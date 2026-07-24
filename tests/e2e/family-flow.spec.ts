import { expect, type Page, test } from '@playwright/test';

function failOnApplicationErrors(page: Page, allowed: RegExp[] = []) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!allowed.some((pattern) => pattern.test(text))) errors.push(`console: ${text}`);
  });
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

async function startDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /start jury demo/i }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByText(/Family live map/i)).toBeVisible();
}

test('Demo Mode loads without Firebase and the regional PMTiles asset is valid', async ({ page, request }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  const response = await request.get('/maps/nashik-ramkund-v1.pmtiles', {
    headers: { Range: 'bytes=0-7' },
  });
  expect([200, 206]).toContain(response.status());
  expect((await response.body()).subarray(0, 7).toString('ascii')).toBe('PMTiles');
  await startDemo(page);
  await expect(page.getByText('SIMULATED DEMO')).toBeVisible();
  await expect(page.locator('.source-badge')).toHaveText('LIVE');
  assertNoErrors();
});

test('all failed tile sources produce the intentional finite fallback and one retry', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page, [
    /Failed to load resource/i,
    /ERR_FAILED/i,
  ]);
  await page.route(/nashik-ramkund-v1\.pmtiles|openfreemap|openstreetmap/, (route) => route.abort());
  await startDemo(page);
  await expect(page.getByText('Offline coordinate map – detailed basemap unavailable'))
    .toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Retry Map' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry Map' }).click();
  await expect(page.getByRole('button', { name: 'Retry Map' })).toHaveCount(0);
  assertNoErrors();
});

test('safe ranges update state immediately and persist across reload', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  await startDemo(page);
  await page.getByRole('button', { name: /next demo step/i }).click();
  await page.getByRole('button', { name: /next demo step/i }).click();
  await expect(page.getByText(/Arya.*warning/i).first()).toBeVisible();
  await page.getByText('Safety ranges').first().click();
  await page.getByRole('button', { name: '100m' }).click();
  await expect(page.getByText(/Arya.*safe/i).first()).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('spinbutton', { name: /custom safe radius numeric/i }))
    .toHaveValue('100');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: /custom safe radius numeric/i }))
    .toHaveValue('100');
  assertNoErrors();
});

test('simulated SOS overrides state and reunion reaches manual stable completion', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  await startDemo(page);
  const openAdvanced = page.getByRole('button', { name: /toggle simulation controls drawer/i });
  await openAdvanced.click();
  const simulationActions = page.locator('.simulation-action-grid');
  await simulationActions.getByRole('button', { name: 'Simulated SOS' }).click();
  await expect(page.getByText(/Arya Dhumal: SOS/i)).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Start reunion' }).click();
  await expect(page.getByText(/REUNION ACTIVE/i).first()).toBeVisible();
  await simulationActions.getByRole('button', { name: 'Guardian reunion point' }).click();
  await simulationActions.getByRole('button', { name: 'Enter reunion radius' }).click();
  await simulationActions.getByRole('button', { name: 'Complete reunion' }).click();
  await expect(page.getByText(/reunited/i).first()).toBeVisible();
  assertNoErrors();
});

test('Demo Mode continues locally when the browser goes offline', async ({ page, context }) => {
  const assertNoErrors = failOnApplicationErrors(page, [/Failed to load resource/i, /ERR_INTERNET_DISCONNECTED/i]);
  await startDemo(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: /next demo step/i }).click();
  await expect(page.getByRole('status', { name: /Network status: offline/i })).toBeVisible();
  await expect(page.getByText(/STEP 2 OF 9/i)).toBeVisible();
  await context.setOffline(false);
  assertNoErrors();
});

test('join code and all major family routes work', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  await page.goto('/join');
  await page.getByLabel(/six-digit code/i).fill('274 961');
  await page.getByLabel(/your name/i).fill('Aditya');
  await page.getByRole('button', { name: /join family/i }).click();
  await expect(page.getByText(/Good afternoon, Aditya/i)).toBeVisible();
  for (const [label, path] of [
    ['Map', '/map'],
    ['Family', '/family'],
    ['Alerts', '/alerts'],
    ['Settings', '/settings'],
    ['Home', '/'],
  ]) {
    await page.getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : `${path}$`}`));
  }
  assertNoErrors();
});

test('legacy Simulation Lab remains sandboxed and functional', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  await page.goto('/simulation');
  const frame = page.getByTitle(/Legacy Kumbh Kavach Crowd Command Center/i);
  await expect(frame).toBeVisible();
  await expect(page.getByRole('button', { name: /Back to Family App/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Full Screen/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reset Simulation/i })).toBeVisible();
  await expect(frame.contentFrame().locator('body')).not.toBeEmpty();
  assertNoErrors();
});

test('map workspace has no horizontal overflow across required responsive widths', async ({ page }) => {
  const assertNoErrors = failOnApplicationErrors(page);
  await startDemo(page);
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1408, height: 846 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const map = page.locator('.immersive-map-page');
    const box = await map.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(viewport.width);
    expect(box?.height).toBeGreaterThan(viewport.height * 0.65);
  }
  assertNoErrors();
});
