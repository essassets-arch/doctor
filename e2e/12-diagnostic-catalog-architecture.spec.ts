import { test, expect } from '@playwright/test';

test.describe('Diagnostic Lab Architecture - Single Source of Truth (/admin/lab -> Doctor Lab Order)', () => {

  test('01. Admin Lab Master loads master catalog and configures tests & parameters', async ({ page }) => {
    await page.goto('/admin/lab');
    await expect(page.locator('main h1').filter({ hasText: /Diagnostic Laboratory Masters/i })).toBeVisible();

    // Verify 3 tabs
    await expect(page.getByRole('button', { name: /Hospital Diagnostic Catalog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Requisition & Order Configuration/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingestion & Result Parameters Matrix/i })).toBeVisible();

    // Verify Master Catalog Table columns and entries
    await expect(page.getByText('Complete Blood Count (CBC) with ESR').first()).toBeVisible();
    await expect(page.getByText('LAB-CBC').first()).toBeVisible();
    await expect(page.getByText('Blood Sugar (Fasting Glucose)').first()).toBeVisible();
    await expect(page.getByText('LAB-BS').first()).toBeVisible();
    await expect(page.getByText('Liver Function Test (LFT)').first()).toBeVisible();
    await expect(page.getByText('LAB-LFT').first()).toBeVisible();

    // Verify Add New Lab Test button opens modal
    await page.locator('#btn-add-new-lab-test').click();
    await expect(page.getByText('Add New Lab Test (Admin Master)')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Switch to Requisition & Order tab
    await page.getByRole('button', { name: /Requisition & Order Configuration/i }).click();
    await expect(page.getByText('Requisition & Order Rules Configuration')).toBeVisible();
    await expect(page.getByText('ORDERABLE: YES').first()).toBeVisible();

    // Switch to Parameters Matrix tab
    await page.getByRole('button', { name: /Ingestion & Result Parameters Matrix/i }).click();
    await expect(page.getByRole('heading', { name: /Ingestion & Result Parameters Matrix/i })).toBeVisible();
    await expect(page.getByText('Hemoglobin').first()).toBeVisible();
    await expect(page.getByText('HGB').first()).toBeVisible();
  });

  test('02. Doctor Consultation Lab Order tab consumes Admin master catalog, places order pointing to LabTest ID, and forbids independent test creation', async ({ page }) => {
    // Open doctor consultation
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Click Lab Orders tab (Tab 2)
    const labOrdersTab = page.locator('button.tab-item').filter({ hasText: /Lab Orders/i }).first();
    await expect(labOrdersTab).toBeVisible();
    await labOrdersTab.click();

    // Verify SINGLE SOURCE OF TRUTH Banner is present
    await expect(page.getByText(/SINGLE SOURCE OF TRUTH/i).first()).toBeVisible();
    await expect(page.getByText(/Hospital Diagnostic Catalog loaded live from Admin Master/i)).toBeVisible();

    // Verify Doctor CANNOT create independent tests (no "+ Add New Lab Test" button in doctor consultation)
    await expect(page.locator('button').filter({ hasText: /Add New Lab Test/i })).toHaveCount(0);

    // Verify search input is present
    const searchInput = page.getByPlaceholder(/Search Hospital Diagnostic Catalog/i);
    await expect(searchInput).toBeVisible();

    // Verify catalog items from Admin master are displayed
    await expect(page.getByText('Complete Blood Count (CBC) with ESR').first()).toBeVisible();
    await expect(page.getByText('Blood Sugar (Fasting Glucose)').first()).toBeVisible();
    await expect(page.getByText('Liver Function Test (LFT)').first()).toBeVisible();

    // Search for CBC
    await searchInput.fill('CBC');
    await expect(page.getByText('LAB-CBC').first()).toBeVisible();

    // Add CBC to requisition
    const addCbcBtn = page.locator('div').filter({ hasText: 'Complete Blood Count (CBC) with ESR' }).locator('button', { hasText: '+ Add' }).first();
    await addCbcBtn.click();

    // Clear search and search for Blood Sugar
    await searchInput.fill('Blood Sugar');
    await expect(page.getByText('LAB-BS').first()).toBeVisible();

    // Add Blood Sugar to requisition
    const addBsBtn = page.locator('div').filter({ hasText: 'Blood Sugar (Fasting Glucose)' }).locator('button', { hasText: '+ Add' }).first();
    await addBsBtn.click();

    // Verify Selected Tests Requisition on Right Column shows 2 items
    await expect(page.getByText(/Selected Tests Requisition \(2\)/i)).toBeVisible();
    await expect(page.getByText('☑').first()).toBeVisible();

    // Enter Clinical Notes
    const notesInput = page.getByPlaceholder(/clinical indication, diagnostic differential/i);
    await notesInput.fill('Routine pre-op hematological workup and fasting glucose evaluation');

    // Select Priority STAT
    const statRadio = page.locator('input[type="radio"][value="STAT"]');
    await statRadio.check();
    await expect(statRadio).toBeChecked();

    // Click [ Place Lab Order ]
    const placeOrderBtn = page.getByRole('button', { name: /Place Lab Order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Verify order placed and requisition cleared
    await expect(page.getByText(/Placed Lab Orders for Encounter/i)).toBeVisible();
    await expect(page.getByText(/LAB-ORD-/i).first()).toBeVisible();
    await expect(page.getByText('STAT').first()).toBeVisible();
  });

  test('03. Deactivating or marking a test non-orderable in /admin/lab immediately hides it from doctor consultation', async ({ page }) => {
    // Navigate to admin lab
    await page.goto('/admin/lab');
    await page.waitForLoadState('networkidle');

    // Go to Requisition tab
    await page.getByRole('button', { name: /Requisition & Order Configuration/i }).click();

    // Find Blood Sugar and toggle it to ORDERABLE: NO
    const bsToggle = page.locator('#btn-toggle-orderable-LAB-BS');
    await expect(bsToggle).toBeVisible();
    await bsToggle.click();
    await expect(bsToggle).toHaveText('ORDERABLE: NO');

    // Now go to doctor consultation
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Click Lab Orders tab
    await page.locator('button.tab-item').filter({ hasText: /Lab Orders/i }).first().click();

    // Search for Blood Sugar
    const searchInput = page.getByPlaceholder(/Search Hospital Diagnostic Catalog/i);
    await searchInput.fill('Blood Sugar');

    // It should NOT be available in the doctor's orderable search!
    await expect(page.getByText(/No active catalog test matching/i)).toBeVisible();

    // But CBC is still active and orderable!
    await searchInput.fill('CBC');
    await expect(page.getByText('LAB-CBC').first()).toBeVisible();

    // Restore Blood Sugar to ORDERABLE: YES in admin
    await page.goto('/admin/lab');
    await page.getByRole('button', { name: /Requisition & Order Configuration/i }).click();
    const bsToggleRestore = page.locator('#btn-toggle-orderable-LAB-BS');
    await bsToggleRestore.click();
    await expect(bsToggleRestore).toHaveText('ORDERABLE: YES');
  });

});
