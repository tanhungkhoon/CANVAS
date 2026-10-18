# Quickstart & Validation Guide: Country Detail Sublayers

**Feature**: `002-country-detail-sublayers`
**Phase**: 1 — Design
**Date**: 2026-10-18

> This guide covers how to validate that the feature works end-to-end once implemented.
> It is not an implementation guide — code structure and test suites are in `tasks.md`.

---

## Prerequisites

| Requirement | Detail |
|-------------|--------|
| Node.js | ≥ 18 (ESM support) |
| Dependencies installed | `npm install` from repo root |
| All packages built | `npm run build` from repo root (or `npm run build` in `packages/core` then `packages/map-engine`) |
| Dev server running | `npm run dev` in `apps/web` (Vite dev server, default `http://localhost:5173`) |
| Tile provider reachable | The demo MapLibre tile URL (`https://demotiles.maplibre.org/style.json`) must be reachable for base map tiles. Country detail sublayer tile sources use the URLs configured in `CountryDetailConfig.definitions` |

---

## Scenario 1: Automatic Sublayer Activation on Zoom-In

**What this validates**: FR-001, FR-002, FR-003, SC-001, User Story 1 (P1)

**Steps**:

1. Open `http://localhost:5173` in a browser.
2. Confirm the base map loads and is interactive (panning, zooming work).
3. In the developer console, inject a test country sublayer definition (or use the management UI if implemented):

   ```
   // Pseudocode — actual API call via useCountryDetailManager hook or direct manager call
   countryDetailManager.addDefinition({
     countryCode: 'MY',           // Malaysia
     name: 'Malaysia — Administrative Boundaries',
     detailCategory: 'administrative',
     minZoomThreshold: 5.0,
     tileSourceUrl: '<your-vector-tile-url-for-MY-admin-boundaries>'
   });
   ```

4. Zoom the map into Malaysia (approximately `[109.5, 3.9]`).
5. At zoom level ≥ 5.0:
   - **Expected**: The Malaysia administrative boundary sublayer renders on the map below all semantic layers.
   - **Expected**: The sublayer appears in the layer dock under a "MAP DETAIL LAYERS" (or equivalent) grouped header.
   - **Expected**: Activation happens within 500 ms of the map settling at zoom ≥ 5.0 (SC-001).

6. Zoom back out to zoom < 5.0 or pan to a different region.
   - **Expected**: The sublayer disappears from the map view (visibility set to `none`).
   - **Expected**: The sublayer entry disappears from the layer dock (no longer auto-active).

---

## Scenario 2: User Visibility Toggle in Layer Dock

**What this validates**: FR-013, FR-014, SC-002, User Story 3 (P3)

**Steps**:

1. Using the setup from Scenario 1, zoom into Malaysia at zoom ≥ 5.0 so the sublayer is active and visible in the dock.
2. In the layer dock, locate the "Malaysia — Administrative Boundaries" entry under the country detail sublayer group.
3. Click the visibility toggle icon on that entry to hide it.
   - **Expected**: The sublayer immediately disappears from the map.
   - **Expected**: The visibility toggle icon reflects the hidden state (e.g., eye-slash icon).
   - **Expected**: The action completes in < 50 ms (no perceptible lag).

4. Zoom out to < 5.0 and back in to ≥ 5.0 (simulating a zoom cycle).
   - **Expected**: The sublayer does **not** reappear in the map view or toggle back to visible automatically (FR-014 — user-hidden state is sticky).
   - **Expected**: The sublayer entry still shows in the dock as hidden.

5. Click the visibility toggle again to re-enable the sublayer.
   - **Expected**: The sublayer becomes visible on the map immediately (since zoom threshold is still met).

---

## Scenario 3: Multiple Sublayers at Different Zoom Thresholds

**What this validates**: FR-006, User Story 2 (P2)

**Steps**:

1. Register two definitions for Malaysia:
   - Definition A: `detailCategory: 'administrative'`, `minZoomThreshold: 5.0`
   - Definition B: `detailCategory: 'transport'`, `minZoomThreshold: 8.0`

2. Zoom into Malaysia to zoom level 6.0.
   - **Expected**: Only Definition A is active and visible on the map and in the dock.

3. Continue zooming to zoom level 9.0.
   - **Expected**: Both Definition A and Definition B are active and visible on the map and in the dock.

4. Zoom back out to 6.5.
   - **Expected**: Definition B deactivates (disappears from map and dock). Definition A remains active.

---

## Scenario 4: Layer Isolation — Semantic Layers Unaffected

**What this validates**: FR-004, FR-005, FR-011, User Story 4 (P4), SC-003

**Steps**:

1. Create a semantic layer named "Test Layer" and draw (or place) a test entity on it.
2. Note the entity's position and the layer's current state (visible, unlocked, order).
3. Zoom into Malaysia so country detail sublayers activate.
4. Verify:
   - **Expected**: The test entity's visual position is unchanged.
   - **Expected**: "Test Layer" still appears above the country detail sublayer entries in the layer dock.
   - **Expected**: The "Test Layer" is still the active layer (or remains as previously set).
   - **Expected**: Clicking on the map canvas still selects/interacts with semantic layer entities (country detail sublayers do not capture input).

5. Attempt to drag a country detail sublayer entry in the layer dock to reorder it.
   - **Expected**: Drag has no effect; the sublayer remains in its fixed position in the dock (or a tooltip/message indicates it is read-only).

6. Attempt to click on the sublayer entry to set it as the active layer.
   - **Expected**: The active layer does not change; the country detail sublayer cannot be activated as the drawing target.

---

## Scenario 5: Workspace Export / Import with Sublayer Config

**What this validates**: FR-008, SC-005, User Story 4 (P4) scenario 3

**Steps**:

1. With at least one country detail sublayer configured (Scenario 1 setup) and a user visibility override applied (Scenario 2 step 3 — one sublayer hidden):
2. Use the "Export Workspace" action in the workspace menu to download a JSON file.
3. Open the exported JSON and verify:
   - **Expected**: `schemaVersion` is `"1.1.0"`.
   - **Expected**: `countryDetailConfig.definitions` contains the registered definition(s).
   - **Expected**: `countryDetailConfig.sublayerVisibilityOverrides` contains the hidden override (`{ "<definitionId>": false }`).

4. Reset the workspace (or reload the app fresh).
5. Use "Import Workspace" to load the exported file.
6. Zoom into Malaysia.
   - **Expected**: The country detail sublayer is active but rendered as user-hidden (the override is restored from the file).
   - **Expected**: The definition appears in the dock in the hidden state without the user needing to toggle it again.

---

## Scenario 6: Border Region — Single Country Activation

**What this validates**: FR-009 (deterministic border resolution), Edge Case "Ambiguous Region at Borders"

**Steps**:

1. Configure overlapping sublayers for two neighbouring countries (e.g., Malaysia `MY` and Indonesia `ID`) each with `minZoomThreshold: 5.0`.
2. Zoom to a viewport centred exactly on the Malaysia–Indonesia border (Borneo, approx. `[117.0, 4.5]`) at zoom ≥ 5.0.
   - **Expected**: Only one country's sublayers activate — the country whose polygon the viewport center point falls inside. No duplicate dual-country sublayer stacking occurs.
3. Pan slightly deeper into Malaysia territory.
   - **Expected**: Malaysia sublayers are (or remain) active. Indonesian sublayers are inactive.
4. Pan into Indonesia territory.
   - **Expected**: Indonesia sublayers activate. Malaysia sublayers deactivate.

---

## Scenario 7: v1.0.0 Workspace Migration

**What this validates**: Schema migration — backward compatibility

**Steps**:

1. Obtain or create a valid `CanvasWorkspace` JSON document with `schemaVersion: "1.0.0"` (save one from the Feature 001 implementation before upgrading, or craft one manually without the `countryDetailConfig` field).
2. Import that file using the workspace import action.
   - **Expected**: Import succeeds without an error (no schema validation failure).
   - **Expected**: The imported workspace has `schemaVersion: "1.1.0"` internally.
   - **Expected**: `countryDetailConfig` is initialized as `{ definitions: [], sublayerVisibilityOverrides: {} }`.
   - **Expected**: All semantic layers, base map config, and other data from the original document are preserved exactly.

---

## Key Artifacts Reference

| Artifact | Location |
|----------|----------|
| Country detail config schema | [contracts/country-detail-config.schema.json](./contracts/country-detail-config.schema.json) |
| Sublayer event type contracts | [contracts/sublayer-event-types.ts](./contracts/sublayer-event-types.ts) |
| Workspace v1.1 schema | [contracts/workspace-v1.1.schema.json](./contracts/workspace-v1.1.schema.json) |
| Data model (entities + state machine) | [data-model.md](./data-model.md) |
| Research decisions | [research.md](./research.md) |

---

## Expected Test Coverage (Unit + Integration)

The following are the key test scenarios that `tasks.md` (Phase 2) must cover:

| Area | Test Scope |
|------|-----------|
| `CountryDetailManager.evaluateViewport` | Point-in-polygon correct for 5+ countries; bounding-box pre-filter correctly skips non-candidates; border tie-break is deterministic |
| `CountryDetailManager.setVisibilityOverride` | Override persists; zoom re-evaluation does not override user-hidden; clearing override restores auto-activation control |
| `CountryDetailManager.getVisibleDefinitions` | Only returns auto-active AND not user-hidden definitions |
| Schema migration | v1.0.0 document without `countryDetailConfig` migrates cleanly; v1.1.0 validates correctly; invalid documents are rejected |
| `CountryDetailSyncEngine` | `sublayer:activated` → `addLayer` called with correct `beforeId`; `sublayer:deactivated` → `setLayoutProperty('visibility', 'none')`; no mutation of semantic layer state |
| `CountrySublayerItem` (UI) | Visibility toggle emits correct callback; reorder/lock interactions are blocked; active layer not changed on click |
| `LayerDock` with sublayers | Sublayer group renders below semantic layers; count badge updates; empty group is not shown |
