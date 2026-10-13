import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';
test('static build only publishes marketing assets, with correct canonical and social URLs', () => {
  const output = mkdtempSync(join(tmpdir(), 'nextstep-site-'));
  try {
    build({ output, siteUrl: 'https://example.com' });
    const html = readFileSync(join(output, 'index.html'), 'utf8');
    assert.ok(html.includes('rel="canonical" href="https://example.com/"'));
    assert.ok(html.includes('https://example.com/social-preview.png'));
    assert.ok(
      readFileSync(join(output, 'robots.txt'), 'utf8').includes(
        'Sitemap: https://example.com/sitemap.xml',
      ),
    );
    assert.ok(
      !readdirSync(output).some((name) =>
        /sqlite|env|data|runtime|git|^api$|^server$/.test(name),
      ),
    );
    assert.ok(html.includes('Nextstep-0.4.0-macOS-arm64.zip'));
    assert.ok(!html.includes('DEVELOPMENT PREVIEW'));
    build({output,siteUrl:''});
    assert.equal(existsSync(join(output,'sitemap.xml')),false);
    assert.ok(!readFileSync(join(output,'index.html'),'utf8').includes('rel="canonical"'));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
test('invalid canonical origins fail instead of generating unsafe or misleading metadata', () => {
  for (const siteUrl of [
    'javascript:alert(1)',
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com/path',
    'https://example.com/?q=x',
  ])
    assert.throws(() => build({ siteUrl }));
});
