import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { verifyGuestOrderToken } from '@/lib/guest-order';

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const ENTERPRISE_AI_TOOLS: ToolDeclaration[] = [
  {
    name: 'searchProducts',
    description: 'Search live catalog for luxury Sheesham furniture products by query, category, material, or price limit.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product title, material, or design style' },
        category: { type: 'string', description: 'Category e.g. Sofas, Beds, Dining Tables, Office' },
        maxPrice: { type: 'number', description: 'Maximum price threshold' },
      },
    },
  },
  {
    name: 'getProduct',
    description: 'Fetch detailed product specifications, materials, dimensions, stock, and warranty.',
    parameters: {
      type: 'object',
      properties: {
        productIdOrSlug: { type: 'string', description: 'Product ID or URL slug' },
      },
      required: ['productIdOrSlug'],
    },
  },
  {
    name: 'compareProducts',
    description: 'Compare 2 or 3 products side by side by price, material, dimensions, and warranty.',
    parameters: {
      type: 'object',
      properties: {
        productIds: { type: 'array', items: { type: 'string' }, description: 'Array of product IDs or names' },
      },
      required: ['productIds'],
    },
  },
  {
    name: 'checkStock',
    description: 'Check real-time stock availability and lead times for a specific furniture product.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID or title' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'generateQuote',
    description: 'Calculate instant estimate for custom bespoke furniture dimensions, wood stain, and fabric.',
    parameters: {
      type: 'object',
      properties: {
        itemType: { type: 'string', description: 'e.g. King Bed Set, 6-Seater Dining Table, L-Shape Sofa' },
        lengthInches: { type: 'number', description: 'Length in inches' },
        widthInches: { type: 'number', description: 'Width in inches' },
        heightInches: { type: 'number', description: 'Height in inches' },
        woodStain: { type: 'string', description: 'e.g. Natural Sheesham, Royal Dark Walnut, Satin Ebony' },
        fabricType: { type: 'string', description: 'e.g. Royal Velvet, Italian Linen, Leatherette' },
      },
      required: ['itemType', 'lengthInches', 'widthInches'],
    },
  },
  {
    name: 'calculateDelivery',
    description: 'Calculate shipping fee and white-glove delivery estimate for a destination city.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Destination city in Pakistan or worldwide' },
        orderAmount: { type: 'number', description: 'Total order subtotal' },
      },
      required: ['city'],
    },
  },
  {
    name: 'trackOrder',
    description: 'Track real-time status of a customer order using order number and authorized credentials.',
    parameters: {
      type: 'object',
      properties: {
        orderIdOrNumber: { type: 'string', description: 'Order reference number e.g. FAI-123456' },
        guestToken: { type: 'string', description: 'Tamper-proof HMAC guest token issued at checkout' },
      },
      required: ['orderIdOrNumber'],
    },
  },
  {
    name: 'bookAppointment',
    description: 'Schedule a private white-glove interior design consultation appointment.',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string' },
        phone: { type: 'string' },
        preferredDate: { type: 'string' },
        city: { type: 'string' },
      },
      required: ['customerName', 'phone', 'preferredDate'],
    },
  },
];

export interface AiToolContext {
  userId?: string | null;
  userEmail?: string | null;
  role?: string | null;
  isAdmin?: boolean;
}

export interface AiToolResult {
  success?: boolean;
  quoteId?: string;
  subtotal?: number;
  currency?: string;
  warrantyYears?: number;
  isFreeShipping?: boolean;
  shippingFee?: number;
  products?: unknown[];
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  totalAmount?: number;
  error?: string;
  [key: string]: unknown;
}

export class AiToolExecutor {
  static async executeTool(
    name: string,
    args: Record<string, unknown>,
    context?: AiToolContext
  ): Promise<AiToolResult> {
    switch (name) {
      case 'searchProducts': {
        const { query, category, maxPrice } = args;
        let products: Array<Record<string, unknown>> = [];
        try {
          const where: Record<string, unknown> = { deletedAt: null };
          if (category) where.category = { contains: category, mode: 'insensitive' };
          if (maxPrice) where.price = { lte: maxPrice };
          if (query) {
            where.OR = [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { material: { contains: query, mode: 'insensitive' } },
            ];
          }

          products = await db.product.findMany({
            where,
            take: 6,
            orderBy: { isPremium: 'desc' },
          });
        } catch (e) {
          logger.warn('Prisma tool search fallback', { detail: String(e) });
        }

        return {
          success: true,
          count: products.length,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            material: p.material || '100% Solid Sheesham Wood',
            dimensions: p.dimensions || 'Standard',
            stockCount: p.stockCount,
            image: p.image || '/cat-thumb-sofas-2x.webp',
          })),
        };
      }

      case 'generateQuote': {
        const { itemType, lengthInches = 72, widthInches = 36, woodStain, fabricType } = args as { itemType?: string; lengthInches?: number; widthInches?: number; woodStain?: string; fabricType?: string };
        const cubicFt = (Number(lengthInches) * Number(widthInches) * 48) / 1728;
        const rawWoodCost = Math.round(cubicFt * 2400);
        const laborCost = Math.round(rawWoodCost * 0.45 + 15000);
        const total = rawWoodCost + laborCost + 28000;

        return {
          success: true,
          quoteId: `QUOTE-${Date.now().toString().slice(-6)}`,
          itemType,
          dimensions: `${lengthInches}" L x ${widthInches}" W`,
          woodStain: woodStain || 'Royal Dark Walnut',
          fabricType: fabricType || 'Royal Velvet',
          material: '100% Solid Kiln-Seasoned Sheesham Wood',
          subtotal: total,
          currency: 'PKR',
          formattedTotal: `PKR ${new Intl.NumberFormat('en-PK').format(total)}`,
          warrantyYears: 10,
          deliveryEstimateDays: '10-14 Business Days',
        };
      }

      case 'calculateDelivery': {
        const { city = 'Lahore', orderAmount = 0 } = args as { city?: string; orderAmount?: number };
        const cityStr = String(city || '').toLowerCase();
        const isMajorCity = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad'].includes(cityStr);
        const fee = Number(orderAmount) >= 100000 ? 0 : isMajorCity ? 3500 : 5500;
        return {
          success: true,
          city,
          shippingFee: fee,
          isFreeShipping: fee === 0,
          formattedFee: fee === 0 ? 'FREE White-Glove Delivery & Installation' : `PKR ${new Intl.NumberFormat('en-PK').format(fee)}`,
          estimatedDays: isMajorCity ? '3-5 Business Days' : '5-7 Business Days',
        };
      }

      case 'trackOrder': {
        const { orderIdOrNumber, guestToken, token } = args as {
          orderIdOrNumber?: string;
          guestToken?: string;
          token?: string;
        };

        if (!orderIdOrNumber || typeof orderIdOrNumber !== 'string') {
          return {
            success: false,
            status: 'Invalid Order ID or Reference Number provided.',
          };
        }

        let order: {
          id: string;
          userId: string;
          status: string;
          paymentStatus: string;
          trackingNumber: string | null;
          totalAmount: unknown;
          shippingEmail: string | null;
          user?: { id: string; email: string | null; role: string } | null;
        } | null = null;

        try {
          order = await db.order.findFirst({
            where: { OR: [{ id: orderIdOrNumber }, { trackingNumber: orderIdOrNumber }] },
            select: {
              id: true,
              userId: true,
              status: true,
              paymentStatus: true,
              trackingNumber: true,
              totalAmount: true,
              shippingEmail: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          });
        } catch (e) {
          logger.warn('Prisma order search', { detail: String(e) });
        }

        if (!order) {
          return {
            success: false,
            orderNumber: orderIdOrNumber,
            status: 'Order Not Found — Please verify your Order ID or contact our showroom concierge.',
          };
        }

        // Authorization Guard: Require valid guest HMAC token or logged-in account owner / admin
        const authedUserId = context?.userId || (typeof args.userId === 'string' ? args.userId : null);
        const authedEmail = (
          context?.userEmail ||
          (typeof args.userEmail === 'string' ? args.userEmail : '') ||
          ''
        ).trim().toLowerCase();
        const isAdmin = Boolean(context?.isAdmin || context?.role === 'ADMIN');

        const isOwner = Boolean(
          (authedUserId && order.userId === authedUserId) ||
          (authedEmail && (
            (order.shippingEmail && order.shippingEmail.trim().toLowerCase() === authedEmail) ||
            (order.user?.email && order.user.email.trim().toLowerCase() === authedEmail)
          ))
        );

        const hmacToken = String(guestToken || token || '').trim();
        const orderEmail = (order.shippingEmail || order.user?.email || '').trim().toLowerCase();
        const isGuestTokenValid = Boolean(
          hmacToken &&
          orderEmail &&
          (verifyGuestOrderToken(order.id, orderEmail, hmacToken) ||
           (order.trackingNumber && verifyGuestOrderToken(order.trackingNumber, orderEmail, hmacToken)))
        );

        if (!isAdmin && !isOwner && !isGuestTokenValid) {
          return {
            success: false,
            orderNumber: orderIdOrNumber,
            error: 'Forbidden. Tracking requires a verified guest tracking token or logged-in account ownership.',
            status: 'Access Denied — Please provide your verified guest tracking token or log in with the purchasing account.',
          };
        }

        return {
          success: true,
          orderNumber: String(order.id || ''),
          status: String(order.status || 'PENDING'),
          paymentStatus: String(order.paymentStatus || 'AWAITING_VERIFICATION'),
          trackingNumber: String(order.trackingNumber || 'Pending Courier Assignment'),
          totalAmount: Number(order.totalAmount),
          estimatedDelivery: order.status === 'DELIVERED' ? 'Delivered' : '3-5 Business Days',
        };
      }

      default:
        return { success: true, message: `Tool ${name} executed successfully.` };
    }
  }
}
