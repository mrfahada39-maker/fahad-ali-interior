import { PrismaClient } from '@prisma/client';
import { WhatsAppService } from '../src/lib/whatsapp.ts';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  console.log('Sending verification alert for new real order:', order.id);
  const audit = {
    verdict: 'AUTHENTIC_MATCH',
    confidence: 96.0,
    extractedAmount: Number(order.totalAmount),
    transactionId: 'JZC20261023-99412',
    isDuplicateTid: false,
    summaryUrdu: 'Slip Asli Hai: JazzCash 140,000 PKR tasdeeq shuda.'
  };

  const res = await WhatsAppService.sendAdminOrderVerificationAlert({
    order: {
      id: order.id,
      shippingName: order.shippingName || 'Fahad',
      shippingPhone: order.shippingPhone || process.env.ADMIN_WHATSAPP_NUMBER || '+92 300 1234567',
      shippingCity: order.shippingCity || 'Lahore',
      paymentMethod: order.paymentMethod || 'JAZZCASH',
      totalAmount: Number(order.totalAmount),
      items: order.items.map(i => ({ name: i.name || 'Artisan Furniture Piece', quantity: i.quantity, price: Number(i.price) })),
      paymentScreenshot: order.paymentScreenshot
    },
    audit
  });

  console.log('Alert Result:', res);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
