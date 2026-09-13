import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Fingerprint the final entry after Expo has inserted lazy-chunk paths.
// Those paths can change without changing Expo's original entry filename.
export async function fingerprintWebEntry(directory = 'dist') {
  const indexPath = path.join(directory, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');
  const entries = [...new Set(html.match(/\/_expo\/static\/js\/web\/AppEntry-[a-f0-9]+\.js/g) ?? [])];
  if (entries.length !== 1) throw new Error('Expected one Expo web entry script.');
  const entry = entries[0];
  const content = await fs.readFile(path.join(directory, entry.slice(1)));
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 32);
  const fingerprinted = entry.replace(/AppEntry-[a-f0-9]+\.js$/, `AppEntry-${hash}.js`);
  if (entry !== fingerprinted) {
    await fs.rename(path.join(directory, entry.slice(1)), path.join(directory, fingerprinted.slice(1)));
    html = html.replaceAll(entry, fingerprinted);
    await fs.writeFile(indexPath, html);
  }
  return fingerprinted;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  console.log(`Final web entry: ${await fingerprintWebEntry()}`);
}
