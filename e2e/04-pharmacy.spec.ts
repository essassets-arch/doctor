import { test, expect } from '@playwright/test';

test.describe('Module D: Medical, Pharmacy & Dispensary POS Workflow', () => {

  test('01. Pharmacy Dashboard displays shift counters and alerts', async ({ page }) => {
    await page.goto('/medical/dashboard');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify Pharmacy header branding
    await expect(page.locator('.medical-logo-text')).toContainText('MEDFLOW');
    await expect(page.locator('.medical-logo-text')).toContainText('PHARMACY & DISPENSARY');

    // Shift Counters
    await expect(page.getByText(/PENDING DISPENSING/i).first()).toBeVisible();
    await expect(page.getByText(/OUT OF STOCK/i).first()).toBeVisible();
  });

  test('02. Dispensing Hub displays prescription queue', async ({ page }) => {
    await page.goto('/medical/dispensing');
    await expect(page.locator('h1').filter({ hasText: /Dispensing Hub/i })).toBeVisible();
  });

  test('03. Dispensing POS Workspace loads for active case', async ({ page }) => {
    await page.goto('/medical/dispensing/C003-001-190926');
    
    // Patient header
    await expect(page.getByText(/Mahesh Kumar/i).first()).toBeVisible();

    // High risk allergy check or warning banner
    await expect(page.getByText(/Allerg/i).first()).toBeVisible();

    // Prescribed medications
    await expect(page.getByText(/Prescribed/i).first()).toBeVisible();

    // Point of Sale Cart / Total Amount Due
    await expect(page.getByText(/Total Amount Due/i).first()).toBeVisible();
  });

  test('04. Central Stock Management loads drug catalog and movement history', async ({ page }) => {
    await page.goto('/medical/stock');
    await expect(page.locator('h1').filter({ hasText: /Central Stock/i })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('05. Medication Returns page loads with return form', async ({ page }) => {
    await page.goto('/medical/returns');
    await expect(page.locator('h1').filter({ hasText: /Medication Returns/i })).toBeVisible();
  });

  test('06. Inventory Alerts displays Low Stock, Near-Expiry and Expired tabs', async ({ page }) => {
    await page.goto('/medical/alerts');
    await expect(page.locator('h1').filter({ hasText: /Inventory Alerts/i })).toBeVisible();

    // Tabs
    await expect(page.getByRole('button', { name: /Low Stock Deficit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Near Expiry/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quarantine & Expired/i })).toBeVisible();
  });

  test('07. Pharmacy Staff Profile loads', async ({ page }) => {
    await page.goto('/medical/profile');
    await expect(page.locator('h1').filter({ hasText: /Profile/i })).toBeVisible();
  });

});
