import { redirect } from 'next/navigation';

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  if (params?.category) {
    const slug = params.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    redirect(`/#cat-section-${slug}`);
  }
  redirect('/#signature-categories');
}
