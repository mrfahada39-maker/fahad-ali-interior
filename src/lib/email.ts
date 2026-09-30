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
  host = process.env.SMTP_HOST || 'smtp.gmail.com',
  port = Number(process.env.SMTP_PORT) || 465,
  user = process.env.SMTP_USER || '',
  pass = process.env.SMTP_PASS || '',
  from = process.env.SMTP_FROM || (process.env.SMTP_USER ? `Fahad Ali Interior <${process.env.SMTP_USER}>` : 'Fahad Ali Interior <info@fahadaliinterior.com>'),
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
  if (!user || !pass) {
    console.error('[SMTP ERROR] Cannot send email: SMTP_USER or SMTP_PASS environment variable is missing.');
    return Promise.resolve(false);
  }
  const tlsPort = (port === 587 && host.includes('gmail.com')) ? 465 : port;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    try {
      const socket = tls.connect(
        {
          host,
          port: tlsPort,
          rejectUnauthorized: true,
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
              finish(true);
            }
          });
        }
      );

      socket.on('error', (err) => {
        console.error('[SMTP TLS ERROR]', err.message);
        finish(false);
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        finish(false);
      });
    } catch (e: any) {
      console.error('[SMTP CONNECT ERROR]', e.message);
      finish(false);
    }
  });
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || (user ? `Fahad Ali Interior <${user}>` : 'Fahad Ali Interior <info@fahadaliinterior.com>');

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #EFE8DD;">
        <td style="padding: 14px 10px; vertical-align: middle;">
          <div style="font-weight: 800; color: #1F1612; font-size: 14px; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0.2px;">${item.name}</div>
          <div style="color: #9C8272; font-size: 11px; margin-top: 3px; font-weight: 500;">🪵 100% Solid Kiln-Seasoned Sheesham • 10-Yr Warranty</div>
        </td>
        <td style="padding: 14px 10px; text-align: center; vertical-align: middle;">
          <span style="display: inline-block; background: #F3ECE2; border: 1px solid #E2D6C5; color: #5C4538; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 12px;">× ${item.quantity}</span>
        </td>
        <td style="padding: 14px 10px; text-align: right; vertical-align: middle; color: #8C6239; font-weight: 800; font-size: 14.5px; font-family: 'Playfair Display', Georgia, serif;">
          Rs. ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation #${order.orderId} - Fahad Ali Interior</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      </style>
    </head>
    <body style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F3EE; margin: 0; padding: 28px 12px; color: #221814; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            
            <!-- Main Luxury Container -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1.5px solid #E5DBCB; box-shadow: 0 16px 45px rgba(34, 24, 20, 0.08);">
              
              <!-- ── TOP PRESTIGE HEADER ── -->
              <tr>
                <td style="background: linear-gradient(180deg, #18110D 0%, #241914 100%); padding: 36px 28px 30px; text-align: center; border-bottom: 2px solid #C9A24D;">
                  
                  <!-- Gold Crest Seal -->
                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 14px;">
                    <tr>
                      <td align="center" style="width: 44px; height: 44px; border: 1.5px solid #D4AF37; border-radius: 50%; background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(26,17,13,0.9) 100%);">
                        <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: #F5E5C9; letter-spacing: 1px;">FA</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Brand Wordmark -->
                  <h1 style="color: #F8E7BE; margin: 0; font-size: 23px; font-weight: 900; letter-spacing: 3.5px; text-transform: uppercase; font-family: 'Playfair Display', Georgia, serif;">
                    FAHAD ALI <span style="color: #D4AF37; font-style: italic; font-weight: normal; margin: 0 2px;">&</span> INTERIOR
                  </h1>
                  <p style="color: #C5A059; margin: 8px 0 0; font-size: 10.5px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;">
                    Haute Couture Solid Sheesham Atelier • Lahore
                  </p>

                  <!-- Hairline 24K Gold Accent Line -->
                  <div style="height: 1px; width: 140px; margin: 18px auto 0; background: linear-gradient(90deg, rgba(212,175,55,0), #D4AF37, rgba(212,175,55,0));"></div>
                </td>
              </tr>

              <!-- ── MAIN BODY CONTENT ── -->
              <tr>
                <td style="padding: 34px 28px 24px;">
                  
                  <!-- Royal Status Medallion -->
                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px;">
                    <tr>
                      <td style="background: #FAF5EA; border: 1.5px solid #D4AF37; border-radius: 50px; padding: 7px 22px; text-align: center; box-shadow: 0 2px 10px rgba(212,175,55,0.15);">
                        <span style="color: #8C6239; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                          ✦ ROYAL COMMISSION CONFIRMED ✦
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Customer Salutation -->
                  <div style="text-align: center; margin-bottom: 26px;">
                    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 900; color: #221814; margin: 0 0 8px; letter-spacing: -0.3px;">
                      Thank You, ${order.customerName}!
                    </h2>
                    <p style="margin: 0 auto; color: #6E594D; font-size: 13.5px; line-height: 1.65; max-width: 460px;">
                      Your bespoke solid wood commission has been officially confirmed and queued for artisan kiln-seasoned crafting in our atelier.
                    </p>
                  </div>

                  <!-- ── EXECUTIVE ORDER METADATA CARD (100% Table Layout) ── -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FAF7F2; border: 1.5px solid #E8DFD3; border-radius: 18px; margin-bottom: 26px; overflow: hidden;">
                    <tr>
                      <td style="padding: 18px 20px;">
                        <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px;">
                          <tr>
                            <td style="color: #7A6354; font-weight: 600; width: 38%; padding: 6px 0;">Order Reference:</td>
                            <td style="text-align: right; padding: 6px 0;">
                              <span style="background: #1F1612; color: #F8E7BE; font-weight: 800; font-family: monospace; font-size: 12.5px; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.5px;">#${order.orderId}</span>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="border-top: 1px solid #ECE3D6; padding: 0;"></td>
                          </tr>
                          <tr>
                            <td style="color: #7A6354; font-weight: 600; padding: 8px 0 6px;">Payment Protocol:</td>
                            <td style="text-align: right; font-weight: 800; color: #996515; text-transform: uppercase; font-size: 12.5px; padding: 8px 0 6px;">
                              ${order.paymentMethod}
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="border-top: 1px solid #ECE3D6; padding: 0;"></td>
                          </tr>
                          <tr>
                            <td style="color: #7A6354; font-weight: 600; padding: 8px 0 6px; vertical-align: top;">Delivery Address:</td>
                            <td style="text-align: right; font-weight: 700; color: #1F1612; padding: 8px 0 6px;">
                              ${order.shippingAddress}, ${order.shippingCity}
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="border-top: 1px solid #ECE3D6; padding: 0;"></td>
                          </tr>
                          <tr>
                            <td style="color: #7A6354; font-weight: 600; padding: 8px 0 2px;">Customer Contact:</td>
                            <td style="text-align: right; font-weight: 700; color: #1F1612; padding: 8px 0 2px;">
                              ${order.customerPhone}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- ── ORDERED PIECES TABLE ── -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
                    <tr>
                      <td style="padding-bottom: 10px; border-bottom: 1.5px solid #E7DDD0;">
                        <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 900; color: #221814; letter-spacing: 1px; text-transform: uppercase;">
                          Ordered Masterpieces
                        </span>
                      </td>
                      <td style="padding-bottom: 10px; border-bottom: 1.5px solid #E7DDD0; text-align: right;">
                        <span style="font-size: 11px; color: #8C6239; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Artisan Certified</span>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                      <tr style="background: #F5EFE6; color: #7A6354; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">
                        <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 8px;">Masterwork Piece</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right; border-radius: 0 8px 8px 0;">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- ── 24K EXECUTIVE TOTAL BREAKDOWN (100% Table Layout - Bulletproof on Gmail Mobile) ── -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #1C130F 0%, #281B15 100%); border: 1.5px solid #C9A24D; border-radius: 18px; box-shadow: 0 10px 30px rgba(34, 24, 20, 0.25); margin-bottom: 26px;">
                    <tr>
                      <td style="padding: 22px 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          
                          <!-- Subtotal Row -->
                          <tr>
                            <td align="left" style="color: #D9C3A3; font-size: 13.5px; font-weight: 600; padding: 4px 0;">
                              Subtotal Amount:
                            </td>
                            <td align="right" style="color: #FFFFFF; font-size: 14.5px; font-weight: 700; padding: 4px 0;">
                              Rs. ${order.subtotal.toLocaleString()}
                            </td>
                          </tr>

                          <!-- VIP Delivery Row -->
                          <tr>
                            <td align="left" style="color: #D9C3A3; font-size: 13.5px; font-weight: 600; padding: 8px 0;">
                              White-Glove VIP Delivery & Assembly:
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <span style="display: inline-block; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.45); color: #34D399; font-weight: 800; font-size: 10.5px; letter-spacing: 1px; padding: 3px 9px; border-radius: 5px;">
                                COMPLIMENTARY FREE
                              </span>
                            </td>
                          </tr>

                          <!-- Divider Line -->
                          <tr>
                            <td colspan="2" style="padding: 10px 0;">
                              <div style="height: 1px; background: linear-gradient(90deg, rgba(201,162,77,0.1), rgba(201,162,77,0.6), rgba(201,162,77,0.1));"></div>
                            </td>
                          </tr>

                          <!-- Grand Total Row -->
                          <tr>
                            <td align="left" style="color: #F8E7BE; font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                              TOTAL PAYABLE:
                            </td>
                            <td align="right" style="color: #F8E7BE; font-size: 21px; font-weight: 900; font-family: 'Playfair Display', Georgia, serif; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
                              Rs. ${order.totalAmount.toLocaleString()}
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- ── CONCIERGE & WHATSAPP SUPPORT CARD ── -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FAF6F0; border: 1px solid #E8DFD3; border-radius: 16px; text-align: center;">
                    <tr>
                      <td style="padding: 20px 18px;">
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #221814;">
                          Need bespoke dimensions, polish sample, or order modification?
                        </p>
                        <p style="margin: 0 0 14px; font-size: 12px; color: #7A6354;">
                          Our Master Artisan Concierge is available 7 days a week to assist you.
                        </p>
                        
                        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 10px;">
                          <tr>
                            <td align="center" style="background: #25D366; border-radius: 50px; box-shadow: 0 4px 14px rgba(37,211,102,0.3);">
                              <a href="https://wa.me/923207006110?text=Assalam-o-Alaikum%20Fahad%20Ali%20Interior%2C%20I%20have%20an%20inquiry%20regarding%20Order%20%23${order.orderId}" style="display: inline-block; padding: 10px 24px; color: #FFFFFF; font-weight: 800; font-size: 12.5px; text-decoration: none; letter-spacing: 0.5px;">
                                💬 WhatsApp Artisan Concierge
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 8px 0 0; font-size: 11.5px; color: #8C6239; font-weight: 600;">
                          Direct Hotline: <strong>+92 320 7006110</strong> &nbsp;|&nbsp; <strong>orders@fahadaliinterior.com</strong>
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- ── PRESTIGE FOOTER ── -->
              <tr>
                <td style="background: #F5EFE6; padding: 22px 24px; text-align: center; border-top: 1.5px solid #E8DFD3;">
                  <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #5C4538; text-transform: uppercase; letter-spacing: 1px;">
                    Fahad Ali Interior • Lahore Flagship Showroom & Gujrat Atelier
                  </p>
                  <p style="margin: 0; font-size: 10.5px; color: #9C8272;">
                    © ${new Date().getFullYear()} Fahad Ali Interior. All rights reserved. Handcrafted Solid Sheesham Luxury Furniture.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; background: #FAF5EE;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 24px; border: 1.5px solid #D4AF37;">
            <h2 style="color: #221814; font-family: Georgia, serif; margin-top: 0;">🚨 New Customer Order Received!</h2>
            <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
            <p><strong>Delivery Address:</strong> ${order.shippingAddress}, ${order.shippingCity}</p>
            <p><strong>Payment Protocol:</strong> ${order.paymentMethod}</p>
            <p><strong>Total Amount:</strong> <span style="color: #8C6239; font-weight: bold; font-size: 16px;">Rs. ${order.totalAmount.toLocaleString()}</span></p>
            <hr style="border: 0; height: 1px; background: #E7DDD0; margin: 20px 0;" />
            <h3 style="color: #7A6354; font-size: 14px; text-transform: uppercase;">Customer Email Preview Below:</h3>
            ${emailHtml}
          </div>
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
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || (user ? `Fahad Ali Interior <${user}>` : 'Fahad Ali Interior <info@fahadaliinterior.com>');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - Fahad Ali Interior</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F3EE; margin: 0; padding: 28px 12px; color: #221814;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1.5px solid #E5DBCB; box-shadow: 0 16px 45px rgba(34, 24, 20, 0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(180deg, #18110D 0%, #241914 100%); padding: 32px 24px 26px; text-align: center; border-bottom: 2px solid #C9A24D;">
                  <h1 style="color: #F8E7BE; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; font-family: Georgia, serif;">
                    FAHAD ALI <span style="color: #D4AF37; font-style: italic; font-weight: normal;">&</span> INTERIOR
                  </h1>
                  <p style="color: #C5A059; margin: 6px 0 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                    VIP Account Security
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 34px 28px; text-align: center;">
                  <h2 style="font-family: Georgia, serif; font-size: 22px; color: #221814; margin: 0 0 10px;">
                    Password Reset Request
                  </h2>
                  <p style="color: #6E594D; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Hello ${name},<br />We received a request to reset your password for your Fahad Ali Interior VIP account. Use the 6-digit verification code below:
                  </p>

                  ${
                    code
                      ? `<div style="background: #FAF6F0; border: 1.5px dashed #C9A24D; border-radius: 14px; padding: 18px; margin: 0 auto 26px; max-width: 320px;">
                          <span style="font-size: 11px; color: #8C6239; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Your 6-Digit Code</span>
                          <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1F1612; font-family: monospace;">${code}</span>
                        </div>`
                      : ''
                  }

                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #1C130F 0%, #281B15 100%); border: 1px solid #D4AF37; border-radius: 12px; box-shadow: 0 4px 15px rgba(34,24,20,0.2);">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; color: #F8E7BE; font-weight: 800; font-size: 13.5px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                          Reset Password Now →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #9C8272; font-size: 12px; margin: 0; line-height: 1.5;">
                    This security link will expire in 60 minutes. If you did not request this, please disregard this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F5EFE6; padding: 18px 24px; text-align: center; border-top: 1px solid #E8DFD3; font-size: 11px; color: #8C7565;">
                  © ${new Date().getFullYear()} Fahad Ali Interior. Lahore Flagship Showroom & Atelier, Pakistan.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
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
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || (user ? `Fahad Ali Interior <${user}>` : 'Fahad Ali Interior <info@fahadaliinterior.com>');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Fahad Ali Interior</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F3EE; margin: 0; padding: 28px 12px; color: #221814;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1.5px solid #E5DBCB; box-shadow: 0 16px 45px rgba(34, 24, 20, 0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(180deg, #18110D 0%, #241914 100%); padding: 32px 24px 26px; text-align: center; border-bottom: 2px solid #C9A24D;">
                  <h1 style="color: #F8E7BE; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; font-family: Georgia, serif;">
                    FAHAD ALI <span style="color: #D4AF37; font-style: italic; font-weight: normal;">&</span> INTERIOR
                  </h1>
                  <p style="color: #C5A059; margin: 6px 0 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                    VIP Client Membership
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 34px 28px; text-align: center;">
                  <h2 style="font-family: Georgia, serif; font-size: 22px; color: #221814; margin: 0 0 10px;">
                    Welcome to Fahad Ali Interior!
                  </h2>
                  <p style="color: #6E594D; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Hello ${name},<br />Thank you for creating an account. Please verify your email to unlock exclusive VIP concierge services, bespoke orders, and custom interior consultations:
                  </p>

                  ${
                    code
                      ? `<div style="background: #FAF6F0; border: 1.5px dashed #C9A24D; border-radius: 14px; padding: 18px; margin: 0 auto 26px; max-width: 320px;">
                          <span style="font-size: 11px; color: #8C6239; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Your Verification Code</span>
                          <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1F1612; font-family: monospace;">${code}</span>
                        </div>`
                      : ''
                  }

                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #1C130F 0%, #281B15 100%); border: 1px solid #D4AF37; border-radius: 12px; box-shadow: 0 4px 15px rgba(34,24,20,0.2);">
                        <a href="${verifyUrl}" style="display: inline-block; padding: 14px 36px; color: #F8E7BE; font-weight: 800; font-size: 13.5px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                          Verify Email Address →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #9C8272; font-size: 12px; margin: 0; line-height: 1.5;">
                    If you did not create this account, please disregard this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F5EFE6; padding: 18px 24px; text-align: center; border-top: 1px solid #E8DFD3; font-size: 11px; color: #8C7565;">
                  © ${new Date().getFullYear()} Fahad Ali Interior. Lahore Flagship Showroom & Atelier, Pakistan.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
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

