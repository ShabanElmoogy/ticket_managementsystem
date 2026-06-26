import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDir = path.resolve(__dirname, '../../web');
const apiPublicDir = path.resolve(__dirname, '../public');

console.log('Building web project...');
execSync('npm install', { cwd: webDir, stdio: 'inherit' });
execSync('npm run build', { cwd: webDir, stdio: 'inherit' });

console.log('Copying web build to api/public...');
if (fs.existsSync(apiPublicDir)) {
  fs.rmSync(apiPublicDir, { recursive: true, force: true });
}
fs.cpSync(path.join(webDir, 'dist'), apiPublicDir, { recursive: true });

console.log('Done.');
