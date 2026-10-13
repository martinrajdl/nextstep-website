import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { list } from '@vercel/blob';
import { dailyCounts, listReceipts } from '../server/usage.mjs';

const environment = fileURLToPath(new URL('../.env.local', import.meta.url));
if (existsSync(environment)) process.loadEnvFile(environment);

try {
  const counts = dailyCounts(await listReceipts(list));
  const downloads = [];
  for (let page = 1; ; page++) {
    const releases = JSON.parse(execFileSync('gh', ['api', `repos/martinrajdl/nextstep/releases?per_page=100&page=${page}`], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 }));
    for (const release of releases) for (const asset of release.assets) {
      if (/\.(zip|dmg|exe|AppImage|deb|rpm)$/.test(asset.name)) downloads.push({ release: release.tag_name, file: asset.name, downloads: asset.download_count });
    }
    if (releases.length < 100) break;
  }
  console.log('Daily active installations that opted in (UTC; last 31 days)');
  console.table(counts);
  console.log('GitHub release downloads (requests, not unique people)');
  console.table(downloads);
  console.log(`Total app downloads: ${downloads.reduce((total, row) => total + row.downloads, 0)}`);
  console.log('Daily identifiers rotate. Daily counts cannot be added to calculate unique monthly users.');
} catch (error) {
  console.error(error.message);
  console.error('Use an authenticated GitHub CLI (gh) and run vercel env pull .env.local for this project’s private Blob credentials. No usage identifiers are printed.');
  process.exitCode = 1;
}
