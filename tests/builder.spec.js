// @ts-check
import { test, expect } from '@playwright/test';

/* The builder posts to Web3Forms (customer email) and /api/notify-order (kitchen
   text alert) on submit. Every test that reaches "Send This Batch" mocks both
   routes — letting a real request through would email/text the actual business
   for a fake test order. */
async function mockOrderEndpoints(page, { formOk = true } = {}) {
  await page.route('https://api.web3forms.com/submit', function (route) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(formOk ? { success: true, message: 'ok' } : { success: false, message: 'nope' })
    });
  });
  await page.route('**/api/notify-order', function (route) {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
}

test.beforeEach(async function ({ page }) {
  await page.goto('/#builder');
});

test.describe('batch builder — picking plates', function () {
  test('stepping a plate up updates its qty, the cap text and the live total', async function ({ page }) {
    var chicken = page.locator('.plate-row', { hasText: 'Chicken Plate' });
    await chicken.locator('.step-up').click();

    await expect(chicken.locator('[data-qty]')).toHaveText('1');
    await expect(page.locator('#cap-used')).toHaveText('1');
    await expect(page.locator('#cap-left')).toHaveText('7 open');
    await expect(page.locator('#receipt-total')).toHaveText('$24.99');
    await expect(page.locator('#receipt-lines')).toContainText('1× Chicken Plate');
  });

  test('stepping down removes the plate and the down button disables at zero', async function ({ page }) {
    var chicken = page.locator('.plate-row', { hasText: 'Chicken Plate' });
    var down = chicken.locator('.step-down');

    await expect(down).toBeDisabled();

    await chicken.locator('.step-up').click();
    await expect(down).toBeEnabled();

    await down.click();
    await expect(chicken.locator('[data-qty]')).toHaveText('0');
    await expect(down).toBeDisabled();
    await expect(page.locator('#receipt-lines')).toContainText('No plates yet');
  });

  test('the 8-plate cap disables every step-up button and shows the warning', async function ({ page }) {
    var chickenUp = page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up');
    for (var i = 0; i < 8; i++) {
      await chickenUp.click();
    }

    await expect(page.locator('#cap-used')).toHaveText('8');
    await expect(page.locator('#cap-left')).toHaveText('batch full');
    await expect(page.locator('#cap-warn')).toBeVisible();

    var salmonUp = page.locator('.plate-row', { hasText: 'Salmon Plate' }).locator('.step-up');
    await expect(salmonUp).toBeDisabled();
    await expect(chickenUp).toBeDisabled();
  });

  test('mixed plates total correctly', async function ({ page }) {
    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
    await page.locator('.plate-row', { hasText: 'Ribeye Plate' }).locator('.step-up').click();

    // 2 × 24.99 + 39.99 = 89.97
    await expect(page.locator('#receipt-total')).toHaveText('$89.97');
    await expect(page.locator('#cap-used')).toHaveText('3');
  });
});

test.describe('batch builder — addons and pickup slot', function () {
  test('checking an addon adds its price and unchecking removes it', async function ({ page }) {
    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
    var noodles = page.locator('#addon-list li', { hasText: 'Garlic noodles' }).locator('input[type=checkbox]');

    await noodles.check();
    await expect(page.locator('#receipt-total')).toHaveText('$34.98'); // 24.99 + 9.99
    await expect(page.locator('#receipt-lines')).toContainText('Garlic noodles');

    await noodles.uncheck();
    await expect(page.locator('#receipt-total')).toHaveText('$24.99');
  });

  test('picking a pickup slot updates the receipt', async function ({ page }) {
    await expect(page.locator('#receipt-slot')).toHaveText('Tracy · 4:00 PM');

    // The radio is visually hidden behind the styled <span> label, same as a
    // real visitor would interact with it — click the label, not the input.
    await page.locator('.slot', { has: page.locator('input[value="Tracy · 8:00 PM"]') }).click();
    await expect(page.locator('#receipt-slot')).toHaveText('Tracy · 8:00 PM');
  });
});

test.describe('batch builder — validation', function () {
  test('sending with no plates selected shows a warning and does not submit', async function ({ page }) {
    var submitted = false;
    await page.route('https://api.web3forms.com/submit', function (route) {
      submitted = true;
      route.abort();
    });

    await page.click('#lock-btn');

    await expect(page.locator('#receipt-msg')).toContainText('Add at least one plate');
    expect(submitted).toBe(false);
  });

  test('sending without a name or phone is blocked and focuses the field', async function ({ page }) {
    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();

    await page.click('#lock-btn');
    await expect(page.locator('#receipt-msg')).toContainText('Add your name');
    await expect(page.locator('#cust-name')).toBeFocused();

    await page.fill('#cust-name', 'Alex Test');
    await page.click('#lock-btn');
    await expect(page.locator('#receipt-msg')).toContainText('Add a phone number');
    await expect(page.locator('#cust-phone')).toBeFocused();
  });
});

test.describe('batch builder — submit (mocked network)', function () {
  test('a valid batch submits, shows the confirmation, and reveals pay-at-pickup', async function ({ page }) {
    await mockOrderEndpoints(page);

    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
    await page.fill('#cust-name', 'Alex Test');
    await page.fill('#cust-phone', '2095551234');

    await page.click('#lock-btn');

    await expect(page.locator('#receipt-msg')).toContainText('Batch sent');
    await expect(page.locator('#lock-btn')).toBeHidden();
    await expect(page.locator('#pay-btn')).toBeVisible();
  });

  test('editing the batch after sending re-arms the send button', async function ({ page }) {
    await mockOrderEndpoints(page);

    var chickenUp = page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up');
    await chickenUp.click();
    await page.fill('#cust-name', 'Alex Test');
    await page.fill('#cust-phone', '2095551234');
    await page.click('#lock-btn');
    await expect(page.locator('#receipt-msg')).toContainText('Batch sent');

    await chickenUp.click();

    await expect(page.locator('#lock-btn')).toBeVisible();
    await expect(page.locator('#lock-btn')).toHaveText('Send Updated Batch');
    await expect(page.locator('#pay-btn')).toBeHidden();
    await expect(page.locator('#receipt-msg')).toContainText('Order changed');
  });

  test('a failed submission tells the customer nothing was lost and re-enables the button', async function ({ page }) {
    await mockOrderEndpoints(page, { formOk: false });

    await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
    await page.fill('#cust-name', 'Alex Test');
    await page.fill('#cust-phone', '2095551234');

    await page.click('#lock-btn');

    await expect(page.locator('#receipt-msg')).toContainText('did not send');
    await expect(page.locator('#lock-btn')).toBeEnabled();
    await expect(page.locator('#lock-btn')).toHaveText('Send This Batch');
  });
});

test('copy order summary copies the receipt text to the clipboard', async function ({ page, context, browserName }) {
  test.skip(browserName !== 'chromium', 'clipboard permission API is chromium-only');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.locator('.plate-row', { hasText: 'Chicken Plate' }).locator('.step-up').click();
  await page.click('#copy-btn');

  await expect(page.locator('#copy-btn')).toHaveText('Copied to clipboard');
  var clip = await page.evaluate(function () { return navigator.clipboard.readText(); });
  expect(clip).toContain('1× Chicken Plate');
  expect(clip).toContain('TRAPPANYAKI — batch request');
});
