import { readFileSync } from 'node:fs';

const root = new URL('.', import.meta.url).pathname;
const i18nPath = new URL('../src/i18n/index.js', import.meta.url).pathname;
const source = readFileSync(i18nPath, 'utf8');

const enBlock = source.match(/const en = \{([\s\S]*?)\n\};/)?.[1] || '';
const arBlock = source.match(/const ar = \{([\s\S]*?)\n\};\n\nconst savedLanguage/)?.[1] || '';

const extractKeys = (block) => {
  const keys = new Set();
  const re = /^\s*([A-Za-z0-9_]+):\s*(?:['`"]|\{)/gm;
  let m;
  while ((m = re.exec(block)) !== null) keys.add(m[1]);
  return keys;
};

const enKeys = extractKeys(enBlock);
const arKeys = extractKeys(arBlock);

const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));

let failed = false;
if (missingInAr.length) {
  failed = true;
  console.log('MISSING IN AR:', missingInAr.join(', '));
}
if (missingInEn.length) {
  failed = true;
  console.log('MISSING IN EN:', missingInEn.join(', '));
}
if (!failed) {
  console.log(`i18n parity OK: ${enKeys.size} keys match between EN and AR.`);
}
process.exit(failed ? 1 : 0);
