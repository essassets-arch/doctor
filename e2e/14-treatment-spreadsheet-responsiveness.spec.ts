import { test, expect } from '@playwright/test';

test.describe('Treatment Protocol 22-Col Spreadsheet Responsiveness', () => {

  test('01. Switching between Full Session Cards and 22-Col Spreadsheet preserves responsive layout without page blowout', async ({ page }) => {
    // Set a standard desktop/laptop viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Click Tab 4: Procedures
    const procTab = page.locator('button.tab-item').filter({ hasText: /Procedures/i }).first();
    await expect(procTab).toBeVisible();
    await procTab.click();

    // Verify Level 2 is visible
    const level2Section = page.locator('#level-2-execution-section');
    await expect(level2Section).toBeVisible();

    // Verify view toggle buttons exist
    const cardsBtn = page.getByRole('button', { name: /Full Session Cards/i });
    const spreadsheetBtn = page.getByRole('button', { name: /22-Col Spreadsheet/i });
    await expect(cardsBtn).toBeVisible();
    await expect(spreadsheetBtn).toBeVisible();

    // Verify page has no horizontal overflow in Cards mode
    const pageOverflowCards = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(pageOverflowCards).toBeLessThanOrEqual(1);

    // Click "22-Col Spreadsheet"
    await spreadsheetBtn.click();

    // Verify 22-column table is rendered
    const table = level2Section.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'SESSION' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'REMARK' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'ACTIONS' })).toBeVisible();

    // Verify CRITICAL FIX: Page does NOT have horizontal blowout when 22-Col Spreadsheet is active
    const pageOverflowSpreadsheet = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(pageOverflowSpreadsheet).toBeLessThanOrEqual(1);

    // Verify the table wrapper is scrollable horizontally internally
    const tableContainer = table.locator('..');
    const isInternalScrollable = await tableContainer.evaluate((el: HTMLElement) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(isInternalScrollable).toBe(true);

    // Verify Level 2 header buttons remain visible and within the viewport
    await expect(cardsBtn).toBeVisible();
    await expect(spreadsheetBtn).toBeVisible();
    const addSessionBtn = level2Section.getByRole('button', { name: /\+ Add Session/i }).first();
    await expect(addSessionBtn).toBeVisible();

    // Verify Level 1 schedule buttons remain visible
    await expect(page.getByText(/Session-Wise|Full Package/i).first()).toBeVisible();

    // Verify sticky first column on table
    const firstHeader = table.locator('th').filter({ hasText: 'SESSION' });
    const headerSticky = await firstHeader.evaluate((el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      return style.position;
    });
    expect(headerSticky).toBe('sticky');

    // Switch back to Full Session Cards
    await cardsBtn.click();
    await expect(page.locator('.treatment-session-card').first()).toBeVisible();

    // Verify still zero page-level horizontal overflow
    const pageOverflowAfter = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(pageOverflowAfter).toBeLessThanOrEqual(1);
  });

  test('02. Tablet viewport (768px) maintains responsiveness when 22-Col Spreadsheet is toggled', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/doctor/consultation/C006-001-190926');
    await page.waitForLoadState('networkidle');

    // Click Tab 4: Procedures
    const procTab = page.locator('button.tab-item').filter({ hasText: /Procedures/i }).first();
    await procTab.click();

    const spreadsheetBtn = page.getByRole('button', { name: /22-Col Spreadsheet/i });
    await expect(spreadsheetBtn).toBeVisible();
    await spreadsheetBtn.click();

    // Verify zero page-level horizontal overflow on tablet
    const pageOverflowTablet = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(pageOverflowTablet).toBeLessThanOrEqual(1);
  });

});
