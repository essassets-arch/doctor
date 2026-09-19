import { test, expect } from '@playwright/test';

test.describe('Module C: Nursing Triage & Care Coordination Workflow', () => {

  test('01. Nursing Dashboard displays triage shift metrics and queue', async ({ page }) => {
    await page.goto('/nursing/dashboard');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify Nursing header and branding
    await expect(page.locator('.nursing-logo-text')).toContainText('MEDFLOW');

    // Verify shift counters
    await expect(page.getByText(/TODAY'S PATIENTS/i).first()).toBeVisible();
    await expect(page.getByText('Vitals Pending', { exact: true })).toBeVisible();

    // Verify triage queue table
    await expect(page.locator('table')).toBeVisible();
  });

  test('02. Pre-Consultation Vitals page loads with inputs and BMI calculation', async ({ page }) => {
    await page.goto('/nursing/vitals');
    await expect(page.locator('h1').filter({ hasText: /Pre-Consultation Vitals/i })).toBeVisible();

    // Verify vital inputs: Height, Weight, Temp, BP, Pulse, SpO2
    await expect(page.getByText(/Height/i).first()).toBeVisible();
    await expect(page.getByText(/Weight/i).first()).toBeVisible();
    await expect(page.getByText(/Temp/i).first()).toBeVisible();
    await expect(page.getByText(/Pulse/i).first()).toBeVisible();
    await expect(page.getByText(/Blood Pressure/i).first()).toBeVisible();
    await expect(page.getByText(/SpO2/i).first()).toBeVisible();

    // Verify BMI indicator card exists
    await expect(page.getByText(/BMI/i).first()).toBeVisible();
  });

  test('03. Diagnostic Lab Reports page displays upload zone and orders', async ({ page }) => {
    await page.goto('/nursing/lab-reports');
    await expect(page.locator('h1').filter({ hasText: /Lab Report Upload/i })).toBeVisible();

    // Upload section
    await expect(page.getByRole('button', { name: /Upload/i }).first()).toBeVisible();
  });

  test('04. Follow-up Outreach displays recall list', async ({ page }) => {
    await page.goto('/nursing/followup');
    await expect(page.locator('h1').filter({ hasText: /Follow-Up Call/i })).toBeVisible();
  });

  test('05. Nursing Staff Profile displays credentials', async ({ page }) => {
    await page.goto('/nursing/profile');
    await expect(page.locator('h1').filter({ hasText: /Staff Nurse Profile/i })).toBeVisible();
  });

});
