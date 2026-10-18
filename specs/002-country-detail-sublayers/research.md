# Research: Country Detail Sublayers

**Feature**: `002-country-detail-sublayers`
**Phase**: 0 — Research & Decision Log
**Date**: 2026-10-18

---

## 1. Country Boundary Data Source

**Decision**: Bundle **Natural Earth 50m simplified polygons** as a static GeoJSON asset in `packages/core/src/data/country-boundaries.geo.json`.

**Rationale**:
- Natural Earth is public domain, OGC-compliant, and widely used in open mapping projects — aligns with the constitution's OGC standards requirement.
- 50m resolution (~150 KB minified) offers sufficient polygon fidelity for country-level zoom activation without excessive bundle weight. 110m is too coarse for small countries (e.g., Singapore, Monaco); 10m is ~4 MB — prohibitive.
- Bundling eliminates runtime HTTP dependency: country membership tests work offline, satisfying FR-010 (graceful data unavailability for tile layers does not affect polygon matching).
- Each feature carries `ISO_A2` (alpha-2) and `ISO_A3` (alpha-3) properties — matches the ISO 3166-1 standard called out in FR-001 and the spec Assumptions.

**Alternatives Considered**:
- **Runtime API (e.g., REST Countries, OpenStreetMap Nominatim)**: Rejected — introduces network latency into the critical zoom-activation path; breaks offline capability; adds an external service dependency.
- **110m polygons**: Rejected — too coarse for small-area countries; would cause incorrect early/late activation near dense border regions.
- **10m polygons**: Rejected — bundle size (~4 MB) is unacceptable for a web app initial load.

---

## 2. Viewport-Country Membership Algorithm

**Decision**: **Bounding-box pre-filter → point-in-polygon (ray-casting) on viewport center**.

**Rationale**:
- Two-stage approach: (1) quickly discard non-candidate countries using axis-aligned bounding box comparison against viewport center `[lng, lat]`; (2) run ray-casting polygon containment only on the ≤ 5 remaining candidates (typical for dense border regions).
- Viewport center is used as the primary signal rather than viewport coverage area. This avoids expensive polygon-polygon intersection computation, which would be O(n²) in the worst case, while still satisfying FR-009's majority-viewport-area intent at practical zoom levels (when zoomed into a country, the center almost always lies within that country's polygon).
- For the FR-009 border-ambiguity edge case: when the viewport center falls on an ambiguous border region (within 0.5° of a country boundary), the system breaks ties by selecting the country whose bounding box the center is *most deeply inside* (smallest distance from center to nearest bounding-box edge — a stable, deterministic heuristic).
- Ray-casting is implemented in pure TypeScript with no external library dependency — keeps `@canvas/core` dependency-free of geometry libraries.

**Alternatives Considered**:
- **Turf.js `booleanPointInPolygon`**: Rejected — adds ~200 KB to `@canvas/core` bundle for a single function; also pulls in GeoJSON type conflicts with existing project types.
- **MapLibre `queryRenderedFeatures`**: Rejected — ties polygon membership to the render pipeline, introducing async coupling and a render-frame dependency. Also not accessible from `@canvas/core` (which must remain UI-framework agnostic).
- **Full viewport coverage (polygon-polygon intersection)**: Rejected — computationally expensive; ray-casting on viewport center is sufficient given FR-009's "majority area" intent.

---

## 3. Zoom Threshold Event Strategy

**Decision**: Listen to MapLibre's **`moveend`** event (fires once after pan/zoom gesture settles), debounced to avoid re-evaluation during animated transitions.

**Rationale**:
- `moveend` fires once when the map comes to rest — correct semantic for "did the user arrive at a new location/zoom?".
- Using `zoom` (fires continuously during pinch/scroll) would evaluate country membership dozens of times per second — unnecessary thrashing of the polygon containment algorithm.
- A 100 ms debounce guard prevents redundant calls when MapLibre fires `moveend` multiple times during a programmatic `flyTo` animation.
- This directly satisfies SC-001 (≤ 500 ms activation latency from zoom settling) while respecting the constitution's ≤ 16 ms frame rendering budget (membership evaluation never runs on-frame).

**Alternatives Considered**:
- **`zoom` event (continuous)**: Rejected — triggers hundreds of evaluations per zoom gesture; violates the YAGNI/simplicity principle of Constitution §V.
- **`zoomend` only**: Rejected — does not fire during pan-only movements that might change the country in viewport without changing zoom level.
- **Polling interval**: Rejected — wastes CPU when the map is idle; does not align with event-driven architecture required by Constitution §II.

---

## 4. Sublayer Rendering Strategy in MapLibre

**Decision**: Add country detail sublayers as **MapLibre vector tile sources with `beforeId`** pointing to the first semantic layer's map layer ID.

**Rationale**:
- MapLibre's `addLayer(layer, beforeId)` inserts a layer *below* the specified layer in the render stack — exactly the required z-order (sublayers below all semantic layers, above base map tiles).
- Vector tile sources are the correct format for geographic reference data (boundaries, roads, terrain). They are style-driven, resolution-independent, and support filtering by zoom level natively via MapLibre style `minzoom`/`maxzoom` properties — complementing the application-level zoom threshold without duplication.
- When a sublayer is deactivated (user toggle or zoom-out), its MapLibre layer is set to `visibility: 'none'` rather than removed — avoids the source/layer reload cost on re-activation.
- The `CountryDetailSyncEngine` uses the same `setLayoutProperty('visibility', ...)` pattern as the existing `LayerSyncEngine` for consistency.

**Alternatives Considered**:
- **GeoJSON source (bundled polygon data rendered directly)**: Considered for administrative boundary sublayers at lower zoom levels — rejected for primary rendering because GeoJSON sources do not scale well at high zoom with dense feature sets (e.g., road networks). GeoJSON sources remain appropriate for the country membership polygon data used in membership tests (a separate internal concern, not rendered via MapLibre).
- **Raster tile overlay**: Rejected — lower fidelity, no style control, cannot support interactive feature queries in future enhancements.
- **Remove/re-add layer on activation toggle**: Rejected — incurs tile re-fetch latency; `visibility: 'none'` / `'visible'` toggle is instant.

---

## 5. Workspace Schema Migration Strategy

**Decision**: Bump `CanvasWorkspace.schemaVersion` from `"1.0.0"` → `"1.1.0"` with a **backward-compatible migration function** in `workspace-serializer.ts`.

**Rationale**:
- Existing workspaces saved at `1.0.0` do not have a `countryDetailConfig` field. The migration adds an empty `countryDetailConfig: { definitions: [], sublayerVisibilityOverrides: {} }` when loading a v1.0.0 document — safe, additive, non-destructive.
- Zod's `CanvasWorkspaceSchema` will be updated to accept both `"1.0.0"` (via migration pre-parse) and `"1.1.0"` as valid schema versions, with the migration running in `deserializeWorkspace` before validation.
- Serialization always writes `"1.1.0"` — once upgraded, a workspace carries the new schema permanently.
- This pattern matches the constitution's "deterministic, schema-versioned JSON" serialization requirement (§ Technical Constraints).

**Alternatives Considered**:
- **Separate config file for country detail**: Rejected — violates the single-document workspace contract established in Feature 001; breaks `SC-005` (100% config fidelity on export/import of a single file).
- **Keep `schemaVersion: "1.0.0"` with optional field**: Rejected — ambiguous schema versioning; makes it impossible to distinguish migrated from legacy documents in future tooling.

---

## 6. User Visibility Override State Management

**Decision**: Store per-sublayer user visibility overrides in **`CountryDetailManager`** as a runtime map `Map<sublayerDefinitionId, boolean>`, persisted in `countryDetailConfig.sublayerVisibilityOverrides` in the workspace JSON.

**Rationale**:
- User visibility overrides are orthogonal to auto-activation state. A sublayer can be "auto-activated by zoom" but "user-hidden" — the display result is hidden. The override wins.
- Storing overrides in `CountryDetailManager` (not in the MapLibre adapter or UI layer) keeps the domain logic testable without a rendered map.
- The override map is keyed by `CountrySublayerDefinition.id` (not by country code), supporting multiple sublayers per country with independent override states.
- On workspace save, the override map is serialized into the JSON document. On load, it is restored — satisfying FR-014 (user explicit hidden state persists) and SC-005 (100% fidelity on import).

**Alternatives Considered**:
- **Store overrides in React state only**: Rejected — lost on workspace export/import; violates FR-014 and SC-005.
- **Store overrides as a property on each `CountrySublayerDefinition`**: Rejected — conflates configuration (what sublayers exist) with runtime user preference (should this one be shown right now); makes resetting user preferences require cloning the configuration.
