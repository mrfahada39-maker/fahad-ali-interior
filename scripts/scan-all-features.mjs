import { PrismaClient } from '../Backend/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function scanSystem() {
  console.log('=== STARTING FULL SYSTEM & FEATURE SCAN ===\n');
  const results = [];

  // 1. Test Database Schema & Connection
  try {
    const userCount = await prisma.user.count();
    results.push({ feature: 'Database Connection & Prisma ORM', status: 'WORKING', details: `${userCount} users found in Neon DB` });
  } catch (e) {
    results.push({ feature: 'Database Connection & Prisma ORM', status: 'FAILED', details: e.message });
  }

  // 2. Test Products & Search Querying
  try {
    const products = await prisma.product.findMany({ take: 5, where: { deletedAt: null } });
    results.push({ feature: 'Product Retrieval & Catalog', status: 'WORKING', details: `${products.length} products retrieved` });
  } catch (e) {
    results.push({ feature: 'Product Retrieval & Catalog', status: 'FAILED', details: e.message });
  }

  // 3. Test Order System
  try {
    const orders = await prisma.order.findMany({ take: 5, include: { items: true } });
    results.push({ feature: 'Orders & Cart System', status: 'WORKING', details: `${orders.length} orders found with line items` });
  } catch (e) {
    results.push({ feature: 'Orders & Cart System', status: 'FAILED', details: e.message });
  }

  // 4. Test Categories
  try {
    const categories = await prisma.category.findMany();
    results.push({ feature: 'Categories Management', status: 'WORKING', details: `${categories.length} categories active` });
  } catch (e) {
    results.push({ feature: 'Categories Management', status: 'FAILED', details: e.message });
  }

  // 5. Test Reviews & Ratings
  try {
    const reviews = await prisma.review.findMany({ take: 5 });
    results.push({ feature: 'Reviews & Ratings', status: 'WORKING', details: `${reviews.length} reviews processed` });
  } catch (e) {
    results.push({ feature: 'Reviews & Ratings', status: 'FAILED', details: e.message });
  }

  // 6. Test Coupons System
  try {
    const coupons = await prisma.coupon.findMany();
    results.push({ feature: 'Coupons & Discounts', status: 'WORKING', details: `${coupons.length} coupons configured` });
  } catch (e) {
    results.push({ feature: 'Coupons & Discounts', status: 'FAILED', details: e.message });
  }

  // 7. Test Customer Inquiries
  try {
    const inquiries = await prisma.inquiry.findMany();
    results.push({ feature: 'Customer Contact & Inquiries', status: 'WORKING', details: `${inquiries.length} inquiries in queue` });
  } catch (e) {
    results.push({ feature: 'Customer Contact & Inquiries', status: 'FAILED', details: e.message });
  }

  // 8. Test Site Settings
  try {
    const settings = await prisma.settings.findFirst();
    results.push({ feature: 'Global Site Settings', status: settings ? 'WORKING' : 'MISSING', details: settings ? 'Site settings active' : 'No settings record' });
  } catch (e) {
    results.push({ feature: 'Global Site Settings', status: 'FAILED', details: e.message });
  }

  console.log('=== SCAN SUMMARY ===');
  results.forEach((r) => {
    console.log(`[${r.status}] ${r.feature}: ${r.details}`);
  });

  await prisma.$disconnect();
}

scanSystem();
