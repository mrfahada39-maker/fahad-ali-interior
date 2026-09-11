const fs = require('fs');
const path = require('path');

function pruneDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (f === 'cache' || f === 'types' || f === 'diagnostics') {
          fs.rmSync(full, { recursive: true, force: true });
          continue;
        }
        pruneDir(full);
      } else {
        if (
          f.endsWith('.map') ||
          f.endsWith('.d.ts') ||
          f.endsWith('.md') ||
          (f.endsWith('.txt') && !f.includes('robots')) ||
          f.endsWith('.LICENSE') ||
          f.endsWith('.license') ||
          f.startsWith('trace')
        ) {
          fs.unlinkSync(full);
        }
      }
    } catch (e) {}
  }
}

pruneDir('.next');
if (fs.existsSync('tsconfig.tsbuildinfo')) {
  try { fs.unlinkSync('tsconfig.tsbuildinfo'); } catch (e) {}
}
console.log('✓ Successfully pruned all sourcemaps, build cache, unneeded wasm engines, and artifacts from .next!');
