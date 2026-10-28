import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Sparkles, ArrowRight } from 'lucide-react';
import StoreShell from '@/components/StoreShell';
import { db } from '@/lib/db';
import type { EditorialArticle } from '@/lib/editorial-fallback';

export const revalidate = 60;

type RouteProps = { params: Promise<{ slug: string }> };

async function getArticleBySlug(slug: string): Promise<EditorialArticle | null> {
  const cleanSlug = decodeURIComponent(slug).trim();
  const dbArticle = await db.blogPost
    .findFirst({
      where: { slug: cleanSlug, deletedAt: null, isActive: true },
    })
    .catch(() => null);

  if (dbArticle) {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      slug: dbArticle.slug,
      excerpt: dbArticle.excerpt || dbArticle.content.slice(0, 160),
      content: dbArticle.content,
      image: dbArticle.image || '/hero-living-room-img1-4k.webp',
      author: dbArticle.author || 'Fahad Ali Atelier',
      tags: Array.isArray(dbArticle.tags) && dbArticle.tags.length > 0 ? dbArticle.tags : ['Atelier Journal'],
      createdAt: dbArticle.createdAt ? new Date(dbArticle.createdAt).toISOString() : new Date().toISOString(),
      isActive: dbArticle.isActive,
    };
  }

  return null;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: 'Article Not Found | Fahad Ali Interior' };
  }
  return {
    title: `${article.title} | Fahad Ali Interior Journal`,
    description: article.excerpt,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    openGraph: {
      title: `${article.title} | Fahad Ali Interior`,
      description: article.excerpt,
      type: 'article',
      url: `/blog/${article.slug}`,
      images: [
        {
          url: article.image || '/hero-living-room-img1-4k.webp',
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

export default async function BlogDetailPage({ params }: RouteProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: article.image ? [article.image] : ['/hero-living-room-img1-4k.webp'],
    datePublished: article.createdAt,
    dateModified: article.createdAt,
    author: {
      '@type': 'Person',
      name: article.author || 'Fahad Ali Atelier',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fahad Ali Interior',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://fahadaliinterior.com/blog/${article.slug}`,
    },
  };

  return (
    <StoreShell showFooter={true}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <main className="min-h-screen bg-[#FAF8F5] text-[#2C1E18] font-sans pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <Link
              href="/blog"
              prefetch={false}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#8C6239] hover:text-[#221814] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Atelier Journal</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF5EE] text-[#8C6239] border border-[#B88E4B]/40"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-[#221814] leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-stone-500 font-medium pb-6 mb-6 border-b border-[#E7DDD0]">
            <span className="inline-flex items-center gap-1.5">
              <User size={13} className="text-[#B88E4B]" />
              {article.author}
            </span>
            <span>•</span>
            <span suppressHydrationWarning className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-[#B88E4B]" />
              {new Date(article.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="relative aspect-[16/9] rounded-[24px] overflow-hidden border border-[#E7DDD0] bg-[#FAF5EE] mb-8 shadow-[0_10px_32px_rgba(44,30,24,0.08)]">
            <Image
              src={article.image || '/hero-living-room-img1-4k.webp'}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-6 sm:p-9 shadow-[0_4px_20px_rgba(44,30,24,0.03)] space-y-5 text-sm sm:text-base text-[#3D2C24] leading-relaxed">
            {paragraphs.map((para, idx) => (
              <p key={idx} className={idx === 0 ? 'font-serif text-base sm:text-lg text-[#221814] font-medium' : ''}>
                {para}
              </p>
            ))}
          </div>

          <div className="mt-10 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#B88E4B]/40 shadow-lg">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1">
                <Sparkles size={12} />
                <span>BESPOKE SHOWROOM COLLECTION</span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-black text-white">
                Experience 100% Solid Seasoned Sheesham
              </h3>
              <p className="text-xs text-stone-300 mt-1">
                Explore our handcrafted living, dining, and royal bedroom suites with 10-year structural guarantee.
              </p>
            </div>
            <Link
              href="/#signature-categories"
              prefetch={false}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shrink-0 transition-all"
            >
              <span>Explore Showroom</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </main>
    </StoreShell>
  );
}
