import { test, expect } from '@playwright/test';

test.describe('Drug & Procedure Architecture - Single Source of Truth (/admin/drugs & /admin/procedures -> Doctor Consultation)', () => {

  test('01. /admin/drugs loads drug master with active toggles and registers new drug with brand and default Rx', async ({ page }) => {
    await page.goto('/admin/drugs');
    await page.waitForLoadState('networkidle');

    // Header validation
    await expect(page.locator('h1').filter({ hasText: /Central Drug Master & Formulary/i })).toBeVisible();

    // Verify existing drugs from master
    await expect(page.getByText(/Flucocip/i).first()).toBeVisible();
    await expect(page.getByText('Amoxicillin 500mg').first()).toBeVisible();

    // Open Add Drug Modal
    const addDrugBtn = page.getByRole('button', { name: /Register Formulary Drug/i });
    await expect(addDrugBtn).toBeVisible();
    await addDrugBtn.click();

    await expect(page.getByText(/Register New Formulary Medicine/i)).toBeVisible();

    // Fill in new drug details
    await page.locator('input[placeholder*="TAB Flucocip 400mg"]').fill('Doxycycline 100mg');
    await page.locator('input[placeholder*="Cipla pvt"]').fill('Doxy-Doc 100');
    await page.locator('input[placeholder*="ABC 500mg"]').fill('Doxycycline Hyclate 100mg');
    await page.locator('input[placeholder="1 Tablet"]').fill('1 cap');
    await page.locator('input[placeholder="1-0-1"]').fill('1-0-1');
    await page.locator('input[placeholder="5 day"]').fill('7 day');
    await page.locator('input[placeholder="5"]').fill('14');
    await page.locator('input[placeholder*="After food"]').fill('Take with large glass of water');

    // Submit modal
    await page.getByRole('button', { name: /Save to Formulary/i }).click();

    // Verify Doxycycline appears in admin drugs list
    await expect(page.getByText('Doxycycline 100mg').first()).toBeVisible();
    await expect(page.getByText('Doxy-Doc 100').first()).toBeVisible();
  });

  test('02. Doctor Consultation uses /admin/drugs as single source of truth for prescriptions', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Click Tab 3: Rx Pharmacy
    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await expect(rxTab).toBeVisible();
    await rxTab.click();

    // Verify required header elements
    await expect(page.getByText(/Drug & Medication Prescription/i)).toBeVisible();
    await expect(page.getByText(/Active Prescription Items/i)).toBeVisible();
    await expect(page.getByText(/AI Drug Safety Verified/i).first()).toBeVisible();

    // Verify table columns exist: No., Drug, Combination, Brand, Dose, Frequency, Days, Total, Note, Price
    const rxTable = page.locator('.rx-table-scroll table').first();
    await expect(rxTable.locator('th').filter({ hasText: /^No\.?$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Drug$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Combination$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Brand$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Dose$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Frequency$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Days$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Total$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Note$/i })).toBeVisible();
    await expect(rxTable.locator('th').filter({ hasText: /^Price$/i })).toBeVisible();

    // Test + Add Row button opens Searchable Drug Selector modal from /admin/drugs
    const addRowBtn = page.getByRole('button', { name: /Add Row/i }).first();
    await expect(addRowBtn).toBeVisible();
    await addRowBtn.click();

    // Verify Modal Header shows single source of truth info
    await expect(page.getByText(/Select Drug from Admin Drug Catalog/i)).toBeVisible();
    await expect(page.getByText(/\/admin\/drugs/i)).toBeVisible();

    // Search for Amoxicillin from master
    const modalSearchInput = page.getByPlaceholder(/Search drug name, combination/i);
    await expect(modalSearchInput).toBeVisible();
    await modalSearchInput.fill('Amoxicillin');

    // Click Select & Prescribe
    const selectAmoxBtn = page.locator('div').filter({ hasText: 'Amoxicillin 500mg' }).getByRole('button', { name: /Select & Prescribe/i }).first();
    await selectAmoxBtn.click();

    // Modal closes and prescription row is populated with master data
    await expect(page.getByText(/Select Drug from Admin Drug Catalog/i)).toHaveCount(0);

    // Verify Amoxicillin row is populated in prescription table with Master ID badge
    await expect(page.locator('input[value*="Amoxicillin 500mg"]').first()).toBeVisible();
    await expect(page.getByText(/Master ID: d-/i).first()).toBeVisible();
  });

  test('03. Layout toggle between Stacked and Side-by-Side retains prescription data', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    // Click Side-by-Side button
    const sideBySideBtn = page.getByRole('button', { name: /Side-by-Side/i });
    await expect(sideBySideBtn).toBeVisible();
    await sideBySideBtn.click();

    // Verify table remains visible with columns and items
    await expect(page.locator('.rx-table-scroll table').first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /^Drug$/i })).toBeVisible();

    // Click Stacked button
    const stackedBtn = page.getByRole('button', { name: /Stacked/i });
    await expect(stackedBtn).toBeVisible();
    await stackedBtn.click();

    // Verify table remains intact
    await expect(page.locator('.rx-table-scroll table').first()).toBeVisible();
  });

  test('04. Procedure Supplies (Clinical Instruments) uses /admin/procedures -> 4. Procedures (3) as exact master list', async ({ page }) => {
    // Step A: Verify /admin/procedures tabs structure
    await page.goto('/admin/procedures');
    await page.waitForLoadState('networkidle');

    // Verify 4 tabs exist
    await expect(page.locator('#admin-proc-tab-overview')).toBeVisible();
    await expect(page.locator('#admin-proc-tab-consumables')).toBeVisible();
    await expect(page.locator('#admin-proc-tab-prerequisites')).toBeVisible();
    const procMasterTab = page.locator('#admin-proc-tab-procedures');
    await expect(procMasterTab).toBeVisible();

    // Verify Tab 4 has dynamic count and DOCTOR MASTER badge
    await expect(procMasterTab).toContainText(/4\. Procedures \(3\)/i);
    await expect(procMasterTab).toContainText(/SOURCE FOR DOCTOR/i);

    // Click Tab 4
    await procMasterTab.click();
    await expect(page.getByText(/Exact Master Source for Doctor Consultation/i)).toBeVisible();

    // Step B: Navigate to Doctor Consultation
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    // Verify Procedure Supplies Section Header
    await expect(page.getByText(/Procedure Supplies \(Clinical Instruments\)/i)).toBeVisible();
    await expect(page.getByText(/Optional · 3 Added/i)).toBeVisible();

    // Switch to Sub-Tab 2: Procedure Supplies
    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // Verify + Add and Hide Section buttons
    const procAddBtn = page.locator('#proc-header-add-btn');
    await expect(procAddBtn).toBeVisible();
    await expect(page.getByRole('button', { name: /Hide Section/i })).toBeVisible();

    // Click + Add in Procedure Supplies
    await procAddBtn.click();

    // Search Procedure Modal opens referencing /admin/procedures -> 4. Procedures
    await expect(page.getByText(/Search Procedure/i).first()).toBeVisible();
    await expect(page.getByText(/\/admin\/procedures/i).first()).toBeVisible();

    // Select Chemical Peel
    const peelItem = page.locator('div').filter({ hasText: 'Chemical Peel (Glycolic 35%)' }).last();
    await peelItem.click();

    // Verify added to Procedure Items table with Master ID
    await expect(page.locator('input[value*="Chemical Peel"]').first()).toBeVisible();

    // Verify Hide / Show section toggle
    const hideBtn = page.getByRole('button', { name: /Hide Section/i });
    await hideBtn.click();

    // Section collapses
    const openBtn = page.getByRole('button', { name: /Open Procedure Prescription/i });
    await expect(openBtn).toBeVisible();

    // Reopen section
    await openBtn.click({ force: true });
    await expect(page.locator('#procedure-prescription-section')).toBeVisible();
  });

  test('05. Admin dynamic activation updates /admin/procedures -> 4. Procedures tab count and doctor selector', async ({ page }) => {
    // Step A: Go to /admin/procedures and activate Ear Syringing (proc-4)
    await page.goto('/admin/procedures');
    await page.waitForLoadState('networkidle');

    // Click Tab 4
    await page.locator('#admin-proc-tab-procedures').click();

    // Find the inactive toggle on Ear Syringing and click to activate it
    const earSyringingRow = page.locator('tr').filter({ hasText: 'Ear Syringing & Cerumen Removal' });
    const earToggle = earSyringingRow.locator('button').filter({ hasText: /^INACTIVE$/i });
    if (await earToggle.count() > 0) {
      await earToggle.click();
      await expect(earSyringingRow.locator('button').filter({ hasText: /^ACTIVE$/i })).toBeVisible();
    }

    // Verify Tab 4 count dynamically updated from (3) to (4)
    await expect(page.locator('#admin-proc-tab-procedures')).toContainText(/4\. Procedures \(4\)/i);

    // Step B: Open Doctor Consultation and verify Ear Syringing is now available in + Add selector
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // Open procedure selector modal
    const procAddBtn = page.locator('#proc-header-add-btn');
    await procAddBtn.click();

    // Ear Syringing should now be present in active selector
    await expect(page.locator('div').filter({ hasText: 'Ear Syringing & Cerumen Removal' }).last()).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel|Close/i }).last().click();

    // Step C: Verify existing saved consultation procedure rows remain intact across reloads
    await expect(page.locator('#procedure-prescription-section table tbody tr').first()).toBeVisible();
    await page.reload();
    await page.waitForLoadState('networkidle');

    const rxTabReload = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTabReload.click();
    const procSubTabReload = page.locator('#rx-subtab-procedures');
    if (await procSubTabReload.isVisible()) {
      await procSubTabReload.click();
    }
    await expect(page.locator('#procedure-prescription-section table tbody tr').first()).toBeVisible();
  });

  test('06. Procedure Prescription allows selecting drugs from Central Drug Formulary (/admin/drugs) into Procedure Supplies', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // Open procedure catalog selector modal
    const procAddBtn = page.locator('#proc-header-add-btn');
    await procAddBtn.click();

    // Switch to Central Drug Formulary tab in modal
    const drugTabBtn = page.locator('button').filter({ hasText: /Central Drug Formulary/i }).first();
    await expect(drugTabBtn).toBeVisible();
    await drugTabBtn.click();

    // Select Paracetamol or Amoxicillin from formulary
    const drugItem = page.locator('div').filter({ hasText: 'Paracetamol 650mg' }).last();
    await drugItem.click();

    // Verify added to Procedure Items table with Central Drug Formulary badge
    const procTable = page.locator('#procedure-prescription-section table');
    await expect(procTable).toBeVisible();
    await expect(procTable.locator('input[value*="Paracetamol"]').first()).toBeVisible();
    await expect(procTable.getByText(/Central Drug Formulary/i).first()).toBeVisible();
  });

  test('07. Custom item entry allows Source: CUSTOM and does NOT create records in /admin/procedures or /admin/drugs', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // Type custom item name into the inline tool
    const customItemInput = page.locator('#proc-input-name');
    await customItemInput.fill('Sterile Hemostatic Sponge');

    // Click "+ Use Custom Item" option from dropdown
    const customOption = page.locator('div').filter({ hasText: /\+ Use Custom Item "Sterile Hemostatic Sponge"/i }).first();
    await customOption.click();

    // Adjust Quantity and ID / CORD
    await page.locator('#proc-input-qty').fill('2');
    await page.locator('#proc-input-idcode').fill('CORD-HEMO-01');

    // Click + Add Instrument
    await page.locator('#proc-form-add-btn').click();

    // Verify item is added with Source: CUSTOM badge
    const procTable = page.locator('#procedure-prescription-section table');
    await expect(procTable.locator('input[value="Sterile Hemostatic Sponge"]')).toBeVisible();
    await expect(procTable.getByText(/Source: CUSTOM/i).first()).toBeVisible();
    await expect(procTable.locator('input[value="CORD-HEMO-01"]')).toBeVisible();

    // Step B: Verify /admin/procedures does NOT contain "Sterile Hemostatic Sponge"
    await page.goto('/admin/procedures');
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-proc-tab-procedures').click();
    await expect(page.getByText('Sterile Hemostatic Sponge')).toHaveCount(0);

    // Step C: Verify /admin/drugs does NOT contain "Sterile Hemostatic Sponge"
    await page.goto('/admin/drugs');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Sterile Hemostatic Sponge')).toHaveCount(0);
  });

  test('08. Final Prescription Slip only includes items where Print on Rx = ✓', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // In Procedure Supplies table, toggle the first item's print status to "✕ Do Not Print"
    const firstRow = page.locator('#procedure-prescription-section table tbody tr').first();
    const firstItemName = await firstRow.locator('input.form-input').first().inputValue();
    const firstPrintBtn = firstRow.getByRole('button', { name: /✓ Print on Rx/i });

    if (await firstPrintBtn.isVisible()) {
      await firstPrintBtn.click();
      await expect(firstRow.getByRole('button', { name: /✕ Do Not Print/i })).toBeVisible();
    }

    // Verify second item remains "✓ Print on Rx"
    const secondRow = page.locator('#procedure-prescription-section table tbody tr').nth(1);
    const secondItemName = await secondRow.locator('input.form-input').first().inputValue();
    await expect(secondRow.getByRole('button', { name: /✓ Print on Rx/i })).toBeVisible();

    // Click "Preview Prescription Slip"
    const previewBtn = page.getByRole('button', { name: /Preview Prescription Slip/i });
    await previewBtn.click();

    // Official Prescription Print Modal is visible
    const modal = page.locator('.modal-body');
    await expect(modal).toBeVisible();

    // Verify Procedure Consumables section in printable slip contains the item with Print on Rx = ✓
    await expect(modal.getByText(/Procedure Consumables & Supplies Prescription/i)).toBeVisible();
    await expect(modal.getByText(secondItemName).first()).toBeVisible();

    // Verify the item with ✕ Do Not Print is NOT listed in the printable slip
    const procSectionText = await modal.locator('table').last().innerText();
    expect(procSectionText).not.toContain(firstItemName);

    // Close preview modal
    await page.locator('.modal-header button').last().click();
  });

  test('09. Removing an item from Doctor Consultation does not delete the master record in /admin/procedures', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();

    const procSubTab = page.locator('#rx-subtab-procedures');
    if (await procSubTab.isVisible()) {
      await procSubTab.click();
    }

    // Find Chemical Peel row in Doctor Consultation procedure table
    const chemPeelRow = page.locator('#procedure-prescription-section table tbody tr').filter({ has: page.locator('input[value*="Chemical Peel"]') }).first();
    await expect(chemPeelRow).toBeVisible();

    // Click the delete icon button 🗑 (Remove item)
    const deleteBtn = chemPeelRow.locator('button[title*="Remove item"]');
    await deleteBtn.click();

    // Verify Chemical Peel is removed from consultation table
    await expect(page.locator('#procedure-prescription-section table tbody tr').filter({ has: page.locator('input[value*="Chemical Peel"]') })).toHaveCount(0);

    // Navigate to /admin/procedures and verify Chemical Peel is still in master catalog
    await page.goto('/admin/procedures');
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-proc-tab-procedures').click();
    await expect(page.getByText('Chemical Peel (Glycolic 35%)').first()).toBeVisible();
  });

  test('10. Unified Clinical Masters mapping across all 4 modules', async ({ page }) => {
    // 1. Procedure Master -> Doctor Procedure Prescription
    await page.goto('/admin/procedures');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#admin-proc-tab-procedures')).toContainText(/4\. Procedures/i);

    // 2. Central Drug Formulary -> Doctor Drug & Medication Prescription
    await page.goto('/admin/drugs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: /Central Drug Master & Formulary/i })).toBeVisible();

    // 3. Diagnostic Lab Masters -> Doctor Lab Order
    await page.goto('/admin/lab');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Hospital Diagnostic Catalog/i })).toBeVisible();

    // 4. Legal Consent Templates -> Doctor Consent
    await page.goto('/admin/consent-forms');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Legal Informed Consent Form Templates/i).first()).toBeVisible();

    // Doctor Consultation links to all four
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Tab 2: Lab Orders (Diagnostic Lab Master source)
    const labTab = page.locator('button.tab-item').filter({ hasText: /Lab Orders/i }).first();
    await labTab.click();
    await expect(page.getByText(/SINGLE SOURCE OF TRUTH/i).first()).toBeVisible();

    // Tab 3: Rx Pharmacy (Drug Formulary & Procedure Master source)
    const rxTab = page.locator('button.tab-item').filter({ hasText: /Rx Pharmacy/i }).first();
    await rxTab.click();
    await expect(page.getByText(/Drug & Medication Prescription/i)).toBeVisible();
    await expect(page.getByText(/Procedure Supplies \(Clinical Instruments\)/i)).toBeVisible();

    // Tab 4: Procedures & Consent (Legal Consent Templates source)
    const procTab = page.locator('button.tab-item').filter({ hasText: /Procedures/i }).first();
    await procTab.click();
    await expect(page.getByText(/Master Source: \/admin\/consent-forms/i).first()).toBeVisible();
  });

});

