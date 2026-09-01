import { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import FAQPage from './FAQPage';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAQ | Fahad Ali Interior — Frequently Asked Questions',
  description: 'Find answers to common questions about our luxury furniture, delivery, payment options, customization, and warranty policies.',
  openGraph: {
    title: 'FAQ | Fahad Ali Interior',
    description: 'Frequently asked questions about luxury furniture, delivery, and services.',
    type: 'website',
  },
};

export default function FAQ() {
  return (
    <StoreShell showFooter={true}>
      <FAQPage />
    </StoreShell>
  );
}
