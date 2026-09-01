import { defineConfig } from 'prisma/config';
import fs from 'fs';
import path from 'path';

// Manually load environment variables from .env because prisma.config.ts disables auto-loading.
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEquals = trimmed.indexOf('=');
        if (firstEquals !== -1) {
          const key = trimmed.substring(0, firstEquals).trim();
          let val = trimmed.substring(firstEquals + 1).trim();
          // Remove wrapping quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn('Warning: Could not manually load .env file:', e);
}

export default defineConfig({
  schema: 'Database/models/schema.prisma',
});


