import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import FAQPage from './FAQPage';
import { faqCategories } from '@/lib/faq-data';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description: 'Find answers to common questions about our luxury furniture, delivery, payment options, customization, and warranty policies.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ | Fahad Ali Interior',
    description: 'Frequently asked questions about luxury furniture, delivery, and services.',
    type: 'website',
  },
};

export default function FAQ() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((cat) =>
      cat.questions.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.a,
        },
      }))
    ),
  };

  return (
    <StoreShell showFooter={true}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQPage />
    </StoreShell>
  );
}
