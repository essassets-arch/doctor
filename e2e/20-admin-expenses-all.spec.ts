import { test, expect } from '@playwright/test';

test.describe('Module J: Admin Clinic Expenses & Operational Overhead Governance (/admin/expenses)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('01. Expenses page loads with 5 Governance KPIs, category spend strip, and action bar', async ({ page }) => {
    // 1. Verify Header
    await expect(page.locator('main h1').filter({ hasText: /Clinic Expense/i })).toBeVisible();
    await expect(page.getByText(/Financial ERP & Expense Audits/i)).toBeVisible();

    // 2. Verify 5 KPI cards
    await expect(page.getByText('Gross Patient Collections').first()).toBeVisible();
    await expect(page.getByText('Operational Overhead').first()).toBeVisible();
    await expect(page.getByText('Staff Payroll Liability').first()).toBeVisible();
    await expect(page.getByText('Net Clinic Operating Profit').first()).toBeVisible();
    await expect(page.getByText(/Input GST Credit/i).first()).toBeVisible();

    // 3. Verify Primary Action Buttons
    await expect(page.locator('[data-testid="record-expense-btn"]')).toBeVisible();
    await expect(page.getByText(/Export Ledger \(CSV\)/i)).toBeVisible();
    await expect(page.getByText(/Reload Standard Ledger/i)).toBeVisible();

    // 4. Verify Departmental Overhead Breakdown Strip
    await expect(page.getByText(/Departmental Overhead Breakdown/i)).toBeVisible();
    await expect(page.getByText('Rent & Lease').first()).toBeVisible();
    await expect(page.getByText('Medical Consumables').first()).toBeVisible();
    await expect(page.getByText('Pharmaceuticals & Stock').first()).toBeVisible();
    await expect(page.getByText('Diagnostic Reagents').first()).toBeVisible();

    // 5. Verify Table and initial records
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('REC-RENT-2609')).toBeVisible();
    await expect(page.getByText('Ellis Bridge Commercial Estates LLP')).toBeVisible();
    await expect(page.getByText('INV-ZYD-49102')).toBeVisible();
  });

  test('02. Department category chips filter the expenses table', async ({ page }) => {
    // Click "Bio-Medical Waste" chip in the category strip
    const bmwChip = page.locator('div').filter({ hasText: /Departmental Overhead Breakdown/i }).getByText('Bio-Medical Waste').first();
    await bmwChip.click();

    // Verify only Bio-Medical Waste records are displayed
    await expect(page.getByText('REC-BMW-4102')).toBeVisible();
    await expect(page.getByText('Envirocare Bio Waste Solutions')).toBeVisible();

    // Rent expense should not be visible under Bio-Medical Waste filter
    await expect(page.getByText('REC-RENT-2609')).not.toBeVisible();

    // Click "All Categories" chip to reset
    await page.getByText('All Categories').first().click();
    await expect(page.getByText('REC-RENT-2609')).toBeVisible();
  });

  test('03. Record New Expense Voucher modal logs expense and updates financial ledger', async ({ page }) => {
    // Click "+ Record Expense Voucher"
    await page.locator('[data-testid="record-expense-btn"]').click();

    // Verify modal opened
    await expect(page.getByText('Record Hospital Expense Voucher')).toBeVisible();
    await expect(page.getByText('Clinical Overhead Disbursement & Tax Audit Record')).toBeVisible();

    // Fill Form
    await page.locator('input[placeholder*="BD Vacutainer"]').fill('Emergency Defibrillator Battery Packs');
    await page.locator('select').filter({ hasText: /Medical Consumables/i }).first().selectOption('Maintenance & Facility');
    await page.locator('input[type="number"]').first().fill('7500');
    await page.locator('input[placeholder*="Becton Dickinson"]').fill('Philips Healthcare India');
    await page.locator('input[placeholder*="24AABCB"]').fill('24AAACP9912K1Z8');
    await page.locator('input[placeholder*="INV-SURG"]').fill('INV-PHIL-7721');

    // Submit Voucher
    await page.locator('button').filter({ hasText: /Commit & Disburse Voucher/i }).click();

    // Verify Toast Alert Banner
    await expect(page.getByText(/Emergency Defibrillator Battery Packs.*logged successfully/i)).toBeVisible();

    // Verify New Expense in the Table
    const newRow = page.locator('tr').filter({ hasText: 'INV-PHIL-7721' });
    await expect(newRow).toBeVisible();
    await expect(newRow.getByText('Emergency Defibrillator Battery Packs')).toBeVisible();
    await expect(newRow.getByText('Philips Healthcare India')).toBeVisible();
  });

  test('04. Official Disbursement Voucher modal displays printable preview with Indian numbering words', async ({ page }) => {
    // Click "Voucher" button on the first expense row (Rent expense)
    const voucherBtn = page.locator('[data-testid="view-voucher-btn-exp-1"]');
    await expect(voucherBtn).toBeVisible();
    await voucherBtn.click();

    // Verify Modal Header and Details scoped to the modal container
    const modal = page.locator('[data-testid="disbursement-voucher-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('REC-RENT-2609')).toBeVisible();
    await expect(modal.getByText('Ellis Bridge Commercial Estates LLP')).toBeVisible();

    // Verify Amount in Words
    await expect(modal.getByText(/Rupees Sixty Five Thousand Only/i)).toBeVisible();

    // Verify Signatures
    await expect(modal.getByText('Prepared By (Cashier)')).toBeVisible();
    await expect(modal.getByText('Verified By (Accounts Officer)')).toBeVisible();
    await expect(modal.getByText('APPROVED')).toBeVisible();

    // Close Modal
    await page.locator('[data-testid="close-voucher-modal-btn"]').click();
    await expect(modal).not.toBeVisible();
  });

  test('05. Status toggle switches voucher between Paid and Pending', async ({ page }) => {
    // Target status button on exp-2 (Bio-Medical Waste)
    const expRow = page.locator('[data-testid="expense-row-exp-2"]');
    const statusBtn = expRow.locator('button').filter({ hasText: /PAID|PENDING/i });

    await expect(statusBtn).toBeVisible();
    await statusBtn.click();

    // Verify status toast and badge change
    await expect(page.getByText(/status updated to/i)).toBeVisible();
  });

  test('06. Search and Payment Channel filter ledger rows dynamically', async ({ page }) => {
    // Search by vendor "Zydus"
    const searchInput = page.locator('input[placeholder*="Search voucher by title"]');
    await searchInput.fill('Zydus');

    // Only Zydus row should be shown
    await expect(page.getByText('Zydus Lifesciences Wholesale Depot')).toBeVisible();
    await expect(page.getByText('Ellis Bridge Commercial Estates LLP')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(page.getByText('Ellis Bridge Commercial Estates LLP')).toBeVisible();

    // Filter by Payment Channel "Cash Petty Cash Till"
    const paymentSelect = page.locator('select').filter({ hasText: /All Payment Channels/i });
    await paymentSelect.selectOption('CASH');

    // Only cash vouchers should be displayed (e.g. OT Linen Laundry)
    await expect(page.getByText('VCH-CSH-1049')).toBeVisible();
    await expect(page.getByText('REC-RENT-2609')).not.toBeVisible();
  });

  test('07. Viewport responsiveness across Mobile, Tablet, and Desktop', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 800, name: 'Desktop' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Verify no horizontal page blowout
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(hasOverflow).toBeFalsy();

      // Main header and at least one KPI should be visible
      await expect(page.locator('main h1').filter({ hasText: /Clinic Expense/i })).toBeVisible();
      await expect(page.getByText('Gross Patient Collections').first()).toBeVisible();
    }
  });

});
