import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import StoreShell from '@/components/StoreShell';
import { db } from '@/lib/db';
import type { EditorialArticle } from '@/lib/editorial-fallback';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Editorial Journal & Craft Stories | Fahad Ali Interior',
  description:
    'Explore architectural styling guides, solid Chiniot Sheesham craftsmanship stories, and luxury home interior inspiration from Fahad Ali Interior.',
  alternates: {
    canonical: '/blog',
  },
};

export default async function BlogIndexPage() {
  const dbBlogs = await db.blogPost
    .findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    .catch(() => []);

  const articles: EditorialArticle[] = dbBlogs.map(
    (b: {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content: string;
      image?: string | null;
      author?: string | null;
      tags?: string[];
      createdAt?: Date | string;
      isActive: boolean;
    }) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt || b.content.slice(0, 160) + '...',
      content: b.content,
      image: b.image || '/hero-living-room-img1-4k.webp',
      author: b.author || 'Fahad Ali Atelier',
      tags: Array.isArray(b.tags) && b.tags.length > 0 ? b.tags : ['Atelier Journal'],
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      isActive: b.isActive,
    })
  );

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FAF8F5] text-[#2C1E18] font-sans pt-28 pb-20">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs mb-4">
              <Sparkles size={13} className="text-[#B88E4B]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#7A6354]">
                THE ATELIER JOURNAL
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-black text-[#221814] tracking-tight mb-4">
              Heritage Craftsmanship &amp; <span className="text-[#B88E4B]">Interior Chronicles</span>
            </h1>
            <p className="text-sm sm:text-base text-[#7A6048] leading-relaxed font-serif italic">
              Curated insights on solid kiln-dried Sheesham joinery, royal drawing room proportions, and heirloom timber preservation.
            </p>
          </div>

          {/* Articles Grid */}
          {articles.length === 0 ? (
            <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-16 text-center shadow-[0_4px_20px_rgba(44,30,24,0.015)] max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-3 text-[#B88E4B]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-serif font-black text-[#221814]">Journal Articles Coming Soon</h3>
              <p className="text-stone-500 text-xs mt-1">
                Our master craftsmen and interior concierges are preparing upcoming editorial pieces. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/60 rounded-[24px] overflow-hidden shadow-[0_6px_28px_rgba(44,30,24,0.04)] hover:shadow-[0_14px_38px_rgba(184,142,75,0.14)] transition-all flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/blog/${article.slug}`} prefetch={false} className="block relative aspect-[16/10] bg-[#FAF5EE] overflow-hidden">
                    <Image
                      src={article.image || '/hero-living-room-img1-4k.webp'}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/75 text-[#FFEAA0] backdrop-blur-xs border border-[#B88E4B]/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium mb-2.5">
                      <span className="inline-flex items-center gap-1">
                        <User size={12} className="text-[#B88E4B]" />
                        {article.author}
                      </span>
                      <span>•</span>
                      <span suppressHydrationWarning className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-[#B88E4B]" />
                        {new Date(article.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <Link href={`/blog/${article.slug}`} prefetch={false}>
                      <h2 className="font-serif text-lg sm:text-xl font-black text-[#221814] group-hover:text-[#B88E4B] transition-colors leading-snug mb-2.5">
                        {article.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-[#F0E8DC] flex items-center justify-between">
                  <Link
                    href={`/blog/${article.slug}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 text-xs font-serif font-black text-[#8C6239] hover:text-[#221814] uppercase tracking-wider transition-colors"
                  >
                    <BookOpen size={14} />
                    <span>Read Full Story</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
            </div>
          )}
        </div>
      </main>
    </StoreShell>
  );
}
