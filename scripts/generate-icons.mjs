import sharp from 'sharp';
import { Buffer } from 'buffer';
import { mkdirSync } from 'fs';

mkdirSync('./public/icons', { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0a" rx="80"/>
  <rect x="4" y="4" width="504" height="504" fill="none" stroke="#c9a96e" stroke-width="8" rx="76"/>
  <text x="256" y="310" font-family="Georgia,serif" font-size="220" font-weight="bold" fill="#c9a96e" text-anchor="middle">FA</text>
</svg>`;

const svgBuf = Buffer.from(svg);

await sharp(svgBuf).resize(192, 192).png().toFile('./public/icons/icon-192.png');
console.log('✓ icon-192.png');

await sharp(svgBuf).resize(512, 512).png().toFile('./public/icons/icon-512.png');
console.log('✓ icon-512.png');

console.log('PWA icons generated!');
