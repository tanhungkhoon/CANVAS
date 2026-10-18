# Implementation Plan: Country Detail Sublayers

**Branch**: `002-country-detail-sublayers` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-country-detail-sublayers/spec.md`

## Summary

Add a system-managed **Country Detail Sublayer** subsystem that automatically activates richer geographic reference layers (administrative boundaries, transport networks, terrain) when the map viewport zooms into a country's region beyond a configured threshold. Active sublayers appear in the layer dock as read-only, labelled entries in a dedicated group below semantic layers — visible to the user, toggleable for visibility, but not editable. The implementation adds new domain models and services to `@canvas/core`, a new `CountryDetailSyncEngine` in `@canvas/map-engine` driven by `ViewportController` zoom/move events, and extends `LayerDock` + `App.tsx` in `@canvas/web` to render the sublayer group. The `CanvasWorkspace` schema is bumped to `1.1.0` with backward-compatible migration to carry sublayer configuration and per-sublayer user visibility overrides.

## Technical Context

**Language/Version**: TypeScript 5.6 (ESM modules, strict mode)

**Primary Dependencies**:
- `@canvas/core` — domain models, Zod schemas, EventBroker, LayerManager
- `@canvas/map-engine` — MapLibreMapAdapter (MapLibre GL JS 4.7), ViewportController
- `maplibre-gl` ^4.7.1 — map rendering and viewport events (`zoom`, `move` / `moveend`)
- `zod` ^3.23 — runtime schema validation
- `react` ^18.3, `react-dom` ^18.3 — UI layer (`@canvas/web`)
- `vite` ^5.4 — bundler for web app
- `vitest` ^2.1 — test runner across all packages

**Storage**: No persistent backend database. Workspace state is serialized to JSON (schema-versioned). Country boundary GeoJSON data is bundled as static assets in `@canvas/core` (Natural Earth 110m / 50m polygons, pre-simplified).

**Testing**: `vitest run` per package (`@canvas/core`, `@canvas/map-engine`); `@canvas/web` has no dedicated test runner currently — component behaviour validated via `quickstart.md` manual scenarios.

**Target Platform**: Desktop/tablet web browser (modern Chromium / Firefox / Safari). WASM via MapLibre GL JS.

**Project Type**: Monorepo web application (`apps/web`) backed by internal TypeScript packages (`packages/core`, `packages/map-engine`).

**Performance Goals**:
- Sublayer activation/deactivation ≤ 500 ms from zoom threshold crossing (FR, SC-001)
- Layer sync event handling ≤ 50 ms (existing `LayerSyncEngine` SLA, retained for new sync engine)
- 60 FPS maintained during zoom with sublayers active (SC-002)
- Viewport country-matching for ≥ 50 registered countries — O(n) bounding-box pre-filter then polygon containment check

**Constraints**:
- `CanvasWorkspace` schema version bump from `1.0.0` → `1.1.0`; `deserializeWorkspace` must include a migration path for v1.0.0 documents (add empty `countryDetailConfig` field)
- Country detail sublayers are **always rendered below** all semantic layers — MapLibre `addLayer` `beforeId` parameter must reference the lowest semantic layer
- Country detail sublayers are read-only: no `setActiveLayer`, no `updateLayer`, no `reorderLayers` calls may target them
- Country boundary data must be bundled (no runtime HTTP fetch required for polygon membership tests); map tile data is fetched from the configured tile provider

**Scale/Scope**:
- ≥ 50 country-sublayer configurations supported (FR-012)
- Zoom threshold evaluations fire on MapLibre `moveend` (debounced at 100 ms) — not on every `zoom` tick — to avoid thrashing
- Natural Earth country polygons: ~180 countries, simplified to 50m resolution (~150 KB GeoJSON bundle)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Multimodal Intent & Semantic Grounding | Country detail sublayers are geographic *reference* layers, not semantic entities. They carry no semantic entity model. | ✅ PASS | Sublayers are infrastructure enrichment below the semantic layer stack; they do not violate the principle because they are not plotted semantic objects. Principle I applies to user-drawn entities on semantic layers, which remain unchanged. |
| II. Layer-Isolated Geospatial Architecture | New sublayers must maintain strict isolation; cross-layer mutations are prohibited; inter-layer communication via event broker only. | ✅ PASS | `CountryDetailManager` (new) communicates with `LayerSyncEngine`-equivalent via a new `sublayer:*` event namespace through the shared `EventBroker`. No direct mutation of `SemanticLayer` objects. |
| III. Extensible Plugin & MCP Integration | New subsystem must be modular. | ✅ PASS | `CountryDetailManager` is a standalone service in `@canvas/core`; `CountryDetailSyncEngine` is an isolated adapter in `@canvas/map-engine`. Both are independently testable. |
| IV. Test-First Quality & Contract Verification (NON-NEGOTIABLE) | Unit tests for country-matching, sublayer activation, and schema migration MUST be committed before implementation. | ✅ GATE — Required | Tasks must include TDD tasks for: `CountryDetailManager` (unit), `CountryDetailSyncEngine` (unit/integration), schema migration (unit), LayerDock sublayer group (unit). |
| V. Observability, Performance & Simplicity | Sync engine must emit structured telemetry; ≤ 50 ms SLA per event; viewport change processing must avoid premature optimisation (debounced `moveend`). | ✅ PASS | Debounced `moveend` listener (100 ms) over per-frame `zoom` event. Existing `performance.now()` SLA warnings retained in new sync engine. |

**Constitution Check — Post Phase 1 re-evaluation**: ✅ All principles satisfied. See data-model.md for isolation boundaries and contracts/ for typed schema contracts.

## Project Structure

### Documentation (this feature)

```text
specs/002-country-detail-sublayers/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── country-detail-config.schema.json
│   ├── sublayer-event-types.ts
│   └── workspace-v1.1.schema.json
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/core/src/
├── schemas/
│   ├── basemap.ts                    (existing)
│   ├── layer.ts                      (existing)
│   ├── workspace.ts                  (modify: v1.1.0, add countryDetailConfig)
│   ├── entity.ts                     (existing, no change)
│   └── country-sublayer.ts           (NEW: CountryDetailConfig, CountrySublayerDef, SublayerActivationState schemas)
├── services/
│   ├── layer-manager.ts              (existing, no change — sublayers are separate)
│   ├── workspace-serializer.ts       (modify: migration v1.0.0 → v1.1.0)
│   └── country-detail-manager.ts     (NEW: CountryDetailManager service)
├── data/
│   └── country-boundaries.geo.json  (NEW: bundled Natural Earth 50m simplified polygons)
├── events/
│   └── event-broker.ts              (modify: add sublayer:* event types)
└── index.ts                          (modify: export new schemas + service)

packages/map-engine/src/
├── adapters/
│   └── maplibre-adapter.ts          (existing, no change)
├── controllers/
│   └── viewport-controller.ts       (existing, no change — already emits zoom/move)
├── sync/
│   ├── layer-sync-engine.ts         (existing, no change)
│   └── country-detail-sync-engine.ts (NEW: listens to viewport + sublayer events, calls MapLibre addLayer/removeLayer)
└── index.ts                          (modify: export CountryDetailSyncEngine)

apps/web/src/
├── components/
│   └── layers/
│       ├── LayerDock.tsx            (modify: add CountrySublayerGroup section below semantic layers)
│       ├── LayerItem.tsx            (existing, no change)
│       └── CountrySublayerItem.tsx  (NEW: read-only layer dock row for a country sublayer)
├── hooks/
│   ├── useLayerManager.ts           (existing, no change)
│   ├── useCountryDetailManager.ts   (NEW: React hook wrapping CountryDetailManager state)
│   ├── useWorkspacePersistence.ts   (existing, no change)
│   └── useViewportSync.ts           (NEW: binds ViewportController → CountryDetailManager on zoom/moveend)
└── App.tsx                          (modify: instantiate CountryDetailSyncEngine + useCountryDetailManager)
```

**Structure Decision**: Monorepo Option 2 pattern (web app + internal packages). The `CountryDetailManager` is placed in `@canvas/core` alongside `LayerManager` because it owns domain state (sublayer configurations, activation state, user visibility overrides) that must be serialized with the workspace. The `CountryDetailSyncEngine` is placed in `@canvas/map-engine` because it bridges domain events to MapLibre GL JS rendering — symmetric to the existing `LayerSyncEngine`. The web app's `LayerDock` is extended non-destructively with a new `CountrySublayerGroup` sub-component rendered below the semantic layers list.

## Complexity Tracking

> No Constitution violations requiring justification. All principles satisfied.
