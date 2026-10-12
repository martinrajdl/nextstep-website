import { test, expect } from '@playwright/test';

const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:4335';
test.use({ timezoneId: 'Europe/Prague' });

test('automatic appearance follows local 20:00 and 07:00 boundaries on an open page', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T17:59:50Z') });
  await page.goto(site);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.clock.fastForward(11000);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111318');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 19, 24)');
  await page.clock.setSystemTime(new Date('2026-10-13T04:59:50Z'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.clock.fastForward(11000);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('manual appearance survives reload and Auto restores the time-based choice', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T12:00:00Z') });
  await page.goto(site);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('[data-theme-status]')).toContainText('your choice');
  await page.getByRole('button', { name: 'Auto', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Auto', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'auto');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the WebGL sculpture changes visibly with shapes, keyboard and dragging', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site);
  const canvas = page.locator('#workspace-orbit');
  await canvas.scrollIntoViewIfNeeded();
  await expect(page.locator('.orbit-stage')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('#orbit-fallback')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause animation', exact: true })).toBeHidden();
  await canvas.focus();
  const before = await canvas.screenshot();
  await page.keyboard.press('ArrowRight');
  const rotated = await canvas.screenshot();
  expect(rotated.equals(before)).toBe(false);
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + bounds.height / 2 + 30, { steps: 8 });
  await page.mouse.up();
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Organize', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#shape-description')).toContainText('every detail');
  const grid = await canvas.screenshot({ path: 'test-results/sculpture-grid.png' });
  await page.getByRole('button', { name: 'Let it flow', exact: true }).click();
  expect((await canvas.screenshot({ path: 'test-results/sculpture-wave.png' })).equals(grid)).toBe(false);
  await page.getByRole('button', { name: /A little chaos/ }).click();
  await expect(page.getByRole('button', { name: 'Connect', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try another collection shape' }).click();
  await expect(page.locator('.mini-schema')).toContainText('Progress');
  await page.getByRole('button', { name: 'Try review' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('appearance and playful controls work without WebGL, storage or view transitions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-12T12:00:00Z') });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return getContext.apply(this, [type, ...args] as never);
    } as typeof getContext;
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage is disabled', 'SecurityError'); } });
    Object.defineProperty(document, 'startViewTransition', { value: undefined });
  });
  await page.goto(site);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Play with the workspace' }).click();
  await expect(page.locator('#workspace-orbit')).toBeHidden();
  await expect(page.locator('#orbit-fallback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Organize', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Let it flow', exact: true }).click();
  await expect(page.locator('.orbit-stage')).toHaveAttribute('data-shape', 'wave');
  await expect(page.locator('#shape-description')).toContainText('moving with the work');
  expect(errors).toEqual([]);
});

test('day and night remain usable on a narrow mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-12T12:00:00Z') });
  await page.goto(site);
  await page.screenshot({ path: 'test-results/mobile-day.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Organize', exact: true }).click();
  await expect(page.locator('#shape-description')).toContainText('every detail');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/mobile-night.png', fullPage: true });
});
