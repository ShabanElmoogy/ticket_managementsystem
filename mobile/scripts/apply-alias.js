/**
 * Replaces all relative imports (../../) with @/ alias imports.
 * Run: node scripts/apply-alias.js [folder]
 * Example: node scripts/apply-alias.js src/stores
 */
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');  // mobile/
const folder = process.argv[2] || 'src';
const target = path.join(ROOT, folder);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    processFile(full);
  }
}

function processFile(filePath) {
  const dir     = path.dirname(filePath);
  let   content = fs.readFileSync(filePath, 'utf8');
  let   changed = false;

  // Match: from '../...' or from './...' — only relative paths
  const updated = content.replace(
    /from\s+['"](\.[^'"]+)['"]/g,
    (match, rel) => {
      // Skip same-dir imports that don't need aliasing (e.g. './types')
      // Only replace if it goes up at least one level OR is a src-rooted path
      const abs     = path.resolve(dir, rel);
      const fromRoot = path.relative(ROOT, abs).replace(/\\/g, '/');

      // Only alias if the resolved path is inside the project root
      if (fromRoot.startsWith('..')) return match; // outside root, skip

      const alias = `@/${fromRoot}`;
      if (alias === match.slice(6, -1)) return match; // already correct

      changed = true;
      return `from '${alias}'`;
    }
  );

  if (changed) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('✅', path.relative(ROOT, filePath));
  }
}

walk(target);
console.log('Done.');
