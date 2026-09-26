import { test, expect } from '@playwright/test';

test.describe('Module A: Receptionist & Front Desk Workflow', () => {

  test('01. Reception Dashboard loads with shift counters and queue', async ({ page }) => {
    await page.goto('/reception/dashboard');
    await expect(page).toHaveTitle(/MedFlow/i);
    
    // Check main branding
    await expect(page.locator('.medflow-logo-text')).toContainText('MEDFLOW');

    // Verify key metrics exist
    await expect(page.getByText('Total Today')).toBeVisible();
    await expect(page.getByText('Waiting').first()).toBeVisible();
    await expect(page.getByText('In Session').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();

    // Verify queue entries table
    await expect(page.locator('table')).toBeVisible();
  });

  test('02. Patient Search Directory displays patient roster', async ({ page }) => {
    await page.goto('/reception/search');
    await expect(page.locator('h1').filter({ hasText: /Patient Directory/i })).toBeVisible();
    
    // Search input should be present and functional
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Mahesh');
    
    // Mahesh Kumar should be visible
    await expect(page.getByText(/Mahesh/i).first()).toBeVisible();
  });

  test('03. Walk-in Check-In loads doctor assignment and visit types', async ({ page }) => {
    await page.goto('/reception/checkin');
    await expect(page.locator('h1').filter({ hasText: /Walk-In Management/i })).toBeVisible();

    // Verify doctor selection dropdown or buttons
    await expect(page.getByText(/Dr\. Raj Valaki/i).first()).toBeVisible();
  });

  test('04. OPD Queue Control Center displays active tokens and status badges', async ({ page }) => {
    await page.goto('/reception/queue');
    await expect(page.locator('h1').filter({ hasText: /OPD Queue Control/i })).toBeVisible();

    // Verify table
    await expect(page.locator('table')).toBeVisible();
  });

  test('05. Appointment Booking Wizard displays slots', async ({ page }) => {
    await page.goto('/reception/appointments');
    await expect(page.locator('h1').filter({ hasText: /Appointment/i })).toBeVisible();
  });

  test('06. Patient Hub 6-Tab Workspace displays all tabs', async ({ page }) => {
    // Open pat-2 (Anita Sharma) who is waiting and not locked
    await page.goto('/reception/patients/pat-2');
    await expect(page.getByText(/Anita Sharma/i).first()).toBeVisible();

    // Verify tabs via .tab-item selector
    await expect(page.locator('.tab-item').filter({ hasText: /Profile & Demographics/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Clinical Data/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Timeline/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Documents/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Consent/i })).toBeVisible();
    await expect(page.locator('.tab-item').filter({ hasText: /Billing/i })).toBeVisible();
  });

  test('07. Billing Settlement and History load financial records', async ({ page }) => {
    await page.goto('/reception/billing');
    await expect(page.locator('h1').filter({ hasText: /OPD Billing/i })).toBeVisible();

    await page.goto('/reception/billing/history');
    await expect(page.locator('h1').filter({ hasText: /Billing History/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('08. Public Waiting TV Screen renders queue', async ({ page }) => {
    await page.goto('/waiting-screen');
    await expect(page.getByText(/MEDFLOW/i).first()).toBeVisible();
    await expect(page.getByText(/OPD BOARD ACTIVE/i)).toBeVisible();
  });

  test('09. Reschedule Appointment resolves queue entry ID (q-8 for Deepak Trivedi)', async ({ page }) => {
    // Navigate to reschedule page with queue ID q-8
    await page.goto('/reception/appointments/reschedule/q-8');

    // Should NOT show "Appointment Record Not Found"
    await expect(page.getByText(/Appointment Record Not Found/i)).not.toBeVisible();

    // Verify page title and Deepak Trivedi's booking details
    await expect(page.getByText(/Reschedule Patient Appointment/i)).toBeVisible();
    await expect(page.getByText(/Deepak Trivedi/i)).toBeVisible();
    await expect(page.getByText(/Dr\. Suresh Kumar/i).first()).toBeVisible();
    await expect(page.getByText(/Procedure/i).first()).toBeVisible();

    // Select slot and submit reschedule
    const confirmBtn = page.getByRole('button', { name: /Confirm & Notify Patient/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify success banner and notification
    await expect(page.getByText(/successfully shifted/i)).toBeVisible();
  });

  test('10. Reschedule Appointment resolves direct appointment ID (apt-4 for Rekha Patel)', async ({ page }) => {
    await page.goto('/reception/appointments/reschedule/apt-4');
    await expect(page.getByText(/Appointment Record Not Found/i)).not.toBeVisible();
    await expect(page.getByText(/Rekha Patel/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirm & Notify Patient/i })).toBeVisible();
  });

  test('11. Reschedule Appointment displays friendly not found screen for invalid ID', async ({ page }) => {
    await page.goto('/reception/appointments/reschedule/non-existent-999');
    await expect(page.getByText(/Appointment Record Not Found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Appointments/i })).toBeVisible();
  });

  test('12. Reception Dashboard All tab displays total queue and filters correctly', async ({ page }) => {
    await page.goto('/reception/dashboard');
    await page.waitForSelector('text=OPD Dashboard');

    // All chip should be present and active by default
    const allChip = page.locator('button.chip').filter({ hasText: /^All \(/ });
    await expect(allChip).toBeVisible();
    await expect(allChip).toHaveClass(/active/);

    // Waiting chip should be visible
    const waitingChip = page.locator('button.chip').filter({ hasText: /^Waiting \(/ });
    await expect(waitingChip).toBeVisible();

    // Click Waiting chip -> All chip should deactivate, Waiting should be active
    await waitingChip.click();
    await expect(waitingChip).toHaveClass(/active/);
    await expect(allChip).not.toHaveClass(/active/);

    // Click All chip -> All should be active again, Waiting should deactivate
    await allChip.click();
    await expect(allChip).toHaveClass(/active/);
    await expect(waitingChip).not.toHaveClass(/active/);
  });

  test('13. Reception Billing full list renders with status tabs and modal details', async ({ page }) => {
    await page.goto('/reception/billing');
    await page.waitForSelector('text=OPD Billing & Encounter Settlement');

    // Verify main table is visible
    await expect(page.getByText('Billing Records & Collections Ledger')).toBeVisible();

    // Verify filter buttons: All, Pending, Settled, Complete
    const allTab = page.locator('button.chip').filter({ hasText: /^All \(/ });
    const pendingTab = page.locator('button.chip').filter({ hasText: /^Pending \(/ });
    const settledTab = page.locator('button.chip').filter({ hasText: /^Settled \(/ });
    const completeTab = page.locator('button.chip').filter({ hasText: /^Complete \(/ });

    await expect(allTab).toBeVisible();
    await expect(pendingTab).toBeVisible();
    await expect(settledTab).toBeVisible();
    await expect(completeTab).toBeVisible();

    // Click Pending tab
    await pendingTab.click();
    await expect(pendingTab).toHaveClass(/active/);

    // Click Open Details on the first row
    const openDetailsBtn = page.locator('button').filter({ hasText: /Open Details →/i }).first();
    await expect(openDetailsBtn).toBeVisible();
    await openDetailsBtn.click();

    // Modal should appear with patient name, clinical sections, and itemized service charges
    await expect(page.getByText(/Rahul Sharma · MRD-2026-0006/i)).toBeVisible();
    await expect(page.getByText(/Attending Consultant & Clinical Assessment/i)).toBeVisible();
    await expect(page.getByText(/Laboratory Diagnostics & Ordered Investigations/i)).toBeVisible();
    await expect(page.getByText(/Clinical Procedures & Consumables/i)).toBeVisible();
    await expect(page.getByText(/Prescriptions & Pharmacy Dispensing/i)).toBeVisible();
    await expect(page.getByText(/Itemized Service Charges/i)).toBeVisible();
    await expect(page.getByText(/Payment ledger/i)).toBeVisible();

    // Test tab filtering inside the Details modal
    const labsTab = page.locator('.modal-overlay button.chip').filter({ hasText: /Lab Diagnostics/i });
    await expect(labsTab).toBeVisible();
    await labsTab.click();
    await expect(page.getByText(/Laboratory Diagnostics & Ordered Investigations/i)).toBeVisible();
    await expect(page.getByText(/Attending Consultant & Clinical Assessment/i)).not.toBeVisible();

    const proceduresTab = page.locator('.modal-overlay button.chip').filter({ hasText: /Procedures & Consumables/i });
    await expect(proceduresTab).toBeVisible();
    await proceduresTab.click();
    await expect(page.getByText(/Clinical Procedures & Consumables/i)).toBeVisible();
    await expect(page.getByText(/Laboratory Diagnostics & Ordered Investigations/i)).not.toBeVisible();

    const rxTab = page.locator('.modal-overlay button.chip').filter({ hasText: /Prescriptions & Pharmacy/i });
    await expect(rxTab).toBeVisible();
    await rxTab.click();
    await expect(page.getByText(/Prescriptions & Pharmacy Dispensing/i)).toBeVisible();
    await expect(page.getByText(/Clinical Procedures & Consumables/i)).not.toBeVisible();

    // Return to All tab
    const allInfoTab = page.locator('.modal-overlay button.chip').filter({ hasText: /All Information/i });
    await expect(allInfoTab).toBeVisible();
    await allInfoTab.click();
    await expect(page.getByText(/Attending Consultant & Clinical Assessment/i)).toBeVisible();
    await expect(page.getByText(/Itemized Service Charges/i)).toBeVisible();

    // Close the modal
    const closeBtn = page.locator('.modal-overlay button').filter({ hasText: /Close/i }).first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Modal should disappear
    await expect(page.getByText(/Itemized Service Charges/i)).not.toBeVisible();
  });

  test('14. Reception Billing direct Settle Bill button opens QR modal and completes payment', async ({ page }) => {
    await page.goto('/reception/billing');
    await page.waitForSelector('text=OPD Billing & Encounter Settlement');

    // Find and click the direct Settle Bill button
    const directSettleBtn = page.locator('button').filter({ hasText: /Settle Bill/i }).first();
    await expect(directSettleBtn).toBeVisible();
    await directSettleBtn.click();

    // Verify Settle Modal appears with QR code and payment methods
    await expect(page.getByText('Instant Bill Settlement & Cashier Desk')).toBeVisible();
    await expect(page.getByText(/Scan UPI QR Code to Pay/i)).toBeVisible();
    await expect(page.getByText('medflow@upi')).toBeVisible();
    await expect(page.getByText('UPI / QR')).toBeVisible();
    await expect(page.getByText('Cash', { exact: true })).toBeVisible();
    await expect(page.getByText('Card / POS')).toBeVisible();
    await expect(page.getByText('Bank / NEFT')).toBeVisible();

    // Click Cash tab to test mode change
    await page.getByText('Cash', { exact: true }).click();
    await expect(page.getByText('Cash Tendered by Patient (₹):')).toBeVisible();

    // Switch back to UPI
    await page.getByText('UPI / QR', { exact: true }).click();
    await expect(page.getByText(/Scan UPI QR Code to Pay/i)).toBeVisible();

    // Complete payment
    const confirmPaymentBtn = page.locator('button').filter({ hasText: /Confirm & Complete Payment/i });
    await expect(confirmPaymentBtn).toBeVisible();
    await confirmPaymentBtn.click();

    // Verify success confirmation screen
    await expect(page.getByText('Payment Settled Successfully!')).toBeVisible();
    await expect(page.getByText(/Print Tax Invoice/i)).toBeVisible();

    // Close modal
    const closeReturnBtn = page.locator('button').filter({ hasText: /Close & Return to List/i });
    await expect(closeReturnBtn).toBeVisible();
    await closeReturnBtn.click();

    // Modal closes
    await expect(page.getByText('Payment Settled Successfully!')).not.toBeVisible();
  });

});
