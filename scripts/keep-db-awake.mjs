const HEALTH_URL = 'http://localhost:3001/api/v1/health';
const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

console.log('=== Database Keep-Awake Pinger Started ===');
console.log(`Target: ${HEALTH_URL}`);
console.log(`Interval: Every 4 minutes`);

async function ping() {
  try {
    const res = await fetch(HEALTH_URL);
    const data = await res.json();
    console.log(`[${new Date().toLocaleTimeString()}] Pinged backend health: Database is ${data.data?.database?.status || 'unknown'}`);
  } catch (err) {
    console.log(`[${new Date().toLocaleTimeString()}] Ping failed (Is backend running?):`, err.message);
  }
}

// Initial ping
ping();

// Periodic ping
setInterval(ping, INTERVAL_MS);
