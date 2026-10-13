import { timingSafeEqual } from 'node:crypto';

export const usagePrefix = 'usage/v1/';
const receiptPattern = /^usage\/v1\/(\d{4}-\d{2}-\d{2})\/[a-f0-9]{64}\.json$/;
export const utcDay = (timestamp = Date.now()) => new Date(timestamp).toISOString().slice(0, 10);
export const firstRetainedDay = (timestamp = Date.now()) => utcDay(timestamp - 30 * 86400000);
export const receiptDay = (path) => receiptPattern.exec(path)?.[1];
const response = (status) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

async function readSmallJson(request) {
  if (Number(request.headers.get('content-length')) > 512) return { status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { status: 400 };
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512) { await reader.cancel(); return { status: 413 }; }
      chunks.push(value);
    }
    return { value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch { return { status: 400 }; }
  finally { reader.releaseLock(); }
}

// No request headers, addresses or arbitrary event properties enter storage.
export function createUsageHandler({ put, enabled = () => true, now = Date.now }) {
  return async function handle(request) {
    if (request.method !== 'POST') return response(405);
    if (!enabled()) return response(503);
    if (new URL(request.url).search || request.headers.has('origin')) return response(400);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return response(415);
    const parsed = await readSmallJson(request);
    if (parsed.status) return response(parsed.status);
    const value = parsed.value;
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).sort().join(',') !== 'dailyId,day,platform,schema,version'
      || value.schema !== 1 || value.day !== utcDay(now())
      || typeof value.dailyId !== 'string' || !/^[a-f0-9]{64}$/.test(value.dailyId)
      || typeof value.version !== 'string' || !/^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[a-zA-Z0-9.-]{1,24})?$/.test(value.version)
      || !['darwin', 'win32', 'linux'].includes(value.platform)) return response(400);
    try {
      await put(`${usagePrefix}${value.day}/${value.dailyId}.json`, JSON.stringify({ day: value.day, version: value.version, platform: value.platform }), {
        access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
      });
      return response(204);
    } catch { return response(503); }
  };
}

export async function listReceipts(list) {
  const receipts = [];
  let cursor;
  do {
    const page = await list({ prefix: usagePrefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    receipts.push(...page.blobs.filter((blob) => receiptDay(blob.pathname)));
    cursor = page.hasMore ? page.cursor : undefined;
    if (page.hasMore && !cursor) throw new Error('Incomplete usage listing.');
  } while (cursor);
  return receipts;
}

export function createCleanupHandler({ list, del, secret, now = Date.now }) {
  return async function handle(request) {
    if (request.method !== 'GET') return response(405);
    const expected = secret();
    if (!expected) return response(503);
    const supplied = request.headers.get('authorization') || '';
    const wanted = `Bearer ${expected}`;
    if (Buffer.byteLength(supplied) !== Buffer.byteLength(wanted) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))) return response(401);
    try {
      const expired = (await listReceipts(list)).filter((blob) => receiptDay(blob.pathname) < firstRetainedDay(now()));
      for (let offset = 0; offset < expired.length; offset += 100) await del(expired.slice(offset, offset + 100).map((blob) => blob.pathname));
      return response(204);
    } catch { return response(503); }
  };
}

export function dailyCounts(receipts, timestamp = Date.now()) {
  const counts = new Map(Array.from({ length: 31 }, (_, index) => [utcDay(timestamp - (30 - index) * 86400000), 0]));
  const seen = new Set();
  for (const { pathname } of receipts) {
    const day = receiptDay(pathname);
    if (counts.has(day) && !seen.has(pathname)) { counts.set(day, counts.get(day) + 1); seen.add(pathname); }
  }
  return [...counts].map(([day, activeInstallations]) => ({ day, activeInstallations }));
}
