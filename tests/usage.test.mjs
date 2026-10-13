import test from 'node:test';
import assert from 'node:assert/strict';
import { createUsageHandler, createCleanupHandler, dailyCounts, listReceipts } from '../server/usage.mjs';

const now = () => Date.UTC(2026, 9, 13, 12);
const sample = { schema: 1, day: '2026-10-13', dailyId: 'a'.repeat(64), version: '0.4.1', platform: 'darwin' };
const request = (value = sample, options = {}) => new Request('https://example.com/api/usage', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value), ...options,
});
test('collector accepts only the documented payload and deduplicates retries in private storage', async () => {
  const receipts = new Map();
  const handler = createUsageHandler({ now, put: async (path, body, options) => {
    assert.equal(options.access, 'private');
    assert.equal(options.addRandomSuffix, false);
    assert.equal(options.allowOverwrite, true);
    receipts.set(path, JSON.parse(body));
  }});
  assert.equal((await handler(request())).status, 204);
  assert.equal((await handler(request())).status, 204);
  assert.deepEqual([...receipts.values()], [{ day: sample.day, version: sample.version, platform: sample.platform }]);
  for (const invalid of [{ ...sample, contact: 'private@example.com' }, { ...sample, schema: 2 }, { ...sample, day: '2026-10-12' }, { ...sample, dailyId: '../private' }, { ...sample, platform: 'unknown' }, { ...sample, version: '/private/path' }, [], null]) {
    assert.equal((await handler(request(invalid))).status, 400);
  }
  assert.equal((await handler(request(sample, { headers: { 'content-type': 'application/json', origin: 'https://example.com' } }))).status, 400);
  assert.equal((await handler(request(sample, { headers: { 'content-type': 'text/plain' } }))).status, 415);
  assert.equal((await handler(request('a'.repeat(600)))).status, 413);
  assert.equal((await handler(new Request('https://example.com/api/usage'))).status, 405);
  assert.equal(receipts.size, 1);
});
test('unconfigured or failed storage never acknowledges a receipt', async () => {
  const put = async () => { throw new Error('Unavailable'); };
  assert.equal((await createUsageHandler({ now, put })(request())).status, 503);
  assert.equal((await createUsageHandler({ now, put, enabled: () => false })(request())).status, 503);
});
test('cleanup requires its secret and only removes owned receipts older than the 31-day window', async () => {
  const path = (day) => `usage/v1/${day}/${'b'.repeat(64)}.json`;
  const pages = [
    { blobs: [{ pathname: path('2026-09-12') }, { pathname: 'unrelated.json' }], hasMore: true, cursor: 'page2' },
    { blobs: [{ pathname: path('2026-09-13') }, { pathname: path('2026-10-13') }], hasMore: false },
  ];
  let reads = 0;
  const list = async (options) => { reads++; return pages[options.cursor ? 1 : 0]; };
  const deleted = [];
  const handler = createCleanupHandler({ now, list, del: async (paths) => deleted.push(...paths), secret: () => 'test-only-secret' });
  assert.equal((await handler(new Request('https://example.com/api/usage-cleanup'))).status, 401);
  assert.equal(reads, 0);
  assert.equal((await handler(new Request('https://example.com/api/usage-cleanup', { headers: { authorization: 'Bearer test-only-secret' } }))).status, 204);
  assert.deepEqual(deleted, [path('2026-09-12')]);
  const receipts = await listReceipts(list);
  const counts = dailyCounts([...receipts, ...receipts], now());
  assert.equal(counts.length, 31);
  assert.deepEqual(counts[0], { day: '2026-09-13', activeInstallations: 1 });
  assert.deepEqual(counts.at(-1), { day: '2026-10-13', activeInstallations: 1 });
  assert.equal(counts[1].activeInstallations, 0);
});
