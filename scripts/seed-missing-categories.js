const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_PRODUCTS = [
  // Dining Room
  {
    name: 'Royal 8-Seater Solid Sheesham Dining Suite',
    category: 'Dining Room',
    price: 345000,
    image: '/cat-thumb-dining-2x.webp',
    description: 'Handcrafted 8-seater dining table made of kiln-dried solid Sheesham wood with 8 ergonomically tufted high-back chairs.',
    dimensions: 'Table: 8 ft × 4 ft × 30 in (Seats 8-10)',
    material: 'Grade-A Solid Sheesham Timber',
    stockCount: 4,
    isPremium: true
  },
  {
    name: 'Imperial Round Fluted Dining Table Set',
    category: 'Dining Room',
    price: 265000,
    image: '/cat-thumb-dining-2x.webp',
    description: 'Contemporary circular dining masterpiece with fluted solid pedestal and 6 cushioned Italian velvet dining chairs.',
    dimensions: 'Diameter: 5.5 ft × 30 in Height',
    material: 'Seasoned Solid Sheesham & Velvet',
    stockCount: 6,
    isPremium: true
  },

  // Center Tables
  {
    name: 'Fluted Marble & Solid Wood Center Table Nest',
    category: 'Center Tables',
    price: 85000,
    image: '/cat-thumb-centertables-2x.webp',
    description: 'Twin nesting center tables featuring fluted solid timber bases and imported polished marble top.',
    dimensions: 'Large: 36 in Dia × 18 in H | Small: 24 in Dia × 16 in H',
    material: 'Solid Wood with Carrara Marble Top',
    stockCount: 8,
    isPremium: false
  },
  {
    name: 'Artisan Curved Organic Coffee Table',
    category: 'Center Tables',
    price: 72000,
    image: '/cat-thumb-centertables-2x.webp',
    description: 'Sculptural organic coffee table with rounded chamfered edges, hand-finished in warm natural matte polyurethane.',
    dimensions: '48 in L × 28 in W × 17 in H',
    material: 'Seasoned Solid Sheesham Timber',
    stockCount: 5,
    isPremium: false
  },

  // Coffee Chairs
  {
    name: 'Venetian Velvet Accent Coffee Chairs (Pair)',
    category: 'Coffee Chairs',
    price: 95000,
    image: '/cat-thumb-chairs-2x.webp',
    description: 'Pair of royal lounge coffee chairs with high-density foam cushioning and hand-tufted Italian plush velvet.',
    dimensions: '32 in W × 30 in D × 32 in H (Each)',
    material: 'Solid Kikar Frame & Italian Velvet',
    stockCount: 7,
    isPremium: true
  },
  {
    name: 'Artisan Solid Sheesham Barrel Lounge Chair',
    category: 'Coffee Chairs',
    price: 58000,
    image: '/cat-thumb-chairs-2x.webp',
    description: 'Curved barrel silhouette armchair with exposed natural timber ribbing and premium boucle fabric cushion.',
    dimensions: '30 in W × 28 in D × 30 in H',
    material: 'Solid Sheesham & Boucle Fabric',
    stockCount: 9,
    isPremium: false
  },

  // Luxury Showcase
  {
    name: 'Imperial Glass & Brass Display Showcase',
    category: 'Luxury Showcase',
    price: 245000,
    image: '/cat-thumb-showcase-2x.webp',
    description: 'Grand architectural showcase with tempered glass shelves, internal warm LED ambient illumination, and antiqued brass hardware.',
    dimensions: '7 ft H × 4 ft W × 18 in D',
    material: 'Solid Sheesham Timber, Tempered Glass, Brass',
    stockCount: 3,
    isPremium: true
  },
  {
    name: 'Heritage Arch Curio Showcase Cabinet',
    category: 'Luxury Showcase',
    price: 195000,
    image: '/cat-thumb-showcase-2x.webp',
    description: 'Graceful arched showcase cabinet with hand-carved mouldings and glass-panelled double doors for heirloom display.',
    dimensions: '6.5 ft H × 3.5 ft W × 16 in D',
    material: 'Solid Sheesham Timber & Fluted Glass',
    stockCount: 4,
    isPremium: true
  },

  // Luxury Wardrobes
  {
    name: 'Maharani 4-Door Solid Sheesham Wardrobe',
    category: 'Luxury Wardrobes',
    price: 395000,
    image: '/cat-thumb-wardrobes-2x.webp',
    description: 'Majestic 4-door wardrobe featuring full-length dressing mirrors, soft-close Blum hinges, and internal velvet-lined jewelry drawers.',
    dimensions: '8 ft H × 7 ft W × 24 in D',
    material: 'Kiln-Dried Solid Sheesham Wood',
    stockCount: 2,
    isPremium: true
  },
  {
    name: 'Royal Sliding-Door Architectural Almirah',
    category: 'Luxury Wardrobes',
    price: 320000,
    image: '/cat-thumb-wardrobes-2x.webp',
    description: 'Space-saving luxury wardrobe with smooth sliding panels, integrated warm illumination sensors, and multi-tier hanging rods.',
    dimensions: '7.5 ft H × 6 ft W × 24 in D',
    material: 'Solid Timber & Smoked Glass Panels',
    stockCount: 3,
    isPremium: true
  }
];

async function main() {
  console.log('Inserting products for missing categories into Neon PostgreSQL...');
  for (const item of NEW_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name, deletedAt: null }
    });
    if (!existing) {
      const created = await prisma.product.create({
        data: item
      });
      console.log(`+ Created: ${created.name} (${created.category})`);
    } else {
      console.log(`= Already exists: ${existing.name}`);
    }
  }
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => console.error('Seeding error:', e))
  .finally(() => prisma.$disconnect());
