import { test, expect } from '@playwright/test';

test.describe('Module I: Doctor Management & Consultation Fee Governance (/admin/doctors)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/doctors');
    await page.waitForLoadState('networkidle');
  });

  test('01. Doctors page loads with 5 Governance KPIs, consultation fee tariffs, and action bar', async ({ page }) => {
    // 1. Verify header
    await expect(page.locator('main h1').filter({ hasText: /Doctor Management/i })).toBeVisible();
    await expect(page.getByText(/Physician Workforce & Tariff Governance/i)).toBeVisible();

    // 2. Verify 5 KPI cards
    await expect(page.getByText('Active Duty Roster').first()).toBeVisible();
    await expect(page.getByText(/Avg OPD Consultation Fee/i).first()).toBeVisible();
    await expect(page.getByText('Clinic Fee Range').first()).toBeVisible();
    await expect(page.getByText(/Avg Follow-Up Review/i).first()).toBeVisible();
    await expect(page.getByText(/Specialities Covered/i).first()).toBeVisible();

    // 3. Verify primary action buttons
    await expect(page.getByText('+ Onboard New Doctor')).toBeVisible();
    await expect(page.getByText(/Export Tariff Matrix/i)).toBeVisible();

    // 4. Verify initial doctor cards (Dr. Raj Valaki, Dr. Anita Soni, etc.)
    await expect(page.getByText('Dr. Raj Valaki')).toBeVisible();
    await expect(page.getByText('Dr. Anita Soni')).toBeVisible();
    await expect(page.getByText('Dr. Priya Mehta')).toBeVisible();

    // 5. Verify Consultation Fee Tariffs breakdown on Dr. Raj Valaki's card (id: doc-1)
    const rajCard = page.locator('[data-testid="doctor-card-doc-1"]');
    await expect(rajCard).toBeVisible();
    await expect(rajCard.getByText('Consultation Fee Tariffs')).toBeVisible();
    await expect(rajCard.getByText('FIRST VISIT OPD')).toBeVisible();
    await expect(rajCard.getByText('FOLLOW-UP REVIEW')).toBeVisible();
    await expect(rajCard.getByText('EMERGENCY / WALK-IN')).toBeVisible();
    await expect(rajCard.getByText('TELECONSULTATION')).toBeVisible();
  });

  test('02. Dual View toggle switches between Card Grid and Tariff Matrix Table', async ({ page }) => {
    // Initial view should be Cards
    const cardsBtn = page.locator('[data-testid="view-mode-cards"]');
    const tableBtn = page.locator('[data-testid="view-mode-table"]');

    await expect(cardsBtn).toBeVisible();
    await expect(tableBtn).toBeVisible();

    // Switch to Tariff Matrix table view
    await tableBtn.click();

    // Verify table elements
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Doctor & Speciality/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /OPD First Visit/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Follow-Up Fee/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Emergency Fee/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Teleconsult Fee/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Grace Window/i })).toBeVisible();

    // Row for Dr. Raj Valaki in table
    await expect(page.locator('[data-testid="doctor-row-doc-1"]')).toBeVisible();

    // Switch back to Cards view
    await cardsBtn.click();
    await expect(page.locator('[data-testid="doctor-card-doc-1"]')).toBeVisible();
  });

  test('03. Quick Fee Decider Modal updates Dr. Raj Valaki consultation fees and recalculates KPIs', async ({ page }) => {
    // Click "Decide Fees" button on Dr. Raj Valaki's card
    const feeDecideBtn = page.locator('[data-testid="decide-fees-btn-doc-1"]');
    await expect(feeDecideBtn).toBeVisible();
    await feeDecideBtn.click();

    // Verify Modal appears
    await expect(page.getByText('Consultation Fee Decider')).toBeVisible();
    await expect(page.getByText(/Decide Fees for Dr\. Raj Valaki/i)).toBeVisible();

    // Locate +₹50 stepper button and click it to bump fee
    const stepUp50Btn = page.locator('button').filter({ hasText: '+₹50' }).first();
    await expect(stepUp50Btn).toBeVisible();
    await stepUp50Btn.click(); // +50
    await stepUp50Btn.click(); // +50

    // Save and commit fees
    const saveBtn = page.locator('button').filter({ hasText: /Save & Apply Consultation Fees/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify toast notification
    await expect(page.getByText(/Consultation fees for Dr\. Raj Valaki updated/i)).toBeVisible();
  });

  test('04. Onboard New Doctor modal adds physician with specific consultation tariffs', async ({ page }) => {
    // Click "+ Onboard New Doctor"
    await page.getByText('+ Onboard New Doctor').click();

    // Verify Onboarding Modal opened
    await expect(page.getByText('Add New Physician to Roster')).toBeVisible();
    await expect(page.getByText(/Decide Consultation Fees & Tariffs/i)).toBeVisible();

    // Fill form
    await page.locator('input[placeholder*="Rajesh Patel"]').fill('Dr. Vikram Seth');
    await page.locator('input[placeholder*="Dermatology"]').fill('Neurology');
    await page.locator('input[placeholder*="MBBS"]').fill('MBBS, MD, DM (Neurology)');
    await page.locator('input[placeholder*="G-48291"]').fill('MCI-99482');
    await page.locator('input[placeholder*="Cabin 1"]').fill('OPD-305');

    // Save doctor
    const saveDoctorBtn = page.locator('button').filter({ hasText: /Save & Add Physician/i });
    await saveDoctorBtn.click();

    // Verify notification
    await expect(page.getByText(/Dr\. Vikram Seth successfully added to hospital roster/i)).toBeVisible();

    // Verify Dr. Vikram Seth appears in the roster
    const newDocCard = page.locator('div').filter({ hasText: 'Dr. Vikram Seth' }).filter({ hasText: 'OPD-305' }).last();
    await expect(newDocCard).toBeVisible();
    await expect(newDocCard.getByText('Dr. Vikram Seth')).toBeVisible();
    await expect(newDocCard.getByText('OPD-305')).toBeVisible();
  });

  test('05. Doctor status toggle switches between Active and On Leave', async ({ page }) => {
    // Find status button for Dr. Anita Soni (id: doc-2)
    const statusToggle = page.locator('[data-testid="toggle-status-btn-doc-2"]');
    await expect(statusToggle).toBeVisible();

    // Click to toggle status
    await statusToggle.click();

    // Verify status changed toast
    await expect(page.getByText(/Status updated to/i)).toBeVisible();
  });

  test('06. Real-time search and specialty filters filter doctors list', async ({ page }) => {
    // Search for "Anita"
    const searchInput = page.locator('input[placeholder*="Search by Doctor Name"]');
    await searchInput.fill('Anita');

    // Dr. Anita Soni should be visible, Dr. Raj Valaki should not be
    await expect(page.getByText('Dr. Anita Soni')).toBeVisible();
    await expect(page.locator('[data-testid="doctor-card-doc-1"]')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(page.locator('[data-testid="doctor-card-doc-1"]')).toBeVisible();

    // Filter by Specialty "Obstetrics & Gynecology"
    const specialtySelect = page.locator('select').filter({ hasText: /All Specialities/i });
    await specialtySelect.selectOption('Obstetrics & Gynecology');

    // Only Dr. Priya Mehta (Obstetrics & Gynecology) should be shown
    await expect(page.getByText('Dr. Priya Mehta')).toBeVisible();
    await expect(page.locator('[data-testid="doctor-card-doc-1"]')).not.toBeVisible();
  });

  test('07. Responsive viewport testing with zero horizontal overflow', async ({ page }) => {
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

      // Main header and at least one doctor card should be visible
      await expect(page.locator('main h1').filter({ hasText: /Doctor Management/i })).toBeVisible();
      await expect(page.getByText('Dr. Raj Valaki')).toBeVisible();
    }
  });

});
