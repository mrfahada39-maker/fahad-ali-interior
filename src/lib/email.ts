import tls from 'tls';

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  paymentMethod: string;
  items: Array<{ name: string; price: number; quantity: number; image?: string }>;
  subtotal: number;
  gst: number;
  discount: number;
  totalAmount: number;
}

// Pure Node.js TLS SMTP Sender - 0 External Dependencies, 100% Reliable across all Next.js/Vercel versions
function sendSmtpTls({
  host = 'smtp.gmail.com',
  port = 465,
  user = 'mrfahada39@gmail.com',
  pass = 'naqxyqlglbvegztw',
  from = 'Fahad Ali Interior <mrfahada39@gmail.com>',
  to,
  subject,
  html,
}: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host,
          port,
          rejectUnauthorized: false,
        },
        () => {
          let step = 0;

          const send = (cmd: string) => {
            socket.write(cmd + '\r\n');
          };

          socket.on('data', (data) => {
            const res = data.toString();

            if (step === 0 && res.startsWith('220')) {
              step++;
              send(`EHLO localhost`);
            } else if (step === 1 && res.startsWith('250')) {
              step++;
              send('AUTH LOGIN');
            } else if (step === 2 && res.startsWith('334')) {
              step++;
              send(Buffer.from(user).toString('base64'));
            } else if (step === 3 && res.startsWith('334')) {
              step++;
              send(Buffer.from(pass).toString('base64'));
            } else if (step === 4 && res.startsWith('235')) {
              step++;
              send(`MAIL FROM:<${user}>`);
            } else if (step === 5 && res.startsWith('250')) {
              step++;
              send(`RCPT TO:<${to}>`);
            } else if (step === 6 && res.startsWith('250')) {
              step++;
              send('DATA');
            } else if (step === 7 && res.startsWith('354')) {
              step++;
              const msg = [
                `From: ${from}`,
                `To: ${to}`,
                `Subject: ${subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=UTF-8',
                '',
                html,
                '.',
              ].join('\r\n');
              send(msg);
            } else if (step === 8 && res.startsWith('250')) {
              step++;
              send('QUIT');
              socket.end();
              resolve(true);
            }
          });

          socket.on('error', (err) => {
            console.error('[SMTP TLS ERROR]', err.message);
            resolve(false);
          });
        }
      );

      socket.setTimeout(10000, () => {
        socket.destroy();
        resolve(false);
      });
    } catch (e: any) {
      console.error('[SMTP CONNECT ERROR]', e.message);
      resolve(false);
    }
  });
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const user = process.env.SMTP_USER || 'mrfahada39@gmail.com';
  const pass = process.env.SMTP_PASS || 'naqxyqlglbvegztw';
  const from = process.env.SMTP_FROM || `Fahad Ali Interior <${user}>`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #EAE0D5;">
        <td style="padding: 12px 8px; font-weight: bold; color: #221814;">${item.name}</td>
        <td style="padding: 12px 8px; text-align: center; color: #7A6354;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; color: #8C6239; font-weight: bold;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Fahad Ali Interior</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF5EE; margin: 0; padding: 24px; color: #221814;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DDD0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: #1F1612; padding: 28px 24px; text-align: center;">
          <h1 style="color: #F5D77F; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">FAHAD ALI INTERIOR</h1>
          <p style="color: #C5A059; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1px;">HAUTE COUTURE LUXURY FURNITURE</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-weight: bold; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">Order Confirmed ✓</span>
            <h2 style="margin: 12px 0 4px 0; color: #221814; font-size: 22px;">Thank You, ${order.customerName}!</h2>
            <p style="margin: 0; color: #7A6354; font-size: 14px;">Your bespoke furniture order has been received and scheduled for artisan crafting.</p>
          </div>

          <!-- Order Summary Card -->
          <div style="background: #FAF7F2; border: 1px solid #E2D9CD; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #7A6354; padding: 4px 0;">Order Reference:</td>
                <td style="text-align: right; font-weight: bold; color: #1F1612;">#${order.orderId}</td>
              </tr>
              <tr>
                <td style="color: #7A6354; padding: 4px 0;">Payment Protocol:</td>
                <td style="text-align: right; font-weight: bold; color: #8C6239; text-transform: uppercase;">${order.paymentMethod}</td>
              </tr>
              <tr>
                <td style="color: #7A6354; padding: 4px 0;">Delivery Address:</td>
                <td style="text-align: right; font-weight: bold; color: #1F1612;">${order.shippingAddress}, ${order.shippingCity}</td>
              </tr>
              <tr>
                <td style="color: #7A6354; padding: 4px 0;">Customer Contact:</td>
                <td style="text-align: right; font-weight: bold; color: #1F1612;">${order.customerPhone}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <h3 style="font-size: 15px; color: #221814; margin-bottom: 12px; border-bottom: 1px solid #E7DDD0; padding-bottom: 6px;">Ordered Pieces</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #FAF5EE; color: #7A6354; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total Calculation -->
          <div style="background: #1F1612; color: #FFFFFF; border-radius: 12px; padding: 18px 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
              <span style="color: #D4AF37;">Subtotal:</span>
              <span>Rs. ${order.subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span style="color: #D4AF37;">White-Glove VIP Delivery:</span>
              <span style="color: #34D399; font-weight: bold;">FREE</span>
            </div>
            <div style="border-top: 1px solid rgba(212,175,55,0.3); padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
              <span style="color: #F5D77F;">Total Payable:</span>
              <span style="color: #F5D77F;">Rs. ${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <!-- VIP Assistance -->
          <div style="text-align: center; margin-top: 28px; font-size: 12px; color: #7A6354;">
            <p style="margin: 0 0 4px 0;">Need custom dimensions or assistance with your order?</p>
            <p style="margin: 0; font-weight: bold; color: #8C6239;">Direct Artisan Helpline: +92 320 7006110 | orders@fahadaliinterior.com</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #FAF5EE; padding: 16px; text-align: center; font-size: 11px; color: #9C8272; border-top: 1px solid #E7DDD0;">
          © ${new Date().getFullYear()} Fahad Ali Interior. All rights reserved. Gujrat / Lahore Showroom, Pakistan.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // 1. Send to Customer
    if (order.customerEmail && order.customerEmail.includes('@')) {
      await sendSmtpTls({
        user,
        pass,
        from,
        to: order.customerEmail,
        subject: `Order Confirmation #${order.orderId} - Fahad Ali Interior`,
        html: emailHtml,
      });
      console.log(`[SMTP] Customer confirmation email sent to ${order.customerEmail}`);
    }

    // 2. Send New Order Alert to Admin
    await sendSmtpTls({
      user,
      pass,
      from,
      to: user,
      subject: `🚨 NEW ORDER RECEIVED #${order.orderId} (Rs. ${order.totalAmount.toLocaleString()})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Customer Order Placed!</h2>
          <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          <p><strong>Address:</strong> ${order.shippingAddress}, ${order.shippingCity}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod}</p>
          <p><strong>Total Amount:</strong> Rs. ${order.totalAmount.toLocaleString()}</p>
          <hr />
          ${emailHtml}
        </div>
      `,
    });
    console.log(`[SMTP] Admin new order alert sent to ${user}`);

    return { success: true };
  } catch (err: any) {
    console.error('[SMTP ERROR]', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendPasswordResetEmail({
  to,
  name = 'Valued Client',
  resetUrl,
  code,
}: {
  to: string;
  name?: string;
  resetUrl: string;
  code?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = process.env.SMTP_USER || 'mrfahada39@gmail.com';
  const pass = process.env.SMTP_PASS || 'naqxyqlglbvegztw';
  const from = process.env.SMTP_FROM || `Fahad Ali Interior <${user}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Reset Password - Fahad Ali Interior</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF5EE; margin: 0; padding: 24px; color: #221814;">
      <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DDD0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background: #1F1612; padding: 24px; text-align: center;">
          <h1 style="color: #F5D77F; margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">FAHAD ALI INTERIOR</h1>
          <p style="color: #C5A059; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1px;">HAUTE COUTURE LUXURY FURNITURE</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="margin: 0 0 12px 0; color: #221814; font-size: 20px;">Password Reset Request</h2>
          <p style="color: #7A6354; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Hello ${name},<br />We received a request to reset the password for your Fahad Ali Interior VIP Account. Click the button below or use the 6-digit code to complete the reset:
          </p>
          ${
            code
              ? `<div style="background: #FAF7F2; border: 1.5px dashed #B88E4B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <span style="font-size: 11px; color: #7A6354; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Your 6-Digit Reset Code</span>
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #221814; font-family: monospace;">${code}</span>
                </div>`
              : ''
          }
          <a href="${resetUrl}" style="display: inline-block; background: #1F1612; color: #F5D77F; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #B88E4B; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px;">
            Reset Password Now →
          </a>
          <p style="color: #9C8272; font-size: 12px; margin: 0;">This reset link and code will expire in 60 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div style="background: #FAF5EE; padding: 14px; text-align: center; font-size: 11px; color: #9C8272; border-top: 1px solid #E7DDD0;">
          © ${new Date().getFullYear()} Fahad Ali Interior. Lahore / Gujrat, Pakistan.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendSmtpTls({
      user,
      pass,
      from,
      to,
      subject: `Password Reset Request - Fahad Ali Interior`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendVerificationEmail({
  to,
  name = 'Valued Client',
  verifyUrl,
  code,
}: {
  to: string;
  name?: string;
  verifyUrl: string;
  code?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = process.env.SMTP_USER || 'mrfahada39@gmail.com';
  const pass = process.env.SMTP_PASS || 'naqxyqlglbvegztw';
  const from = process.env.SMTP_FROM || `Fahad Ali Interior <${user}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Verify Your Email - Fahad Ali Interior</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF5EE; margin: 0; padding: 24px; color: #221814;">
      <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E7DDD0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background: #1F1612; padding: 24px; text-align: center;">
          <h1 style="color: #F5D77F; margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">FAHAD ALI INTERIOR</h1>
          <p style="color: #C5A059; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1px;">HAUTE COUTURE LUXURY FURNITURE</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="margin: 0 0 12px 0; color: #221814; font-size: 20px;">Welcome to Fahad Ali Interior!</h2>
          <p style="color: #7A6354; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Hello ${name},<br />Thank you for creating an account with us. Please verify your email to unlock exclusive VIP concierge services, bespoke orders, and custom interior consultations:
          </p>
          ${
            code
              ? `<div style="background: #FAF7F2; border: 1.5px dashed #B88E4B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <span style="font-size: 11px; color: #7A6354; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Your 6-Digit Verification Code</span>
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #221814; font-family: monospace;">${code}</span>
                </div>`
              : ''
          }
          <a href="${verifyUrl}" style="display: inline-block; background: #1F1612; color: #F5D77F; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #B88E4B; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px;">
            Verify Email Address →
          </a>
          <p style="color: #9C8272; font-size: 12px; margin: 0;">If you did not register for an account, no further action is required.</p>
        </div>
        <div style="background: #FAF5EE; padding: 14px; text-align: center; font-size: 11px; color: #9C8272; border-top: 1px solid #E7DDD0;">
          © ${new Date().getFullYear()} Fahad Ali Interior. Lahore / Gujrat, Pakistan.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendSmtpTls({
      user,
      pass,
      from,
      to,
      subject: `Verify Your Email - Fahad Ali Interior`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

