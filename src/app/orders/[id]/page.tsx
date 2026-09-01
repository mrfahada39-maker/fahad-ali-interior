import { Metadata } from 'next';
import OrderDetailClient from './OrderDetailClient';
import StoreShell from '@/components/layout/StoreShell';

export const metadata: Metadata = {
  title: 'Order Details | Fahad Ali Interior',
  description: 'View your order details and tracking information.',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <StoreShell showFooter={true}>
      <OrderDetailClient orderId={id} />
    </StoreShell>
  );
}
