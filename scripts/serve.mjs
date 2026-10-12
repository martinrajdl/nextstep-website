import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const directory = resolve(
  root,
  process.argv.includes('--built') ? 'dist' : 'src',
);
const port = Number(process.env.PORT || 4333);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const file = resolve(
      directory,
      '.' + decodeURIComponent(path === '/' ? '/index.html' : path),
    );
    if (
      !file.startsWith(directory + sep) ||
      !['GET', 'HEAD'].includes(req.method)
    )
      throw new Error();
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(resolve(directory, '404.html')));
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Nextstep website: http://127.0.0.1:${port}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, () => server.close());
