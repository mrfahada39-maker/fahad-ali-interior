import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

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

    const body = await req.json().catch(() => ({}));
    const { name, phone, email, projectType, budget, message } = body;

    if (!name && !email) {
      return NextResponse.json({ success: false, error: 'Name or email is required' }, { status: 400 });
    }

    const contactName = (name || 'VIP Inquirer').toString().slice(0, 200);
    const contactPhone = (phone || '+92 300 0000000').toString().slice(0, 50);
    const contactEmail = (email || '').toString().slice(0, 200);
    const contactMessage = (message || 'N/A').toString().slice(0, 2000);
    const contactProject = (projectType || 'Custom Furniture').toString().slice(0, 200);

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
