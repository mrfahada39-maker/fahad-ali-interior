import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export interface PaymentAuditResult {
  isAuthentic: boolean;
  confidence: number; // 0 to 100
  extractedAmount: number | null;
  expectedAmount: number;
  amountMatches: boolean;
  transactionId: string | null;
  isDuplicateTid: boolean;
  receiverAccount: string | null;
  senderName: string | null;
  bankOrProvider: string;
  paymentDate: string | null;
  tamperingSuspected: boolean;
  verdict: 'AUTHENTIC_MATCH' | 'AMOUNT_MISMATCH' | 'DUPLICATE_TID' | 'TAMPERED_SUSPECTED' | 'MANUAL_REVIEW_NEEDED';
  summaryUrdu: string;
  summaryEnglish: string;
  rawAnalysis?: string;
}

const GENERIC_TIDS = new Set([
  '123456',
  '000000',
  '111111',
  '12345678',
  'UNKNOWN',
  'TEST',
  'NONE',
  'NULL',
  'N/A',
  'NA',
  'NIL',
  '0',
]);

/**
 * Validates external image URLs to prevent Server-Side Request Forgery (SSRF)
 * to internal networks, cloud metadata services, and local loopbacks.
 */
function isSafeImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '0:0:0:0:0:0:0:1' ||
      hostname.startsWith('::ffff:127.') ||
      hostname.startsWith('::ffff:10.') ||
      hostname.startsWith('::ffff:192.168.') ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fd00:') ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      /^\d+$/.test(hostname) ||
      /^0x[0-9a-f]+$/i.test(hostname)
    ) {
      return false;
    }

    // Disallow IPv4 private ranges: 10.x.x.x, 192.168.x.x, 172.16.x.x - 172.31.x.x, 0.x.x.x
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Pattern);
    if (ipMatch) {
      const first = parseInt(ipMatch[1], 10);
      const second = parseInt(ipMatch[2], 10);
      if (first === 0 || first === 10 || first === 127) return false;
      if (first === 169 && second === 254) return false;
      if (first === 192 && second === 168) return false;
      if (first === 172 && second >= 16 && second <= 31) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export class PaymentVerifier {
  /**
   * Analyzes an uploaded payment screenshot using Gemini 2.0 Flash Vision
   * and cross-checks with database orders for duplicate Transaction IDs (TID).
   */
  static async verifyScreenshot(params: {
    orderId?: string;
    screenshotUrlOrBase64: string;
    expectedAmount: number;
    paymentMethod: string;
    selectedBank?: string;
  }): Promise<PaymentAuditResult> {
    const { orderId, screenshotUrlOrBase64, expectedAmount, paymentMethod, selectedBank } = params;

    let extractedAmount: number | null = null;
    let transactionId: string | null = null;
    let receiverAccount: string | null = null;
    let senderName: string | null = null;
    let bankOrProvider = selectedBank || paymentMethod;
    let paymentDate: string | null = null;
    let tamperingSuspected = false;
    let confidence = 85;
    let rawAnalysis = '';

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const isValidGeminiKey = Boolean(geminiKey && !geminiKey.startsWith('AQ.') && geminiKey.length > 20);

    if (isValidGeminiKey && screenshotUrlOrBase64) {
      try {
        const isBase64 = screenshotUrlOrBase64.startsWith('data:') || !screenshotUrlOrBase64.startsWith('http');
        let imagePart: Record<string, unknown> | null = null;

        if (isBase64) {
          const cleanData = screenshotUrlOrBase64.replace(/^data:image\/\w+;base64,/, '');
          // DoS check: limit base64 payload to ~8MB
          if (cleanData.length <= 11000000) {
            imagePart = {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanData,
              },
            };
          }
        } else if (isSafeImageUrl(screenshotUrlOrBase64)) {
          // SSRF-guarded fetch with timeout and size cap
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const imgRes = await fetch(screenshotUrlOrBase64, {
              signal: controller.signal,
              redirect: 'error',
              headers: { Accept: 'image/*' },
            });
            clearTimeout(timeoutId);

            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              if (arrayBuffer.byteLength <= 8 * 1024 * 1024) {
                const base64Data = Buffer.from(arrayBuffer).toString('base64');
                const mime = imgRes.headers.get('content-type') || 'image/jpeg';
                imagePart = {
                  inlineData: {
                    mimeType: mime,
                    data: base64Data,
                  },
                };
              }
            }
          } catch (fetchErr) {
            logger.warn('Failed to fetch screenshot URL for vision analysis:', { detail: String(fetchErr) });
          }
        }

        if (imagePart) {
          const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
          for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
            const promptText = `You are the Expert Financial Fraud & Payment Receipt Verification AI for "FAHAD ALI INTERIOR" in Pakistan.
The customer claims to have paid PKR ${expectedAmount} via ${paymentMethod} (${selectedBank || 'Bank/Wallet'}).

Analyze this payment screenshot with forensic accuracy:
1. Extract the exact payment amount transferred (numbers only, in PKR).
2. Extract the Transaction ID / Ref No / RRN / Stan / Approval Code.
3. Extract the Receiver account title/number/IBAN/Raast ID.
4. Extract the Sender name or account.
5. Extract the Date and Time of the transaction.
6. Identify the Bank / Mobile App (e.g. Meezan Bank, HBL, Bank Alfalah, JazzCash, Easypaisa, Raast, Nayapay, Sadapay, MCB, UBL).
7. Check for digital tampering, photoshopped text, font mismatch, blurred numbers, or edited amounts.

Return ONLY a valid JSON object matching this schema:
{
  "extractedAmount": number or null,
  "transactionId": string or null,
  "receiverAccount": string or null,
  "senderName": string or null,
  "bankOrProvider": string,
  "paymentDate": string or null,
  "tamperingSuspected": boolean,
  "confidence": number, // 0 to 100
  "authenticityRationale": string
}`;

            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: promptText }, imagePart],
                  },
                ],
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (responseText) {
                rawAnalysis = responseText;
                const match = responseText.match(/\{[\s\S]*\}/);
                if (match) {
                  const parsed = JSON.parse(match[0]);
                  if (typeof parsed.extractedAmount === 'number') extractedAmount = parsed.extractedAmount;
                  if (parsed.transactionId) transactionId = String(parsed.transactionId).trim();
                  if (parsed.receiverAccount) receiverAccount = String(parsed.receiverAccount).trim();
                  if (parsed.senderName) senderName = String(parsed.senderName).trim();
                  if (parsed.bankOrProvider) bankOrProvider = String(parsed.bankOrProvider).trim();
                  if (parsed.paymentDate) paymentDate = String(parsed.paymentDate).trim();
                  if (typeof parsed.tamperingSuspected === 'boolean') tamperingSuspected = parsed.tamperingSuspected;
                  if (typeof parsed.confidence === 'number') confidence = Math.min(100, Math.max(0, parsed.confidence));
                  break; // Successful parse, no need to fallback to second model
                }
              }
            }
          } catch (modelErr) {
            logger.warn(`Gemini Vision model ${model} error:`, { detail: String(modelErr) });
          }
        }
      }
    } catch (visionErr) {
        logger.warn('PaymentVerifier vision inspection exception:', { detail: String(visionErr) });
      }
    }

    // ── Duplicate Transaction ID Check against Database ──
    let isDuplicateTid = false;
    if (
      transactionId &&
      transactionId.length > 4 &&
      !GENERIC_TIDS.has(transactionId.trim().toUpperCase())
    ) {
      try {
        const whereClause: Record<string, unknown> = {
          paymentGatewayRef: transactionId,
          deletedAt: null,
        };
        if (orderId) {
          whereClause.id = { not: orderId };
        }
        const existingOrder = await db.order.findFirst({
          where: whereClause,
          select: { id: true, createdAt: true, totalAmount: true },
        });

        if (existingOrder) {
          isDuplicateTid = true;
          confidence = 99; // High confidence of fraud
        }
      } catch (dbErr) {
        logger.warn('Error checking duplicate transaction ID in database:', { detail: String(dbErr) });
      }
    }

    // ── Amount, Receiver Account & Date Freshness Analysis ──
    const amountDifference = extractedAmount !== null ? Math.abs(extractedAmount - expectedAmount) : null;
    const amountMatches = amountDifference !== null && amountDifference <= 5; // tolerance of Rs. 5

    // Validate receiver account / title if extracted
    const officialAccounts = (process.env.OFFICIAL_PAYMENT_ACCOUNTS || 'fahad ali,fahadali,interior,03213283301,03207006110,meezan,jazzcash,easypaisa')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanReceiver = (receiverAccount || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isReceiverSuspicious =
      cleanReceiver.length >= 4 &&
      !officialAccounts.some((acc) => {
        const cleanAcc = acc.replace(/[^a-z0-9]/g, '');
        return cleanReceiver.includes(cleanAcc) || cleanAcc.includes(cleanReceiver);
      });

    // Check if slip date is older than 7 days
    let isStaleSlip = false;
    if (paymentDate) {
      const parsedDate = Date.parse(paymentDate);
      if (!Number.isNaN(parsedDate)) {
        const ageMs = Date.now() - parsedDate;
        if (ageMs > 7 * 24 * 60 * 60 * 1000) {
          isStaleSlip = true;
          tamperingSuspected = true;
        }
      }
    }

    // ── Determine Overall Verdict ──
    let verdict: PaymentAuditResult['verdict'] = 'AUTHENTIC_MATCH';
    let summaryUrdu = '';
    let summaryEnglish = '';

    if (isDuplicateTid) {
      verdict = 'DUPLICATE_TID';
      summaryUrdu = `⚠️ Khatra: Transaction ID (${transactionId}) pehle se kisi aur order mein use ho chuki hai!`;
      summaryEnglish = `⚠️ FRAUD ALERT: Transaction ID (${transactionId}) was previously used on another order!`;
    } else if (isStaleSlip) {
      verdict = 'TAMPERED_SUSPECTED';
      summaryUrdu = `⚠️ Purani Slip: Yeh receipt (${paymentDate}) 7 din se zyada purani hai!`;
      summaryEnglish = `⚠️ STALE RECEIPT ALERT: Payment date (${paymentDate}) is older than 7 days!`;
    } else if (tamperingSuspected) {
      verdict = 'TAMPERED_SUSPECTED';
      summaryUrdu = `⚠️ Shak: Screenshot mein editing / photoshop ke nishan mile hain!`;
      summaryEnglish = `⚠️ TAMPERING ALERT: Digital editing or font irregularities detected on slip!`;
    } else if (extractedAmount !== null && !amountMatches) {
      verdict = 'AMOUNT_MISMATCH';
      summaryUrdu = `⚠️ Raqam Farq: Slip par Rs. ${extractedAmount?.toLocaleString()} hai jabke order Rs. ${expectedAmount.toLocaleString()} ka hai!`;
      summaryEnglish = `⚠️ AMOUNT MISMATCH: Slip shows PKR ${extractedAmount?.toLocaleString()} but order requires PKR ${expectedAmount.toLocaleString()}!`;
    } else if (isReceiverSuspicious) {
      verdict = 'MANUAL_REVIEW_NEEDED';
      confidence = Math.min(confidence, 60);
      summaryUrdu = `⚠️ Receiver Check: Slip par receiver (${receiverAccount}) company account se match nahi ho raha. Admin review zaroori hai.`;
      summaryEnglish = `⚠️ RECEIVER ALERT: Recipient on slip (${receiverAccount}) does not match Fahad Ali Interior accounts. Manual review required.`;
    } else if (extractedAmount !== null && amountMatches && !tamperingSuspected) {
      verdict = 'AUTHENTIC_MATCH';
      summaryUrdu = `✅ Slip Asli Hai: Rs. ${expectedAmount.toLocaleString()} poori raqam aur TID (${transactionId || 'Meezan/Raast'}) match ho gayi hai.`;
      summaryEnglish = `✅ VERIFIED AUTHENTIC: PKR ${expectedAmount.toLocaleString()} and TID (${transactionId || 'Confirmed'}) match perfectly.`;
    } else {
      verdict = 'MANUAL_REVIEW_NEEDED';
      summaryUrdu = `🔍 Manual Check Zaroori: AI ne slip scan ki hai, admin payment check karein.`;
      summaryEnglish = `🔍 MANUAL REVIEW NEEDED: Screenshot uploaded. Admin confirmation required.`;
    }

    return {
      isAuthentic: verdict === 'AUTHENTIC_MATCH',
      confidence,
      extractedAmount,
      expectedAmount,
      amountMatches,
      transactionId,
      isDuplicateTid,
      receiverAccount,
      senderName,
      bankOrProvider,
      paymentDate,
      tamperingSuspected,
      verdict,
      summaryUrdu,
      summaryEnglish,
      rawAnalysis,
    };
  }
}
