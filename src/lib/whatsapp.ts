import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { PaymentAuditResult } from '@/lib/ai/payment-verifier';

const ADMIN_TOKEN_SECRET =
  process.env.ADMIN_TOKEN_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'fahad_ali_luxury_interior_default_secret_2026';

/**
 * Generate a tamper-proof HMAC-SHA256 token for 1-Tap WhatsApp action links.
 * Token expires in 72 hours.
 */
export function generateOrderActionToken(
  orderId: string,
  action: 'verify' | 'hold' | 'reject'
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${orderId}:${action}:${timestamp}`;
  const hmac = crypto
    .createHmac('sha256', ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest('hex');
  return `${timestamp}.${hmac}`;
}

/**
 * Verifies a 1-Tap action token against candidate secrets.
 */
export function verifyOrderActionToken(
  orderId: string,
  action: string,
  token: string
): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [timestampStr, receivedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);

    // 72 hours expiration window (259200 seconds)
    if (isNaN(timestamp) || now - timestamp > 259200 || timestamp > now + 300) {
      return false;
    }

    const payload = `${orderId}:${action}:${timestamp}`;
    const candidateSecrets = Array.from(
      new Set(
        [
          process.env.ADMIN_TOKEN_SECRET,
          process.env.NEXTAUTH_SECRET,
          '574b2e813539ba3517cbffe5ba1cdef52aaf68efc50ea06ac3789a321e0ab502',
          'fahad_ali_luxury_interior_default_secret_2026',
        ].filter(Boolean) as string[]
      )
    );

    for (const secret of candidateSecrets) {
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      try {
        if (
          crypto.timingSafeEqual(
            Buffer.from(receivedHmac, 'hex'),
            Buffer.from(expectedHmac, 'hex')
          )
        ) {
          return true;
        }
      } catch {}
    }

    return false;
  } catch (e) {
    logger.warn('Token verification error:', { detail: String(e) });
    return false;
  }
}

export interface SendAdminOrderAlertParams {
  order: {
    id: string;
    shippingName?: string | null;
    shippingPhone?: string | null;
    shippingEmail?: string | null;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    paymentMethod?: string | null;
    totalAmount: number | string;
    items?: Array<{ name?: string; productName?: string; quantity?: number; price?: number }>;
    paymentScreenshot?: string | null;
  };
  audit: PaymentAuditResult;
}

export class WhatsAppService {
  /**
   * Dispatches the full order verification slip to Admin's personal WhatsApp phone.
   * Sends Meta Interactive Buttons [Verify], [Hold], [Reject], plus direct 1-tap links.
   */
  static async sendAdminOrderVerificationAlert(
    params: SendAdminOrderAlertParams
  ): Promise<{ success: boolean; mode: 'META_CLOUD_API' | 'LOCAL_LOG' }> {
    const { order, audit } = params;

    const shortId = order.id.slice(-6).toUpperCase();
    const customerName = order.shippingName || 'Valued Customer';
    const customerPhone = order.shippingPhone || 'N/A';
    const customerCity = order.shippingCity || 'Lahore';
    const totalAmount = Number(order.totalAmount).toLocaleString();
    const itemsList = (order.items || [])
      .map((i) => `• ${i.name || i.productName || 'Piece'} (x${i.quantity || 1})`)
      .join('\n') || '• Luxury Furniture Commission';

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://fahad-ali-interior.vercel.app';

    // Generate 1-Tap Direct Action Links (Fallback & Direct Access)
    const verifyToken = generateOrderActionToken(order.id, 'verify');
    const holdToken = generateOrderActionToken(order.id, 'hold');
    const rejectToken = generateOrderActionToken(order.id, 'reject');

    const verifyUrl = `${baseUrl}/api/orders/action?id=${order.id}&action=verify&token=${verifyToken}`;
    const holdUrl = `${baseUrl}/api/orders/action?id=${order.id}&action=hold&token=${holdToken}`;
    const rejectUrl = `${baseUrl}/api/orders/action?id=${order.id}&action=reject&token=${rejectToken}`;

    const auditBadge =
      audit.verdict === 'AUTHENTIC_MATCH'
        ? '✅ AUTHENTIC & MATCHED'
        : audit.verdict === 'DUPLICATE_TID'
        ? '❌ DUPLICATE TID FRAUD'
        : audit.verdict === 'AMOUNT_MISMATCH'
        ? '⚠️ AMOUNT MISMATCH'
        : '🔍 MANUAL VERIFICATION NEEDED';

    const adminPhoneRaw =
      process.env.ADMIN_WHATSAPP_NUMBER ||
      process.env.WHATSAPP_NUM ||
      '923213283301';
    const adminPhone = adminPhoneRaw.replace(/\D/g, '');

    const accessToken = (
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAQJJ9hjtQkBS2ymskmMBSWLSqMSHIZCXhSDH0KdfuvElp9aNfLJYhx7XZBwZAFZC7HkkVJYyPevHMMSS2xAEpeXxSLIDsNjDYm65nGrTCUJFAkLmZAAq7tYAiPXLNKqdn7reINBo30tGIiD4ZBZAy4AgiNS3nXGOZC8EUNZBeryeZBDBZCr0laUoxLewZA1nmW4219ASAZDZD'
    )?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '1404434616090105';

    // ── Upload base64 screenshot to Cloudinary if needed to get clean public HTTPS image URL ──
    let publicScreenshotUrl: string | null = null;
    if (order.paymentScreenshot) {
      if (order.paymentScreenshot.startsWith('https://') || order.paymentScreenshot.startsWith('http://')) {
        publicScreenshotUrl = order.paymentScreenshot;
      } else if (order.paymentScreenshot.startsWith('data:image/')) {
        try {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dfd8rzojj';
          const apiKey = process.env.CLOUDINARY_API_KEY || '349178888815894';
          const apiSecret = process.env.CLOUDINARY_API_SECRET || 'ZeZe39YqYU2RgC_JBEkWC3AO_Js';
          const timestamp = Math.round(Date.now() / 1000);
          const folder = 'fahad-ali-interior/payment-slips';
          const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

          const formData = new FormData();
          formData.append('file', order.paymentScreenshot);
          formData.append('api_key', apiKey);
          formData.append('timestamp', String(timestamp));
          formData.append('folder', folder);
          formData.append('signature', signature);

          const cRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          if (cRes.ok) {
            const cData = await cRes.json();
            publicScreenshotUrl = cData.secure_url || cData.url;
          }
        } catch (uploadErr) {
          logger.warn('[WhatsApp Cloudinary Upload Warning]', { detail: String(uploadErr) });
        }
      }
    }

    const messageBody = `✦ ORDER #${shortId} VERIFICATION ✦
👤 Client: ${customerName} | 📞 ${customerPhone}
📍 Delivery: ${customerCity}
🛋️ Masterpieces:
${itemsList}
💰 Total Amount: PKR ${totalAmount} (${order.paymentMethod || 'BANK'})

🤖 AI BOT AUDIT REPORT:
• Verdict: ${auditBadge}
• Extracted: ${audit.extractedAmount ? `PKR ${audit.extractedAmount.toLocaleString()}` : 'N/A'}
• Transaction ID: ${audit.transactionId || 'Manual Screenshot'}
• AI Confidence: ${audit.confidence}%
• Bot Note: ${audit.summaryUrdu}

⚡ DIRECT 1-TAP ACTIONS (Instant Bypass):
1️⃣ [✅ Verify Payment]:
👉 ${verifyUrl}

2️⃣ [⏳ Hold 24-48h]:
👉 ${holdUrl}

3️⃣ [❌ Reject / Cancel]:
👉 ${rejectUrl}`;

    if (accessToken && phoneNumberId) {
      try {
        const metaApiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

        // Interactive Message with 3 Buttons + Direct Embedded Slip Image Header
        const buttonPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: adminPhone,
          type: 'interactive',
          interactive: {
            type: 'button',
            header: publicScreenshotUrl
              ? {
                  type: 'image',
                  image: {
                    link: publicScreenshotUrl,
                  },
                }
              : {
                  type: 'text',
                  text: `✦ ORDER #${shortId} VERIFICATION ✦`,
                },
            body: {
              text: messageBody.slice(0, 1024), // Meta character limit
            },
            footer: {
              text: 'Fahad Ali Interior • Executive Terminal',
            },
            action: {
              buttons: [
                {
                  type: 'reply',
                  reply: {
                    id: `verify_${order.id}`,
                    title: '✅ Verify Payment',
                  },
                },
                {
                  type: 'reply',
                  reply: {
                    id: `hold_${order.id}`,
                    title: '⏳ Hold 24-48h',
                  },
                },
                {
                  type: 'reply',
                  reply: {
                    id: `reject_${order.id}`,
                    title: '❌ Reject Payment',
                  },
                },
              ],
            },
          },
        };

        const res = await fetch(metaApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buttonPayload),
        });

        if (res.ok) {
          logger.info(`[WhatsApp Cloud API] Dispatched 3-button alert for order #${shortId} to ${adminPhone}`);
          return { success: true, mode: 'META_CLOUD_API' };
        } else {
          const errData = await res.json().catch(() => ({}));
          logger.warn('[WhatsApp Cloud API Error] Failed interactive button send, fallback to standard message:', {
            detail: JSON.stringify(errData),
          });

          // Fallback: Send standard text message if template/buttons not allowed
          const textPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: adminPhone,
            type: 'text',
            text: { body: messageBody },
          };

          await fetch(metaApiUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(textPayload),
          });

          return { success: true, mode: 'META_CLOUD_API' };
        }
      } catch (cloudErr) {
        logger.error('[WhatsApp Cloud API Exception]', cloudErr);
      }
    }

    // Local / Dev Fallback: Log clearly to server logs
    logger.info(`[WHATSAPP ADMIN DISPATCH (SIM: +${adminPhone})]\n${messageBody}`);
    return { success: true, mode: 'LOCAL_LOG' };
  }

  /**
   * Sends confirmation reply back to Admin on WhatsApp after action is clicked.
   */
  static async sendAdminActionAck(
    adminPhone: string,
    orderId: string,
    action: 'verify' | 'hold' | 'reject'
  ): Promise<void> {
    const accessToken = (
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAQJJ9hjtQkBS2ymskmMBSWLSqMSHIZCXhSDH0KdfuvElp9aNfLJYhx7XZBwZAFZC7HkkVJYyPevHMMSS2xAEpeXxSLIDsNjDYm65nGrTCUJFAkLmZAAq7tYAiPXLNKqdn7reINBo30tGIiD4ZBZAy4AgiNS3nXGOZC8EUNZBeryeZBDBZCr0laUoxLewZA1nmW4219ASAZDZD'
    )?.trim();
    const phoneNumberId = (
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '1404434616090105'
    )?.trim();
    if (!accessToken || !phoneNumberId) return;

    const shortId = orderId.slice(-6).toUpperCase();
    let replyText = '';
    if (action === 'verify') {
      replyText = `✅ Confirmed: Order #${shortId} has been VERIFIED and marked as PAID. Factory processing commenced and customer notified via email/SMS.`;
    } else if (action === 'hold') {
      replyText = `⏳ Updated: Order #${shortId} is on HOLD (24-48 Hours). Customer notified that bank clearance is underway.`;
    } else if (action === 'reject') {
      replyText = `❌ Cancelled: Order #${shortId} has been REJECTED. Payment marked as FAILED and inventory restored.`;
    }

    try {
      await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: adminPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: replyText },
        }),
      });
    } catch (e) {
      logger.warn('[WhatsApp Ack Send Warning]', { detail: String(e) });
    }
  }
}
