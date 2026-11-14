import { expect, test } from '@playwright/test';

async function openApp(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sothis-echo-tour-seen', '1');
      localStorage.setItem('sothis-echo-language', 'en');
    } catch {
      /* storage unavailable */
    }
  });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
}

test('Blueprint ledger renders virtualized and resizable inside Deep Dive Data', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await openApp(page);
  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.getByRole('tab', { name: 'Deep Dive Data' }).click();

  const shell = page.getByTestId('measurements');
  await expect(shell).toBeVisible();
  await expect(shell.locator('.bp6-table-container')).toBeVisible();

  const cells = await shell.locator('.bp6-table-cell').count();
  expect(cells).toBeGreaterThan(0);
  await expect(shell.locator('.bp6-table-body-virtual-client').first()).toBeVisible();

  const header = shell.locator('.bp6-table-column-header-cell').first();
  await expect(header).toBeVisible();
  await expect(shell).toContainText('Sundarbans');

  expect(errors).toEqual([]);
});

test('Tech Editorial tokens and typography are applied', async ({ page }) => {
  await openApp(page);

  const base = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const heroTitle = getComputedStyle(document.querySelector('.hero-title'));
    const button = getComputedStyle(document.querySelector('.bp6-button'));
    const card = getComputedStyle(document.querySelector('.app-panel'));
    return {
      bodyBackground: body.backgroundColor,
      bodyFont: body.fontFamily,
      heroFont: heroTitle.fontFamily,
      heroColor: heroTitle.color,
      buttonRadius: button.borderRadius,
      buttonFont: button.fontFamily,
      cardRadius: card.borderRadius,
      cardShadow: card.boxShadow,
    };
  });

  expect(base.bodyBackground).toBe('rgb(247, 246, 242)');
  expect(base.bodyFont).toContain('Instrument Sans');
  expect(base.heroFont).toContain('Newsreader');
  expect(base.heroColor).toBe('rgb(28, 28, 28)');
  expect(base.buttonRadius).toBe('0px');
  expect(base.buttonFont).toContain('JetBrains Mono');
  expect(base.cardRadius).toBe('0px');
  expect(base.cardShadow).toBe('none');

  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.getByRole('tab', { name: 'Deep Dive Data' }).click();
  await expect(page.getByTestId('measurements')).toBeVisible();
  const tableType = await page.locator('.observations-table .bp6-table-cell').first().evaluate((cell) => ({
    font: getComputedStyle(cell).fontFamily,
    headerFont: getComputedStyle(document.querySelector('.observations-table .bp6-table-header')).fontFamily,
  }));
  expect(tableType.font).toContain('JetBrains Mono');
  expect(tableType.headerFont).toContain('JetBrains Mono');
});

test('light theme reaches Dialog and text contrast is AA', async ({ page }) => {
  await openApp(page);
  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.getByRole('tab', { name: 'Deep Dive Data' }).click();
  await expect(page.getByTestId('measurements')).toBeVisible();

  const palette = await page.evaluate(() => {
    const effectiveBg = (element) => {
      let node = element;
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
        node = node.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const pair = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return { fg: getComputedStyle(element).color, bg: effectiveBg(element) };
    };
    return {
      body: pair('body'),
      muted: pair('.body-copy-muted'),
      panel: pair('.app-panel'),
      primaryButton: pair('.bp6-button.bp6-intent-primary'),
      warningTag: pair('.bp6-tag.bp6-intent-warning'),
      dangerTag: pair('.bp6-tag.bp6-intent-danger'),
    };
  });

  // Dialog inherits the body-level dark scope, including its portal.
  await page.getByTestId('tour-help').click();
  const dialog = page.locator('.bp6-dialog').first();
  await expect(dialog).toBeVisible();
  const dialogColors = await dialog.evaluate((node) => {
    const body = node.querySelector('.bp6-dialog-body');
    const bg = getComputedStyle(node).backgroundColor;
    return {
      background: bg,
      bodyColor: body ? getComputedStyle(body).color : null,
      hasDarkAncestor: Boolean(node.closest('.bp6-dark')),
    };
  });
  expect(dialogColors.hasDarkAncestor).toBe(false);
  expect(dialogColors.background).toBe('rgb(247, 246, 242)');

  await page.keyboard.press('Escape');

  // Report the measured pairs; fail only where normal body copy falls below 4.5:1.
  const parse = (value) => {
    if (!value || value === 'transparent') return null;
    const rgb = value.match(/rgba?\(([^)]+)\)/);
    if (rgb) {
      const parts = rgb[1].split(',').map((part) => Number(part.trim()));
      return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
    }
    const oklch = value.match(/oklch\(([^)]+)\)/);
    if (!oklch) return null;
    const [channels, alphaPart] = oklch[1].split('/');
    const [l, c, h] = channels.trim().split(/\s+/).map(Number);
    const alpha = alphaPart == null ? 1 : Number(alphaPart.trim());
    const radians = (h * Math.PI) / 180;
    const a = c * Math.cos(radians);
    const b = c * Math.sin(radians);
    const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
    const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
    const sPrime = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = lPrime ** 3;
    const m3 = mPrime ** 3;
    const s3 = sPrime ** 3;
    const linear = [
      4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
      -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
      -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
    ];
    const rgbValue = linear.map((channel) => {
      const clamped = Math.max(0, Math.min(1, channel));
      const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255);
    });
    return { rgb: rgbValue, alpha };
  };
  const composite = (foreground, background) => {
    if (!foreground || !background) return null;
    return foreground.rgb.map((channel, index) =>
      Math.round(channel * foreground.alpha + background.rgb[index] * (1 - foreground.alpha))
    );
  };
  const luminance = (rgb) => {
    const channels = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const ratio = (foreground, background, parentBackground) => {
    const fg = parse(foreground);
    const rawBg = parse(background);
    const parent = parse(parentBackground) || { rgb: [255, 255, 255], alpha: 1 };
    if (!fg || !rawBg) return null;
    const bg = rawBg.alpha < 1 ? { rgb: composite(rawBg, parent), alpha: 1 } : rawBg;
    const l1 = luminance(fg.rgb);
    const l2 = luminance(bg.rgb);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const measured = {
    body: ratio(palette.body.fg, palette.body.bg),
    muted: ratio(palette.muted.fg, palette.muted.bg),
    primaryButton: ratio(palette.primaryButton.fg, palette.primaryButton.bg),
    warningTag: ratio(palette.warningTag.fg, palette.warningTag.bg, palette.panel.bg),
    dangerTag: ratio(palette.dangerTag.fg, palette.dangerTag.bg, palette.panel.bg),
    dialog: ratio(dialogColors.bodyColor, dialogColors.background),
  };
  console.log('MEASURED_CONTRAST', JSON.stringify(measured, null, 2));
  console.log('MEASURED_COLORS', JSON.stringify({ palette, dialogColors }, null, 2));
  expect(measured.body).toBeGreaterThanOrEqual(4.5);
  expect(measured.muted).toBeGreaterThanOrEqual(4.5);
  expect(measured.primaryButton).toBeGreaterThanOrEqual(4.5);
  expect(measured.warningTag).toBeGreaterThanOrEqual(4.5);
  expect(measured.dangerTag).toBeGreaterThanOrEqual(4.5);
  expect(measured.dialog).toBeGreaterThanOrEqual(4.5);
});

test('Arabic flips the ledger columns and right-aligns headers and cells', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sothis-echo-tour-seen', '1');
      localStorage.setItem('sothis-echo-language', 'ar');
    } catch {
      /* storage unavailable */
    }
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFont).toContain('IBM Plex Sans Arabic');

  await page.locator('#sites').scrollIntoViewIfNeeded();
  await page.getByRole('tab', { name: 'بيانات الباحثين' }).click();

  const shell = page.getByTestId('measurements');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute('dir', 'rtl');

  const headers = shell.locator('.bp6-table-column-header-cell');
  const siteBox = await headers.filter({ hasText: 'منطقة الدراسة' }).first().boundingBox();
  const statusBox = await headers.filter({ hasText: 'الحالة' }).first().boundingBox();
  expect(siteBox).not.toBeNull();
  expect(statusBox).not.toBeNull();
  // The study-area column is on the physical right, where RTL reading starts.
  expect(siteBox.x).toBeGreaterThan(statusBox.x);

  const headerStyle = await headers
    .filter({ hasText: 'منطقة الدراسة' })
    .first()
    .locator('.bp6-table-column-name')
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return { direction: style.direction, textAlign: style.textAlign };
    });
  expect(headerStyle.direction).toBe('rtl');
  expect(headerStyle.textAlign).toBe('right');

  const firstCellStyle = await shell.locator('.bp6-table-cell').first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { textAlign: style.textAlign, direction: style.direction };
  });
  expect(firstCellStyle.direction).toBe('rtl');
  expect(firstCellStyle.textAlign).toBe('right');
});
