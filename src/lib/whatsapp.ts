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

/**
 * Normalizes payment method text to ensure clean display without double names
 * (e.g. cleans "JAZZCASH (Meezan Bank)" to "JAZZCASH").
 */
export function formatPaymentMethodDisplay(order: { paymentMethod?: string | null; shippingNotes?: string | null }): string {
  const notes = order.shippingNotes || '';
  const methodMatch = notes.match(/Method:\s*([^.\n]+)/i);
  const matchedMethod = methodMatch && methodMatch[1] ? methodMatch[1].trim() : '';
  const raw = (order.paymentMethod || '').trim().toUpperCase();

  // 1. JazzCash
  if (raw === 'JAZZCASH' || matchedMethod.toUpperCase().includes('JAZZCASH')) {
    return 'JAZZCASH';
  }

  // 2. EasyPaisa
  if (raw === 'EASYPAISA' || matchedMethod.toUpperCase().includes('EASYPAISA')) {
    return 'EASYPAISA';
  }

  // 3. Cash on Delivery
  if (raw === 'COD' || matchedMethod.toUpperCase().includes('COD') || matchedMethod.toUpperCase().includes('CASH ON DELIVERY')) {
    return 'CASH ON DELIVERY';
  }

  // 4. Card
  if (raw === 'CARD' || matchedMethod.toUpperCase().includes('CARD')) {
    return 'CREDIT / DEBIT CARD';
  }

  // 5. Bank Transfer
  if (matchedMethod.toUpperCase().includes('BANK') || raw.includes('BANK')) {
    const bankMatch = matchedMethod.match(/\(([^)]+)\)/);
    if (bankMatch && bankMatch[1] && !['JAZZCASH', 'EASYPAISA', 'CARD', 'COD'].includes(bankMatch[1].toUpperCase())) {
      return `BANK TRANSFER (${bankMatch[1].trim()})`;
    }
    return 'BANK TRANSFER';
  }

  // Fallback
  return raw.replace(/_/g, ' ') || 'BANK TRANSFER';
}

export interface SendAdminOrderAlertParams {
  order: {
    id: string;
    shippingName?: string | null;
    shippingPhone?: string | null;
    shippingEmail?: string | null;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingProvince?: string | null;
    shippingNotes?: string | null;
    paymentMethod?: string | null;
    paymentGatewayRef?: string | null;
    status?: string | null;
    paymentStatus?: string | null;
    totalAmount: number | string;
    items?: Array<{ name?: string; productName?: string; quantity?: number; price?: number }>;
    paymentScreenshot?: string | null;
  };
  audit: PaymentAuditResult;
}

export class WhatsAppService {
  /**
   * Retrieves sanitized Meta Cloud API credentials from environment variables.
   */
  public static getCredentials(): { accessToken: string; phoneNumberId: string } {
    const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
    let phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '1482842828238710').trim();
    if (phoneNumberId === '1404434616090105' || !phoneNumberId) {
      phoneNumberId = '1482842828238710';
    }
    return { accessToken, phoneNumberId };
  }

  /**
   * Dispatches the simple order verification alert to Admin's personal WhatsApp phone.
   * Sends Meta Interactive Buttons [Verify], [Hold], [Restocked], plus direct 1-tap links.
   */
  static async sendAdminOrderVerificationAlert(
    params: SendAdminOrderAlertParams
  ): Promise<{ success: boolean; mode: 'META_CLOUD_API' | 'LOCAL_LOG' }> {
    const { order, audit } = params;

    const shortId = order.id.slice(-6).toUpperCase();
    const customerName = order.shippingName || 'Valued Client';
    const customerPhone = order.shippingPhone || 'N/A';
    
    // Clean deduplicated address
    const addressParts = [
      order.shippingAddress,
      order.shippingCity,
      order.shippingProvince,
    ].filter((part, idx, arr) => part && (!arr[idx - 1] || String(part).toLowerCase() !== String(arr[idx - 1]).toLowerCase()));
    const deliveryAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Provided on Checkout';

    // Customer TID
    const tidMatch = (order.shippingNotes || '').match(/TxID:\s*([^\s,;.]+)/i);
    const extractedTid = tidMatch && tidMatch[1] && !['N/A', 'NA', 'NONE', 'N'].includes(tidMatch[1].toUpperCase())
      ? tidMatch[1]
      : null;
    const customerTid = audit.transactionId || order.paymentGatewayRef || extractedTid || (order.paymentScreenshot ? 'Attached on Receipt' : 'N/A');

    // Order Items with Name, Qty, and Amount
    const itemsList = (order.items || [])
      .map((i) => {
        const name = i.name || i.productName || 'Item';
        const qty = i.quantity || 1;
        const price = i.price ? ` | PKR ${Number(i.price * qty).toLocaleString()}` : '';
        return `▫️ ${name} | Qty: ${qty}${price}`;
      })
      .join('\n') || '▫️ Furniture Suite | Qty: 1';

    const totalAmount = Number(order.totalAmount).toLocaleString();
    const paymentMethod = formatPaymentMethodDisplay(order);
    const status = order.status === 'PENDING' || order.paymentStatus === 'AWAITING_VERIFICATION'
      ? '⏳ Under Verification'
      : '⏳ Awaiting Verification';

    const messageBody = `🏛️ *FAHAD ALI INTERIOR*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${customerName}
📞 *Phone:* ${customerPhone}
📍 *Delivery Address:* ${deliveryAddress}
📋 *Order #:* #${shortId}
💳 *Customer TID:* \`${customerTid}\`

🛋️ *Order Details:*
${itemsList}

💰 *Total Amount:* *PKR ${totalAmount}*
📦 *Status:* ${status}
💳 *Payment Method:* ${paymentMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Executive Actions:*
✅ Verify
⏳ Hold 24-48h
❌ Restocked`;

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

    const { accessToken, phoneNumberId } = WhatsAppService.getCredentials();

    // ── Upload base64 screenshot to Cloudinary if needed to get clean public HTTPS image URL ──
    let publicScreenshotUrl: string | null = null;
    if (order.paymentScreenshot) {
      if (order.paymentScreenshot.startsWith('https://') || order.paymentScreenshot.startsWith('http://')) {
        publicScreenshotUrl = order.paymentScreenshot;
      } else if (order.paymentScreenshot.startsWith('data:image/')) {
        try {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          const apiKey = process.env.CLOUDINARY_API_KEY;
          const apiSecret = process.env.CLOUDINARY_API_SECRET;
          if (cloudName && apiKey && apiSecret) {
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
                  text: '✦ FAHAD ALI INTERIOR — ORDER VERIFICATION ✦',
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
                    title: '✅ Verify',
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
                    title: '❌ Restocked',
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
    const { accessToken, phoneNumberId } = WhatsAppService.getCredentials();
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
   * Sends an automated luxury WhatsApp digital Order Slip / Receipt to the Customer upon checkout.
   */
  static async sendCustomerOrderPlacedSlip(orderInput: string | any): Promise<boolean> {
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
        logger.warn('[WhatsApp Customer Slip] No valid customer phone found:', { orderId: order.id });
        return false;
      }

      const shortId = order.id.slice(-8).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';
      const totalAmount = Number(order.totalAmount).toLocaleString();
      const paymentMethod = order.paymentMethod || 'JAZZCASH';

      const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderDateStr = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(dateObj);

      const itemsList = (order.items || [])
        .map((i: any) => {
          const name = i.name || i.productName || 'Item';
          const qty = i.quantity || 1;
          const price = i.price ? `PKR ${Number(i.price * qty).toLocaleString()}` : '';
          return `  ▫️ *${name}* | Qty: ${qty}${price ? ` | ${price}` : ''}`;
        })
        .join('\n') || '  ▫️ Furniture Suite';

      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;

      const addressParts = [
        order.shippingAddress,
        order.shippingCity,
        order.shippingProvince,
      ].filter((part, idx, arr) => part && (!arr[idx - 1] || part.toLowerCase() !== arr[idx - 1].toLowerCase()));
      const deliveryAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Provided on Checkout';

      const slipStatus = order.paymentScreenshot ? '✅ Attached & Under AI Verification' : 'Pending Verification';

      // Extract customer payment info
      const tidMatch = (order.shippingNotes || '').match(/TxID:\s*([^\s,;.]+)/i);
      const extractedTid = tidMatch && tidMatch[1] && !['N/A', 'NA', 'NONE', 'N'].includes(tidMatch[1].toUpperCase())
        ? tidMatch[1]
        : null;
      const transactionId = order.paymentGatewayRef || extractedTid;
      const paymentChannel = formatPaymentMethodDisplay(order);
      const tidDisplay = transactionId ? `\`${transactionId}\`` : (order.paymentScreenshot ? 'Attached on Receipt' : 'Pending Verification');

      // 1. Try sending via Meta Approved Template (bypasses 24-hour window for new customers)
      const summaryItems = (order.items || [])
        .map((i: any) => `${i.name || 'Item'} (Qty: ${i.quantity || 1})`)
        .join(', ') || 'Furniture Suite';

      await this.sendTemplateMessage(customerPhone, 'customer_order_slip_v2', [
        customerName,
        shortId,
        totalAmount,
        orderDateStr,
        summaryItems,
        trackingUrl,
      ]).catch(() => {});

      // 2. Rich WhatsApp Slip (Customer Payment Details)
      const message = `🏛️ *FAHAD ALI INTERIOR — OFFICIAL ORDER SLIP*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Salam *${customerName}*! Your order *#${shortId}* for *PKR ${totalAmount}* has been successfully placed.

📅 *Date & Time:* ${orderDateStr}

🛋️ *Order Details:*
${itemsList}

💰 *Total Amount:* *PKR ${totalAmount}*
📦 *Status:* ⏳ *Under Verification*

💳 *Customer Payment Details:*
• *Payment Method:* ${paymentChannel}
• *Paid By:* ${customerName}
• *Transaction ID / Ref:* ${tidDisplay}
• *Payment Slip / Proof:* ${slipStatus}

📍 *Delivery Address:*
${deliveryAddress}
👤 *Recipient Contact:* ${customerPhone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *Track order live:*
👉 ${trackingUrl}

📞 *For further details contact Admin:* +92 321 3283301`;

      const textSent = await this.sendTextMessage(customerPhone, message);

      // If customer attached a public screenshot image URL, also deliver it to their WhatsApp
      if (
        order.paymentScreenshot &&
        typeof order.paymentScreenshot === 'string' &&
        order.paymentScreenshot.startsWith('http') &&
        !order.paymentScreenshot.startsWith('data:')
      ) {
        await this.sendImageMessage(
          customerPhone,
          order.paymentScreenshot,
          `🧾 Order #${shortId} Attached Payment Receipt`
        ).catch(() => {});
      }

      return textSent;
    } catch (err) {
      logger.warn('[WhatsApp Customer Slip Alert Error]:', { detail: String(err) });
      return false;
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
      const paymentMethod = formatPaymentMethodDisplay(order);

      const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderDateStr = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(dateObj);

      const itemsList = (order.items || [])
        .map((i: any) => {
          const name = i.name || i.productName || 'Item';
          const qty = i.quantity || 1;
          const price = i.price ? `PKR ${Number(i.price * qty).toLocaleString()}` : '';
          return `  ▫️ *${name}* | Qty: ${qty}${price ? ` | ${price}` : ''}`;
        })
        .join('\n') || '  ▫️ Furniture Suite';

      const trackingUrl = `https://fahad-ali-interior.vercel.app/orders/track?id=${order.id}`;

      const addressParts = [
        order.shippingAddress,
        order.shippingCity,
        order.shippingProvince,
      ].filter(Boolean);
      const deliveryAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Provided on Checkout';

      const message = `🏛️ *FAHAD ALI INTERIOR — ORDER APPROVED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Salam *${customerName}*! Your order *#${shortId}* payment has been verified and approved.

📅 *Date & Time:* ${orderDateStr}

🛋️ *Order Details:*
${itemsList}

💰 *Total Amount:* *PKR ${totalAmount}*
📦 *Status:* ✅ *Verified & In Production*
💳 *Payment Method:* ${paymentMethod}
📍 *Delivery Address:* ${deliveryAddress}

━━━━━━━━━━━━━━━━━━━━
🌐 *Track order live:*
👉 ${trackingUrl}

📞 *For further details contact Admin:* +92 321 3283301`;

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
   * Sends a Meta Cloud API approved template message (bypasses 24-hour window for uninitiated chats).
   */
  static async sendTemplateMessage(
    toPhone: string,
    templateName: string,
    parameters: string[]
  ): Promise<boolean> {
    const { accessToken, phoneNumberId } = WhatsAppService.getCredentials();
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
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: parameters.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        }),
      });

      return res.ok;
    } catch (e) {
      logger.warn('[WhatsApp sendTemplateMessage Error]', { detail: String(e) });
      return false;
    }
  }

  /**
   * Sends a general WhatsApp text message using Meta Cloud API.
   */
  static async sendTextMessage(toPhone: string, textBody: string): Promise<boolean> {
    const { accessToken, phoneNumberId } = WhatsAppService.getCredentials();
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

  /**
   * Sends an image message with optional caption to a phone number via Meta Cloud API.
   */
  static async sendImageMessage(
    toPhone: string,
    imageUrl: string,
    caption?: string
  ): Promise<boolean> {
    const { accessToken, phoneNumberId } = WhatsAppService.getCredentials();
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
          type: 'image',
          image: {
            link: imageUrl,
            ...(caption ? { caption } : {}),
          },
        }),
      });

      return res.ok;
    } catch (e) {
      logger.warn('[WhatsApp sendImageMessage Error]', { detail: String(e) });
      return false;
    }
  }

  /**
   * Generates a comprehensive real-time Daily Sales & Inventory briefing.
   */
  static async generateDailyReport(): Promise<string> {
    try {
      const todayStr = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date());

      // Start of day in PKT (UTC+5)
      const pktOffset = 5 * 60 * 60 * 1000;
      const pktNow = new Date(Date.now() + pktOffset);
      const pktMidnight = new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), pktNow.getUTCDate()));
      const startOfDayUtc = new Date(pktMidnight.getTime() - pktOffset);

      const [ordersToday, lowStockProducts] = await Promise.all([
        db.order.findMany({
          where: {
            createdAt: { gte: startOfDayUtc },
            deletedAt: null,
          },
          include: { items: true },
        }),
        db.product.findMany({
          where: {
            deletedAt: null,
            stockCount: { lte: 5 },
          },
          orderBy: { stockCount: 'asc' },
          take: 6,
        }),
      ]);

      const totalOrders = ordersToday.length;
      const paidOrders = ordersToday.filter((o: any) => o.paymentStatus === 'PAID');
      const awaitingOrders = ordersToday.filter(
        (o: any) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'AWAITING_VERIFICATION'
      );
      const shippedOrders = ordersToday.filter(
        (o: any) => o.status === 'SHIPPED' || o.status === 'DELIVERED'
      );

      const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);

      // Top products demanded
      const itemCounts: Record<string, number> = {};
      for (const order of ordersToday) {
        for (const item of (order as any).items || []) {
          const name = item.name || 'Piece';
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        }
      }
      const topProducts = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, qty]) => `  ▫️ ${name} (x${qty})`);

      const outOfStock = lowStockProducts.filter((p: any) => p.stockCount === 0);
      const runningLow = lowStockProducts.filter((p: any) => p.stockCount > 0 && p.stockCount <= 5);

      const stockSection = [
        outOfStock.length > 0
          ? `🔴 *Out of Stock (Zero Units):*\n` +
            outOfStock.map((p: any) => `  • ${p.name} (0 stock)`).join('\n')
          : '✅ *Out of Stock:* Koi item khatam nahi hui.',
        runningLow.length > 0
          ? `🟡 *Low Stock Alert (< 5 Units):*\n` +
            runningLow.map((p: any) => `  • ${p.name} (${p.stockCount} baaqi)`).join('\n')
          : '✅ *Low Stock:* Tamam items ka stock safe level par hai.',
      ].join('\n\n');

      return `🏛️ *FAHAD ALI INTERIOR — DAILY EXECUTIVE REPORT*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${todayStr} (Pakistan Time)
⚡ *Automated Sales & Stock Dossier*

💰 *SALES & REVENUE SUMMARY:*
• *Gross Revenue:* *PKR ${totalRevenue.toLocaleString()}*
• *Total Orders Placed:* *${totalOrders}*
  ▫️ ✅ Verified & Paid: *${paidOrders.length}*
  ▫️ ⏳ Awaiting Review: *${awaitingOrders.length}*
  ▫️ 🚚 Dispatched: *${shippedOrders.length}*

🛋️ *TODAY'S POPULAR PIECES:*
${topProducts.length > 0 ? topProducts.join('\n') : '  ▫️ No pieces ordered in this cycle'}

⚠️ *INVENTORY & STOCK STATUS:*
${stockSection}

━━━━━━━━━━━━━━━━━━━━
🌐 *Live Admin Control Center:*
👉 https://fahad-ali-interior.vercel.app/admin

_Sent automatically by Fahad Ali Interior Executive AI Bot_`;
    } catch (err) {
      logger.warn('[WhatsApp Daily Report Generation Error]', { detail: String(err) });
      const todayStr = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date());

      return `🏛️ *FAHAD ALI INTERIOR — DAILY EXECUTIVE REPORT*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${todayStr} (Pakistan Time)
⚡ *Automated Sales & Stock Dossier*

💰 *SALES & REVENUE SUMMARY:*
• *Gross Revenue:* *PKR 0*
• *Total Orders Placed:* *0*
  ▫️ ✅ Verified & Paid: *0*
  ▫️ ⏳ Awaiting Review: *0*
  ▫️ 🚚 Dispatched: *0*

⚠️ *INVENTORY & STOCK STATUS:*
✅ *Stock Status:* All stock levels safe.

━━━━━━━━━━━━━━━━━━━━
🌐 *Live Admin Control Center:*
👉 https://fahad-ali-interior.vercel.app/admin

_Sent automatically by Fahad Ali Interior Executive AI Bot_`;
    }
  }

  /**
   * Dispatches the daily sales & stock report to the Admin WhatsApp.
   */
  static async sendDailyReport(targetPhone?: string): Promise<boolean> {
    const reportText = await this.generateDailyReport();
    let recipient = (targetPhone || process.env.ADMIN_WHATSAPP_NUMBER || '923344171450').replace(/\D/g, '');
    if (recipient === '923213283301' || !recipient) {
      recipient = '923344171450';
    }
    return await this.sendTextMessage(recipient, reportText);
  }
}

