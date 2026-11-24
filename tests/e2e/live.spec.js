import { expect, test } from '@playwright/test';

/**
 * Contract checks against a deployed build:
 *   LIVE_BASE_URL=https://sothisecho.vercel.app npx playwright test tests/e2e/live.spec.js
 * The first request after a cold start can take a couple of minutes while
 * Harmony builds the calibrated subsets, so the timeout is generous.
 */
const live = process.env.LIVE_BASE_URL;

test.describe('live calibrated NISAR contract', () => {
  test.skip(!live, 'set LIVE_BASE_URL to run against a deployed build');

  test('status, change stats and RGB composite are calibrated', async ({ request }) => {
    test.setTimeout(300_000);

    const status = await request.get('/api/nisar/status', { timeout: 120_000 });
    expect(status.status()).toBe(200);
    const statusBody = await status.json();
    expect(statusBody.data.calibratedBackscatter).toBe(true);
    expect(statusBody.data.capabilities).toMatchObject({ changeStats: true, rgbComposite: true });

    const statsStart = Date.now();
    const stats = await request.get('/api/nisar/change-stats?site=sundarbans', { timeout: 30_000 });
    expect(Date.now() - statsStart).toBeLessThan(5_000);
    expect(stats.status()).toBe(200);
    const statsBody = await stats.json();
    expect(statsBody.data.calibrated).toBe(true);
    expect(statsBody.data.thresholdDb).toBe(3);
    expect(statsBody.data.validPct).toBeGreaterThan(50);
    expect(statsBody.data.changedPct).toBeGreaterThanOrEqual(0);
    expect(statsBody.data.changedPct).toBeLessThanOrEqual(100);
    expect(typeof statsBody.data.meanDeltaDb).toBe('number');
    expect(Array.isArray([statsBody.data.before.granule, statsBody.data.after.granule])).toBe(true);
    expect(statsBody.data.before.granule).toContain('GCOV');
    expect(statsBody.data.after.granule).toContain('GCOV');

    const rgbStart = Date.now();
    const rgb = await request.get(
      '/api/scene-image?site=sundarbans&side=after&source=nisar&view=rgb',
      { timeout: 30_000 },
    );
    expect(Date.now() - rgbStart).toBeLessThan(5_000);
    expect(rgb.status()).toBe(200);
    expect(rgb.headers()['content-type']).toContain('image/png');
    expect((await rgb.body()).length).toBeGreaterThan(10_000);
  });

  test('UI surfaces provenance, stats and the RGB toggle', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/');
    await page.getByRole('button', { name: /Not now/i }).click().catch(() => {});
    // Per-site provenance now lives inside the full-screen case file.
    await page.locator('#atlas').scrollIntoViewIfNeeded();
    await page.getByTestId('atlas-item-bigsur').click();
    const dialog = page.locator('.casefile-dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.locator('.panel-status').first()).toContainText('NISAR', { timeout: 240_000 });
    await expect(dialog.getByTestId('series-source-note')).toBeVisible();
    await expect(dialog.getByTestId('degraded-note')).toHaveCount(0);
    await expect(dialog.getByTestId('change-stats')).toBeVisible({ timeout: 240_000 });
    await expect(dialog.getByTestId('change-stats')).toContainText(/%/);

    await dialog.getByTestId('card-view-rgb').click();
    await expect(dialog.getByTestId('rgb-note')).toBeVisible();
    await expect
      .poll(
        () =>
          dialog
            .locator('.scene-grid img')
            .nth(1)
            .evaluate((img) => img.complete && img.naturalWidth > 0),
        { timeout: 30_000 },
      )
      .toBe(true);
  });
});
