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

});
