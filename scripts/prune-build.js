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
        pruneDir(full);
      } else {
        if (
          f.endsWith('.map') ||
          f.endsWith('.d.ts') ||
          f.endsWith('.md') ||
          f.endsWith('.txt') ||
          f.endsWith('.LICENSE') ||
          f.includes('cockroachdb') ||
          f.includes('sqlserver') ||
          f.includes('mysql') ||
          f.includes('sqlite')
        ) {
          fs.unlinkSync(full);
        }
      }
    } catch (e) {}
  }
}

pruneDir('.next');
console.log('✓ Successfully pruned all sourcemaps, unneeded wasm engines, and artifacts from .next!');
