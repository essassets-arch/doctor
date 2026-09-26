import { test, expect } from '@playwright/test';

test.describe('Module Admin: In-Panel Direct Workflows (No External Redirects)', () => {

  test('01. Admin Dashboard KPI cards link within admin console', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('h1').filter({ hasText: /Executive Intelligence/i })).toBeVisible();

    // Check KPI links
    const queueCard = page.locator('main a[href="/admin/queue"]');
    await expect(queueCard).toBeVisible();
    await expect(queueCard.getByText(/Active In-Clinic Queue/i)).toBeVisible();

    const billingCard = page.locator('a[href="/admin/billing"]').first();
    await expect(billingCard).toBeVisible();

    const patientsCard = page.locator('a[href="/admin/patients"]').first();
    await expect(patientsCard).toBeVisible();

    const drugsCard = page.locator('a[href="/admin/drugs"]').first();
    await expect(drugsCard).toBeVisible();
  });

  test('02. Admin Live Queue Control Center renders within admin with flow controls', async ({ page }) => {
    await page.goto('/admin/queue');
    await expect(page.locator('h1').filter({ hasText: /OPD Live Queue/i })).toBeVisible();

    // Verify status ticker counters exist
    await expect(page.getByText('Waiting in Lobby').first()).toBeVisible();
    await expect(page.getByText('In Doctor Session').first()).toBeVisible();

    // Verify queue manifest table exists
    await expect(page.locator('table')).toBeVisible();

    // Verify token actions are available
    await expect(page.getByRole('button', { name: /Call/i }).first()).toBeVisible();
  });

  test('03. Admin Appointments Master displays roster and supports in-admin rescheduling', async ({ page }) => {
    await page.goto('/admin/appointments');
    await expect(page.locator('h1').filter({ hasText: /Appointment Scheduling/i })).toBeVisible();

    // Ensure Master Appointments Roster tab is active and table is visible
    await expect(page.getByText(/Master Appointments Roster/i)).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Verify Reschedule button inside admin opens the modal
    const rescheduleBtn = page.getByRole('button', { name: /Reschedule/i }).first();
    await expect(rescheduleBtn).toBeVisible();
    await rescheduleBtn.click();

    // Modal should be visible
    await expect(page.getByText(/Reschedule Patient Appointment/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirm Shift/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).last().click();
    await expect(page.getByText(/Reschedule Patient Appointment/i)).not.toBeVisible();
  });

  test('04. Admin Patients Master opens Clinical Consultation Station in-admin without redirecting', async ({ page }) => {
    await page.goto('/admin/patients');
    await expect(page.locator('h1').filter({ hasText: /Patient Master/i })).toBeVisible();

    // Encounters tab should have "View Clinical Consultation" button
    const consultBtn = page.getByRole('button', { name: /View Clinical Consultation/i }).first();
    await expect(consultBtn).toBeVisible();
    await consultBtn.click();

    // Should open the in-admin modal without navigating away to /doctor/...
    await expect(page).toHaveURL(/\/admin\/patients/);
    await expect(page.getByText(/Clinical Consultation Master/i)).toBeVisible();
    await expect(page.getByText(/Physiological Vitals Triage/i)).toBeVisible();
    await expect(page.getByText(/Prescriptions & Formularies Dispensed/i)).toBeVisible();

    // Close station
    await page.getByRole('button', { name: /Close Station/i }).click();
    await expect(page.getByText(/Clinical Consultation Master/i)).not.toBeVisible();
  });

});
