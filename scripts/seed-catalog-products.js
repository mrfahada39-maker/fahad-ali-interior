const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATALOG_PRODUCTS = [
  {
    name: 'Imperial Chesterfield 7-Seater Royal Sofa Set',
    price: 685000,
    category: 'Living Room',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg'],
    dimensions: '3-Seater (7.2 ft) + 2-Seater (5.2 ft) + 2 × 1-Seater (3.2 ft)',
    material: '100% Solid Seasoned Sheesham Wood & Turkish Velvet',
    stockCount: 5,
    isPremium: true,
    description: 'Handcrafted Imperial Chesterfield sofa suite with deep button tufting, high-density foam, and solid Sheesham framework.',
  },
  {
    name: 'Karachi Contemporary L-Shape Sectional Sofa',
    price: 345000,
    category: 'Sofas',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'],
    dimensions: '9.5 ft × 7 ft × 34 in (Left/Right Reversible)',
    material: 'Solid Seasoned Sheesham Wood & Stain-Resistant Suede',
    stockCount: 8,
    isPremium: true,
    description: 'Ergonomic contemporary L-shape sectional offering deep lounge seating and solid timber support.',
  },
  {
    name: 'Royal Sheesham King Bed with Tufted Velvet Headboard',
    price: 385000,
    category: 'Bedroom',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg'],
    dimensions: 'King Size: 6.5 ft × 6 ft × 54 in Headboard',
    material: '100% Solid Seasoned Sheesham Wood & Champagne Velvet',
    stockCount: 7,
    isPremium: true,
    description: 'Masterpiece king-size bed featuring hand-carved Sheesham pillars and a grand tufted velvet headboard.',
  },
  {
    name: 'Lahore Velvet Queen Bed with Dual Nightstands',
    price: 275000,
    category: 'Bedroom',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg'],
    dimensions: 'Queen Size: 6.5 ft × 5 ft × 48 in Headboard',
    material: '100% Solid Seasoned Sheesham Wood',
    stockCount: 10,
    isPremium: false,
    description: 'Sleek luxury queen bed set including two matching hand-polished Sheesham bedside tables.',
  },
  {
    name: 'Sultan 8-Seater Hand-Carved Sheesham Dining Table',
    price: 795000,
    category: 'Dining Room',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg'],
    dimensions: 'Table: 8 ft × 4 ft × 30 in (Includes 8 Upholstered Chairs)',
    material: '100% Solid Seasoned Sheesham Wood & Brass Inlays',
    stockCount: 3,
    isPremium: true,
    description: 'Bespoke 8-seater dining table with intricate floral carvings, brass inlays, and durable high-gloss lacquer finish.',
  },
  {
    name: 'Heritage Round Dining Set with 6 Artisan Chairs',
    price: 165000,
    category: 'Dining Room',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg'],
    dimensions: 'Diameter: 5.5 ft × 30 in Height',
    material: '100% Solid Seasoned Sheesham Wood',
    stockCount: 12,
    isPremium: false,
    description: 'Classic round dining table for family dinners, featuring a pedestal base and 6 contoured chairs.',
  },
  {
    name: 'Presidential Hand-Carved Sheesham Executive Desk',
    price: 285000,
    category: 'Office',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'],
    dimensions: '6.5 ft (L) × 3.5 ft (W) × 30 in (H)',
    material: '100% Solid Seasoned Sheesham Wood with Brass Accents',
    stockCount: 4,
    isPremium: true,
    description: 'Commanding executive workstation featuring lockable drawers, cable management channels, and hand-carved floral borders.',
  },
  {
    name: 'Solid Sheesham Brass-Inlaid Center Table',
    price: 85000,
    category: 'Coffee Tables',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg'],
    dimensions: '4 ft × 2.5 ft × 18 in Height',
    material: '100% Solid Seasoned Sheesham Wood & Brass Filigree',
    stockCount: 15,
    isPremium: false,
    description: 'Elegant coffee table featuring authentic brass filigree inlay and bevelled tempered glass protective top.',
  },
  {
    name: 'Chinioti Royal Coffee Chair Set with Embroidered Cushions',
    price: 125000,
    category: 'Coffee Tables',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg'],
    dimensions: 'Chairs: 32 in (H) × 26 in (W) | Table: 24 in Diameter',
    material: 'Solid Seasoned Sheesham Wood & Silk Brocade Upholstery',
    stockCount: 9,
    isPremium: true,
    description: 'Set of 2 royal accent coffee chairs with matching round side table, hand-carved in signature Chinioti heritage style.',
  },
  {
    name: 'Chinioti Handcrafted Solid Sheesham Media & TV Console',
    price: 195000,
    category: 'TV Units',
    image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80'],
    dimensions: '7 ft (L) × 18 in (D) × 26 in (H)',
    material: '100% Solid Seasoned Sheesham Wood & Soft-Close Drawers',
    stockCount: 6,
    isPremium: true,
    description: 'Modern luxury entertainment console accommodating up to 85-inch screens with hidden cable ports and storage bays.',
  },
  {
    name: 'Maharani 4-Door Walk-In Seasoned Sheesham Wardrobe',
    price: 575000,
    category: 'Storage',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg'],
    dimensions: '8.5 ft (H) × 7 ft (W) × 24 in (D)',
    material: '100% Solid Seasoned Sheesham Wood & German Soft-Close Hinges',
    stockCount: 4,
    isPremium: true,
    description: 'Spacious 4-door master wardrobe with integrated drawers, concealed LED lighting channels, and velvet-lined jewelry vaults.',
  },
  {
    name: 'Classic Hinged Door Artisan Almirah',
    price: 185000,
    category: 'Storage',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg'],
    dimensions: '7 ft (H) × 4 ft (W) × 22 in (D)',
    material: '100% Solid Seasoned Sheesham Wood',
    stockCount: 8,
    isPremium: false,
    description: 'Traditional 2-door Sheesham almirah with antique brass handles and adjustable interior shelving.',
  },
  {
    name: 'Grand Heirloom Curio Display Showcase Console',
    price: 245000,
    category: 'Storage',
    image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg',
    images: ['https://res.cloudinary.com/dfd8rzojj/image/upload/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg'],
    dimensions: '6.5 ft (H) × 4.5 ft (W) × 18 in (D)',
    material: 'Solid Seasoned Sheesham Wood & Tempered Glass',
    stockCount: 6,
    isPremium: true,
    description: 'Showcase console designed for heirloom porcelain and luxury accessories with ambient interior spotlighting.',
  },
];

async function seed() {
  console.log('Seeding products...');
  const catMap = {};
  const allCats = await prisma.category.findMany();
  for (const c of allCats) {
    catMap[c.name.toLowerCase().trim()] = c.id;
  }

  for (const item of CATALOG_PRODUCTS) {
    const cId = catMap[item.category.toLowerCase().trim()] || null;
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          category: item.category,
          categoryId: cId,
          image: item.image,
          images: item.images,
          dimensions: item.dimensions,
          material: item.material,
          stockCount: item.stockCount,
          isPremium: item.isPremium,
          description: item.description,
        },
      });
      console.log('Created product:', item.name);
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          categoryId: cId,
          deletedAt: null,
        },
      });
      console.log('Updated product:', item.name);
    }
  }

  const finalCount = await prisma.product.count({ where: { deletedAt: null } });
  console.log('Total Active Products in DB now:', finalCount);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
