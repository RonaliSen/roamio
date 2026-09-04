import { test, expect } from '@playwright/test';

test('home to trip dashboard', async ({ page }) => {
  const email = `e2e_${Date.now()}@roamio.test`;
  await page.goto('/');
  await expect(page.getByText('Every journey, considered').first()).toBeVisible();

  // sign up
  await page.goto('/login');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('roamio-test-1234');
  await page.getByRole('button', { name: /create account/i }).click();
  // LoginComponent itself navigates to /discover once the session is set —
  // wait for that instead of a manual goto, which would race the async signUp.
  await expect(page).toHaveURL('/discover');

  // discover -> prague
  await page.getByRole('link', { name: /prague/i }).click();
  await expect(page).toHaveURL(/destinations\/prague/);

  // build trip
  await page.getByRole('button', { name: /build my trip/i }).click();
  // Destination step is pre-filled and locked from the ?destination= query param —
  // advance past it before the date fields become visible.
  await page.getByRole('button', { name: /next/i }).click(); // destination (locked)
  await page.getByLabel('Start date').fill('2026-05-01');
  await page.getByLabel('End date').fill('2026-05-05');
  await page.getByRole('button', { name: /next/i }).click(); // travelers
  await page.getByRole('button', { name: /next/i }).click(); // budget
  await page.getByRole('button', { name: /next/i }).click(); // interests
  await page.getByRole('button', { name: /create trip/i }).click();

  await expect(page).toHaveURL(/trips\/[0-9a-f-]{36}/);
  await expect(page.getByText(/readiness/i)).toBeVisible();

  // add an activity
  await page.getByRole('button', { name: /add activity/i }).first().click();
  await page.getByLabel('Title').fill('Old Town walk');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText('Old Town walk')).toBeVisible();

  // budget tab
  await page.getByRole('tab', { name: /budget/i }).click();
  await expect(page.getByText(/total/i).first()).toBeVisible();
});
