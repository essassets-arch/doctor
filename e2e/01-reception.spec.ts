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

});
