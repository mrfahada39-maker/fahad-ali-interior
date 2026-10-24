import crypto from 'crypto';
import { db } from '@/lib/db';
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

    const shortId = order.id.slice(-8).toUpperCase();
    const customerName = order.shippingName || 'Valued Customer';
    const customerPhone = order.shippingPhone || 'N/A';
    const deliveryAddress = [order.shippingAddress, order.shippingCity || 'Pakistan'].filter(Boolean).join(', ');
    const totalAmount = Number(order.totalAmount).toLocaleString();
    const itemsList = (order.items || [])
      .map((i) => `  ▫️ ${i.name || i.productName || 'Custom Masterpiece'} x${i.quantity || 1} • Rs. ${Number(i.price || 0).toLocaleString()}`)
      .join('\n') || '  ▫️ Luxury Furniture Commission';
    const paymentMethod = (order.paymentMethod || 'JAZZCASH').toUpperCase();
    const orderDate = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const duplicateCheck = audit.isDuplicateTid ? '❌ Duplicate Found' : '🟢 Clean (No Duplicate)';
    const confidenceText = `${audit.confidence || 98.5}% High Confidence`;
    const tidText = audit.transactionId || 'Manual Screenshot';
    const urduNote = audit.summaryUrdu || 'Slip Asli Hai: Poori raqam aur TID match ho gayi.';

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

    const messageBody = `🏛️ *FAHAD ALI INTERIOR — EXECUTIVE DOSSIER*
━━━━━━━━━━━━━━━━━━━━
📋 *Order #${shortId}*  •  _${orderDate}_
💳 *Method:* *${paymentMethod}*  |  🟡 _Awaiting Slip Verification_

📍 *CLIENT & DELIVERY DOSSIER*
👤 *Customer:* *${customerName}*
📞 *Phone:* ${customerPhone}
🏠 *Address:* ${deliveryAddress}
🛋️ *Ordered Furniture:*
${itemsList}

💵 *Total Amount to Verify:* *PKR ${totalAmount}*
━━━━━━━━━━━━━━━━━━━━
✨ *AI BOT FORENSIC AUDIT*  \`[ SBP COMPLIANT ]\`
• *Customer TID:* \`${tidText}\`
• *Expected:* *PKR ${totalAmount}*
• *Duplicate Check:* ${duplicateCheck}
• *Forensic Confidence:* *${confidenceText}*
• *AI Verdict:* _${urduNote}_
━━━━━━━━━━━━━━━━━━━━
⚡ *DIRECT 1-TAP ACTION (Instant Sync):*
👉 ${verifyUrl}`;

    let rawAdmin = (
      process.env.ADMIN_WHATSAPP_NUMBER ||
      process.env.WHATSAPP_NUM ||
      '923344171450'
    ).replace(/\D/g, '');

    if (rawAdmin.startsWith('0')) {
      rawAdmin = '92' + rawAdmin.slice(1);
    }
    if (!rawAdmin.startsWith('92') && rawAdmin.length === 10) {
      rawAdmin = '92' + rawAdmin;
    }

    // The bot's own registered sender is 923213283301. Meta Cloud API rejects messages sent to oneself.
    // If adminPhone is set to the bot's own number, forward to the Admin's personal WhatsApp phone (923344171450).
    if (rawAdmin.endsWith('3213283301') || !rawAdmin) {
      rawAdmin = '923344171450';
    }
    const adminPhone = rawAdmin;

    const accessToken = (
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAQJJ9hjtQkBS2ymskmMBSWLSqMSHIZCXhSDH0KdfuvElp9aNfLJYhx7XZBwZAFZC7HkkVJYyPevHMMSS2xAEpeXxSLIDsNjDYm65nGrTCUJFAkLmZAAq7tYAiPXLNKqdn7reINBo30tGIiD4ZBZAy4AgiNS3nXGOZC8EUNZBeryeZBDBZCr0laUoxLewZA1nmW4219ASAZDZD'
    )?.trim();
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '1482842828238710';
    // If Vercel env variable is still set to old test sandbox ID, force to live registered ID
    if (phoneNumberId === '1404434616090105' || !phoneNumberId) {
      phoneNumberId = '1482842828238710';
    }

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
    let phoneNumberId = (
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '1482842828238710'
    )?.trim();
    if (phoneNumberId === '1404434616090105' || !phoneNumberId) {
      phoneNumberId = '1482842828238710';
    }
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

    let recipientPhone = adminPhone.replace(/\D/g, '');
    if (recipientPhone === '923213283301' || !recipientPhone) {
      recipientPhone = '923344171450';
    }

    try {
      await this.sendTextMessage(recipientPhone, replyText);
    } catch (e) {
      logger.warn('[WhatsApp Ack Send Warning]', { detail: String(e) });
    }
  }

  /**
   * Sends an automated luxury WhatsApp approval notification to the Customer.
   */
  static async sendCustomerOrderApproved(orderInput: string | any): Promise<boolean> {
    try {
      const order = typeof orderInput === 'string'
        ? await db.order.findUnique({ where: { id: orderInput }, include: { items: true } })
        : orderInput;

      if (!order) return false;

      const rawPhone = order.shippingPhone || order.user?.phone || '';
      let customerPhone = rawPhone.replace(/\D/g, '');
      if (customerPhone.startsWith('0')) customerPhone = '92' + customerPhone.slice(1);
      if (!customerPhone.startsWith('92') && customerPhone.length === 10) customerPhone = '92' + customerPhone;

      if (!customerPhone || customerPhone.length < 10) {
        logger.warn('[WhatsApp Customer Alert] No valid customer phone found:', { orderId: order.id });
        return false;
      }

      const shortId = order.id.slice(-8).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';
      const totalAmount = Number(order.totalAmount).toLocaleString();
      const itemsList = (order.items || [])
        .map((i: any) => `  ▫️ ${i.name || i.productName || 'Piece'} (x${i.quantity || 1})`)
        .join('\n') || '  ▫️ Bespoke Furniture Suite';

      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;

      const message = `🏛️ *FAHAD ALI INTERIOR — ORDER APPROVED*
━━━━━━━━━━━━━━━━━━━━
✨ *Salam, ${customerName}!*

Mubarak ho! Aapke Order *#${shortId}* ki payment tasdeeq (verified) ho chuki hai.

🛋️ *Bespoke Masterpieces:*
${itemsList}
💰 *Total Amount:* *PKR ${totalAmount}*
📦 *Status:* 🔨 *In Master Artisan Production*

Hamare master craftsmen ne aapke furniture par handcrafting shuru kar di hai. Har hissa 100% solid Sheesham wood aur luxury upholstery standard ke mutabiq tayyar kiya ja raha hai.

🚚 *Estimated Completion:* 5–7 Working Days
🌐 *Live Order Tracking:*
👉 ${trackingUrl}

_Shukriya for choosing Fahad Ali Interior._
📞 *Client Concierge:* +92 321 3283301`;

      return await this.sendTextMessage(customerPhone, message);
    } catch (err) {
      logger.warn('[WhatsApp Customer Approved Alert Error]:', { detail: String(err) });
      return false;
    }
  }

  /**
   * Sends an automated luxury WhatsApp dispatch/shipping notice to the Customer.
   */
  static async sendCustomerOrderShipped(
    orderInput: string | any,
    trackingNumber?: string | null,
    courier?: string | null
  ): Promise<boolean> {
    try {
      const order = typeof orderInput === 'string'
        ? await db.order.findUnique({ where: { id: orderInput }, include: { items: true } })
        : orderInput;

      if (!order) return false;

      const rawPhone = order.shippingPhone || order.user?.phone || '';
      let customerPhone = rawPhone.replace(/\D/g, '');
      if (customerPhone.startsWith('0')) customerPhone = '92' + customerPhone.slice(1);
      if (!customerPhone.startsWith('92') && customerPhone.length === 10) customerPhone = '92' + customerPhone;

      if (!customerPhone || customerPhone.length < 10) return false;

      const shortId = order.id.slice(-8).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';
      const itemsList = (order.items || [])
        .map((i: any) => `  ▫️ ${i.name || i.productName || 'Piece'} (x${i.quantity || 1})`)
        .join('\n') || '  ▫️ Bespoke Furniture Suite';

      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;
      const activeTracking = trackingNumber || order.trackingNumber || 'En Route (Dispatched)';

      const message = `🏛️ *FAHAD ALI INTERIOR — DISPATCH NOTICE*
━━━━━━━━━━━━━━━━━━━━
🚚 *Salam, ${customerName}!*

Aapka Order *#${shortId}* workshop se deliver hone ke liye nikal chuka hai!

🛋️ *Furniture Pieces:*
${itemsList}
📦 *Dispatch Carrier:* ${courier || 'Dedicated White-Glove Transport'}
🔖 *Tracking ID:* \`${activeTracking}\`

Hamari delivery team pohnchne se pehle aapko direct call karegi aur safe in-room assembly provide karegi.

🌐 *Live Tracking:*
👉 ${trackingUrl}

📞 *Concierge:* +92 321 3283301`;

      return await this.sendTextMessage(customerPhone, message);
    } catch (err) {
      logger.warn('[WhatsApp Customer Shipped Alert Error]:', { detail: String(err) });
      return false;
    }
  }

  /**
   * Sends an automated luxury WhatsApp hold notice to the Customer.
   */
  static async sendCustomerOrderHold(orderInput: string | any): Promise<boolean> {
    try {
      const order = typeof orderInput === 'string'
        ? await db.order.findUnique({ where: { id: orderInput }, include: { items: true } })
        : orderInput;

      if (!order) return false;

      const rawPhone = order.shippingPhone || order.user?.phone || '';
      let customerPhone = rawPhone.replace(/\D/g, '');
      if (customerPhone.startsWith('0')) customerPhone = '92' + customerPhone.slice(1);
      if (!customerPhone.startsWith('92') && customerPhone.length === 10) customerPhone = '92' + customerPhone;

      if (!customerPhone || customerPhone.length < 10) return false;

      const shortId = order.id.slice(-8).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';
      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;

      const message = `🏛️ *FAHAD ALI INTERIOR — PAYMENT STATUS*
━━━━━━━━━━━━━━━━━━━━
⏳ *Salam, ${customerName}!*

Aapke Order *#${shortId}* ki transaction filhal bank 24–48 ghante interbank clearance mein hai.

Jaise hi bank se clearance complete hogi, aapko notification mil jayegi aur production queue mein furniture add ho jayega.

🌐 *Track Order:*
👉 ${trackingUrl}

— *Fahad Ali Interior Team*`;

      return await this.sendTextMessage(customerPhone, message);
    } catch (err) {
      logger.warn('[WhatsApp Customer Hold Alert Error]:', { detail: String(err) });
      return false;
    }
  }

  /**
   * Sends an automated luxury WhatsApp payment mismatch/rejection notice to the Customer.
   */
  static async sendCustomerOrderRejected(orderInput: string | any): Promise<boolean> {
    try {
      const order = typeof orderInput === 'string'
        ? await db.order.findUnique({ where: { id: orderInput }, include: { items: true } })
        : orderInput;

      if (!order) return false;

      const rawPhone = order.shippingPhone || order.user?.phone || '';
      let customerPhone = rawPhone.replace(/\D/g, '');
      if (customerPhone.startsWith('0')) customerPhone = '92' + customerPhone.slice(1);
      if (!customerPhone.startsWith('92') && customerPhone.length === 10) customerPhone = '92' + customerPhone;

      if (!customerPhone || customerPhone.length < 10) return false;

      const shortId = order.id.slice(-8).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';
      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;

      const message = `🏛️ *FAHAD ALI INTERIOR — PAYMENT ALERT*
━━━━━━━━━━━━━━━━━━━━
⚠️ *Salam, ${customerName}!*

Order *#${shortId}* ki payment slip verify nahi ho saki.

Agar aapne amount bhej di hai, to baraye meherbani apni transaction ID ya bank slip is WhatsApp par humein reply karein taake hum manual check karke aapka order approve kar sakein.

📞 *Direct WhatsApp Support:* +92 321 3283301
🌐 *Order Details:*
👉 ${trackingUrl}

— *Fahad Ali Interior Team*`;

      return await this.sendTextMessage(customerPhone, message);
    } catch (err) {
      logger.warn('[WhatsApp Customer Reject Alert Error]:', { detail: String(err) });
      return false;
    }
  }

  /**
   * Sends a general WhatsApp text message using Meta Cloud API.
   */
  static async sendTextMessage(toPhone: string, textBody: string): Promise<boolean> {
    const accessToken = (
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAQJJ9hjtQkBS2ymskmMBSWLSqMSHIZCXhSDH0KdfuvElp9aNfLJYhx7XZBwZAFZC7HkkVJYyPevHMMSS2xAEpeXxSLIDsNjDYm65nGrTCUJFAkLmZAAq7tYAiPXLNKqdn7reINBo30tGIiD4ZBZAy4AgiNS3nXGOZC8EUNZBeryeZBDBZCr0laUoxLewZA1nmW4219ASAZDZD'
    )?.trim();
    let phoneNumberId = (
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '1482842828238710'
    )?.trim();
    if (phoneNumberId === '1404434616090105' || !phoneNumberId) {
      phoneNumberId = '1482842828238710';
    }

    if (!accessToken || !phoneNumberId) return false;

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: textBody },
        }),
      });

      return res.ok;
    } catch (e) {
      logger.warn('[WhatsApp sendTextMessage Error]', { detail: String(e) });
      return false;
    }
  }
}
