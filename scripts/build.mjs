import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const root = fileURLToPath(new URL('..', import.meta.url));
export function build({
  output = resolve(root, 'dist'),
  siteUrl = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''),
} = {}) {
  let origin = '';
  if (siteUrl) {
    const url = new URL(siteUrl);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error(
        'SITE_URL must be an HTTPS site origin, such as https://example.com.',
      );
    origin = url.origin;
  }
  // The default output belongs to this build. Remove obsolete assets and metadata.
  if (resolve(output) === resolve(root,'dist')) rmSync(output,{recursive:true,force:true});
  mkdirSync(output, { recursive: true });
  rmSync(resolve(output,'sitemap.xml'),{force:true});
  rmSync(resolve(output,'mark.svg'),{force:true});
  const files = ['index.html', 'style.css', 'site.js', 'app-icon.png', 'favicon.png', '404.html'];
  if (existsSync(resolve(root, 'src/social-preview.png')))
    files.push('social-preview.png');
  for (const file of files)
    cpSync(resolve(root, 'src', file), resolve(output, file));
  let html = readFileSync(resolve(output, 'index.html'), 'utf8');
  if (origin) {
    html = html.replace(
      '</head>',
      `<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"><meta property="og:image" content="${origin}/social-preview.png"><meta name="twitter:image" content="${origin}/social-preview.png"></head>`,
    );
    writeFileSync(
      resolve(output, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>\n`,
    );
  }
  writeFileSync(resolve(output, 'index.html'), html);
  writeFileSync(
    resolve(output, 'robots.txt'),
    `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`,
  );
  return { output, files, canonicalOrigin: origin || null };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(build()));
