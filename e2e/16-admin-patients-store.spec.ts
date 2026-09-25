import { test, expect } from '@playwright/test';

test.describe('Module F: Central Patient Master Registry & Multi-Store EHR Dossier', () => {

  test('01. Admin Patients page loads KPI metrics and patient directory', async ({ page }) => {
    await page.goto('/admin/patients');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify main header
    await expect(page.locator('main h1').filter({ hasText: /Patient Master Registry/i })).toBeVisible();

    // Verify 4 KPI summary cards
    await expect(page.getByText('Registered Patients')).toBeVisible();
    await expect(page.getByText('Active Visits Today')).toBeVisible();
    await expect(page.getByText('Recalls Pending')).toBeVisible();
    await expect(page.getByText('Total In-Store Collected')).toBeVisible();

    // Verify default patient selected (e.g. Mahesh Kumar or Amit Shah)
    await expect(page.getByText('Mahesh Kumar').first()).toBeVisible();
    await expect(page.getByText('MRD-2026-0001').first()).toBeVisible();
  });

  test('02. Patient search and category filters work dynamically', async ({ page }) => {
    await page.goto('/admin/patients');

    const searchInput = page.locator('input[placeholder*="Search MRD"]');
    await expect(searchInput).toBeVisible();

    // Search for Amit
    await searchInput.fill('Amit');
    await expect(page.locator('div').filter({ hasText: 'Amit Shah' }).first()).toBeVisible();
    await expect(page.getByText('MRD-2026-0004').first()).toBeVisible();

    // Clear search and test category filter
    await searchInput.fill('');
    const vipFilter = page.locator('button').filter({ hasText: /^VIP$/ });
    await expect(vipFilter).toBeVisible();
    await vipFilter.click();

    // Check that VIP patients are shown (Mahesh Kumar or Amit Shah)
    await expect(page.getByText('Amit Shah').first()).toBeVisible();
  });

  test('03. Longitudinal EHR tabs display cross-store data for selected patient', async ({ page }) => {
    await page.goto('/admin/patients');

    // Select Amit Shah
    const amitItem = page.locator('[data-testid="patient-card-pat-4"]');
    await expect(amitItem).toBeVisible();
    await amitItem.click();

    // Verify Demographics Header details
    await expect(page.locator('h2').filter({ hasText: 'Amit Shah' })).toBeVisible();
    await expect(page.getByText('MRD-2026-0004').first()).toBeVisible();
    await expect(page.getByText('Sulfonamides')).toBeVisible(); // Known allergy alert

    // Tab 1: Encounters & Cases
    await expect(page.getByText('Encounters & Cases').first()).toBeVisible();
    await expect(page.getByText('C006-001-190926').first()).toBeVisible();
    await expect(page.getByText('Token: C006').first()).toBeVisible();

    // Tab 2: Diagnoses & Vitals
    const diagnosesTab = page.locator('button').filter({ hasText: /Diagnoses & Vitals/i });
    await diagnosesTab.click();
    await expect(page.getByText('Latest Triage Vital Signs')).toBeVisible();
    await expect(page.getByText('Blood Pressure')).toBeVisible();
    await expect(page.getByText('120/80')).toBeVisible();

    // Tab 3: Prescriptions & Rx
    const prescriptionsTab = page.locator('button').filter({ hasText: /Prescriptions & Rx/i });
    await prescriptionsTab.click();
    await expect(page.getByText(/Prescriptions & Formularies Dispensed/i)).toBeVisible();

    // Tab 5: Procedures & Protocols
    const proceduresTab = page.locator('button').filter({ hasText: /Procedures & Protocols/i });
    await proceduresTab.click();
    await expect(page.getByText(/Treatment Protocols & Clinical Procedures/i)).toBeVisible();

    // Tab 6: Billing & Invoices
    const billingTab = page.locator('button').filter({ hasText: /Billing & Invoices/i });
    await billingTab.click();
    await expect(page.getByText('Total Invoiced')).toBeVisible();
    await expect(page.getByText('INV-2026-0089').first()).toBeVisible();

    // Tab 7: Follow-Up Recalls
    const recallsTab = page.locator('button').filter({ hasText: /Follow-Up Recalls/i });
    await recallsTab.click();
    await expect(page.getByText(/Clinical Recall Schedules & Nursing Outbound Log/i)).toBeVisible();
    await expect(page.getByText(/Assess clinical clearance of fungal lesions/i).first()).toBeVisible();
    await expect(page.getByText(/Call patient at day 5 to verify compliance/i).first()).toBeVisible();
  });

  test('04. Register new patient directly into store', async ({ page }) => {
    await page.goto('/admin/patients');

    // Click + Register New Patient
    const registerBtn = page.locator('button').filter({ hasText: /\+ Register New Patient/i });
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Fill registration form
    await expect(page.getByText('Register New Patient in Central Master')).toBeVisible();
    await page.locator('input[placeholder="e.g. Ramesh"]').fill('Nirav');
    await page.locator('input[placeholder="e.g. Varma"]').fill('Choksi');
    await page.locator('input[placeholder="10-digit mobile"]').fill('9825199888');

    // Submit form
    await page.locator('button').filter({ hasText: /Save & Assign MRD/i }).click();

    // Verify patient is now in registry and selected
    await expect(page.locator('h2').filter({ hasText: 'Nirav Choksi' })).toBeVisible();
    await expect(page.getByText('9825199888').first()).toBeVisible();
  });

  test('05. Edit Demographics and Print Master Dossier modals work smoothly', async ({ page }) => {
    await page.goto('/admin/patients');

    // Click Edit Demographics
    const editBtn = page.locator('button').filter({ hasText: /Edit Demographics/i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.getByText('Edit Patient Demographics')).toBeVisible();
    // Test direct save
    await page.locator('button').filter({ hasText: /Commit Demographics/i }).click();

    // Click Print Master Dossier
    const printBtn = page.locator('button').filter({ hasText: /Print Master Dossier/i });
    await expect(printBtn).toBeVisible();
    await printBtn.click();

    await expect(page.getByText('MEDFLOW HEALTHCARE CLINIC')).toBeVisible();
    await expect(page.getByText('Comprehensive Longitudinal Patient EHR Master Dossier')).toBeVisible();
    await page.locator('button').filter({ hasText: /Close Preview/i }).click();
  });

});
