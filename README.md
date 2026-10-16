# Nextstep website

The standalone public marketing website for **Nextstep**, an open-source Electron CRM operated by agents and reviewed by people. This is a separate Git repository from the CRM application. It contains no SQLite database, application server, personal data or agent connection.

A lightweight static site with an interactive fictional workspace, collection schemas, an interactive agent lifecycle, an example proposal review, product narrative, install instructions and FAQ. White and light gray surfaces by day, a dark palette by night, and the generated neutral Nextstep icon. The browser uses no client framework, tracking scripts or remote fonts. Two Vercel Functions separately handle optional desktop-app usage counts and retention.

## Run locally

Use Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:4333`. `pnpm build` creates `dist/`; `pnpm preview` serves that production build on the same port.

## Deploy on Vercel

Import this repository as its **own Vercel project**. The root `vercel.json` configures the static build and `dist` output, plus the `api/` functions; use the Other framework preset and Node.js 24. The marketing site needs no secrets. Optional app usage counts require the private store and cleanup secret described below.

Set `SITE_URL` to the final HTTPS origin, such as `https://example.com`, when the domain is known. The build then adds canonical, Open Graph URLs, social-image URLs, and a sitemap. On Vercel, the build falls back to its system-provided production domain. Outside Vercel, leaving both values unset produces a build without canonical metadata.

To deploy from an authenticated Vercel CLI, run `vercel` from this repository for a preview. Verify the intended project and team before using `vercel --prod` to publish. No Vercel project or production deployment is created by the build itself.

## Source

- `src/index.html`: product story, content, metadata and FAQ.
- `src/style.css`: responsive visual design.
- `src/site.js`: fictional example interactions only; no CRM API calls.
- `src/theme.js`: automatic local-time appearance and a persistent manual override.
- `src/play.js`: pointer-responsive illustrations, hand-drawn arrows and schema reshaping.
- `src/orbit.js`: an interactive native WebGL sculpture with a CSS fallback.
- `src/app-icon.png`, `src/favicon.png` and `src/social-preview.png`: brand assets.
- `scripts/build.mjs`: an explicit static asset allowlist and optional production URL metadata.
- `scripts/serve.mjs`: local-only development and production preview server.

The interactive example is reset on reload. All names and organizations shown in it are fictional. Download links target the signed, notarized macOS Apple silicon release of Nextstep 0.4.1. Keep the asset URLs and release copy aligned with verified GitHub releases. The animated agent walkthrough pauses at review; only explicit approval adds its fictional contact. Motion respects reduced-motion preferences and playback pauses when the tab is hidden.

Appearance defaults to dark from 20:00 to 07:00 in the visitor's local time, including while the page remains open. The header sun/moon button saves a manual choice in local storage; **Auto** in the footer restores the schedule. Theme changes use a circular reveal when supported, with an immediate fallback for reduced motion or older browsers. No appearance preference is sent to a server.

The workspace sculpture morphs between connected, organized and flowing shapes. Drag it to rotate, use arrow keys with the canvas focused, or press Home to reset its orientation. **A little chaos** scatters the points before they settle. **Pause animation** freezes the sculpture. Rendering also pauses outside the viewport or in a hidden tab; reduced motion keeps the sculpture still while its controls remain usable. Browsers without WebGL get a responsive CSS composition with the same shape controls.

Five hand-drawn arrows draw themselves when they enter the viewport. Hover, click, or use the keyboard to draw them again. Each animation finishes after a short gesture; reduced motion keeps the arrows still. The smaller layouts retain the playground and download arrows.

## Optional desktop usage counts

The website itself does not track visitors. Packaged Nextstep 0.4.1+ sends a daily check-in only after the user enables **Settings → Privacy → Share anonymous usage**, which is off by default. [The app's privacy document](https://github.com/martinrajdl/nextstep/blob/main/docs/privacy.md) describes the exact payload and network metadata.

`POST /api/usage` accepts a bounded, strict payload with a rotating daily identifier, UTC day, app version and OS family. It writes one private Blob receipt per installation/day. Repeated sends overwrite the same receipt. It rejects arbitrary properties and does not log request bodies, headers or IP addresses. Vercel still processes network metadata through its infrastructure. Preview deployments reject check-ins. Neither credentials nor collector code are copied into the static build.

Connect a **private Vercel Blob** store in Frankfurt (`fra1`) to production and development for this project. The linked project provides `BLOB_READ_WRITE_TOKEN` (or a supported Blob store credential). Set a random `CRON_SECRET` in production; never commit these values. The daily `03:15 UTC` cleanup checks this secret and removes receipts outside the last 31 UTC dates. Vercel may run Hobby cron jobs within the scheduled hour. Monitor cleanup failures in the Vercel project.

To view the owner's statistics with authenticated Vercel and GitHub (`gh`) CLIs:

```sh
vercel env pull .env.local
pnpm stats
```

The command prints daily active **opted-in installations** for the last 31 days, plus GitHub's public download counts by app release. It never prints daily identifiers. It cannot count users who opted out, distinct people, or unique monthly users. Download counts are requests, including repeats. The collector is unauthenticated and its counts are estimates; this is not billing or security telemetry.

The current store uses the existing Vercel Hobby allowance. Check-ins fail silently if its quota is reached; there is no paid-plan upgrade built into this setup. Check current [Blob limits](https://vercel.com/docs/vercel-blob/usage-and-pricing) before expanding volume. Reads from `pnpm stats` and the cleanup job also consume store operations.

## Checks

```sh
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
# Or use installed Google Chrome:
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
```

Browser checks cover collection tabs, schema inspection, search, example approval/rejection/reset, mobile layout, dialog keyboard access, agent lifecycle steps, FAQ, the day/night schedule, saved theme choices, sculpture controls and WebGL fallback. Test screenshots stay in ignored `test-results/`.

MIT licensed. No CRM source, data or build configuration is shared with this repository.

The appearance toggle is an original SVG watch-style moonphase aperture. A moon-and-stars disc rotates to a sun when switching to light mode; reduced motion changes it immediately. It is a day/night control, not an astronomical phase reading. The form is inspired by [traditional moonphase displays](https://www.jaeger-lecoultre.com/sa-en/watches/moonphase-watches).
