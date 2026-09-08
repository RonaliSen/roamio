import { test, expect } from '@playwright/test';

test('home to trip dashboard via the AI trip planner', async ({ page }) => {
  const email = `e2e_${Date.now()}@roamio.test`;
  await page.goto('/');
  await expect(page.getByText('Every journey, considered').first()).toBeVisible();

  // sign up
  await page.goto('/login');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('roamio-test-1234');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL('/discover');

  // Home -> natural-language search -> AI planner flow
  // Scoped via getByRole('searchbox'), not getByPlaceholder: the <app-search-field> host
  // element also carries a literal `placeholder` attribute (it's an @Input set via a plain
  // string in the template, not a property binding), so getByPlaceholder matches both the
  // host and the inner <input> — a strict-mode violation.
  await page.goto('/');
  const searchBox = page.getByRole('searchbox', { name: "Where to next? Try 'quiet coast, 5 days, mild weather'" });
  await searchBox.fill('romantic 4 day trip in Europe in May');
  await searchBox.press('Enter');
  await expect(page).toHaveURL(/\/plan\/understand/);
  await expect(page.getByRole('heading', { name: /understanding your trip/i })).toBeVisible();
  await page.getByRole('button', { name: /looks right/i }).click();

  // feasibility (green — region+month match Prague/Lisbon/Amalfi, no budget constraint)
  await expect(page).toHaveURL(/\/plan\/feasibility/);
  await page.getByRole('button', { name: /show destinations/i }).click();

  // recommendations -> pick Prague specifically (not by index, by name, since ties are order-independent)
  await expect(page).toHaveURL(/\/plan\/recommendations/);
  await expect(page.getByRole('heading', { name: /perfect matches/i })).toBeVisible();
  const pragueCard = page.locator('[data-testid="match-card"]').filter({ hasText: 'Prague' });
  await expect(pragueCard).toBeVisible();
  await pragueCard.getByRole('button', { name: /choose destination/i }).click();

  // destination detail, arrived via the planner -> shows why-recommended block
  await expect(page).toHaveURL(/\/destinations\/prague/);
  await expect(page.getByText(/why roamio recommends it/i)).toBeVisible();
  await page.getByRole('button', { name: /build my trip/i }).click();

  // confirm -> creates the trip + generated itinerary, lands on the dashboard
  await expect(page).toHaveURL(/\/plan\/confirm/);
  await page.getByRole('button', { name: /build my itinerary/i }).click();
  await expect(page).toHaveURL(/\/trips\/[0-9a-f-]{36}/, { timeout: 15000 });
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
