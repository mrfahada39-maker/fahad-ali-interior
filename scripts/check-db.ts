import { db } from './src/lib/db';

async function main() {
  const orders = await db.order.findMany({
    include: { items: true, user: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total orders in DB:', orders.length);
  orders.forEach((o, i) => {
    console.log(`\n[Order ${i + 1}] ID: ${o.id}`);
    console.log('  shippingName:', o.shippingName);
    console.log('  shippingPhone:', o.shippingPhone);
    console.log('  shippingEmail:', o.shippingEmail);
    console.log('  shippingAddress:', o.shippingAddress);
    console.log('  shippingCity:', o.shippingCity);
    console.log('  shippingProvince:', o.shippingProvince);
    console.log('  user.name:', o.user?.name);
    console.log('  user.email:', o.user?.email);
    console.log('  user.phone:', o.user?.phone);
    console.log('  items count:', o.items?.length);
    console.log('  items:', o.items?.map(it => `${it.name} (x${it.quantity}) - Rs. ${it.price}`).join(', '));
  });
}

main().catch(console.error).finally(() => process.exit(0));
