import { expect, test } from '@playwright/test';

async function openApp(page, { language = 'en' } = {}) {
  await page.addInitScript(
    ({ savedLanguage }) => {
      try {
        localStorage.setItem('sothis-echo-tour-seen', '1');
        localStorage.setItem('sothis-echo-language', savedLanguage);
      } catch {
        /* storage unavailable */
      }
    },
    { savedLanguage: language }
  );
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
}

test('Global Atlas renders the world map, pins and curated list without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const atlas = page.locator('#atlas');
  await atlas.scrollIntoViewIfNeeded();
  await expect(page.locator('#atlas-title')).toBeVisible();

  // The Leaflet/OpenStreetMap map is present with circle-marker pins.
  const map = page.locator('.atlas-map .leaflet-container');
  await expect(map).toBeVisible();
  const pins = page.locator('.atlas-map path.leaflet-interactive');
  await expect(pins.first()).toBeVisible({ timeout: 10_000 });
  expect(await pins.count()).toBeGreaterThanOrEqual(6);

  // Curated list items are clickable and selectable.
  const list = page.getByTestId('atlas-list');
  await expect(list).toBeVisible();
  await expect(page.getByTestId('atlas-item-bigsur')).toBeVisible();
  await expect(page.getByTestId('atlas-item-sundarbans')).toBeVisible();

  // Selecting a site updates the preview.
  await page.getByTestId('atlas-item-bigsur').click();
  await expect(page.getByTestId('atlas-preview')).toContainText('Big Sur');

  expect(errors).toEqual([]);
});

test('Lenses section renders its heading and an honest offline notice', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const lenses = page.locator('#lenses');
  await lenses.scrollIntoViewIfNeeded();
  await expect(page.locator('#lenses-title')).toBeVisible();
  await expect(lenses).toContainText(/live NISAR backend|backend/i);

  expect(errors).toEqual([]);
});

test('Explain the echo renders its heading and offline notice', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const explain = page.locator('#explain');
  await explain.scrollIntoViewIfNeeded();
  await expect(page.locator('#explain-title')).toBeVisible();
  await expect(explain).toContainText(/backend/i);

  expect(errors).toEqual([]);
});

test('Rapid response renders its heading and offline notice', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const respond = page.locator('#respond');
  await respond.scrollIntoViewIfNeeded();
  await expect(page.locator('#respond-title')).toBeVisible();
  await expect(respond).toContainText(/backend/i);

  expect(errors).toEqual([]);
});

test('Atlas renders in Arabic without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page, { language: 'ar' });

  const atlas = page.locator('#atlas');
  await atlas.scrollIntoViewIfNeeded();
  await expect(page.locator('#atlas-title')).toBeVisible();
  await expect(page.locator('.atlas-map .leaflet-container')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Clicking an atlas place loads that study area everywhere', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  // Start on the first study area, then choose Big Sur from the atlas.
  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.locator('#atlas').scrollIntoViewIfNeeded();
  await page.getByTestId('atlas-item-bigsur').click();

  // The study-area tabs must now have Big Sur selected (shared selection).
  const bigsurTab = page.getByTestId('site-tab-bigsur');
  await expect(bigsurTab).toHaveAttribute('aria-selected', 'true');

  // The "Open study area" button also selects it and scrolls to the story.
  await page.getByTestId('atlas-item-sundarbans').click();
  await expect(page.getByTestId('site-tab-sundarbans')).toHaveAttribute('aria-selected', 'true');

  expect(errors).toEqual([]);
});

test('Selecting a story-only place shows a full radar story card', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  await page.locator('#atlas').scrollIntoViewIfNeeded();
  await page.getByTestId('atlas-item-peru-earthquake').click();

  const preview = page.getByTestId('atlas-preview');
  await expect(preview).toContainText('Peru earthquake');
  await expect(preview).toContainText('Why radar sees it');
  await expect(preview).toContainText('What NISAR measures');
  // Story-only places do not open a measured study area, and say so.
  await expect(preview).toContainText(/Narrative preview/i);

  expect(errors).toEqual([]);
});
