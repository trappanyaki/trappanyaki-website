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
