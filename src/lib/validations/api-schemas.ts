import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required for all order items.').optional(),
  id: z.string().trim().min(1).optional(),
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer between 1 and 20.')
    .min(1, 'Quantity must be an integer between 1 and 20.')
    .max(20, 'Quantity must be an integer between 1 and 20.'),
  name: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  image: z.string().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(z.unknown()).min(1, 'Order must contain at least one item.'),
  shippingName: z.string().trim().max(200).optional(),
  shippingPhone: z.string().trim().max(50).optional(),
  shippingEmail: z.string().trim().max(254).optional(),
  shippingAddress: z.string().trim().max(500).optional(),
  shippingCity: z.string().trim().max(100).optional(),
  shippingProvince: z.string().trim().max(100).optional(),
  shippingNotes: z.string().trim().max(1000).optional(),
  shippingInfo: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  couponCode: z.string().nullish(),
  coupon: z.string().nullish(),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().trim().min(1, 'Order ID is required'),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  trackingNumber: z.string().nullish(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(300),
  description: z.string().optional().default(''),
  price: z.union([z.number(), z.string()]).optional().default(0),
  category: z.string().optional().default('Living Room'),
  image: z.string().optional().default('/images/placeholder.webp'),
  images: z.array(z.string()).optional().default([]),
  material: z.string().nullish(),
  dimensions: z.string().nullish(),
  stockCount: z.coerce.number().int().min(0).optional().default(0),
  isPremium: z.boolean().optional().default(false),
  specs: z.union([z.string(), z.record(z.string(), z.unknown()), z.null()]).optional(),
});

export const updateProductSchema = z.object({
  id: z.string().trim().min(1, 'Product ID required'),
  name: z.string().trim().min(1).max(300).optional(),
  description: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  category: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  material: z.string().nullish(),
  dimensions: z.string().nullish(),
  stockCount: z.coerce.number().int().min(0).optional(),
  isPremium: z.boolean().optional(),
  specs: z.union([z.string(), z.record(z.string(), z.unknown()), z.null()]).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(120),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  icon: z.string().optional().default('Sparkles'),
  items: z.string().optional().default(''),
  isPromo: z.boolean().optional().default(false),
  order: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const createReviewSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(2000).optional().default(''),
  image: z.string().nullish(),
  customerName: z.string().max(150).optional(),
});

export const updateReviewStatusSchema = z.object({
  id: z.string().trim().min(1, 'Review ID is required'),
  status: z.string().optional(),
});

export const createAddressSchema = z.object({
  name: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(1000).optional(),
  avatar: z.string().nullish(),
});

export const createMessageSchema = z.object({
  userId: z.string().optional(),
  threadId: z.string().optional(),
  text: z.string().max(4000).optional(),
  message: z.string().max(4000).optional(),
  audioUrl: z.string().optional(),
});

export const contactInquirySchema = z.object({
  name: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().max(254).optional(),
  projectType: z.string().trim().max(150).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(4000).optional(),
});

export const updateSettingsSchema = z.object({
  siteName: z.string().max(150).optional(),
  contactPhone: z.string().max(60).optional(),
  adminEmail: z.string().max(254).optional(),
  storeAddress: z.string().max(500).optional(),
  socialInstagram: z.string().max(300).optional(),
  socialFacebook: z.string().max(300).optional(),
  socialWhatsapp: z.string().max(100).optional(),
  foundedYear: z.string().max(10).optional(),
  currency: z.string().max(10).optional(),
});

export const adminPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

export const enable2FaSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification token must be exactly 6 digits'),
});

export const disable2FaSchema = z.object({
  password: z.string().min(1, 'Current password is required'),
  token: z.string().trim().min(1, '2FA code or backup code is required'),
});
