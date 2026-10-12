import { test, expect } from '@playwright/test';
const site = 'http://127.0.0.1:4335';
test('public website demonstrates schemas and review with fictional data and no app API', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(site);
  await expect(
    page.getByRole('heading', { name: /A CRM for/ }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /Projects/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /View schema/ }).click();
  await expect(page.locator('#demo-schema')).toContainText('due_date');
  await page.getByRole('button', { name: /View records/ }).click();
  await page.getByRole('tab', { name: /People/ }).click();
  await page.getByLabel('Search example records').fill('Morgan');
  await expect(page.locator('#demo-table tbody tr')).toHaveCount(1);
  await page.getByLabel('Search example records').fill('');
  await page
    .getByRole('button', { name: 'Review change', exact: false })
    .click();
  await page.getByRole('button', { name: /Approve example change/ }).click();
  await expect(page.locator('#demo-table')).toContainText('Alex Rivera');
  await page.getByRole('button', { name: /Reset example/ }).click();
  await expect(page.locator('#demo-table')).not.toContainText('Alex Rivera');
  await page
    .getByRole('button', { name: 'Review change', exact: false })
    .click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(page.locator('#proposal-summary')).toContainText('Rejected');
  await page.getByRole('button', { name: /Reset example/ }).click();
  await page.getByRole('tab', {name:/02.*Source/}).click();
  await expect(page.locator('#cycle-title')).toHaveText('Your agent finds the useful information.');
  await page.getByRole('tab', {name:/05.*Keep moving/}).click();
  await expect(page.locator('#cycle-description')).toContainText('enriches contacts');
  await page.getByRole('tab', {name:/01.*Give direction/}).click();
  await page.screenshot({
    path: 'test-results/website-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
  expect(requests.filter((url) => url.includes('/api/'))).toEqual([]);
});
test('website works at mobile width with accessible dialogs and FAQ', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(site);
  await expect(
    page.getByRole('heading', { name: /A CRM for/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByText('What does self-hosting mean here?', { exact: false })
    .click();
  await expect(page.getByText(/ssh -L 4319/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Review change', exact: false })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/website-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('agent walkthrough pauses for a real review and respects manual controls', async ({ page }) => {
  await page.goto(site);
  await page.clock.install();
  await page.getByRole('button', { name: 'Play agent walkthrough' }).click();
  await page.clock.fastForward(2200);
  await expect(page.locator('#cycle-status')).toContainText('SOURCING');
  await page.getByRole('button', { name: 'Pause agent walkthrough' }).click();
  await page.clock.fastForward(10000);
  await expect(page.locator('#cycle-status')).toContainText('SOURCING');
  await page.getByRole('button', { name: 'Play agent walkthrough' }).click();
  await page.clock.fastForward(2200);
  await expect(page.locator('#cycle-status')).toContainText('SHAPING');
  await page.clock.fastForward(2200);
  await expect(page.locator('#playback-status')).toHaveText('Paused for your review');
  await page.clock.fastForward(15000);
  await expect(page.locator('#demo-table')).not.toContainText('Alex Rivera');
  await page.getByRole('button', { name: 'Review this proposal' }).click();
  await page.getByRole('button', { name: /Approve example change/ }).click();
  await expect(page.locator('#cycle-status')).toContainText('CHANGES APPLIED');
  await expect(page.locator('#demo-table')).toContainText('Alex Rivera');
  await page.getByRole('button', { name: /Reset example/ }).click();
  await expect(page.locator('#demo-table')).not.toContainText('Alex Rivera');
  await expect(page.locator('#cycle-status')).toHaveText('YOUR DIRECTION');
  await expect(page.locator('.download-link').first()).toHaveAttribute('href', 'https://github.com/martinrajdl/nextstep/releases/download/v0.4.0/Nextstep-0.4.0-macOS-arm64.zip');
});

test('reduced motion keeps the entire walkthrough usable without decorative animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site);
  expect(await page.locator('.hero').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  await page.getByRole('tab', { name: /04.*Review/ }).click();
  await page.getByRole('button', { name: 'Review this proposal' }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(page.locator('#playback-status')).toContainText('Proposal rejected');
  await expect(page.locator('#demo-table')).not.toContainText('Alex Rivera');
});
