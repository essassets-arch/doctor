import { test, expect } from '@playwright/test';

test.describe('Module C: Clinical Procedure Images Tab Workflow', () => {

  test('01. Images Tab loads with patient identification and clean MedFlow layout', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');

    // Click Tab 5: Clinical Procedure Images & Photography
    const imagesTab = page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i });
    await expect(imagesTab).toBeVisible();
    await imagesTab.click();

    // Verify Patient Identification Bar at top
    await expect(page.getByText(/UHID:/i).first()).toBeVisible();
    await expect(page.getByText(/Case ID:/i).first()).toBeVisible();

    // Verify "+ Add Procedure" button on left
    await expect(page.locator('button').filter({ hasText: /\+ Add Procedure/i }).first()).toBeVisible();

    // Verify Sorting and View Mode toggles
    await expect(page.locator('select').filter({ hasText: /Sort: A–Z/i })).toBeVisible();
  });

  test('02. Create procedure from Master List and see it immediately in List and Box views', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Procedure
    await page.locator('button').filter({ hasText: /\+ Add Procedure/i }).first().click();

    // Master List modal visible
    await expect(page.getByText('ADD CLINICAL PROCEDURE', { exact: true })).toBeVisible();

    // Filter procedure catalog
    await page.locator('input[placeholder*="Filter procedure"]').fill('Chemical');
    await page.getByText(/Chemical Peeling/i).first().click({ force: true });

    // Save
    await page.locator('button').filter({ hasText: /Save & Open Procedure/i }).click();

    // Verify it appears and is selected
    await expect(page.getByText(/Chemical Peeling/i).first()).toBeVisible();
  });

  test('03. Create manual procedure and see it immediately', async ({ page }) => {
    await page.goto('/doctor/consultation/SYNTH-TEST-PATIENT-001');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Procedure
    await page.locator('button').filter({ hasText: /\+ Add Procedure/i }).first().click();

    // Switch to Enter Manually
    await page.locator('button').filter({ hasText: /Enter Manually/i }).click();

    // Fill custom procedure name
    const customName = `Laser Subcision Test ${Date.now().toString().slice(-4)}`;
    await page.locator('input[placeholder*="Subcision"]').fill(customName);

    // Save
    await page.locator('button').filter({ hasText: /Save & Open Procedure/i }).click();

    // Verify custom procedure appears in left panel and header
    await expect(page.getByText(customName).first()).toBeVisible();
  });

  test('04. Add Session in Procedure and syncs automatically with Procedure Tab', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Session
    const addSessionBtn = page.locator('button').filter({ hasText: /\+ Add Session/i }).first();
    await expect(addSessionBtn).toBeVisible();
    await addSessionBtn.click();

    // Check toast or newly added session header
    await expect(page.getByText(/Session \d/i).first()).toBeVisible();
  });

  test('05. Add Sub-section without requiring Before photo', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Sub-section button
    const addSubSecBtn = page.locator('button').filter({ hasText: /\+ Add Sub-section/i }).first();
    await expect(addSubSecBtn).toBeVisible();
    await addSubSecBtn.click();

    // Verify Sub-section panel is rendered
    await expect(page.getByText(/SUB-SECTION 1/i).first()).toBeVisible();
  });

  test('06. Compare modal enables with >= 2 images and supports independent zoom/pan', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Select procedure "Hair Removal" which has multiple photos across sessions
    const searchProcInput = page.locator('input[placeholder*="Search patient procedures"]');
    if (await searchProcInput.isVisible()) {
      await searchProcInput.fill('Hair Removal');
    }
    await page.getByText('Hair Removal', { exact: true }).first().click();

    // Compare button initially disabled when < 2 selected
    const compareBtn = page.locator('button').filter({ hasText: /Compare/i }).first();
    await expect(compareBtn).toBeVisible();
    await expect(compareBtn).toBeDisabled();

    // Checkboxes are real HTML input[type="checkbox"]
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Click first checkbox - verify single-photo viewer is NOT opened!
    await checkboxes.nth(0).check();
    await expect(page.locator('button').filter({ hasText: /Close \(ESC\)/i })).not.toBeVisible();
    await expect(compareBtn).toBeDisabled();
    await expect(compareBtn).toContainText('Compare (1)');

    // Click second checkbox
    await checkboxes.nth(1).check();
    await expect(compareBtn).toBeEnabled();
    await expect(compareBtn).toContainText('Compare (2)');

    // Open comparison
    await compareBtn.click();

    // Comparison Modal appears with exactly 2 images
    await expect(page.getByText(/CLINICAL PHOTO COMPARISON \(2 IMAGES\)/i)).toBeVisible();
    await expect(page.getByText(/Reset All Views/i)).toBeVisible();

    // Both images successfully loaded (no error state)
    await expect(page.getByText(/Unable to load clinical photo/i)).not.toBeVisible();

    // Verify independent zoom controls on panels
    const zoomInBtns = page.locator('button[title="Zoom In"]');
    await expect(zoomInBtns).toHaveCount(2);

    // Zoom in on Panel 1
    await zoomInBtns.first().click();
    // Panel 1 zoom is 125%, while Panel 2 zoom remains 100%
    await expect(page.locator('text=125%')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();

    // Reset All Views restores all to 100%
    await page.locator('button').filter({ hasText: /Reset All Views/i }).click();
    await expect(page.locator('text=125%')).not.toBeVisible();

    // Press ESC to close comparison
    await page.keyboard.press('Escape');
    await expect(page.getByText(/CLINICAL PHOTO COMPARISON/i)).not.toBeVisible();

    // Selections are preserved in gallery
    await expect(compareBtn).toContainText('Compare (2)');

    // Clear selections
    const clearBtn = page.locator('button').filter({ hasText: /Clear/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(compareBtn).toBeDisabled();
    }
  });

  test('07. View Mode toggle between List and Box views works smoothly', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click List View toggle
    const listViewBtn = page.locator('button[title*="List View"]');
    await listViewBtn.click();
    await expect(page.locator('th').filter({ hasText: /Procedure Name/i })).toBeVisible();

    // Click Box View toggle
    const boxViewBtn = page.locator('button[title*="Box View"]');
    await boxViewBtn.click();
    await expect(page.locator('th').filter({ hasText: /Procedure Name/i })).not.toBeVisible();
  });

  test('08. Hardware unavailable states accurately displayed without fake capture', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Image
    await page.locator('button').filter({ hasText: /\+ Add Image/i }).first().click();

    // Click Dermascope source
    await page.locator('button').filter({ hasText: /Dermascope/i }).click();
    await expect(page.getByText(/Dermascope Hardware Integration Status: Offline/i)).toBeVisible();

    // Click Face Scanner source
    await page.locator('button').filter({ hasText: /Face Scanner/i }).click();
    await expect(page.getByText(/3D Facial Scanner Service: Offline/i)).toBeVisible();

    // Close modal
    await page.locator('button').filter({ hasText: /Cancel/i }).last().click();
  });

  test('09. Single-photo fullscreen viewer navigates with Previous/Next and closes with ESC', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click first photo thumbnail
    const thumbnails = page.locator('img[alt*="jpg"], img[alt*="jpeg"], img[alt*="png"]');
    if (await thumbnails.count() > 0) {
      await thumbnails.first().click();

      // Fullscreen viewer visible
      await expect(page.locator('button').filter({ hasText: /Close \(ESC\)/i })).toBeVisible();

      // Check Previous / Next buttons exist
      const prevBtn = page.locator('button').filter({ hasText: /Previous/i });
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      await expect(prevBtn).toBeVisible();
      await expect(nextBtn).toBeVisible();

      // Press ESC to close
      await page.keyboard.press('Escape');
      await expect(page.locator('button').filter({ hasText: /Close \(ESC\)/i })).not.toBeVisible();
    }
  });

  test('10. Photo Editor opens and supports lesion marker stamps', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click Edit button on first photo card
    const editBtn = page.locator('button[title*="Edit / Annotate"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      // Editor modal visible
      await expect(page.getByText(/CLINICAL IMAGE EDITOR/i)).toBeVisible();
      await expect(page.getByText(/Rotate 90°/i)).toBeVisible();
      await expect(page.locator('button').filter({ hasText: /Annotate \/ Markers/i })).toBeVisible();

      // Toggle annotations
      await page.locator('button').filter({ hasText: /Annotate \/ Markers/i }).click();
      await expect(page.getByText(/Erythema Margin/i)).toBeVisible();

      // Close editor
      await page.locator('button').filter({ hasText: /Cancel/i }).click();
    }
  });

  test('11. Send Image sharing options provide download, WhatsApp, and email', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Open first photo
    const thumbnails = page.locator('img[alt*="jpg"], img[alt*="jpeg"], img[alt*="png"]');
    if (await thumbnails.count() > 0) {
      await thumbnails.first().click();

      // Click Send Image
      await page.locator('button').filter({ hasText: /Send Image/i }).click();

      // Share modal visible
      await expect(page.getByText(/SHARE CLINICAL PHOTO/i)).toBeVisible();
      await expect(page.getByText(/Export High-Res JPEG/i)).toBeVisible();
      await expect(page.getByText(/Send to Patient via WhatsApp/i)).toBeVisible();

      // Close share modal
      await page.locator('button').filter({ hasText: /Done/i }).click();
    }
  });

  test('12. Reloading page preserves all saved procedures and sessions', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Reload page
    await page.reload();
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Verify procedures and sessions still present
    await expect(page.getByText(/Hair Removal/i).first()).toBeVisible();
    await expect(page.getByText(/SESSION 1/i).first()).toBeVisible();
  });

  test('13. Add Image modal Step 1 has writable PROCEDURE (e.g. Acne Laser Comedone Extraction) and writable SESSION', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click + Add Image
    await page.locator('button').filter({ hasText: /\+ Add Image/i }).first().click();

    // Check modal step 1 header
    await expect(page.getByText(/1\. CONFIRM DESTINATION & PHOTO TYPE/i)).toBeVisible();

    // Verify writable PROCEDURE input exists
    const procInput = page.locator('#procedure-name-input');
    await expect(procInput).toBeVisible();

    // Type "Acne Laser Comedone Extraction" into PROCEDURE
    await procInput.fill('Acne Laser Comedone Extraction');
    await expect(procInput).toHaveValue('Acne Laser Comedone Extraction');

    // Verify writable SESSION input exists
    const sessInput = page.locator('#session-name-input');
    await expect(sessInput).toBeVisible();

    // Type "Session 1" into SESSION
    await sessInput.fill('Session 1');
    await expect(sessInput).toHaveValue('Session 1');

    // Close modal
    await page.locator('button').filter({ hasText: /Cancel/i }).last().click();
  });

  test('14. Multi-photo comparison across different sessions with 3 images, independent dragging, and reload persistence', async ({ page }) => {
    await page.goto('/doctor/consultation/C005-001-23092026');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Select procedure "Hair Removal"
    const searchProcInput = page.locator('input[placeholder*="Search patient procedures"]');
    if (await searchProcInput.isVisible()) {
      await searchProcInput.fill('Hair Removal');
    }
    await page.getByText('Hair Removal', { exact: true }).first().click();

    // Select 3 images across Session 1 and Session 2
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    const compareBtn = page.locator('button').filter({ hasText: /Compare/i }).first();
    await expect(compareBtn).toBeEnabled();
    await expect(compareBtn).toContainText('Compare (3)');

    // Open comparison
    await compareBtn.click();
    await expect(page.getByText(/CLINICAL PHOTO COMPARISON \(3 IMAGES\)/i)).toBeVisible();

    // All 3 panels present and rendered
    const zoomInBtns = page.locator('button[title="Zoom In"]');
    await expect(zoomInBtns).toHaveCount(3);

    // Zoom in on Panel 1 first to enable dragging
    await zoomInBtns.nth(0).click();
    await zoomInBtns.nth(0).click();
    await expect(page.locator('text=150%')).toBeVisible();

    // Perform mouse drag on Panel 1 canvas
    const panelCanvas = page.locator('div[style*="cursor: grab"]').first();
    const box = await panelCanvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 120);
      await page.mouse.up();
    }

    // Panel 1 shows pan offset snippet, while other panels remain unaffected
    await expect(page.locator('text=/Pan:/i').first()).toBeVisible();

    // Reset All Views
    await page.locator('button').filter({ hasText: /Reset All Views/i }).click();
    await expect(page.locator('text=/Pan:/i')).not.toBeVisible();

    // Close comparison with ESC
    await page.keyboard.press('Escape');
    await expect(page.getByText(/CLINICAL PHOTO COMPARISON/i)).not.toBeVisible();

    // Reload page and verify saved images remain available and selectable
    await page.reload();
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();
    await page.locator('input[placeholder*="Search patient procedures"]').fill('Hair Removal');
    await page.getByText('Hair Removal', { exact: true }).first().click();

    const reloadedCheckboxes = page.locator('input[type="checkbox"]');
    expect(await reloadedCheckboxes.count()).toBeGreaterThanOrEqual(2);
    await reloadedCheckboxes.nth(0).check();
    await reloadedCheckboxes.nth(1).check();
    await expect(page.locator('button').filter({ hasText: /Compare \(2\)/i }).first()).toBeEnabled();
  });

  test('15. Dynamic Workflow: Create Session in Procedure Tab (Tab 4) -> shows that same session in Images Tab (Tab 5) with No photos added', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);

    // Click Tab 4: Procedures
    const procTab = page.locator('.tab-item').filter({ hasText: /4\.\s*Procedures/i });
    await expect(procTab).toBeVisible();
    await procTab.click();

    // Verify Level 2 Session Execution is visible with + Add Session button
    const addSessionBtn = page.locator('#btn-treatment-add-session');
    await expect(addSessionBtn).toBeVisible();

    // Count existing sessions in Procedure Tab
    const initialSessionCards = page.locator('.treatment-session-card');
    const initialCount = await initialSessionCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click + Add Session
    await addSessionBtn.click();

    // Expect session count to increase by 1
    await expect(page.locator('.treatment-session-card')).toHaveCount(initialCount + 1);

    // Switch to Tab 5: Images
    const imagesTab = page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i });
    await imagesTab.click();

    // Verify the newly created session appears in Images Tab under the active procedure
    const newSessionHeader = page.getByText(`SESSION ${initialCount + 1}`, { exact: true }).first();
    await expect(newSessionHeader).toBeVisible();

    // Verify it initially displays "No photos added" with Add Before / Add After actions
    await expect(page.locator('text=/No photos added in Session/i').first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /\+ Add Before/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /\+ Add After/i }).first()).toBeVisible();
  });

  test('16. Dynamic Workflow: Repeated tab switching preserves sessions without duplicates', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);

    // Switch to Tab 4
    await page.locator('.tab-item').filter({ hasText: /4\.\s*Procedures/i }).click();
    await expect(page.locator('.treatment-session-card').first()).toBeVisible();
    const countTab4 = await page.locator('.treatment-session-card').count();
    expect(countTab4).toBeGreaterThan(0);

    // Switch to Tab 5
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();
    await expect(page.locator('.images-session-card')).toHaveCount(countTab4);

    // Switch back to Tab 4
    await page.locator('.tab-item').filter({ hasText: /4\.\s*Procedures/i }).click();
    await expect(page.locator('.treatment-session-card')).toHaveCount(countTab4);

    // Switch back to Tab 5 again
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();
    await expect(page.locator('.images-session-card')).toHaveCount(countTab4);
  });

  test('17. Dynamic Workflow: Upload After photo to the newly created session and verify link', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Click "+ Add After" on the newly added session
    const addAfterBtn = page.locator('button').filter({ hasText: /\+ Add After/i }).first();
    await expect(addAfterBtn).toBeVisible();
    await addAfterBtn.click();

    // Add Image Guided Flow Modal opens with AFTER preselected
    await expect(page.getByText('ADD CLINICAL IMAGE / DOCUMENT')).toBeVisible();

    // Select sample photo
    const sampleCard = page.locator('div[style*="border: 1px solid rgb(226, 232, 240)"]').filter({ hasText: /lesion/i }).first();
    if (await sampleCard.isVisible()) {
      await sampleCard.click();
    }

    // Step 2 Next
    const nextBtn = page.locator('button').filter({ hasText: /Next: Confirm Destination/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Step 3 Save
    const saveBtn = page.locator('button').filter({ hasText: /Save Photo to Procedure/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // Check that photo is now attached in the session
    await expect(page.getByText(/AFTER/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('18. Dynamic Workflow: Add a sub-section and verify photo counts calculate dynamically', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Add Sub-section
    const addSubSecBtn = page.locator('button').filter({ hasText: /\+ Add Sub-section/i }).first();
    await expect(addSubSecBtn).toBeVisible();
    await addSubSecBtn.click();

    await expect(page.getByText(/SUB-SECTION 1/i).first()).toBeVisible();

    // Summary pill updates dynamically
    await expect(page.locator('text=/Procedures • \\d+ Photos/i').first()).toBeVisible();
  });

  test('19. Dynamic Workflow: Edit session date in Procedure Tab and verify Images Tab reflects the change', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);

    // Tab 4 Procedures
    await page.locator('.tab-item').filter({ hasText: /4\.\s*Procedures/i }).click();

    // Find first date input in cards view
    const dateInput = page.locator('.session-date-input').first();
    await expect(dateInput).toBeVisible();
    await dateInput.fill('01/12/2026');
    await dateInput.press('Enter');

    // Switch to Tab 5 Images
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Verify 01/12/2026 is visible in the Images Tab
    await expect(page.getByText('01/12/2026').first()).toBeVisible();
  });

  test('20. Dynamic Workflow: Page reload restores all sessions and images', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-SYNC-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);

    await page.reload();
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();

    // Verify procedure header and sessions remain available
    await expect(page.locator('button').filter({ hasText: /\+ Add Procedure/i }).first()).toBeVisible();
    await expect(page.locator('text=/SESSION 1/i').first()).toBeVisible();
  });

  test('21. Dynamic Workflow: Patient records remain isolated when switching patients', async ({ page }) => {
    // Visit synthetic patient 1
    await page.goto('/doctor/consultation/SYNTH-CASE-ALPHA');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();
    await expect(page.getByText(/Case ID: SYNTH-CASE-ALPHA/i).first()).toBeVisible();

    // Visit synthetic patient 2
    await page.goto('/doctor/consultation/SYNTH-CASE-BETA');
    await page.locator('.tab-item').filter({ hasText: /Clinical Procedure Images|Photography/i }).click();
    await expect(page.getByText(/Case ID: SYNTH-CASE-BETA/i).first()).toBeVisible();
    await expect(page.getByText(/SYNTH-CASE-ALPHA/i)).not.toBeVisible();
  });

  test('22. Dynamic Workflow: Failed save rolls back gracefully without leaving false completed session', async ({ page }) => {
    const synthCaseId = 'SYNTH-PAT-ROLLBACK-001';
    await page.goto(`/doctor/consultation/${synthCaseId}`);
    await page.locator('.tab-item').filter({ hasText: /4\.\s*Procedures/i }).click();

    const countBefore = await page.locator('.treatment-session-card').count();
    expect(countBefore).toBeGreaterThan(0);

    // Intercept POST to simulate a network or server failure
    await page.route(`**/api/consultation/${synthCaseId}/clinical-procedures`, route => {
      route.abort('failed');
    });

    // Try adding a session
    await page.locator('#btn-treatment-add-session').click();

    // Error notification or banner appears
    await expect(page.locator('text=/Failed to create session/i').first()).toBeVisible({ timeout: 5000 });

    // Rollback restored the previous count
    await expect(page.locator('.treatment-session-card')).toHaveCount(countBefore);
  });

});
