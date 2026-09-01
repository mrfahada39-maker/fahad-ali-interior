/**
 * Pre-warms API + homepage after servers start (DB connection, memory cache, ISR).
 * Run: node scripts/warm-stack.mjs
 */
const ORIGIN_API = process.env.ENTERPRISE_API_ORIGIN ?? 'http://127.0.0.1:3001';
const ORIGIN_WEB = process.env.NEXTAUTH_URL ?? 'http://127.0.0.1:3000';
const KEY = process.env.INTERNAL_PROXY_KEY ?? 'dev-internal-proxy-key';

const urls = [
  `${ORIGIN_API}/api/v1/health`,
  `${ORIGIN_API}/api/v1/public/home-bundle`,
  `${ORIGIN_WEB}/`,
  `${ORIGIN_WEB}/api/v1/public/home-bundle`,
];

async function warm(url) {
  const headers = url.includes('/api/v1/')
    ? { 'x-internal-proxy-key': KEY, accept: 'application/json' }
    : { accept: 'text/html' };
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(60_000) });
  console.log(`${res.status} ${url}`);
}

async function main() {
  console.log('Warming stack…');
  for (const url of urls) {
    try {
      await warm(url);
    } catch (e) {
      console.warn(`Skip ${url}:`, e.message);
    }
  }
  console.log('Warm complete.');
}

main();
