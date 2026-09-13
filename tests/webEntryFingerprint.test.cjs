const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os');
test('changed lazy chunk references produce a new web entry URL and repeated fingerprinting is stable', async () => {
  const { fingerprintWebEntry } = await import('../scripts/fingerprint-web-entry.mjs');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pocketcart-entry-'));
  try {
    await fs.mkdir(path.join(directory, '_expo/static/js/web'), { recursive: true });
    const original = '/_expo/static/js/web/AppEntry-aaaa.js';
    const write = async content => {
      await fs.writeFile(path.join(directory, original.slice(1)), content);
      await fs.writeFile(path.join(directory, 'index.html'), `<script src="${original}"></script>`);
    };
    await write('load("pdf-old.js")'); const before = await fingerprintWebEntry(directory);
    assert.equal(await fingerprintWebEntry(directory), before);
    await write('load("pdf-new.js")'); const after = await fingerprintWebEntry(directory);
    assert.notEqual(after, before);
    assert.ok((await fs.readFile(path.join(directory, 'index.html'), 'utf8')).includes(after));
    assert.equal(await fs.readFile(path.join(directory, after.slice(1)), 'utf8'), 'load("pdf-new.js")');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
