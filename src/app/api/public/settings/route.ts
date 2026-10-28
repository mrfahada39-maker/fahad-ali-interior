import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUSINESS_CONTACT } from '@/lib/contact-config';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'singleton',
  siteName: 'Fahad Ali Interior',
  adminEmail: BUSINESS_CONTACT.supportEmail,
  contactPhone: BUSINESS_CONTACT.phone,
  storeAddress: BUSINESS_CONTACT.address,
  currency: 'PKR',
  socialInstagram: 'https://instagram.com/fahadaliinterior',
  socialFacebook: 'https://facebook.com/fahadaliinterior',
  socialWhatsapp: BUSINESS_CONTACT.whatsapp,
  foundedYear: '2020',
  themeFontFamily: 'Playfair Display',
  themeBgColor: '#FAF7F2',
  themeSurfaceColor: '#FFFFFF',
  themeBorderColor: '#EAE5DF',
  themeDarkColor: '#1A1A1A',
  themeMutedColor: '#8A8682',
  themeAccentColor: '#2C251F',
};

export async function GET() {
  try {
    const settings = await db.settings.findFirst().catch(() => null);
    const sanitized = settings
      ? {
          ...settings,
          adminEmail:
            settings.adminEmail && !/@(gmail|yahoo|hotmail)\.com$/i.test(settings.adminEmail)
              ? settings.adminEmail
              : BUSINESS_CONTACT.supportEmail,
        }
      : DEFAULT_SETTINGS;
    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }
}
