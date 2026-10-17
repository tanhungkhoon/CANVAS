# Quickstart Validation Guide: Base Map & Layer Management

**Feature**: `001-base-map-layers`  
**Date**: 2026-10-17  
**Status**: Completed  

This guide provides end-to-end verification scenarios to validate the implementation of **Base Map & Layer Management** against the feature specification and success criteria.

---

## 1. Prerequisites & Environment Setup

- **Node.js**: v20.x or higher (verified with v22.11.0)
- **Package Manager**: npm v10.x or higher
- **Browser**: Modern Chromium, Firefox, or Safari with WebGL enabled

### Setup Commands
```bash
# Install dependencies across the monorepo workspace
npm install

# Build all packages (@canvas/core, @canvas/map-engine, @canvas/web)
npm run build
```

---

## 2. Automated Test Verification (TDD Quality Gate)

Run the test suites to verify that core invariants, coordinate transforms, and serialization contracts hold:

```bash
# Run unit & contract tests in @canvas/core
npm run test --workspace=@canvas/core

# Run rendering & adapter tests in @canvas/map-engine
npm run test --workspace=@canvas/map-engine

# Run all test suites with coverage
npm run test:coverage
```

### Expected Test Results:
- `LayerManager`:
  - Enforces minimum 1 layer invariant (`FR-012`).
  - Throws `InvalidLayerCountError` when attempting to delete the last remaining layer.
  - Generates valid UUID v4 layer identifiers.
  - Clamps opacity strictly to `[0.0, 1.0]`.
- `Serialization`:
  - `serialize()` produces JSON adhering to [workspace-schema.json](./contracts/workspace-schema.json).
  - `deserialize()` rejects out-of-bounds coordinates (e.g., latitude > 90.0) with `InvalidCoordinatesError`.
- `EventBroker`:
  - Dispatches `layer:reordered`, `layer:visibility-changed`, and `layer:opacity-changed` events with correct payloads.

---

## 3. End-to-End User Scenario Walkthrough

Launch the development server:
```bash
npm run dev --workspace=@canvas/web
```
Open `http://localhost:5173` in a WebGL-enabled browser.

### Scenario A: Base Map Rendering & Navigation (User Story 1 / SC-001)
1. **Action**: Open the application URL.
2. **Verification**:
   - The geographical base map renders completely within **2 seconds** (`SC-001`).
   - Drag to pan across the map; scroll to zoom.
   - Panning and zooming remain fluid and responsive at 60 FPS (`SC-003`).

### Scenario B: Semantic Layer Management (User Story 2 / SC-002 & SC-005)
1. **Action**: In the Layer Panel on the right dock, click **"New Layer"**.
2. **Input**: Enter Name: `"Tactical Grid"`, Category: `"tactical"`.
3. **Verification**:
   - The new layer appears in the panel and becomes active.
4. **Action**: Add a second layer named `"Environmental Zones"` (Category: `"environmental"`).
5. **Action**: Drag `"Environmental Zones"` above `"Tactical Grid"`.
6. **Verification**:
   - The layer list reorders; canvas visual z-index updates in **< 50ms** (`SC-002`).
7. **Action**: Click the eye icon to toggle visibility off on `"Tactical Grid"`.
8. **Verification**:
   - Tactical Grid entities are hidden from view without data loss.
9. **Action**: Adjust the opacity slider on `"Environmental Zones"` to 50%.
10. **Verification**:
    - The layer renders with 50% transparency.

### Scenario C: Workspace Persistence & Restoration (User Story 3 / SC-004)
1. **Action**: Click **"File" → "Export Workspace"**.
2. **Verification**:
   - A `.canvas.json` file downloads, containing valid `schemaVersion: "1.0.0"`.
3. **Action**: Refresh the browser page (or click **"File" → "New Workspace"**).
4. **Action**: Click **"File" → "Import Workspace"** and select the downloaded file.
5. **Verification**:
   - Base map position, zoom level, layer names, ordering, visibility states, and opacity values are 100% restored without errors (`SC-004`).
