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
    { savedLanguage: language },
  );
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
}

async function openCaseFile(page, siteId = 'bigsur') {
  await page.locator('#atlas').scrollIntoViewIfNeeded();
  await page.getByTestId(`atlas-item-${siteId}`).click();
  await expect(page.locator('.casefile-dialog')).toBeVisible();
}

async function caseSection(page, name) {
  await page.locator('.casefile-sidebar').getByRole('button', { name }).click();
}

test('Global Atlas renders the world map, pins and curated list without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const atlas = page.locator('#atlas');
  await atlas.scrollIntoViewIfNeeded();
  await expect(page.locator('#atlas-title')).toBeVisible();

  const map = page.locator('.atlas-map .leaflet-container');
  await expect(map).toBeVisible();
  const pins = page.locator('.atlas-map path.leaflet-interactive');
  await expect(pins.first()).toBeVisible({ timeout: 10_000 });
  expect(await pins.count()).toBeGreaterThanOrEqual(6);

  const list = page.getByTestId('atlas-list');
  await expect(list).toBeVisible();
  await expect(page.getByTestId('atlas-item-bigsur')).toBeVisible();
  await expect(page.getByTestId('atlas-item-sundarbans')).toBeVisible();
  await expect(page.getByTestId('atlas-item-greece')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Clicking a measured atlas card opens that site case file', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page, 'greece');

  // The case file identity shows the chosen site.
  await expect(page.locator('.casefile-title')).toContainText('Attica');
  // Its overview facet renders the site headline.
  await expect(page.locator('.casefile-single-body')).toContainText(/quiet burn|canopy/i);

  expect(errors).toEqual([]);
});

test('Lenses render an honest offline notice inside the case file', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Three lenses|العدسات الثلاث/);

  const body = page.locator('.casefile-single-body');
  await expect(body).toContainText(/live NISAR backend|backend/i);

  expect(errors).toEqual([]);
});

test('Explain renders its offline notice inside the case file', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /^Explain$|التفسير/);

  await expect(page.locator('.casefile-single-body')).toContainText(/backend/i);

  expect(errors).toEqual([]);
});

test('Rapid response renders its offline notice inside the case file', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Rapid response|الاستجابة السريعة/);

  await expect(page.locator('.casefile-single-body')).toContainText(/backend/i);

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

  // Arabic case file opens and its sidebar is on the inline-end (right).
  await openCaseFile(page, 'bigsur');
  const shellDir = await page.locator('.casefile-shell').getAttribute('dir');
  expect(shellDir).toBe('rtl');

  expect(errors).toEqual([]);
});

test('Compare pins a second site with synced sections and layout toggle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page, 'bigsur');

  // Switch to a facet, then enable compare.
  await caseSection(page, /Three lenses|العدسات الثلاث/);
  await page.getByTestId('casefile-compare-toggle').click();
  await expect(page.locator('.compare-pane')).toHaveCount(2);
  await expect(page.locator('.compare-panes--side')).toHaveCount(1);

  // Stacked layout toggle.
  await page.getByRole('button', { name: /Stacked|فوق\/تحت/ }).first().click();
  await expect(page.locator('.compare-panes--stacked')).toHaveCount(1);

  // Both panes show the same (synced) section.
  await expect(page.locator('.compare-pane').first()).toContainText(/lens|عدسة/i);

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
  await expect(preview).toContainText(/field-guide entry/i);

  expect(errors).toEqual([]);
});