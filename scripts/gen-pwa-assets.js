const sharp = require('sharp');
const fs = require('fs');

async function createScreenshots() {
  if (!fs.existsSync('public/screenshots')) {
    fs.mkdirSync('public/screenshots', { recursive: true });
  }

  const desktopSvg = Buffer.from(`
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0C08" />
          <stop offset="50%" stop-color="#1C1610" />
          <stop offset="100%" stop-color="#0A0907" />
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D4AF37" />
          <stop offset="50%" stop-color="#F5D77F" />
          <stop offset="100%" stop-color="#996515" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)" />
      <rect x="30" y="30" width="1220" height="660" rx="24" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.4" />
      
      <circle cx="640" cy="260" r="80" fill="#17130E" stroke="url(#gold)" stroke-width="2" />
      <text x="640" y="285" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="url(#gold)" text-anchor="middle">FA</text>
      
      <text x="640" y="410" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">FAHAD ALI INTERIOR</text>
      <text x="640" y="455" font-family="sans-serif" font-size="18" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="6">HAUTE COUTURE LUXURY FURNITURE · LAHORE</text>
      <text x="640" y="515" font-family="sans-serif" font-size="16" fill="#A89F91" text-anchor="middle">Bespoke Artisan Craftsmanship · State Bank Raast Integration · Nationwide White-Glove Logistics</text>
    </svg>
  `);

  await sharp(desktopSvg)
    .png()
    .toFile('public/screenshots/desktop.png');
  console.log('✓ Created public/screenshots/desktop.png');

  const mobileSvg = Buffer.from(`
    <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0C08" />
          <stop offset="50%" stop-color="#1C1610" />
          <stop offset="100%" stop-color="#0A0907" />
        </linearGradient>
        <linearGradient id="goldM" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D4AF37" />
          <stop offset="50%" stop-color="#F5D77F" />
          <stop offset="100%" stop-color="#996515" />
        </linearGradient>
      </defs>
      <rect width="750" height="1334" fill="url(#bgM)" />
      <rect x="24" y="24" width="702" height="1286" rx="24" fill="none" stroke="url(#goldM)" stroke-width="1.5" opacity="0.4" />
      
      <circle cx="375" cy="480" r="90" fill="#17130E" stroke="url(#goldM)" stroke-width="2.5" />
      <text x="375" y="510" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="url(#goldM)" text-anchor="middle">FA</text>
      
      <text x="375" y="660" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">FAHAD ALI INTERIOR</text>
      <text x="375" y="715" font-family="sans-serif" font-size="16" font-weight="600" fill="url(#goldM)" text-anchor="middle" letter-spacing="4">HAUTE COUTURE FURNITURE</text>
      <text x="375" y="780" font-family="sans-serif" font-size="15" fill="#A89F91" text-anchor="middle">Offline Atelier Catalog · VIP Concierge</text>
    </svg>
  `);

  await sharp(mobileSvg)
    .png()
    .toFile('public/screenshots/mobile.png');
  console.log('✓ Created public/screenshots/mobile.png');
}

createScreenshots().catch(console.error);
