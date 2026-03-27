const fs = require('fs'), path = require('path');
function walk(d) {
  return fs.readdirSync(d).flatMap(f => {
    const p = path.join(d, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk('src').filter(f => /\.(ts|tsx)$/.test(f));
const hits = files.filter(f => {
  try { return /SUPER_ADMIN|TENANT_ADMIN|EMPLOYEE|PROGRAMMER/.test(fs.readFileSync(f, 'utf8')); }
  catch { return false; }
});
hits.forEach(f => console.log(f));
