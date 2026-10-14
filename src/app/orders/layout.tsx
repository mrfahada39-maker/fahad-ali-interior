import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Orders | Fahad Ali Interior',
  description: 'Track your luxury handcrafted furniture order delivery status across Pakistan.',
  alternates: {
    canonical: '/orders',
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
