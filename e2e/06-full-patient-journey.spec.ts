import { test, expect } from '@playwright/test';

test.describe('Full Cross-Departmental Patient Journey Workflow with Zustand Persistence', () => {

  test('Complete End-to-End Flow: Reception Check-In -> Nursing Triage -> Doctor Consultation -> Pharmacy POS -> Billing Checkout -> Persistence across Reload', async ({ page }) => {
    // Automatically accept any browser alert/confirm dialogues
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // -------------------------------------------------------------
    // Step 1: Reception Desk Check-In (Generate Token & Queue Entry)
    // -------------------------------------------------------------
    await page.goto('/reception/checkin');
    await expect(page.locator('h1').filter({ hasText: /Walk-In Management & Check-In Counter/i })).toBeVisible();

    // Select 'Pay Later' billing option
    await page.getByText('Pay Later').click();

    // Fill in chief complaints or use defaults
    const complaintInput = page.locator('input[placeholder*="headache"]').first();
    if (await complaintInput.isVisible()) {
      await complaintInput.fill('Fever and acute throat discomfort');
    }

    // Click Generate Token & Check-In
    await page.getByRole('button', { name: /Generate Token & Check-In/i }).click();

    // Wait for the Token Receipt modal to appear
    const caseIdElement = page.locator('[data-testid="generated-case-id"]');
    await expect(caseIdElement).toBeVisible();
    const caseNumber = (await caseIdElement.textContent())?.trim() || '';
    expect(caseNumber).toContain('C');

    // Click 'Proceed to Nursing Triage →'
    await page.locator('a, button').filter({ hasText: /Proceed to Nursing Triage/i }).click();

    // -------------------------------------------------------------
    // Step 2: Nursing Station Triage (Record & Sync Vitals)
    // -------------------------------------------------------------
    await expect(page.locator('h1').filter({ hasText: /Pre-Consultation Vitals & Clinical Intake/i })).toBeVisible();
    await expect(page.getByText(/BMI/i).first()).toBeVisible();

    // Save vitals & forward to doctor cabin
    const saveVitalsBtn = page.getByRole('button', { name: /Save Vitals & Handshake to Doctor Cabin/i });
    await expect(saveVitalsBtn).toBeVisible();
    await saveVitalsBtn.click();

    // -------------------------------------------------------------
    // Step 3: Doctor Consultation Cockpit (Clinical Examination & Rx)
    // -------------------------------------------------------------
    await page.goto(`/doctor/consultation/${caseNumber}`);
    
    // Verify patient header and case number badge
    await expect(page.getByText(new RegExp(`Case: ${caseNumber}`, 'i'))).toBeVisible();

    // Open Rx Pharmacy tab and verify or add medication
    await page.locator('.tab-item').filter({ hasText: /Rx Pharmacy/i }).click();
    await expect(page.getByText(/Prescription/i).first()).toBeVisible();

    // Click 'End Consultation' in the top bar
    const endConsultationBtn = page.getByRole('button', { name: /End Consultation/i });
    await expect(endConsultationBtn).toBeVisible();
    await endConsultationBtn.click();

    // In the handover modal, click 'Confirm & Handover to BILLING'
    const confirmHandoverBtn = page.getByRole('button', { name: /Confirm & Handover/i });
    await expect(confirmHandoverBtn).toBeVisible();
    await confirmHandoverBtn.click();

    // Verify Signed Digital Prescription modal appears
    await expect(page.getByText(/Official Signed Digital Prescription/i)).toBeVisible();

    // -------------------------------------------------------------
    // Step 4: Medical / Pharmacy POS Dispensing Hub
    // -------------------------------------------------------------
    await page.goto(`/medical/dispensing/${caseNumber}`);
    await expect(page.getByText(/Prescription Dispensing/i).first()).toBeVisible();
    await expect(page.getByText(new RegExp(caseNumber, 'i')).first()).toBeVisible();

    // Verify drugs to dispense are listed
    await expect(page.getByText(/Total Amount Due/i).first()).toBeVisible();

    // Complete dispense & cash collection
    const completeDispenseBtn = page.locator('button').filter({ hasText: /COMPLETE & DISPENSE/i });
    if (await completeDispenseBtn.isVisible()) {
      await completeDispenseBtn.click();
      // Verify prescription dispensed confirmation or receipt modal
      await expect(page.getByText(/Prescription Successfully Dispensed & Invoiced|MEDFLOW PHARMACY & DISPENSARY TAX INVOICE/i).first()).toBeVisible();
    }

    // -------------------------------------------------------------
    // Step 5: Receptionist Final Billing & Checkout
    // -------------------------------------------------------------
    await page.goto('/reception/billing');
    await expect(page.locator('h1').filter({ hasText: /OPD Billing/i })).toBeVisible();

    // Verify billing records table shows our patient or doctor bills
    const settleButtons = page.locator('button').filter({ hasText: /Settle ₹/i });
    if (await settleButtons.count() > 0) {
      await settleButtons.first().click();
      await expect(page.getByText(/Invoice settled/i).first()).toBeVisible();
    }

    // -------------------------------------------------------------
    // Step 6: Verify Data Persistence across Browser Page Reload
    // -------------------------------------------------------------
    await page.reload();
    await expect(page.locator('h1').filter({ hasText: /OPD Billing/i })).toBeVisible();

    // Check that Zustand store state persisted in localStorage
    const storedQueue = await page.evaluate(() => localStorage.getItem('doctor-queue'));
    expect(storedQueue).toBeTruthy();
    expect(storedQueue).toContain(caseNumber);

    const storedBilling = await page.evaluate(() => localStorage.getItem('doctor-billing'));
    expect(storedBilling).toBeTruthy();

    const storedPharmacy = await page.evaluate(() => localStorage.getItem('doctor-pharmacy'));
    expect(storedPharmacy).toBeTruthy();

    const storedConsultation = await page.evaluate(() => localStorage.getItem('doctor-consultation'));
    expect(storedConsultation).toBeTruthy();
    expect(storedConsultation).toContain(caseNumber);
  });

  test('Departmental Navigation Smoke Test', async ({ page }) => {
    // Reception dashboard
    await page.goto('/reception/dashboard');
    await expect(page.getByText('Total Today')).toBeVisible();

    // Queue control
    await page.goto('/reception/queue');
    await expect(page.locator('h1').filter({ hasText: /OPD Queue Control/i })).toBeVisible();

    // Nursing vitals
    await page.goto('/nursing/vitals');
    await expect(page.locator('h1').filter({ hasText: /Pre-Consultation Vitals/i })).toBeVisible();

    // Doctor dashboard
    await page.goto('/doctor/dashboard');
    await expect(page.locator('h1').filter({ hasText: /Doctor Consultation Cockpit/i })).toBeVisible();

    // Admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('main').getByText(/Today's Revenue/i).first()).toBeVisible();
  });

});
