import { expect, test } from '@playwright/test';

async function openApp(page, { tourSeen = true, language = 'en' } = {}) {
  await page.addInitScript(
    ({ seen, savedLanguage }) => {
      try {
        localStorage.setItem('sothis-echo-tour-seen', seen ? '1' : '0');
        localStorage.setItem('sothis-echo-language', savedLanguage);
      } catch {
        /* storage unavailable */
      }
    },
    { seen: tourSeen, savedLanguage: language },
  );
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
}

// Open a measured site's full-screen case file from the atlas.
async function openCaseFile(page, siteId = 'bigsur') {
  await page.locator('#atlas').scrollIntoViewIfNeeded();
  await page.getByTestId(`atlas-item-${siteId}`).click();
  await expect(page.locator('.casefile-dialog')).toBeVisible();
}

async function caseSection(page, name) {
  await page.locator('.casefile-sidebar').getByRole('button', { name }).click();
}

test('comparison slider responds to keyboard and pointer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Camera vs radar|الكاميرا مقابل الرادار/);

  const slider = page.locator('.casefile-dialog').getByTestId('compare-slider');
  await expect(slider).toHaveAttribute('aria-valuenow', '50');
  await expect(slider.getByText('OPTICAL · BASEMAP')).toBeVisible();
  await expect(slider.getByText('RADAR · L-BAND')).toBeVisible();

  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '2');

  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.up();
  const dragged = Number(await slider.getAttribute('aria-valuenow'));
  expect(dragged).toBeGreaterThan(70);

  expect(errors).toEqual([]);
});

test('sonification starts, reports passes, and stops', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Sonification|السونفيكيشن/);

  const play = page.getByTestId('sound-play-change');
  await expect(play).toBeVisible();
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('sound-status')).toContainText(/Playing/i);
  await page.waitForTimeout(900);
  await expect(page.getByTestId('sound-status')).toContainText(/step/i);

  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('sound-status')).not.toContainText(/Playing/i);

  expect(errors).toEqual([]);
});

test('detective game scores six rounds and resets', async ({ page }) => {
  await openApp(page);
  await page.locator('#game').scrollIntoViewIfNeeded();
  await page.getByTestId('detective-start').click();

  const answers = ['flood', 'fire', 'context', 'coherence', 'specular', 'mechanism'];
  for (let index = 0; index < answers.length; index += 1) {
    await page.getByTestId(`detective-option-${answers[index]}`).click();
    const feedback = page.getByTestId('detective-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/Correct/i);
    if (answers[index] === 'fire') {
      await expect(feedback).toContainText(/HH/);
      await expect(feedback).toContainText(/HV/);
      await expect(feedback).not.toContainText(/VV/);
      await expect(feedback).not.toContainText(/VH/);
    }
    if (answers[index] === 'flood' || answers[index] === 'fire') {
      await expect(feedback).toContainText(/Evidence/i);
    }
    await page.getByTestId('detective-next').click();
  }

  const result = page.getByTestId('detective-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText('6 / 6');
  await result.getByRole('button', { name: /Play again/i }).click();
  await expect(page.getByTestId('detective-option-flood')).toBeVisible();
});

test('contextual coachmarks appear on reaching a section, dismiss, and replay', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();

  // Opt-in beacon is always available.
  await expect(page.getByTestId('tour-beacon')).toBeVisible();

  // Reaching the atlas surfaces its contextual tip (non-blocking).
  await page.locator('#atlas').scrollIntoViewIfNeeded();
  const mark = page.locator('.coachmark');
  await expect(mark).toBeVisible({ timeout: 8_000 });

  // Dismiss (Got it) -> gone and remembered.
  await mark.getByRole('button', { name: /Got it|فهمت/ }).click();
  await expect(mark).toHaveCount(0);

  // Replay via the beacon brings guidance back.
  await page.getByTestId('tour-beacon').click();
  await expect(mark).toBeVisible({ timeout: 4_000 });
});

test('advanced documentation stays collapsed until opened', async ({ page }) => {
  await openApp(page);

  const mission = page.getByTestId('mission-details');
  await expect(mission).toBeVisible();
  await expect(page.getByText(/30 Jul 2025 — NISAR reaches orbit/i)).toHaveCount(0);
  await mission.locator('.bp6-section-header').click();
  await expect(page.getByText(/30 Jul 2025 — NISAR reaches orbit/i)).toBeVisible();

  await page.locator('#data').scrollIntoViewIfNeeded();
  const docs = page.getByTestId('developer-docs');
  await expect(docs).toBeVisible();
  await expect(docs.getByText('/study-areas', { exact: false })).toHaveCount(0);
  await docs.locator('.bp6-section-header').click();
  await expect(docs.getByText('/study-areas', { exact: false }).first()).toBeVisible();
  await expect(docs.getByText(/Known limits/i)).toBeVisible();

  // Recovery + researcher notes now live inside the case file.
  await openCaseFile(page);
  await caseSection(page, /Recovery|التعافي/);
  await page.getByTestId('recovery-info').click();
  await expect(page.getByText(/How this estimate is made/i)).toBeVisible();

  await caseSection(page, /Overview|نظرة عامة/);
  const researcher = page.getByTestId('for-researchers');
  await expect(researcher).toBeVisible();
  await expect(page.getByText(/Acquisition & products/i)).toHaveCount(0);
  await researcher.locator('.bp6-section-header').click();
  await expect(page.getByText(/Acquisition & products/i)).toBeVisible();
});

test('offline fallback hides calibrated-only controls and never claims calibration', async ({ page }) => {
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Overview|نظرة عامة/);

  await expect(page.getByTestId('card-view-toggle')).toHaveCount(0);
  await expect(page.getByTestId('change-stats')).toHaveCount(0);
  await expect(page.getByTestId('series-source-note')).toHaveCount(0);

  const researcher = page.getByTestId('for-researchers');
  await researcher.locator('.bp6-section-header').click();
  await expect(page.getByText(/labelled offline fallback/i).first()).toBeVisible();
});

test('SeeThrough explains the full browse vs site window', async ({ page }) => {
  await openApp(page);
  await openCaseFile(page);
  await caseSection(page, /Camera vs radar|الكاميرا مقابل الرادار/);
  const seeThrough = page.locator('.casefile-single-body');
  await expect(seeThrough.getByText('Full browse vs site window')).toBeVisible();
  await expect(seeThrough.getByText(/full NISAR L-band browse/i)).toBeVisible();
});