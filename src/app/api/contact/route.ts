import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const body = await req.json().catch(() => ({}));
    const { name, phone, email, projectType, budget, message } = body;

    if (!name && !email) {
      return NextResponse.json({ success: false, error: 'Name or email is required' }, { status: 400 });
    }

    const contactName = name || 'VIP Inquirer';
    const contactPhone = phone || '+92 300 0000000';
    const contactEmail = email || '';

    // Create an Admin Notification in DB
    const adminUser = await db.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    }).catch(() => null);

    if (adminUser) {
      await db.notification.create({
        data: {
          userId: adminUser.id,
          title: `New VIP Inquiry: ${contactName}`,
          desc: `Email: ${contactEmail} | Phone: ${contactPhone} | Project: ${projectType || 'Custom Furniture'} | Note: ${message || 'N/A'}`,
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
