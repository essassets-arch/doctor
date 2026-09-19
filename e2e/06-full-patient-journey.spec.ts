import { test, expect } from '@playwright/test';

test.describe('Full Cross-Departmental Patient Journey Workflow', () => {

  test('Complete Patient Lifecycle: Reception -> Nursing -> Doctor -> Pharmacy -> Checkout', async ({ page }) => {
    // 1. Receptionist Desk Check-In & Queue
    await page.goto('/reception/dashboard');
    await expect(page.getByText('Total Today')).toBeVisible();

    await page.goto('/reception/queue');
    await expect(page.locator('h1').filter({ hasText: /OPD Queue Control/i })).toBeVisible();

    // 2. Nursing Station Triage
    await page.goto('/nursing/vitals');
    await expect(page.locator('h1').filter({ hasText: /Pre-Consultation Vitals/i })).toBeVisible();
    await expect(page.getByText(/BMI/i).first()).toBeVisible();

    // 3. Doctor Consultation Cockpit
    await page.goto('/doctor/consultation/C003-001-190926');
    await expect(page.getByText(/Mahesh Kumar/i).first()).toBeVisible();
    
    // Doctor inspects Rx and Final Summary
    await page.locator('.tab-item').filter({ hasText: /Rx Pharmacy/i }).click();
    await expect(page.getByText(/Prescription/i).first()).toBeVisible();

    await page.locator('.tab-item').filter({ hasText: /Finalize & Sign/i }).click();
    await expect(page.getByText(/Summary/i).first()).toBeVisible();

    // 4. Pharmacy Dispensary POS
    await page.goto('/medical/dispensing/C003-001-190926');
    await expect(page.getByText(/Mahesh Kumar/i).first()).toBeVisible();
    await expect(page.getByText(/Allerg/i).first()).toBeVisible();
    await expect(page.getByText(/Total Amount Due/i).first()).toBeVisible();

    // 5. Receptionist Final Billing Checkout
    await page.goto('/reception/billing');
    await expect(page.locator('h1').filter({ hasText: /OPD Billing/i })).toBeVisible();

    // 6. Superadmin Governance Audit
    await page.goto('/admin/dashboard');
    await expect(page.locator('main').getByText(/Today's Revenue/i).first()).toBeVisible();
  });

});
