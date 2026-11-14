import { expect, test } from '@playwright/test';

async function openApp(page, { tourSeen = true, mode = 'public', language = 'en' } = {}) {
  await page.addInitScript(
    ({ seen, savedMode, savedLanguage }) => {
      try {
        localStorage.setItem('sothis-echo-tour-seen', seen ? '1' : '0');
        localStorage.setItem('sothis-echo-language', savedLanguage);
      } catch {
        /* storage unavailable */
      }
    },
    { seen: tourSeen, savedMode: mode, savedLanguage: language }
  );
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
}

async function expectPaintedCanvas(page, scope) {
  const canvas = page.locator(`${scope} canvas`).first();
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => canvas.evaluate((node) => node.width), { message: 'canvas should be painted' })
    .toBe(760);
  const energy = await canvas.evaluate((node) => {
    const ctx = node.getContext('2d');
    const data = ctx.getImageData(0, 0, node.width, node.height).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4000) sum += data[i] + data[i + 1] + data[i + 2];
    return sum;
  });
  expect(energy).toBeGreaterThan(0);
}

test('comparison slider responds to keyboard and pointer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page);

  const slider = page.getByTestId('compare-slider');
  await slider.scrollIntoViewIfNeeded();
  await expect(slider).toHaveAttribute('aria-valuenow', '50');
  await expect(slider.getByText('OPTICAL · CLOUDED')).toBeVisible();
  await expect(slider.getByText('RADAR · L-BAND')).toBeVisible();
  await expectPaintedCanvas(page, '#see-through');

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

  await page.locator('#sound').scrollIntoViewIfNeeded();
  const play = page.getByTestId('sound-play-change');
  await expect(play).toBeVisible();
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('sound-status')).toContainText(/Playing/i);
  await page.waitForTimeout(900);
  await expect(page.getByTestId('sound-status')).toContainText(/pass/i);

  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('sound-status')).not.toContainText(/Playing/i);

  expect(errors).toEqual([]);
});

test('detective game scores four correct cases and resets', async ({ page }) => {
  await openApp(page);
  await page.locator('#game').scrollIntoViewIfNeeded();

  const answers = ['flood', 'fire', 'drought', 'recovery'];
  for (let index = 0; index < answers.length; index += 1) {
    await page.getByTestId(`detective-option-${answers[index]}`).click();
    const feedback = page.getByTestId('detective-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/Correct/i);
    await expect(feedback).toContainText(/Evidence/i);
    await page.getByTestId('detective-next').click();
  }

  const result = page.getByTestId('detective-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText('4 / 4');
  await result.getByRole('button', { name: /Play again/i }).click();
  await expect(page.getByTestId('detective-option-flood')).toBeVisible();
});

test('guided tour prompts a first-time visitor, walks the page, and remembers', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();

  const prompt = page.getByTestId('tour-prompt');
  await expect(prompt).toBeVisible({ timeout: 6_000 });
  await page.getByTestId('tour-start').click();

  const card = page.getByTestId('tour-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('One satellite, two radars');

  await page.getByTestId('tour-next').click();
  await expect(card).toContainText('Clouds vs radar');
  await expect(page.locator('#see-through')).toBeInViewport({ timeout: 6_000 });

  await page.getByTestId('tour-next').click();
  await expect(card).toContainText('Two places, two rhythms');
  await page.getByTestId('tour-next').click();
  await expect(card).toContainText('Hear the change');
  await page.getByTestId('tour-next').click();
  await expect(card).toContainText('Test your eye');

  await page.getByTestId('tour-next').click();
  await expect(card).toBeHidden();

  await page.reload();
  await expect(page.getByTestId('tour-help')).toBeVisible();
  await page.waitForTimeout(2_000);
  await expect(page.getByTestId('tour-prompt')).toHaveCount(0);
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

  await page.locator('#recovery').scrollIntoViewIfNeeded();
  await page.getByTestId('recovery-info').click();
  await expect(page.getByText(/How this estimate is made/i)).toBeVisible();
  await expect(page.getByText(/divided by its level before the event/i)).toBeVisible();

  await page.locator('#sites').scrollIntoViewIfNeeded();
  const researcher = page.getByTestId('for-researchers');
  await expect(researcher).toBeVisible();
  await expect(page.getByText(/Acquisition & products/i)).toHaveCount(0);
  await researcher.locator('.bp6-section-header').click();
  await expect(page.getByText(/Acquisition & products/i)).toBeVisible();
});
