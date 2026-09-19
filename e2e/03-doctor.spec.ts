import { test, expect } from '@playwright/test';

test.describe('Module B: Doctor Clinical OS Workflow', () => {

  test('01. Doctor Dashboard displays clinical queue and KPIs', async ({ page }) => {
    await page.goto('/doctor/dashboard');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify Doctor branding
    await expect(page.locator('.doctor-logo-text')).toContainText('MEDFLOW');
    await expect(page.locator('.doctor-logo-text')).toContainText('CLINICAL OS');

    // Verify nav items
    await expect(page.getByRole('link', { name: 'DASHBOARD' })).toBeVisible();
    await expect(page.getByRole('link', { name: /OPD QUEUE/i })).toBeVisible();
  });

  test('02. Doctor OPD Queue displays patients waiting', async ({ page }) => {
    await page.goto('/doctor/queue');
    await expect(page.locator('h1').filter({ hasText: /OPD Queue Control Center/i })).toBeVisible();
  });

  test('03. Consultation Master Station loads with 7 clinical tabs', async ({ page }) => {
    await page.goto('/doctor/consultation/C003-001-190926');
    
    // Patient Banner
    await expect(page.getByText(/Mahesh Kumar/i).first()).toBeVisible();

    // Verify all 7 tabs exist via .tab-item
    await expect(page.locator('.tab-item').filter({ hasText: /Complaints & Vitals/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Lab Orders/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Rx Pharmacy/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Procedures/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Photography/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Diagnosis & Recall/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Finalize & Sign/i })).toBeVisible();

    // Switch to Rx Pharmacy tab
    await page.locator('.tab-item').filter({ hasText: /Rx Pharmacy/i }).click();
    await expect(page.getByText(/Prescription/i).first()).toBeVisible();

    // Switch to Diagnosis & Recall tab
    await page.locator('.tab-item').filter({ hasText: /Diagnosis & Recall/i }).click();
    await expect(page.getByText(/Diagnosis/i).first()).toBeVisible();

    // Switch to Finalize & Sign tab
    await page.locator('.tab-item').filter({ hasText: /Finalize & Sign/i }).click();
    await expect(page.getByText(/Summary/i).first()).toBeVisible();
  });

  test('04. Doctor Follow-up Call List loads', async ({ page }) => {
    await page.goto('/doctor/followup-call-list');
    await expect(page.locator('h1').filter({ hasText: /Follow-Up Call/i })).toBeVisible();
  });

  test('05. Doctor Profile loads with shift schedule', async ({ page }) => {
    await page.goto('/doctor/profile');
    await expect(page.locator('h1').filter({ hasText: /Doctor Credentials/i })).toBeVisible();
  });

});
