import { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import ContactPageClient from './ContactPageClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Contact Us | Fahad Ali Interior',
  description: 'Connect with Fahad Ali Interior for custom furniture inquiries, bespoke royal commissions, and flagship atelier showroom appointments.',
  openGraph: {
    title: 'Contact Us | Fahad Ali Interior',
    description: 'Direct VIP concierge, phone line, WhatsApp, and showroom consultation for luxury solid sheesham furniture.',
  },
};

export default function ContactPage() {
  return (
    <StoreShell showFooter={true}>
      <ContactPageClient />
    </StoreShell>
  );
}
