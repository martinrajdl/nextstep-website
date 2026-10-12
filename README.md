# Nextstep website

The standalone public marketing website for **Nextstep**, an open-source Electron CRM operated by agents and reviewed by people. This is a separate Git repository from the CRM application. It contains no SQLite database, application server, personal data or agent connection.

A lightweight static site with an interactive fictional workspace, collection schemas, an interactive agent lifecycle, an example proposal review, product narrative, install instructions and FAQ. White and light gray surfaces by day, a dark palette by night, and the generated neutral Nextstep icon. No client framework, tracking scripts, remote fonts or runtime dependencies.

## Run locally

Use Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:4333`. `pnpm build` creates `dist/`; `pnpm preview` serves that production build on the same port.

## Deploy on Vercel

Import this repository as its **own Vercel project**. The root `vercel.json` configures the build and `dist` output automatically; use the Other framework preset and Node.js 24. No secrets or backend services are required.

Set `SITE_URL` to the final HTTPS origin, such as `https://example.com`, when the domain is known. The build then adds canonical, Open Graph URLs, social-image URLs, and a sitemap. On Vercel, the build falls back to its system-provided production domain. Outside Vercel, leaving both values unset produces a build without canonical metadata.

To deploy from an authenticated Vercel CLI, run `vercel` from this repository for a preview. Verify the intended project and team before using `vercel --prod` to publish. No Vercel project or production deployment is created by the build itself.

## Source

- `src/index.html`: product story, content, metadata and FAQ.
- `src/style.css`: responsive visual design.
- `src/site.js`: fictional example interactions only; no CRM API calls.
- `src/theme.js`: automatic local-time appearance and a persistent manual override.
- `src/play.js`: pointer-responsive illustrations, click responses and schema reshaping.
- `src/orbit.js`: an interactive native WebGL sculpture with a CSS fallback.
- `src/app-icon.png`, `src/favicon.png` and `src/social-preview.png`: brand assets.
- `scripts/build.mjs`: an explicit static asset allowlist and optional production URL metadata.
- `scripts/serve.mjs`: local-only development and production preview server.

The interactive example is reset on reload. All names and organizations shown in it are fictional. Download links target the signed, notarized macOS Apple silicon release of Nextstep 0.4.0. Keep the asset URLs and release copy aligned with verified GitHub releases. The animated agent walkthrough pauses at review; only explicit approval adds its fictional contact. Motion respects reduced-motion preferences and playback pauses when the tab is hidden.

Appearance defaults to dark from 20:00 to 07:00 in the visitor's local time, including while the page remains open. The header sun/moon button saves a manual choice in local storage; **Auto** in the footer restores the schedule. Theme changes use a circular reveal when supported, with an immediate fallback for reduced motion or older browsers. No appearance preference is sent to a server.

The workspace sculpture morphs between connected, organized and flowing shapes. Drag it to rotate, use arrow keys with the canvas focused, or press Home to reset its orientation. **A little chaos** scatters the points before they settle. **Pause animation** freezes the sculpture. Rendering also pauses outside the viewport or in a hidden tab; reduced motion keeps the sculpture still while its controls remain usable. Browsers without WebGL get a responsive CSS composition with the same shape controls.

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
