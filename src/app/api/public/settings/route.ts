import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'singleton',
  siteName: 'Fahad Ali Interior',
  adminEmail: 'mrfahada39@gmail.com',
  contactPhone: '+92 320 7006110',
  storeAddress: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  currency: 'PKR',
  socialInstagram: 'https://instagram.com/fahadaliinterior',
  socialFacebook: 'https://facebook.com/fahadaliinterior',
  socialWhatsapp: '923207006110',
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
    return NextResponse.json(settings || DEFAULT_SETTINGS, {
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
