import { test, expect } from '@playwright/test';

test.describe('Module 00: Authentication & Quick Role Launchers', () => {

  test('01. Login page loads with MedFlow branding and security indicators', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Header Branding
    await expect(page.getByText('MEDFLOW').first()).toBeVisible();
    await expect(page.getByText(/ENTERPRISE 2.4/i)).toBeVisible();
    await expect(page.getByText(/SSE Telemetry: Live & Synchronized/i)).toBeVisible();

    // Form
    await expect(page.getByRole('heading', { name: /Terminal Authentication/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('02. All 5 quick role-based login cards + Public TV are present', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText(/Doctor \/ Clinical Specialist/i)).toBeVisible();
    await expect(page.getByText(/Receptionist \/ Front Desk/i)).toBeVisible();
    await expect(page.getByText(/Staff Nurse \/ Triage Officer/i)).toBeVisible();
    await expect(page.getByText(/Pharmacy & Dispensary Officer/i)).toBeVisible();
    await expect(page.getByText(/Superadmin \/ Medical Director/i)).toBeVisible();
    await expect(page.getByText(/Public Waiting Room TV Screen/i)).toBeVisible();
  });

  test('03. Quick login to Doctor panel navigates successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Doctor \/ Clinical Specialist/i).click();
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.locator('.doctor-logo-text')).toContainText('MEDFLOW');
  });

  test('04. Quick login to Receptionist panel navigates successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Receptionist \/ Front Desk/i).click();
    await page.waitForURL('**/reception/dashboard');
    await expect(page.locator('.medflow-logo-text')).toContainText('MEDFLOW');
  });

  test('05. Quick login to Nursing panel navigates successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Staff Nurse \/ Triage Officer/i).click();
    await page.waitForURL('**/nursing/dashboard');
    await expect(page.locator('.nursing-logo-text')).toContainText('MEDFLOW');
  });

  test('06. Quick login to Pharmacy panel navigates successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Pharmacy & Dispensary Officer/i).click();
    await page.waitForURL('**/medical/dashboard');
    await expect(page.locator('.medical-logo-text')).toContainText('MEDFLOW');
  });

  test('07. Quick login to Superadmin panel navigates successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Superadmin \/ Medical Director/i).click();
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('aside').getByText(/ADMIN APEX/i).first()).toBeVisible();
  });

  test('08. Responsive Test: Mobile screen (375x667) renders cleanly with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Branding is visible
    await expect(page.getByText('MEDFLOW').first()).toBeVisible();

    // Form inputs are visible and within viewport
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // All role cards are accessible and visible on mobile
    await expect(page.getByText(/Doctor \/ Clinical Specialist/i)).toBeVisible();
    await expect(page.getByText(/Receptionist \/ Front Desk/i)).toBeVisible();

    // Check no horizontal document scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 0 or at most fractional rounding
  });

  test('09. Responsive Test: Tablet screen (768x1024) adapts layout gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /Terminal Authentication/i })).toBeVisible();
    await expect(page.getByText(/Quick Role-Based Access/i)).toBeVisible();

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('10. Responsive Test: Desktop screen (1280x800) displays dual-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');

    await expect(page.locator('.login-main-grid')).toBeVisible();
    await expect(page.locator('.login-form-card')).toBeVisible();
    await expect(page.locator('.login-roles-grid')).toBeVisible();

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

});
