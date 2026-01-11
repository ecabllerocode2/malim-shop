// Script para generar archivo version.json en cada build
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const version = {
  timestamp: Date.now(),
  date: new Date().toISOString(),
  buildId: Math.random().toString(36).substring(2, 15)
};

writeFileSync(
  resolve(__dirname, 'public', 'version.json'),
  JSON.stringify(version, null, 2)
);

console.log('✅ Version file generated:', version);
