import { test, expect } from '@playwright/test';

test.describe('CANVAS Base Map & Layer Management E2E', () => {
  test('renders base map and initializes coordinates within SLA (SC-001)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Verify HUD coordinates appear within 2 seconds
    const hud = page.locator('[data-testid="map-coordinates-hud"]');
    await expect(hud).toBeVisible({ timeout: 2000 });

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2000);
  });

  test('creates new layer and updates layer dock', async ({ page }) => {
    await page.goto('/');

    // Click Add Layer
    await page.click('[data-testid="btn-add-layer"]');

    // Fill in layer form
    await page.fill('[data-testid="input-new-layer-name"]', 'Hazard Perimeter');
    await page.selectOption('[data-testid="select-new-layer-category"]', 'environmental');
    await page.click('[data-testid="btn-confirm-add-layer"]');

    // Verify layer is present in dock
    const layerDock = page.locator('[data-testid="layer-dock"]');
    await expect(layerDock).toContainText('Hazard Perimeter');
    await expect(layerDock).toContainText('ENVIRONMENTAL');
  });

  test('toggles visibility and adjusts opacity (SC-002)', async ({ page }) => {
    await page.goto('/');

    // Create a secondary layer
    await page.click('[data-testid="btn-add-layer"]');
    await page.fill('[data-testid="input-new-layer-name"]', 'Tactical Alpha');
    await page.click('[data-testid="btn-confirm-add-layer"]');

    // Find visibility button
    const visibilityBtn = page.locator('button[data-testid^="btn-visibility-"]').first();
    await visibilityBtn.click();

    // Adjust opacity
    const opacitySlider = page.locator('input[data-testid^="slider-opacity-"]').first();
    await opacitySlider.fill('40');
    await expect(opacitySlider).toHaveValue('40');
  });

  test('exports workspace configuration (SC-004)', async ({ page }) => {
    await page.goto('/');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="btn-export-workspace"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.canvas.json');
  });
});
