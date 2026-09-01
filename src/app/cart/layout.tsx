import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review items in your Fahad Ali Interior cart.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
