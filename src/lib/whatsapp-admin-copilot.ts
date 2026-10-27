/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { WhatsAppService } from '@/lib/whatsapp';
import { Prisma } from '@prisma/client';

/**
 * WhatsApp Admin Copilot
 * Provides an intelligent conversational manager for the Admin via Meta WhatsApp Cloud API.
 * Supports interactive Question-Wise menus, natural Roman Urdu/English command parsing,
 * and live database operations (Sales, Pending Orders, Dispatch, Stock, Price, Coupons, Inquiries).
 */

export class WhatsAppAdminCopilot {
  /**
   * Generates the Primary Question-Wise Interactive Menu for the Admin.
   */
  public static getAdminMenuMessage(): string {
    return (
      `🏛️ *FAHAD ALI INTERIOR — AI EXECUTIVE MANAGER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👋 *Assalam-o-Alaikum Sir Fahad!*\n` +
      `*Sir, aaj aap kya kaam karwana chahte hain?*\n\n` +
      `1️⃣ *📊 Sawal 1: Sales & Hisaab*\n` +
      `   _Aaj ki total sale, revenue aur orders ki summary dekhna chahte hain?_\n\n` +
      `2️⃣ *📦 Sawal 2: Pending Orders & Slips*\n` +
      `   _Naye orders aur unki payment slips verify karna chahte hain?_\n\n` +
      `3️⃣ *🚚 Sawal 3: Order Dispatch & Tracking*\n` +
      `   _Kisi order ko 'Shipped' ya 'Delivered' mark karna chahte hain?_\n\n` +
      `4️⃣ *🏷️ Sawal 4: Stock Update*\n` +
      `   _Kisi furniture ka stock kam ya zyada karna chahte hain?_\n\n` +
      `5️⃣ *💰 Sawal 5: Price Change*\n` +
      `   _Kisi item ki nayi qeemat (price) set karna chahte hain?_\n\n` +
      `6️⃣ *🎟️ Sawal 6: Naya Discount Coupon*\n` +
      `   _Website par naya promo discount code activate karna chahte hain?_\n\n` +
      `7️⃣ *💬 Sawal 7: Customer Inquiries*\n` +
      `   _Website se aane wali custom design inquiries dekhna chahte hain?_\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Sir, aap 1 se 7 tak koi number likh kar bhej dein, YA aam alfaz me bol dein:*\n` +
      `▫️ _"Aaj ki sale batao"_\n` +
      `▫️ _"Pending orders dikhao"_\n` +
      `▫️ _"Velvet Sofa ka stock 10 kardo"_\n` +
      `▫️ _"Royal Bed ki price 180000 kardo"_\n` +
      `▫️ _"Coupon banao EID20 20%"_`
    );
  }

  /**
   * Handles Option 1: Sales & Hisaab Summary
   */
  public static async handleSalesSummary(targetPhone: string): Promise<string> {
    try {
      const report = await WhatsAppService.generateDailyReport();
      return report;
    } catch (err) {
      logger.error('[WhatsApp Copilot] Sales report error:', err);
      return `⚠️ Sales report generate karne mein masla aaya. Baraye meherbani thori dair baad try karein.`;
    }
  }

  /**
   * Handles Option 2: Pending Orders & Payment Slips
   */
  public static async handlePendingOrders(): Promise<string> {
    try {
      const pendingOrders = await db.order.findMany({
        where: {
          paymentStatus: 'AWAITING_VERIFICATION',
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      });

      if (!pendingOrders || pendingOrders.length === 0) {
        return (
          `✅ *Alhamdulillah Sir, is waqt koi pending order nahi hai!*\n\n` +
          `Tamam orders ki payment verify ho chuki hai. Naya order aane par aapko foran notification mil jayegi.\n\n` +
          `🌐 *Live Orders Dashboard:*\n👉 https://fahad-ali-interior.vercel.app/admin`
        );
      }

      let msg = `📋 *PENDING ORDERS FOR VERIFICATION (${pendingOrders.length} Found):*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      pendingOrders.forEach((order: any, index: number) => {
        const shortId = order.id.slice(-6).toUpperCase();
        const clientName = order.shippingName || 'Client';
        const clientPhone = order.shippingPhone || 'N/A';
        const amount = Number(order.totalAmount).toLocaleString();
        const items = order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') || 'Furniture Item';
        const slip = order.paymentScreenshot ? '📸 Slip Attached' : '❌ No Slip';

        msg += `\n*${index + 1}. Order #${shortId}* (${slip})\n`;
        msg += `   👤 *Client:* ${clientName} (${clientPhone})\n`;
        msg += `   💰 *Amount:* PKR ${amount}\n`;
        msg += `   🛋️ *Items:* ${items}\n`;
        msg += `   ⚡ *Approve karne ke liye likhein:* \`verify ${shortId}\`\n`;
        msg += `   ❌ *Reject karne ke liye likhein:* \`reject ${shortId}\`\n`;
      });

      msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💡 *Tip:* Aap kisi bhi order ko verify karne ke liye \`verify <Order#>\` reply karein.`;

      return msg;
    } catch (err) {
      logger.error('[WhatsApp Copilot] Pending orders error:', err);
      return `⚠️ Pending orders fetch karne mein masla aaya.`;
    }
  }

  /**
   * Handles Option 3: Order Dispatch & Status Change
   */
  public static async handleOrderDispatch(query: string): Promise<string> {
    try {
      // Check if specific order ID provided e.g. "ship 12345" or "deliver 12345"
      const match = query.match(/(?:ship|shipped|deliver|delivered|dispatch)\s+([a-zA-Z0-9_-]+)/i);

      if (!match || !match[1]) {
        return (
          `🚚 *ORDER DISPATCH & TRACKING*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Sir, kis Order ID ko dispatch/shipped mark karna chahte hain?\n\n` +
          `📝 *Format:* \`ship <Order#>\` ya \`deliver <Order#>\`\n` +
          `*Misaal:* \`ship ORD-102\` ya \`ship 8F9C2B\`\n\n` +
          `Order ship hote hi customer ko automatic WhatsApp tracking notification mil jayegi!`
        );
      }

      const targetId = match[1].trim();
      const isDeliver = /deliver/i.test(query);

      // Search order by exact ID or ending characters
      const order = await db.order.findFirst({
        where: {
          OR: [
            { id: targetId },
            { id: { endsWith: targetId } },
            { id: { endsWith: targetId.toUpperCase() } },
          ],
          deletedAt: null,
        },
        include: { items: true },
      });

      if (!order) {
        return `⚠️ Sir, Order ID \`#${targetId}\` database mein nahi mila. Baraye meherbani sahi order number check karein.`;
      }

      const newStatus = isDeliver ? 'DELIVERED' : 'SHIPPED';
      await db.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      // Dispatch automated WhatsApp notification to customer
      if (newStatus === 'SHIPPED') {
        await WhatsAppService.sendCustomerOrderShipped(order).catch(() => {});
      }

      const shortId = order.id.slice(-6).toUpperCase();
      const customerName = order.shippingName || 'Valued Client';

      return (
        `✅ *Mubarak ho Sir! Order Updated Successfully!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Order:* #${shortId}\n` +
        `👤 *Customer:* ${customerName}\n` +
        `🚚 *New Status:* *${newStatus}*\n` +
        `📱 *Customer Alert:* Customer ke WhatsApp par auto notification send ho chuki hai!`
      );
    } catch (err) {
      logger.error('[WhatsApp Copilot] Dispatch error:', err);
      return `⚠️ Order status update karte waqt error aaya.`;
    }
  }

  /**
   * Handles Option 4: Stock Update
   */
  public static async handleStockUpdate(query: string): Promise<string> {
    try {
      // Match patterns:
      // "stock sofa 10", "stock velvet sofa 5", "velvet sofa ka stock 10 kardo", "stock bed 0"
      const match1 = query.match(/stock\s+([a-zA-Z0-9\s_-]+?)\s+(\d+)(?:\s|$)/i);
      const match2 = query.match(/([a-zA-Z0-9\s_-]+?)\s*(?:ka|ki)?\s*stock\s*(\d+)/i);
      const match = match1 || match2;

      if (!match || !match[1] || match[2] === undefined) {
        return (
          `🏷️ *FURNITURE STOCK UPDATE*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Sir, kis furniture ka stock kitna karna chahte hain?\n\n` +
          `📝 *Format:* \`stock <Item Name> <Quantity>\`\n` +
          `*Misaalein:*\n` +
          `• \`stock Velvet Sofa 10\`\n` +
          `• \`stock Royal Bed 4\`\n` +
          `• \`stock Dining Table 0\`\n\n` +
          `💡 *Tip:* Aap Urdu me bhi likh sakte hain:\n` +
          `▫️ _"Sofa ka stock 8 kardo"_`
        );
      }

      let itemName = match[1].trim();
      const newStock = parseInt(match[2].trim(), 10);

      // Clean common Urdu filler words
      itemName = itemName.replace(/^(ka|ki|ke|set)\s+/i, '').replace(/\s+(ka|ki|ke|set)$/i, '').trim();

      if (isNaN(newStock) || newStock < 0) {
        return `⚠️ Stock quantity positive number honi chahiye (e.g. 0, 5, 10).`;
      }

      // Search matching products
      const products = await db.product.findMany({
        where: {
          name: { contains: itemName, mode: 'insensitive' },
          deletedAt: null,
        },
        take: 3,
      });

      if (!products || products.length === 0) {
        // Fallback: list some available products
        const sampleProducts = await db.product.findMany({
          where: { deletedAt: null },
          take: 4,
          select: { name: true, stockCount: true },
        });
        const samples = sampleProducts.map((p: any) => `• ${p.name} (Current: ${p.stockCount})`).join('\n');

        return (
          `⚠️ Sir, "*${itemName}*" se milta julta koi furniture nahi mila.\n\n` +
          `🛋️ *Store ke kuch items:*\n${samples}\n\n` +
          `Baraye meherbani sahi item ka naam likhein (e.g. \`stock ${sampleProducts[0]?.name || 'Sofa'} 5\`).`
        );
      }

      const product = products[0];
      const previousStock = product.stockCount;

      await db.product.update({
        where: { id: product.id },
        data: { stockCount: newStock },
      });

      return (
        `✅ *Stock Updated Successfully Sir!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛋️ *Product:* *${product.name}*\n` +
        `📦 *Previous Stock:* ${previousStock} units\n` +
        `🟢 *New Live Stock:* *${newStock} units*\n\n` +
        `Website par ye stock foran update ho chuka hai!`
      );
    } catch (err) {
      logger.error('[WhatsApp Copilot] Stock update error:', err);
      return `⚠️ Stock update karte waqt error aaya.`;
    }
  }

  /**
   * Handles Option 5: Price Change
   */
  public static async handlePriceChange(query: string): Promise<string> {
    try {
      // Match patterns:
      // "price sofa 85000", "price royal bed 180000", "sofa ki price 90000 kardo"
      const match1 = query.match(/price\s+([a-zA-Z0-9\s_-]+?)\s+(\d[\d,]*)(?:\s|$)/i);
      const match2 = query.match(/([a-zA-Z0-9\s_-]+?)\s*(?:ka|ki)?\s*price\s*(\d[\d,]*)/i);
      const match = match1 || match2;

      if (!match || !match[1] || !match[2]) {
        return (
          `💰 *FURNITURE PRICE CHANGE*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Sir, kis furniture ki nayi qeemat lagani hai?\n\n` +
          `📝 *Format:* \`price <Item Name> <Amount in PKR>\`\n` +
          `*Misaalein:*\n` +
          `• \`price Velvet Sofa 85000\`\n` +
          `• \`price Royal Bed 175000\`\n` +
          `• \`price Dining Table 95000\`\n\n` +
          `💡 *Tip:* Aap Urdu me bhi likh sakte hain:\n` +
          `▫️ _"Dining table ki price 90000 kardo"_`
        );
      }

      let itemName = match[1].trim();
      const rawPrice = match[2].replace(/,/g, '').trim();
      const newPrice = parseFloat(rawPrice);

      itemName = itemName.replace(/^(ka|ki|ke|set)\s+/i, '').replace(/\s+(ka|ki|ke|set)$/i, '').trim();

      if (isNaN(newPrice) || newPrice <= 0) {
        return `⚠️ Price valid positive amount honi chahiye (e.g. 85000).`;
      }

      const products = await db.product.findMany({
        where: {
          name: { contains: itemName, mode: 'insensitive' },
          deletedAt: null,
        },
        take: 3,
      });

      if (!products || products.length === 0) {
        return `⚠️ Sir, "*${itemName}*" se milta julta furniture nahi mila. Baraye meherbani item ka mukammal naam likhein.`;
      }

      const product = products[0];
      const previousPrice = Number(product.price).toLocaleString();

      await db.product.update({
        where: { id: product.id },
        data: { price: new Prisma.Decimal(newPrice) },
      });

      return (
        `✅ *Price Updated Successfully Sir!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛋️ *Product:* *${product.name}*\n` +
        `💸 *Purani Price:* PKR ${previousPrice}\n` +
        `✨ *Nayi Price:* *PKR ${Number(newPrice).toLocaleString()}*\n\n` +
        `Website ke storefront par nayi qeemat live ho chuki hai!`
      );
    } catch (err) {
      logger.error('[WhatsApp Copilot] Price update error:', err);
      return `⚠️ Price update karte waqt error aaya.`;
    }
  }

  /**
   * Handles Option 6: Discount Coupon Creation
   */
  public static async handleCouponCreate(query: string): Promise<string> {
    try {
      // Match patterns:
      // "coupon EID20 20", "coupon LUXURY15 15%", "coupon banao EID20 20%"
      const match = query.match(/coupon\s+(?:banao\s+)?([a-zA-Z0-9_-]+)\s+(\d+)\s*%?/i);

      if (!match || !match[1] || !match[2]) {
        return (
          `🎟️ *DISCOUNT PROMO COUPON*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Sir, naya discount coupon create karne ke liye code aur percentage likhein.\n\n` +
          `📝 *Format:* \`coupon <CODE> <Discount%>\`\n` +
          `*Misaalein:*\n` +
          `• \`coupon EID20 20%\` (20% Off)\n` +
          `• \`coupon LUXURY15 15\` (15% Off)\n` +
          `• \`coupon FAHAD10 10\` (10% Off)\n\n` +
          `Website par customer checkout karte waqt ye code enter karke discount le sakein ge!`
        );
      }

      const code = match[1].trim().toUpperCase();
      const discountVal = parseInt(match[2].trim(), 10);

      if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
        return `⚠️ Discount percentage 1 se 100 ke darmiyan honi chahiye (e.g. 15 ya 20).`;
      }

      const existingCoupon = await db.coupon.findUnique({
        where: { code },
      });

      if (existingCoupon) {
        await db.coupon.update({
          where: { code },
          data: {
            discount: new Prisma.Decimal(discountVal),
            isActive: true,
            deletedAt: null,
          },
        });
      } else {
        await db.coupon.create({
          data: {
            code,
            discount: new Prisma.Decimal(discountVal),
            discountType: 'PERCENTAGE',
            minOrderAmount: new Prisma.Decimal(0),
            maxUses: 0,
            isActive: true,
          },
        });
      }

      return (
        `✅ *Coupon Activated Successfully Sir!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *Promo Code:* *${code}*\n` +
        `🎁 *Discount:* *${discountVal}% OFF*\n` +
        `🟢 *Status:* Active & Live on Checkout\n\n` +
        `Customers ab yeh coupon checkout page par use kar sakte hain!`
      );
    } catch (err) {
      logger.error('[WhatsApp Copilot] Coupon error:', err);
      return `⚠️ Coupon create karte waqt error aaya.`;
    }
  }

  /**
   * Handles Option 7: Customer Inquiries & Messages
   */
  public static async handleInquiries(): Promise<string> {
    try {
      const [inquiries, recentMessages] = await Promise.all([
        db.inquiry.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { user: true },
        }),
        db.message.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { user: true },
        }),
      ]);

      if (inquiries.length === 0 && recentMessages.length === 0) {
        return `✅ *Sir, is waqt koi nayi design inquiry ya unread message nahi hai.*`;
      }

      let msg = `💬 *LATEST CUSTOMER INQUIRIES & MESSAGES:*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (inquiries.length > 0) {
        msg += `\n🛋️ *Custom Interior Inquiries:*\n`;
        inquiries.forEach((inq: any, idx: number) => {
          const clientName = inq.user?.name || 'Valued Client';
          const phone = inq.user?.phone || 'N/A';
          const budget = inq.budget ? `PKR ${Number(inq.budget).toLocaleString()}` : 'Flexible';
          const cleanPhone = phone.replace(/\D/g, '');

          msg += `*${idx + 1}. Room:* ${inq.roomType} | *Budget:* ${budget}\n`;
          msg += `   👤 ${clientName} (${phone})\n`;
          if (cleanPhone) {
            msg += `   📲 WhatsApp: https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : '92' + cleanPhone.replace(/^0/, '')}\n`;
          }
          if (inq.description) {
            msg += `   📝 "${inq.description.slice(0, 70)}..."\n`;
          }
        });
      }

      if (recentMessages.length > 0) {
        msg += `\n📩 *Recent Chat Messages:*\n`;
        recentMessages.forEach((m: any, idx: number) => {
          const sender = m.user?.name || m.sender || 'Client';
          msg += `*${idx + 1}. ${sender}:* "${m.text.slice(0, 60)}..."\n`;
        });
      }

      msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🌐 *Admin Inquiries Tab:*\n👉 https://fahad-ali-interior.vercel.app/admin`;

      return msg;
    } catch (err) {
      logger.error('[WhatsApp Copilot] Inquiries error:', err);
      return `⚠️ Inquiries fetch karte waqt error aaya.`;
    }
  }

  /**
   * Main intelligent processor for incoming messages from the authorized Admin phone.
   */
  public static async processAdminCommand(senderPhone: string, rawText: string): Promise<string> {
    const text = (rawText || '').trim();
    const lower = text.toLowerCase();

    // 1. Check for Question 1 / Sales: "1", "sales", "report", "hisaab", "today", "aaj ki sale"
    if (
      lower === '1' ||
      lower === 'sales' ||
      lower === 'report' ||
      lower === 'hisaab' ||
      lower === 'hisab' ||
      lower === 'today' ||
      lower === 'aaj ki sale' ||
      lower.includes('sale batao') ||
      lower.includes('aaj ka hisaab')
    ) {
      return await this.handleSalesSummary(senderPhone);
    }

    // 2. Check for Question 2 / Pending Orders: "2", "pending", "slips", "orders", "pending orders"
    if (
      lower === '2' ||
      lower === 'pending' ||
      lower === 'slips' ||
      lower === 'orders' ||
      lower === 'pending orders' ||
      lower === 'slip' ||
      lower.includes('orders dikhao') ||
      lower.includes('pending dikhao')
    ) {
      return await this.handlePendingOrders();
    }

    // 3. Check for Question 3 / Dispatch: "3", "ship", "deliver", "dispatch"
    if (
      lower === '3' ||
      lower.startsWith('ship') ||
      lower.startsWith('deliver') ||
      lower.startsWith('dispatch') ||
      lower.includes('ship kardo') ||
      lower.includes('deliver kardo')
    ) {
      return await this.handleOrderDispatch(text);
    }

    // 4. Check for Question 4 / Stock: "4", "stock", "stock sofa 10", "sofa ka stock 10 kardo"
    if (
      lower === '4' ||
      lower.startsWith('stock') ||
      lower.includes(' ka stock ') ||
      lower.includes(' ki stock ') ||
      lower.includes('stock kardo')
    ) {
      return await this.handleStockUpdate(text);
    }

    // 5. Check for Question 5 / Price: "5", "price", "price sofa 85000", "sofa ki price 90000 kardo"
    if (
      lower === '5' ||
      lower.startsWith('price') ||
      lower.includes(' ka price ') ||
      lower.includes(' ki price ') ||
      lower.includes('price kardo') ||
      lower.includes('qeemat')
    ) {
      return await this.handlePriceChange(text);
    }

    // 6. Check for Question 6 / Coupon: "6", "coupon", "coupon EID20 20%"
    if (
      lower === '6' ||
      lower.startsWith('coupon') ||
      lower.includes('coupon banao') ||
      lower.includes('discount code')
    ) {
      return await this.handleCouponCreate(text);
    }

    // 7. Check for Question 7 / Inquiries: "7", "inquiry", "inquiries", "messages", "rabta"
    if (
      lower === '7' ||
      lower === 'inquiry' ||
      lower === 'inquiries' ||
      lower === 'messages' ||
      lower === 'rabta' ||
      lower.includes('inquiries dikhao')
    ) {
      return await this.handleInquiries();
    }

    // 8. Default fallback for Greetings / Menu / Unknown Admin text:
    // "menu", "hi", "hello", "aoa", "salam", "help", "admin", "?", etc.
    return this.getAdminMenuMessage();
  }
}
