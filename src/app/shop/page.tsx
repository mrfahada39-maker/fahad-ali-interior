import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const category = params?.category;
  if (category) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    redirect(`/#signature-categories?category=${encodeURIComponent(slug)}`);
  }
  redirect('/#signature-categories');
}
