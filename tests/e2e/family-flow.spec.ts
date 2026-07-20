import { expect, test } from '@playwright/test';

test('jury demo reaches map, alert, and reunion states', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start jury demo/i }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByText(/Family live map/i)).toBeVisible();
  const openDemo = page.getByRole('button', { name: /open demo controls/i });
  if (await openDemo.isVisible()) await openDemo.click();
  for (let index = 0; index < 5; index += 1) await page.getByLabel(/next demo step/i).click();
  await expect(page.getByText(/needs help/i).first()).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: /start reunion/i }).click();
  await expect(page.getByText(/Reunion active/i).first()).toBeVisible();
});

test('join code flow works without Firebase', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel(/six-digit code/i).fill('274 961');
  await page.getByLabel(/your name/i).fill('Naina');
  await page.getByRole('button', { name: /join family/i }).click();
  await expect(page.getByText(/Good afternoon, Naina/i)).toBeVisible();
});

test('deep simulation route preserves the legacy iframe', async ({ page }) => {
  await page.goto('/simulation');
  await expect(page.getByTitle(/Legacy Kumbh Kavach Crowd Command Center/i)).toBeVisible();
});
