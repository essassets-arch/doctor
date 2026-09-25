import { test, expect } from '@playwright/test';

test.describe('Doctor Follow-Up Scheduling & Outbound Recall Operations', () => {

  test('01. Consultation C006-001-190926 has Section 4 Follow-Up Scheduling & Outbound Recall Instructions with live sync', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Switch to Tab 6: Diagnosis & Recall
    const diagTab = page.locator('.tab-item').filter({ hasText: /Diagnosis & Recall/i });
    await expect(diagTab).toBeVisible();
    await diagTab.click();

    // Verify Section 4 Header & Subtitle
    await expect(page.getByText('Follow-Up Scheduling & Outbound Recall Instructions')).toBeVisible();
    await expect(page.getByText('Set follow-up interval, return date, and clinical recall reason')).toBeVisible();

    // Verify Interval Preset Pills
    await expect(page.locator('#btn-fu-interval-3')).toBeVisible();
    await expect(page.locator('#btn-fu-interval-7')).toBeVisible();
    await expect(page.locator('#btn-fu-interval-14')).toBeVisible();
    await expect(page.locator('#btn-fu-interval-21')).toBeVisible();
    await expect(page.locator('#btn-fu-interval-30')).toBeVisible();
    await expect(page.locator('#btn-fu-interval-custom')).toBeVisible();

    // Click 14 Days preset
    await page.locator('#btn-fu-interval-14').click();

    // Check return date input is populated
    const returnDateInput = page.locator('#input-fu-return-date');
    await expect(returnDateInput).toBeVisible();
    const returnDateVal = await returnDateInput.inputValue();
    expect(returnDateVal).toMatch(/\d{2}\/\d{2}\/\d{4}/);

    // Purpose of Follow-Up input
    const purposeInput = page.locator('#input-fu-purpose');
    await expect(purposeInput).toBeVisible();
    await purposeInput.fill('Assess clinical clearance of fungal lesions');

    // Nursing Outbound Call Instructions input
    const nursingInput = page.locator('#input-fu-nursing-instructions');
    await expect(nursingInput).toBeVisible();
    await nursingInput.fill('Call patient at day 5 to verify compliance and monitor skin lesion clearance');

    // Verify SHOW on Rx button
    const rxToggle = page.locator('#btn-toggle-show-on-rx');
    await expect(rxToggle).toBeVisible();
    await expect(rxToggle).toContainText(/SHOW on Rx/i);

    // Toggle to HIDE
    await rxToggle.click();
    await expect(rxToggle).toContainText(/HIDE/i);

    // Toggle back to SHOW on Rx
    await rxToggle.click();
    await expect(rxToggle).toContainText(/SHOW on Rx/i);

    // Save to Clinical Record
    const saveBtn = page.getByRole('button', { name: /Save to Clinical Record/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
  });

  test('02. Outbound Follow-Up Call List displays nursing instructions and supports all operations', async ({ page }) => {
    await page.goto('/doctor/followup-call-list');
    await page.waitForLoadState('networkidle');

    // Verify Header
    await expect(page.locator('h1').filter({ hasText: /Patient Follow-Up Call List/i })).toBeVisible();

    // Verify Tab buttons
    await expect(page.locator('#tab-all')).toBeVisible();
    await expect(page.locator('#tab-today')).toBeVisible();

    // Verify table has records
    await page.locator('#tab-all').click();
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();

    // Verify Nursing Outbound Call Instructions is rendered in the ledger
    await expect(page.getByText(/Nursing Outbound Call Instructions/i).first()).toBeVisible();

    // Search for Amit Shah or fungal clearance
    const searchInput = page.locator('#input-followup-search');
    await searchInput.fill('Amit Shah');
    await expect(page.getByText('Amit Shah').first()).toBeVisible();
    await expect(page.getByText('MRD-2026-0004').first()).toBeVisible();
    await expect(page.getByText(/clinical clearance/i).first()).toBeVisible();

    // Clear search
    await searchInput.fill('');

    // Open Call Log Drawer for first task
    const logCallBtn = page.locator('button[id^="btn-log-call-"]').first();
    await logCallBtn.click();

    // Verify Drawer opens
    await expect(page.getByText(/Log Outbound Care Call/i)).toBeVisible();
    // Verify Nursing directives are shown inside the drawer
    await expect(page.getByText(/Doctor's Nursing Outbound Directives/i)).toBeVisible();

    // Select ANSWERED outcome
    await page.locator('#btn-call-outcome-answered').click();

    // Add note
    const notesTextarea = page.locator('#textarea-call-notes');
    await notesTextarea.fill('Patient confirmed 100% medication compliance. Fungal lesions clearing up well.');

    // Save call entry
    await page.locator('#btn-save-call-entry').click();

    // Verify notification toast or drawer closes
    await expect(page.getByText(/Log Outbound Care Call/i)).not.toBeVisible();

    // Test Reschedule operation
    const rescheduleBtn = page.locator('button[id^="btn-reschedule-"]').first();
    await rescheduleBtn.click();
    await expect(page.getByText(/Reschedule Follow-Up Return Date/i)).toBeVisible();
    await page.locator('#btn-confirm-reschedule').click();
    await expect(page.getByText(/Reschedule Follow-Up Return Date/i)).not.toBeVisible();

    // Test Quick Complete
    const completeBtn = page.locator('button[id^="btn-quick-complete-"]').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await expect(page.getByText(/COMPLETED/i).first()).toBeVisible();
    }
  });

  test('03. Prescription preview reflects follow-up visibility', async ({ page }) => {
    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Switch to Tab 7: Finalize & Sign
    const finalTab = page.locator('.tab-item').filter({ hasText: /Finalize & Sign/i });
    await expect(finalTab).toBeVisible();
    await finalTab.click();

    // Verify Return Recall is shown in summary
    await expect(page.getByText(/Return Recall:/i)).toBeVisible();
  });
});
