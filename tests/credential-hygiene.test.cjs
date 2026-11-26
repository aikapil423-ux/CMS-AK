const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const plaintextKey = 'plainPin' + 'Sample';

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).split('\0').filter(Boolean);
}

test('Plaintext credential fields are absent from tracked source and scripts', () => {
  const files = trackedFiles().filter((file) =>
    /^(src|scripts|prisma)\//.test(file) && /\.(ts|tsx|js|mjs|cjs|prisma)$/.test(file),
  );
  const offenders = files.filter((file) =>
    fs.readFileSync(path.join(root, file), 'utf8').includes(plaintextKey),
  );
  assert.deepEqual(offenders, [], `Forbidden credential field found in: ${offenders.join(', ')}`);
});

test('Tracked JSON stores contain no plaintext or password fields', () => {
  const offenders = [];
  for (const file of trackedFiles().filter((file) => file.endsWith('.json'))) {
    const parsed = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const walk = (value, trail) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${trail}[${index}]`));
        return;
      }
      for (const [key, nested] of Object.entries(value)) {
        if (key === plaintextKey || key === 'pin' || key === 'password') {
          offenders.push(`${file}: ${trail}.${key}`);
        }
        walk(nested, `${trail}.${key}`);
      }
    };
    walk(parsed, file);
  }
  assert.deepEqual(offenders, [], `Forbidden credential fields found in: ${offenders.join(', ')}`);
});
