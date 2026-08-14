// @ts-check
import { test, expect } from '@playwright/test';

test('homepage loads with the brand and key sections in place', async function ({ page }) {
  await page.goto('/');

  await expect(page).toHaveTitle(/Trappanyaki/i);
  await expect(page.locator('.brand-link')).toBeVisible();
  await expect(page.locator('#menu')).toBeAttached();
  await expect(page.locator('#builder')).toBeAttached();
  await expect(page.locator('#faq')).toBeAttached();
});

test('call links use the real business phone number', async function ({ page }) {
  await page.goto('/');

  var telLinks = page.locator('a[href="tel:+13502500607"]');
  expect(await telLinks.count()).toBeGreaterThan(0);
});

test('DM-order links point at the Instagram order flow', async function ({ page }) {
  await page.goto('/');
  var dmLinks = page.locator('a[href*="ig.me/m/TRAPPANYAKI"]');
  expect(await dmLinks.count()).toBeGreaterThan(0);
});

test.describe('mobile nav', function () {
  test.use({ viewport: { width: 390, height: 844 } });

  test('toggle opens and closes the menu', async function ({ page }) {
    await page.goto('/');
    var toggle = page.locator('#mobile-toggle');
    var menu = page.locator('#nav-menu');

    await expect(menu).not.toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);

    await toggle.click();
    await expect(menu).not.toHaveClass(/is-open/);
  });

  test('picking a nav link closes the menu', async function ({ page }) {
    await page.goto('/');
    var toggle = page.locator('#mobile-toggle');
    var menu = page.locator('#nav-menu');

    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);

    await page.locator('#nav-menu a[href="#faq"]').click();
    await expect(menu).not.toHaveClass(/is-open/);
  });
});

test.describe('FAQ accordion', function () {
  test('opening one item closes any other open item', async function ({ page }) {
    await page.goto('/#faq');
    var items = page.locator('.faq-item');

    var first = items.nth(0);
    var second = items.nth(1);

    await first.locator('summary').click();
    await expect(first).toHaveJSProperty('open', true);

    await second.locator('summary').click();
    await expect(second).toHaveJSProperty('open', true);
    await expect(first).toHaveJSProperty('open', false);
  });
});

test.describe('shatter mark', function () {
  test('builds a 40-cube grid at desktop width', async function ({ page }) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('#shatter')).toBeAttached();
    await expect(page.locator('#shatter-grid .cube')).toHaveCount(40);
    await expect(page.locator('#shatter-stage')).toHaveClass(/has-cubes/);
  });

  test('builds a reduced 24-cube grid under 820px', async function ({ page }) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('#shatter-grid .cube')).toHaveCount(24);
  });

  test('reduced motion skips the cube grid and shows the flat logo', async function ({ page }) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('#shatter-grid .cube')).toHaveCount(0);
    await expect(page.locator('#shatter-fallback')).toBeVisible();
    await expect(page.locator('#shatter-fallback')).toHaveCSS('opacity', '1');
  });
});
