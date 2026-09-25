import { test, expect } from '@playwright/test';

test.describe('Module H: Admin Multi-Channel Payment Management, Dynamic QR & Gateway Fleet', () => {

  test('01. Payment Management page renders dynamic telemetry KPIs and tabs', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    // Verify main header
    await expect(page.locator('main h1').filter({ hasText: /Payment Management/i })).toBeVisible();

    // Verify 5 Telemetry Metric Cards
    await expect(page.getByText('Total Collections').first()).toBeVisible();
    await expect(page.getByText('UPI / Dynamic QR').first()).toBeVisible();
    await expect(page.getByText('Card POS Terminals').first()).toBeVisible();
    await expect(page.getByText('Cash Drawer Till').first()).toBeVisible();
    await expect(page.getByText('NEFT & TPA Wire').first()).toBeVisible();

    // Verify Tab buttons
    await expect(page.getByText('Dynamic QR & Counter Standee')).toBeVisible();
    await expect(page.getByText('Gateway & Routing Config')).toBeVisible();
    await expect(page.getByText(/Live Transactions Ledger/i)).toBeVisible();
    await expect(page.getByText('Hardware Fleet & Soundbox')).toBeVisible();
  });

  test('02. Dynamic QR Generator adjusts amounts, binds patient bills, and simulates soundbox payment', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    // Click preset ₹800
    const preset800 = page.locator('button').filter({ hasText: '₹800' });
    await preset800.click();

    // Verify Standee amount updates to ₹800
    await expect(page.locator('main').getByText('₹800.00')).toBeVisible();

    // Select a patient bill from dropdown
    const billSelect = page.locator('select').filter({ hasText: /Counter Payment/i });
    if (await billSelect.isVisible()) {
      await billSelect.selectOption({ index: 1 });
    }

    // Click Simulate Patient Payment
    const simBtn = page.locator('button').filter({ hasText: /Simulate Patient UPI Payment/i });
    await expect(simBtn).toBeVisible();
    await simBtn.click();

    // Verify Success notification card appears
    await expect(page.getByText(/UPI Payment Confirmed & Reconciled!/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Txn Ref:/i)).toBeVisible();
  });

  test('03. Gateway Configuration updates VPA, shows bank wire details, and cash drawer till audit', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    // Switch to Gateway Config Tab
    await page.getByText('Gateway & Routing Config').click();

    // Verify VPA and Merchant input fields
    await expect(page.getByText('Banking Merchant & VPA Routing')).toBeVisible();
    await expect(page.getByText('NEFT / RTGS Wire Account Details')).toBeVisible();
    await expect(page.getByText('Cash Drawer & Denomination Till Audit')).toBeVisible();
    await expect(page.getByText('Empanelled Insurance & TPA Cashless Desk')).toBeVisible();

    // Update VPA
    const vpaInput = page.locator('input[value*="@"]').first();
    await vpaInput.fill('apex.hospital@okaxis');
    await page.locator('button').filter({ hasText: /Save Gateway Parameters/i }).click();

    // Verify notification
    await expect(page.getByText(/UPI Virtual Payment Address & Merchant parameters saved/i)).toBeVisible();
  });

  test('04. Live Transactions Ledger filters by payment channel and opens receipt modal', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    // Switch to Transactions Tab
    await page.getByText(/Live Transactions Ledger/i).click();

    // Verify table loads
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Bill # & Patient/i })).toBeVisible();

    // Filter by CASH channel
    const channelSelect = page.locator('select').filter({ hasText: /All Payment Channels/i });
    await channelSelect.selectOption('CASH');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Open receipt modal on first item
    const receiptBtn = page.locator('tbody button').filter({ hasText: /Receipt/i }).first();
    await receiptBtn.click();

    // Verify Modal
    await expect(page.getByText('Official Payment Voucher')).toBeVisible();
    await expect(page.getByText(/Total Invoiced:/i)).toBeVisible();

    // Close Modal
    await page.locator('button').filter({ hasText: /Close/i }).click();
    await expect(page.getByText('Official Payment Voucher')).not.toBeVisible();
  });

  test('05. Hardware Fleet displays MedFlow 4G Soundbox and POS Terminals', async ({ page }) => {
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    // Switch to Hardware Fleet tab
    await page.getByText('Hardware Fleet & Soundbox').click();

    // Verify Soundbox details
    await expect(page.getByText('MedFlow 4G Voice Soundbox')).toBeVisible();
    await expect(page.getByText('94%')).toBeVisible();
    await expect(page.getByText('4G VoLTE')).toBeVisible();

    // Verify POS Terminals
    await expect(page.getByText('Pine Labs Smart Android POS')).toBeVisible();
    await expect(page.getByText('Ingenico Move/5000 Wireless')).toBeVisible();

    // Test ping test chime button
    const pingBtn = page.locator('button').filter({ hasText: /Send Ping Test Chime/i });
    await expect(pingBtn).toBeVisible();
    await pingBtn.click();
  });

  test('06. Payment Management is fully responsive across mobile, tablet, and desktop viewports', async ({ page }) => {
    // 1. Mobile Viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/payment-management');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Total Collections').first()).toBeVisible();
    await expect(page.getByText('Dynamic QR & Counter Standee')).toBeVisible();

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(mobileOverflow).toBe(false);

    // 2. Tablet Viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(tabletOverflow).toBe(false);

    // 3. Desktop Viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(desktopOverflow).toBe(false);
  });

});
