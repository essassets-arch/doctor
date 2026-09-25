import { test, expect } from '@playwright/test';

test.describe('Module G: Admin Financial Governance, Payment Channels & Status Audits', () => {

  test('01. Admin Billing page loads financial KPIs and all payment channel breakdown', async ({ page }) => {
    await page.goto('/admin/billing');
    await expect(page).toHaveTitle(/MedFlow/i);

    // Verify main header
    await expect(page.locator('main h1').filter({ hasText: /Financial Governance & Master Billing Audit/i })).toBeVisible();

    // Verify top 5 KPI cards
    await expect(page.getByText('Gross Invoiced')).toBeVisible();
    await expect(page.getByText('Net Collected Revenue')).toBeVisible();
    await expect(page.getByText('Pending Receivables')).toBeVisible();
    await expect(page.getByText('Discounts & Waivers')).toBeVisible();
    await expect(page.getByText('Status Health')).toBeVisible();

    // Verify Payment Channel Breakdown Cards
    await expect(page.locator('div').filter({ hasText: 'UPI / DYNAMIC QR' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'CASH COUNTER' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'CARD POS TERMINAL' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'BANK TRANSFER / NEFT' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'INSURANCE / TPA' }).first()).toBeVisible();
  });

  test('02. Payment Channel and Billing Status filters update transactions table dynamically', async ({ page }) => {
    await page.goto('/admin/billing');

    // 1. Filter by Payment Channel: CASH
    const channelSelect = page.locator('select').first();
    await channelSelect.selectOption('CASH');

    // Verify only CASH bills shown
    await expect(page.getByText('CASH').first()).toBeVisible();

    // 2. Filter by Payment Channel: UPI
    await channelSelect.selectOption('UPI');
    await expect(page.getByText('UPI').first()).toBeVisible();

    // 3. Reset Channel to ALL, and test Status Filter chips
    await channelSelect.selectOption('ALL');

    // Click PARTIAL status filter chip
    const partialChip = page.locator('button').filter({ hasText: /PARTIAL/i }).first();
    await partialChip.click();
    await expect(page.locator('table').getByText('PARTIAL').first()).toBeVisible();

    // Click PENDING status filter chip
    const pendingChip = page.locator('button').filter({ hasText: /PENDING/i }).first();
    await pendingChip.click();
    await expect(page.locator('table').getByText('PENDING').first()).toBeVisible();

    // Click FOC status filter chip
    const focChip = page.locator('button').filter({ hasText: /FOC/i }).first();
    await focChip.click();
    await expect(page.locator('table').getByText('FOC').first()).toBeVisible();

    // Reset status to All
    const allChip = page.locator('button').filter({ hasText: /All Statuses/i }).first();
    await allChip.click();
  });

  test('03. Search filter by Bill number, Patient Name, or MRD works instantly', async ({ page }) => {
    await page.goto('/admin/billing');

    const searchInput = page.locator('input[placeholder*="Search by Bill"]');
    await searchInput.fill('Amit Shah');

    // Verify Amit Shah's invoice INV-2026-0089 appears
    await expect(page.getByText('Amit Shah').first()).toBeVisible();
    await expect(page.getByText('INV-2026-0089').first()).toBeVisible();

    // Search by MRD
    await searchInput.fill('MRD-2026-0001');
    await expect(page.getByText('Mahesh Kumar').first()).toBeVisible();
    await expect(page.getByText('INV-2026-0090').first()).toBeVisible();
  });

  test('04. Collect payment and settle outstanding balance on an invoice', async ({ page }) => {
    await page.goto('/admin/billing');

    // Find a bill with remaining balance and click Settle
    const settleBtn = page.locator('[data-testid="settle-bill-action-btn"]').first();
    await expect(settleBtn).toBeVisible();
    await settleBtn.click();

    // Verify Collect Modal is open
    await expect(page.getByText('Collect Payment & Settle Invoice')).toBeVisible();

    // Select Card POS channel
    const cardOption = page.locator('button').filter({ hasText: /Card POS/i });
    await cardOption.click();

    // Commit payment collection
    const commitBtn = page.locator('button').filter({ hasText: /Commit/i });
    await commitBtn.click();

    // Verify modal closes
    await expect(page.getByText('Collect Payment & Settle Invoice')).not.toBeVisible();
  });

  test('05. View Tax Invoice Receipt preview modal and print simulation', async ({ page }) => {
    await page.goto('/admin/billing');

    // Click Receipt button
    const receiptBtn = page.locator('button').filter({ hasText: /Receipt/i }).first();
    await expect(receiptBtn).toBeVisible();
    await receiptBtn.click();

    // Verify official receipt modal content
    await expect(page.getByText('MEDFLOW HEALTHCARE CLINIC')).toBeVisible();
    await expect(page.getByText('Official Outpatient Tax Invoice / Cash Receipt')).toBeVisible();
    await expect(page.getByText('Gross Services Subtotal:')).toBeVisible();
    await expect(page.getByText('Net Invoice Amount:')).toBeVisible();

    // Close preview
    await page.locator('button').filter({ hasText: /^Close$/i }).click();
    await expect(page.getByText('Official Outpatient Tax Invoice / Cash Receipt')).not.toBeVisible();
  });

  test('06. Generate a new outpatient invoice directly from admin billing', async ({ page }) => {
    await page.goto('/admin/billing');

    // Open Create New Invoice Modal
    const createBtn = page.locator('button').filter({ hasText: /\+ Create New Invoice/i });
    await createBtn.click();

    await expect(page.getByText('Generate New Outpatient Invoice')).toBeVisible();

    // Fill invoice fields
    await page.locator('select').filter({ hasText: /Choose Patient/i }).selectOption({ index: 1 });
    await page.locator('input[placeholder="Service / Medicine Name"]').first().fill('Laser Skin Rejuvenation');
    await page.locator('input[placeholder="Rate ₹"]').first().fill('3500');

    // Select Payment Channel Bank Transfer using specific data-testid
    await page.locator('[data-testid="new-bill-payment-mode"]').selectOption('BANK_TRANSFER');

    // Submit invoice creation
    await page.locator('button').filter({ hasText: /Generate Invoice & Commit/i }).click();

    // Verify modal closes and new invoice appears
    await expect(page.getByText('Generate New Outpatient Invoice')).not.toBeVisible();
    await expect(page.getByText('Laser Skin Rejuvenation').first()).toBeVisible();
  });

  test('07. Responsive layout adapts across mobile, tablet, and desktop viewports without horizontal page blowout', async ({ page }) => {
    // 1. Mobile Viewport (iPhone SE / 375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/billing');
    await page.waitForLoadState('networkidle');

    // Verify main financial KPI titles & values render
    await expect(page.getByText('Gross Invoiced').first()).toBeVisible();
    await expect(page.getByText('Net Collected Revenue').first()).toBeVisible();

    // Verify payment channels breakdown renders
    await expect(page.getByText('Payment Channel Collections Breakdown')).toBeVisible();

    // Toggle to Card View
    const cardToggle = page.locator('button').filter({ hasText: /Cards/i });
    await cardToggle.click();
    await expect(page.locator('[data-testid="billing-card-item"]').first()).toBeVisible();

    // Verify no horizontal overflow at document element level
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(mobileOverflow).toBe(false);

    // 2. Tablet Viewport (iPad / 768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(tabletOverflow).toBe(false);

    // Toggle back to Table View and ensure table container scrolls horizontally within its bounds if needed
    const tableToggle = page.locator('button').filter({ hasText: /Table/i });
    await tableToggle.click();
    await expect(page.locator('.billing-responsive-table-scroll')).toBeVisible();

    // 3. Desktop Viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(desktopOverflow).toBe(false);

    // Verify Sticky / Fixed Sidebar position after scrolling content
    const sidebar = page.locator('aside.admin-sidebar');
    await expect(sidebar).toBeVisible();
    const sidebarInitialBox = await sidebar.boundingBox();
    expect(sidebarInitialBox?.y).toBe(0);

    // Scroll main content down
    await page.locator('main.admin-main-viewport').evaluate((el) => {
      el.scrollTop = 400;
    });

    // Verify sidebar top position remains strictly fixed at 0 and still visible
    const sidebarScrolledBox = await sidebar.boundingBox();
    expect(sidebarScrolledBox?.y).toBe(0);
    await expect(page.getByText('MEDFLOW').first()).toBeVisible();

    // Verify invoice numbers and receipt actions in table are visible and properly formatted
    await expect(page.getByText('INV-2026-0095').first()).toBeVisible();
    await expect(page.getByText('Receipt').first()).toBeVisible();
  });

});
