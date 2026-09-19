import { test, expect } from '@playwright/test';

test.describe('Module 07: Comprehensive Multi-Device & Responsive Verification', () => {

  test('01. Reception Panel Mobile (375x667): Hamburger drawer opens and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reception/dashboard');

    // Brand is visible
    await expect(page.locator('.medflow-logo-text .brand')).toBeVisible();

    // Hamburger button is visible
    const hamburgerBtn = page.locator('.medflow-mobile-menu-btn');
    await expect(hamburgerBtn).toBeVisible();

    // Click hamburger to open drawer
    await hamburgerBtn.click();
    await expect(page.getByText('RECEPTION DESK').first()).toBeVisible();
    await expect(page.getByText('REGISTER PATIENT').first()).toBeVisible();

    // Click 'CHECK-IN (WALK-IN)' in drawer
    await page.getByText('CHECK-IN (WALK-IN)').first().click();
    await page.waitForURL('**/reception/checkin');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('02. Doctor Panel Mobile (390x844): Consultation Station renders responsively', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/doctor/consultation/CASE-2026-001');

    // Case info is visible
    await expect(page.getByText(/Mahesh Kumar/i).first()).toBeVisible();

    // Vitals section is visible
    await expect(page.getByText(/Current Triage Vitals/i)).toBeVisible();

    // Verify no horizontal overflow on consultation station
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('03. Nursing Panel Mobile (375x667): Triage Dashboard and Drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nursing/dashboard');

    // Hamburger is visible
    const hamburgerBtn = page.locator('.nursing-mobile-menu-btn');
    await expect(hamburgerBtn).toBeVisible();

    // Open drawer
    await hamburgerBtn.click();
    await expect(page.getByText('NURSING & TRIAGE OS').first()).toBeVisible();
    await expect(page.getByText('VITALS ENTRY').first()).toBeVisible();

    // Click Vitals Entry
    await page.getByText('VITALS ENTRY').first().click();
    await page.waitForURL('**/nursing/vitals');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('04. Pharmacy Panel Mobile (390x844): POS and Drawer navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/medical/dashboard');

    // Hamburger is visible
    const hamburgerBtn = page.locator('.medical-mobile-menu-btn');
    await expect(hamburgerBtn).toBeVisible();

    // Open drawer
    await hamburgerBtn.click();
    await expect(page.getByText('PHARMACY & POS').first()).toBeVisible();
    await expect(page.getByText('DISPENSING QUEUE').first()).toBeVisible();

    // Click Dispensing Queue
    await page.getByText('DISPENSING QUEUE').first().click();
    await page.waitForURL('**/medical/dispensing');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('05. Superadmin Panel Mobile (375x667): Off-canvas drawer opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/dashboard');

    // Hamburger button is visible
    const hamburgerBtn = page.locator('.admin-mobile-menu-btn');
    await expect(hamburgerBtn).toBeVisible();

    // Open Admin Drawer
    await hamburgerBtn.click();
    await expect(page.locator('.admin-sidebar.mobile-open')).toBeVisible();
    await expect(page.getByText('CORE INTELLIGENCE').first()).toBeVisible();
    await expect(page.getByText('WORKFORCE & HRMS').first()).toBeVisible();

    // Click close button inside drawer
    const closeBtn = page.locator('.admin-mobile-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.locator('.admin-sidebar.mobile-open')).not.toBeVisible();

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('06. Tablet Viewport (768x1024): Admin Dashboard renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/dashboard');

    await expect(page.getByText(/EXECUTIVE DASHBOARD/i).first()).toBeVisible();
    await expect(page.locator('.admin-mobile-menu-btn')).toBeVisible();

    // Verify no horizontal overflow on tablet
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

});
