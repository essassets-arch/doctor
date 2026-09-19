import { test, expect } from '@playwright/test';

test.describe('Module E: Superadmin & Practice Governance Workflow', () => {

  test('01. Admin Left Sidebar displays categorized navigation groups', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify Admin Left Sidebar branding
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText(/MEDFLOW/i).first()).toBeVisible();
    await expect(sidebar.getByText(/ADMIN APEX/i).first()).toBeVisible();

    // Verify all 6 categorized navigation sections inside sidebar
    await expect(sidebar.getByText('CORE INTELLIGENCE')).toBeVisible();
    await expect(sidebar.getByText('WORKFORCE & HRMS')).toBeVisible();
    await expect(sidebar.getByText('CLINICAL OPERATIONS')).toBeVisible();
    await expect(sidebar.getByText('FINANCIAL GOVERNANCE')).toBeVisible();
    await expect(sidebar.getByText('CLINICAL MASTERS')).toBeVisible();
    await expect(sidebar.getByText('CYBER DEFENSE & SYSTEM')).toBeVisible();

    // Verify sidebar search filter
    const searchInput = sidebar.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Doctor');
    await expect(sidebar.getByText('Doctor Management')).toBeVisible();
    await searchInput.fill('');
  });

  test('02. Admin Dashboard renders 6 KPIs and revenue charts', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // KPI Cards
    await expect(page.locator('main').getByText(/Today's Revenue/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/Today's Patients/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/Active In-Clinic Queue/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/Completed Sessions/i).first()).toBeVisible();

    // Revenue Trend Chart Section
    await expect(page.locator('main').getByText(/30-Day Outpatient Revenue Trajectory/i)).toBeVisible();
    await expect(page.locator('main img, main svg').first()).toBeVisible();

    // Quick Master Launchers
    await expect(page.locator('main').getByText(/Executive Governance Quick Launch/i)).toBeVisible();
  });

  test('03. Doctor Management & Scheduling displays physician roster', async ({ page }) => {
    await page.goto('/admin/doctors');
    await expect(page.locator('main h1').filter({ hasText: /Doctor Management/i })).toBeVisible();
    await expect(page.getByText(/Dr\. Raj Valaki/i).first()).toBeVisible();
    await expect(page.getByText(/Onboard New Doctor/i).first()).toBeVisible();
  });

  test('04. Staff & RBAC Administration displays accounts', async ({ page }) => {
    await page.goto('/admin/staff');
    await expect(page.locator('main h1').filter({ hasText: /Staff & RBAC/i })).toBeVisible();
    await expect(page.locator('main table')).toBeVisible();
  });

  test('05. HRMS & Overtime Auditing displays daily logs', async ({ page }) => {
    await page.goto('/admin/hrms');
    await expect(page.locator('main h1').filter({ hasText: /HRMS/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Overtime/i).first()).toBeVisible();
  });

  test('06. Patient Master Registry loads longitudinal EHR directory', async ({ page }) => {
    await page.goto('/admin/patients');
    await expect(page.locator('main h1').filter({ hasText: /Patient Master Registry/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Mahesh Kumar/i).first()).toBeVisible();
  });

  test('07. Appointment Capacity Master loads slots & holiday controls', async ({ page }) => {
    await page.goto('/admin/appointments');
    await expect(page.locator('main h1').filter({ hasText: /Appointment Scheduling/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Physician Capacity Matrix/i)).toBeVisible();
  });

  test('08. Financial Governance & Billing loads revenue audits', async ({ page }) => {
    await page.goto('/admin/billing');
    await expect(page.locator('main h1').filter({ hasText: /Financial Governance/i })).toBeVisible();
    await expect(page.locator('main table')).toBeVisible();
  });

  test('09. UPI & Dynamic QR Configuration renders standee simulator', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await expect(page.locator('main h1').filter({ hasText: /UPI Gateway/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Counter QR Standee Simulator/i)).toBeVisible();
  });

  test('10. Clinic Expenses & Vouchers computes net profit', async ({ page }) => {
    await page.goto('/admin/expenses');
    await expect(page.locator('main h1').filter({ hasText: /Clinic Expense/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Net Clinic Operating Profit/i)).toBeVisible();
  });

  test('11. Clinical Masters (Procedures, Drugs, Lab, Consent) load', async ({ page }) => {
    // Procedures
    await page.goto('/admin/procedures');
    await expect(page.locator('main h1').filter({ hasText: /Procedure Master/i })).toBeVisible();

    // Central Drug Formulary
    await page.goto('/admin/drugs');
    await expect(page.locator('main h1').filter({ hasText: /Central Drug Master/i })).toBeVisible();

    // Diagnostic Lab
    await page.goto('/admin/lab');
    await expect(page.locator('main h1').filter({ hasText: /Diagnostic Laboratory Masters/i })).toBeVisible();

    // Consent Templates
    await page.goto('/admin/consent-forms');
    await expect(page.locator('main h1').filter({ hasText: /Informed Consent/i })).toBeVisible();
  });

  test('12. Security Command Center displays Zero-Trust and SIEM', async ({ page }) => {
    await page.goto('/admin/security-command-center');
    await expect(page.locator('main h1').filter({ hasText: /Security Command Center/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Zero-Trust/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/SIEM SOC/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/INITIATE GLOBAL PANIC LOCKDOWN/i).first()).toBeVisible();
  });

  test('13. Executive BI Reports displays doctor payouts and tax liabilities', async ({ page }) => {
    await page.goto('/admin/reports');
    await expect(page.locator('main h1').filter({ hasText: /Executive BI Analytics/i })).toBeVisible();
    await expect(page.locator('main').getByText(/Physician Consultation Revenue Share Reconciliation/i)).toBeVisible();
  });

  test('14. Clinic Settings & Prescription Layout Designer renders live A4 simulation', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('main h1').filter({ hasText: /Clinic Settings/i })).toBeVisible();

    // Switch to Prescription Layout Designer tab
    await page.getByRole('button', { name: /Prescription Layout Designer/i }).click();
    await expect(page.locator('main').getByText(/Real-time A4 Print Stationary Simulation/i)).toBeVisible();
  });

  test('15. Engineering Support Desk loads telemetries and ticket dispatch', async ({ page }) => {
    await page.goto('/admin/support');
    await expect(page.locator('main h1').filter({ hasText: /Engineering Support/i })).toBeVisible();
    await expect(page.locator('main').getByText(/SYSTEM STATUS: ALL OPERATIONAL/i)).toBeVisible();
    await expect(page.locator('main').getByText(/Dispatch Priority Engineering Ticket/i)).toBeVisible();
  });

});
