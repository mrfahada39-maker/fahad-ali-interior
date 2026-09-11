import StoreShell from '@/components/StoreShell';
import dynamic from 'next/dynamic';

const Checkout = dynamic(() => import('@/components/Checkout'), {
  loading: () => (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#FCFAF7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif tracking-widest uppercase text-xs text-[#8C6239]">Securing Checkout Terminal...</p>
      </div>
    </div>
  ),
  ssr: true,
});

export default function CheckoutPage() {
  return (
    <StoreShell showFooter={false}>
      <Checkout />
    </StoreShell>
  );
}
