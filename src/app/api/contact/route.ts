import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const contactInquirySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().trim().min(3, 'Phone is required').max(50).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address').max(200).optional().or(z.literal('')),
  projectType: z.string().trim().max(200).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
}).refine((data) => (data.name && data.phone) || (data.name && data.email), {
  message: 'Name and either phone or email are required.',
});

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ACTIVE',
    concierge: 'Fahad Ali Interior VIP Concierge Desk',
    phone: '+92 320 7006110',
    email: 'mrfahada39@gmail.com',
  });
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting: 10 inquiry requests per minute per IP ─────────
    const ip = getClientIp(req);
    const rl = await rateLimit(`contact:${ip}`, 'inquiry');
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = contactInquirySchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Invalid form input.';
      return NextResponse.json({ success: false, error: firstIssue }, { status: 400 });
    }

    const { name, phone, email, projectType, message } = parseResult.data;

    const contactName = name.slice(0, 200);
    const contactPhone = (phone || '+92 300 0000000').slice(0, 50);
    const contactEmail = (email || '').slice(0, 200);
    const contactMessage = (message || 'N/A').slice(0, 2000);
    const contactProject = (projectType || 'Custom Furniture').slice(0, 200);

    // Create an Admin Notification in DB
    const adminUser = await db.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    }).catch(() => null);

    if (adminUser) {
      await db.notification.create({
        data: {
          userId: adminUser.id,
          title: `New VIP Inquiry: ${contactName}`,
          desc: `Email: ${contactEmail} | Phone: ${contactPhone} | Project: ${contactProject} | Note: ${contactMessage}`,
          type: 'order',
          isNew: true,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Your bespoke VIP inquiry has been recorded successfully.',
    });
  } catch (error) {
    console.error('Failed to process contact inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to process inquiry' }, { status: 500 });
  }
}
