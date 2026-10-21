export interface EditorialArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  tags: string[];
  createdAt: string;
  isActive: boolean;
}

export const FALLBACK_EDITORIAL_ARTICLES: EditorialArticle[] = [
  {
    id: 'editorial-sheesham-mastery',
    title: 'Why Kiln-Dried Chiniot Sheesham Lasts for Generations',
    slug: 'kiln-dried-chiniot-sheesham-heritage',
    excerpt:
      'Discover how traditional mortise-and-tenon joinery and seasoned Dalbergia sissoo timber protect luxury Pakistani furniture against seasonal humidity and warping.',
    content: `Every heirloom created at Fahad Ali Interior begins long before the master carver picks up a chisel. True solid Sheesham (Dalbergia sissoo) requires patient kiln seasoning to bring internal moisture equilibrium in line with Pakistan's diverse climate—from Lahore's monsoon summers to Islamabad's crisp winters.

Unlike mass-produced MDF or hollow veneer boards that peel within a few seasons, 100% solid heartwood develops a richer golden-walnut patina every decade. Our ustads inspect each plank for natural interlocking grain density before hand-cutting traditional mortise-and-tenon joints.

When you commission a dining table, royal bedstead, or majlis sofa set from our Lahore showroom, each surface is hand-rubbed with multi-layer protective sealers that highlight the organic river-grain of authentic Pakistani rosewood while resisting everyday spills and heat.`,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    author: 'Fahad Ali Atelier',
    tags: ['Solid Sheesham', 'Craftsmanship', 'Lahore Heritage'],
    createdAt: '2026-09-15T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'editorial-royal-drawing-room',
    title: 'Designing a Grand Pakistani Drawing Room: Proportion, Polish & Velvet',
    slug: 'designing-grand-pakistani-drawing-room',
    excerpt:
      'An architectural guide to balancing hand-carved walnut frames, Turkish champagne velvet upholstery, and warm ambient brass lighting.',
    content: `A formal Pakistani drawing room is the architectural heart of hospitality. Achieving a sense of effortless royalty requires balancing three foundational elements: visual weight, upholstery texture, and warm timber tones.

For spacious 1-kanal and 2-kanal residences in DHA and Bahria Town, we recommend anchoring the main seating zone with a 3-2-1-1 solid Sheesham sofa suite finished in Royal Walnut or Antique Teak. Pairing deep hand-tufted Turkish champagne or emerald velvet with brass-inlaid center tables creates immediate depth without overwhelming the floor plan.

Leave at least 30 inches of circulation clearance around the central coffee table so white-glove serving and conversation flow naturally during family gatherings.`,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    author: 'Senior Interior Concierge',
    tags: ['Drawing Room', 'Interior Styling', 'Turkish Velvet'],
    createdAt: '2026-10-01T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'editorial-timber-care-guide',
    title: 'The 10-Year Heirloom Care Ritual for Solid Wood Furniture',
    slug: 'heirloom-solid-wood-care-ritual',
    excerpt:
      'Simple seasonal maintenance rituals to preserve the mirror-luster polish and hand-carved relief of your bespoke furniture.',
    content: `Maintaining solid seasoned hardwood is remarkably simple when you follow atelier-approved practices. Never use harsh ammonia or silicone sprays on hand-polished Sheesham; a dry, ultra-soft microfiber cloth is all that is needed for weekly dusting.

Every six months, apply a light coat of natural beeswax or carnauba furniture balm along the direction of the wood grain, then buff gently with a clean cotton cloth. Keep pieces positioned away from direct, unshaded afternoon sunlight and AC vents to preserve the natural oils within the timber.`,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    author: 'Master Finishing Ustad',
    tags: ['Care Guide', 'Polish & Finish', '10-Year Guarantee'],
    createdAt: '2026-10-10T10:00:00.000Z',
    isActive: true,
  },
];
