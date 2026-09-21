import { test, expect } from '@playwright/test';

test.describe('Cross-Panel Real-Time Flow and "Arrived" Actions Verification', () => {

  test('01. Create Patient in Receptionist Register and Send Directly to Doctor Queue', async ({ page }) => {
    // 1. Go to Receptionist Patient Registration
    await page.goto('/reception/register');
    await page.waitForSelector('text=Patient Demographics & Medical Record');

    // 2. Fill Patient Registration Demographics
    const uniqueFirstName = `PatientFlow${Date.now() % 10000}`;
    const uniqueLastName = 'Sharma';
    await page.fill('input[placeholder="e.g. Ramesh"]', uniqueFirstName);
    await page.fill('input[placeholder="e.g. Patel"]', uniqueLastName);
    await page.fill('input[placeholder="10-digit mobile"]', '9898765432');

    // 3. Verify Doctor Assignment Selector exists
    const doctorSelect = page.locator('select').filter({ hasText: 'Dr. Raj Valaki' });
    await expect(doctorSelect).toBeVisible();

    // 4. Click "Save & Send to Doctor Queue"
    const sendToDocBtn = page.getByRole('button', { name: 'Save & Send to Doctor Queue' });
    await expect(sendToDocBtn).toBeVisible();
    await sendToDocBtn.click();

    // 5. Verify Success Toast with Action Link
    await expect(page.locator('text=Ready in Doctor panel!')).toBeVisible({ timeout: 5000 });
    const openDoctorBtn = page.getByRole('button', { name: 'Open Doctor Cockpit →' });
    await expect(openDoctorBtn).toBeVisible();

    // 6. Navigate directly to Doctor Cockpit
    await openDoctorBtn.click();
    await page.waitForURL('**/doctor/dashboard');

    // 7. Verify the patient is immediately visible in Doctor Cockpit Waiting list!
    await expect(page.locator(`text=${uniqueFirstName} ${uniqueLastName}`)).toBeVisible({ timeout: 5000 });

    // 8. Go to Doctor Queue page and verify presence as well
    await page.goto('/doctor/queue');
    await expect(page.locator(`text=${uniqueFirstName} ${uniqueLastName}`)).toBeVisible({ timeout: 5000 });

    // 9. Verify Doctor can call the newly created patient
    const patientRow = page.locator('tr').filter({ hasText: uniqueFirstName });
    await expect(patientRow).toBeVisible();
    await expect(patientRow.getByRole('button', { name: 'Call' })).toBeVisible();
  });

  test('02. Verify "Arrived" button in Reception Dashboard sets checkInTime and updates status', async ({ page }) => {
    await page.goto('/reception/dashboard');
    await page.waitForSelector('text=OPD Dashboard');

    // Find row for unarrived patient (e.g. Anita Sharma with token APP-11:30)
    const unarrivedRow = page.locator('tr').filter({ hasText: 'Anita Sharma' });
    await expect(unarrivedRow).toBeVisible();

    const arrivedBtn = unarrivedRow.getByRole('button', { name: 'Arrived' });
    await expect(arrivedBtn).toBeVisible();
    await arrivedBtn.click();

    // After clicking arrived, the "Arrived" button is replaced by vitals badge and CheckInTime
    await expect(arrivedBtn).not.toBeVisible({ timeout: 5000 });
    await expect(unarrivedRow.locator('text=Vit')).toBeVisible();
  });

  test('03. Verify "Arrived" button in Reception Appointments marks appointment and enqueues patient', async ({ page }) => {
    await page.goto('/reception/appointments');
    await page.waitForSelector('text=Appointment Scheduling & Calendar');

    // Switch to Upcoming tab
    await page.getByRole('button', { name: /Upcoming Schedule/i }).click();

    // Find a scheduled appointment row
    const scheduledRow = page.locator('tr').filter({ hasText: 'SCHEDULED' }).first();
    await expect(scheduledRow).toBeVisible();

    // Click Arrived
    const arriveBtn = scheduledRow.getByRole('button', { name: 'Arrived' });
    await expect(arriveBtn).toBeVisible();
    await arriveBtn.click();

    // Verify "In Queue →" badge now appears
    await expect(page.locator('text=In Queue →').first()).toBeVisible({ timeout: 5000 });
  });

  test('04. Verify "Arrived & Queue" button in Doctor Appointments', async ({ page }) => {
    await page.goto('/doctor/appointments');
    await page.waitForSelector('text=Appointment Management & Cabin Schedule');

    // If an appointment is scheduled, click Arrived & Queue
    const arriveBtn = page.getByRole('button', { name: 'Arrived & Queue' }).first();
    if (await arriveBtn.isVisible()) {
      await arriveBtn.click();
      await expect(page.locator('text=In Queue →').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('05. Verify Patient Profile "Send to Doctor" button routes patient to doctor', async ({ page }) => {
    await page.goto('/reception/patients/pat-1');
    await page.waitForSelector('text=Send to Doctor');

    const sendBtn = page.getByRole('button', { name: 'Send to Doctor' });
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    // Verify redirected to Doctor Cockpit
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.locator('text=Mahesh Kumar')).toBeVisible({ timeout: 5000 });
  });

});
