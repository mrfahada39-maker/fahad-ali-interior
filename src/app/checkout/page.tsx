import StoreShell from '@/components/layout/StoreShell';
import Checkout from '@/components/Checkout';

export default function CheckoutPage() {
  return (
    <StoreShell showFooter={false}>
      <Checkout />
    </StoreShell>
  );
}
