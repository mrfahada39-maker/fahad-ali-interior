import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Bag | Fahad Ali Interior',
  description: 'Review your selected luxury handcrafted solid Sheesham furniture pieces.',
  alternates: {
    canonical: '/cart',
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
