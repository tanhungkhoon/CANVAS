# Tasks: Country Detail Sublayers

**Feature**: `002-country-detail-sublayers`
**Branch**: `002-country-detail-sublayers`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)
**Date**: 2026-10-18

> **Constitution Mandate (IV)**: TDD is mandatory. All unit tests for new domain services and schemas MUST be committed (and confirmed failing) before the implementation they cover. Integration tests follow after unit tests pass.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare new files, directories, and package-level wiring needed across all stories. No business logic yet.

- [ ] T001 Create `packages/core/src/schemas/country-sublayer.ts` (empty module with placeholder export)
- [ ] T002 Create `packages/core/src/services/country-detail-manager.ts` (empty module with placeholder export)
- [ ] T003 Create `packages/core/src/data/` directory and add `.gitkeep` placeholder for bundled boundary data
- [ ] T004 [P] Create `packages/map-engine/src/sync/country-detail-sync-engine.ts` (empty module with placeholder export)
- [ ] T005 [P] Create `apps/web/src/components/layers/CountrySublayerItem.tsx` (empty component stub)
- [ ] T006 [P] Create `apps/web/src/hooks/useCountryDetailManager.ts` (empty hook stub)
- [ ] T007 [P] Create `apps/web/src/hooks/useViewportSync.ts` (empty hook stub)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data schemas, boundary data, and event infrastructure that ALL user stories depend on. Nothing in Phase 3+ can begin until this phase is complete.

> ⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

### 2A — Country Boundary Dataset

- [ ] T008 Download Natural Earth 50m Admin-0 Countries GeoJSON (public domain). Simplify polygons to retain only `ISO_A2`, `ISO_A3`, and `NAME` properties. Save the resulting FeatureCollection to `packages/core/src/data/country-boundaries.geo.json`. Target file size ≤ 200 KB minified.

### 2B — Zod Schemas (`packages/core/src/schemas/country-sublayer.ts`)

- [ ] T009 [P] Write unit test file `packages/core/src/schemas/__tests__/country-sublayer.test.ts`. Cover: valid `CountrySublayerDefinition` round-trips; `countryCode` rejects lowercase and 1-char values (must match `/^[A-Z]{2,3}$/`); `minZoomThreshold` clamps to `[0.0, 24.0]`; `name` rejects empty string and strings > 100 chars; `detailCategory` rejects unlisted enum values. Confirm tests FAIL before implementation.
- [ ] T010 Implement `CountrySublayerDetailCategory` enum schema in `packages/core/src/schemas/country-sublayer.ts` with values: `"administrative"`, `"transport"`, `"terrain"`, `"urban"`, `"hydrography"`, `"custom"`.
- [ ] T011 Implement `CountrySublayerDefinitionSchema` Zod object in `packages/core/src/schemas/country-sublayer.ts` with fields: `id` (UUID), `countryCode` (regex `/^[A-Z]{2,3}$/`), `name` (trimmed, 1–100 chars), `detailCategory` (enum), `minZoomThreshold` (number, 0.0–24.0), `tileSourceUrl` (non-empty string), `enabled` (boolean, default `true`), `createdAt` (datetime), `updatedAt` (datetime).
- [ ] T012 Implement `CountryDetailConfigSchema` Zod object in `packages/core/src/schemas/country-sublayer.ts` with fields: `definitions` (array of `CountrySublayerDefinitionSchema`, default `[]`), `sublayerVisibilityOverrides` (record of string→boolean, default `{}`). Export all types: `CountrySublayerDetailCategory`, `CountrySublayerDefinition`, `CountryDetailConfig`, `CreateCountrySublayerOptions`, `UpdateCountrySublayerOptions`.
- [ ] T013 Run schema unit tests from T009 — confirm all pass.

### 2C — Event Broker Extension (`packages/core/src/events/event-broker.ts`)

- [ ] T014 [P] Write unit test file `packages/core/src/events/__tests__/sublayer-events.test.ts`. Cover: `EventBroker` correctly delivers `sublayer:activated`, `sublayer:deactivated`, `sublayer:visibility-override-changed`, `sublayer:config-updated` events to subscribers; listener isolation (one listener error does not block others). Confirm tests FAIL before implementation.
- [ ] T015 Add `SublayerEventType` union literal type to `packages/core/src/events/event-broker.ts`: `'sublayer:activated' | 'sublayer:deactivated' | 'sublayer:visibility-override-changed' | 'sublayer:config-updated'`.
- [ ] T016 Add event interface definitions to `packages/core/src/events/event-broker.ts`: `SublayerActivatedEvent` (fields: `definitionIds: string[]`, `countryCode: string`), `SublayerDeactivatedEvent` (fields: `definitionIds: string[]`), `SublayerVisibilityOverrideChangedEvent` (fields: `definitionId: string`, `visible: boolean`), `SublayerConfigUpdatedEvent` (fields: `config: CountryDetailConfig`). All extend `BaseSublayerEvent` (which includes `type`, `timestamp`, `workspaceId`).
- [ ] T017 Add `SublayerEvent` union type and `SublayerEventListener` type to `packages/core/src/events/event-broker.ts`. Export all new types.
- [ ] T018 Run event unit tests from T014 — confirm all pass.

### 2D — Workspace Schema Migration (`packages/core/src/schemas/workspace.ts` + `packages/core/src/services/workspace-serializer.ts`)

- [ ] T019 [P] Write unit test file `packages/core/src/services/__tests__/workspace-migration.test.ts`. Cover: `deserializeWorkspace` accepts v1.0.0 document (missing `countryDetailConfig`) and outputs v1.1.0 document with `countryDetailConfig: { definitions: [], sublayerVisibilityOverrides: {} }`; v1.1.0 document with full `countryDetailConfig` round-trips losslessly; document with unknown `schemaVersion` is rejected with `SchemaValidationError`; `serializeWorkspace` always writes `schemaVersion: "1.1.0"`. Confirm tests FAIL before implementation.
- [ ] T020 Update `CanvasWorkspaceSchema` in `packages/core/src/schemas/workspace.ts`: change `schemaVersion` from `z.literal('1.0.0')` to `z.literal('1.1.0')`; add `countryDetailConfig: CountryDetailConfigSchema` field with default `{ definitions: [], sublayerVisibilityOverrides: {} }`.
- [ ] T021 Update `deserializeWorkspace` in `packages/core/src/services/workspace-serializer.ts`: before Zod validation, detect `schemaVersion === '1.0.0'` in the raw parsed JSON object; if found, inject `countryDetailConfig: { definitions: [], sublayerVisibilityOverrides: {} }` and set `schemaVersion` to `'1.1.0'`; then proceed with normal `CanvasWorkspaceSchema.safeParse`.
- [ ] T022 Run migration unit tests from T019 — confirm all pass.

### 2E — Point-in-Polygon Utility (`packages/core/src/`)

- [ ] T023 [P] Write unit test file `packages/core/src/__tests__/geo-utils.test.ts`. Cover: ray-casting returns `true` for a point clearly inside a known polygon; `false` for a point clearly outside; `false` for a point on the boundary edge (edge case — ray-casting is inclusive or exclusive consistently); correct result for a concave polygon; correct result for a multi-polygon (any sub-polygon containing the point returns `true`); bounding-box pre-filter correctly discards candidates outside bbox before polygon test. Confirm tests FAIL before implementation.
- [ ] T024 Implement `pointInPolygon(point: [number, number], polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean` using ray-casting algorithm in `packages/core/src/utils/geo-utils.ts`. No external geometry library — pure TypeScript.
- [ ] T025 Implement `getBoundingBox(polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): [minLng, minLat, maxLng, maxLat]` in `packages/core/src/utils/geo-utils.ts` for bounding-box pre-filter.
- [ ] T026 Run geo-utils unit tests from T023 — confirm all pass.

### 2F — Package Exports Update

- [ ] T027 Update `packages/core/src/index.ts`: export everything from `./schemas/country-sublayer.js`, `./services/country-detail-manager.js`, `./utils/geo-utils.js`.
- [ ] T028 Update `packages/map-engine/src/index.ts`: export `CountryDetailSyncEngine` from `./sync/country-detail-sync-engine.js`.

**Checkpoint**: Foundation ready — all schemas, events, migration, and utilities in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Automatic Sublayer Activation on Zoom (Priority: P1) 🏆 MVP

**Goal**: When the viewport zooms into a registered country at or above the configured threshold, the appropriate country detail sublayers automatically appear on the map. They disappear on zoom-out or panning away.

**Independent Test**: Register a definition for one country (e.g., `MY`, threshold `5.0`), zoom in — sublayer renders on map. Zoom out — sublayer disappears. Validate with Quickstart Scenario 1.

### Implementation — CountryDetailManager (Core Logic)

- [ ] T029 [P] Write unit test file `packages/core/src/services/__tests__/country-detail-manager.test.ts`. Cover: `evaluateViewport` with center inside country + zoom ≥ threshold → emits `sublayer:activated` with correct `definitionIds` and `countryCode`; center inside country + zoom < threshold → no activation; center outside country + zoom ≥ threshold → no activation; repeated call with same state → no duplicate events emitted; `evaluateViewport` with no registered definitions → no error, no events; bounding-box pre-filter skips countries whose bbox doesn't contain the center. Confirm tests FAIL before implementation.
- [ ] T030 Implement `CountryDetailManager` class in `packages/core/src/services/country-detail-manager.ts`. Constructor accepts `CountryDetailConfig` (default empty). Internal state: `config: CountryDetailConfig`, `activationState: SublayerActivationState` (runtime only), `eventListeners: Set<SublayerEventListener>`. Load country boundary GeoJSON from `packages/core/src/data/country-boundaries.geo.json` as a static import — index by `ISO_A2` and `ISO_A3` at construction time for O(1) lookup.
- [ ] T031 Implement `ICountryDetailManager.evaluateViewport(center: [number, number], zoom: number): void` in `CountryDetailManager`. Algorithm: (1) bounding-box pre-filter against all enabled definitions' countries; (2) ray-casting `pointInPolygon` on candidates; (3) resolve to single country per research.md §2 tie-break rule (deepest inside bounding box); (4) compute newly activated and deactivated definition IDs; (5) emit `sublayer:activated` / `sublayer:deactivated` events only when the active set changes.
- [ ] T032 Implement `getActivationState(): SublayerActivationState` and `getVisibleDefinitions(): CountrySublayerDefinition[]` (activated AND not user-hidden) in `CountryDetailManager`.
- [ ] T033 Implement `subscribe(listener: SublayerEventListener): () => void` and emit helper in `CountryDetailManager`.
- [ ] T034 Run CountryDetailManager unit tests from T029 — confirm all pass.

### Implementation — CountryDetailSyncEngine (Map Rendering)

- [ ] T035 [P] Write unit test file `packages/map-engine/src/sync/__tests__/country-detail-sync-engine.test.ts`. Cover: `sublayer:activated` event → `map.addSource` + `map.addLayer` called with correct `beforeId` (first semantic layer MapLibre layer ID); `sublayer:deactivated` event → `map.setLayoutProperty(id, 'visibility', 'none')`; re-activation of existing layer → `setLayoutProperty` to `'visible'` (not re-adding source/layer); SLA warning logged if event handler takes > 50 ms. Confirm tests FAIL before implementation.
- [ ] T036 Implement `CountryDetailSyncEngine` class in `packages/map-engine/src/sync/country-detail-sync-engine.ts`. Constructor: `(mapAdapter: MapLibreMapAdapter, viewportController: ViewportController, countryDetailManager: ICountryDetailManager)`. Maintains a `Set<string>` of sublayer IDs that have had MapLibre sources/layers created (to distinguish first-add from re-show).
- [ ] T037 Implement `startSync()` in `CountryDetailSyncEngine`: subscribe to `viewportController.onViewportChange` with 100 ms debounce (use `setTimeout`/`clearTimeout` pattern); on each debounced change call `countryDetailManager.evaluateViewport(center, zoom)`; subscribe to `countryDetailManager` for `sublayer:activated` and `sublayer:deactivated` events and dispatch to private render handlers.
- [ ] T038 Implement private `onSublayerActivated(event: SublayerActivatedEvent)` in `CountryDetailSyncEngine`: for each `definitionId`, retrieve the `CountrySublayerDefinition`; if MapLibre source doesn't exist: `map.addSource(sourceId, { type: 'vector', url: def.tileSourceUrl })`; if MapLibre layer doesn't exist: `map.addLayer({ id: layerId, type: 'fill', source: sourceId, ... }, beforeSemanticLayerId)` where `beforeSemanticLayerId` is the MapLibre ID of the lowest-order semantic layer (`layer-${semanticLayers[0].id}`); if layer already exists: `map.setLayoutProperty(layerId, 'visibility', 'visible')`. Wrap in `performance.now()` SLA check; log warning if > 50 ms.
- [ ] T039 Implement private `onSublayerDeactivated(event: SublayerDeactivatedEvent)` in `CountryDetailSyncEngine`: for each `definitionId`, call `map.setLayoutProperty(layerId, 'visibility', 'none')` if the layer exists. Do NOT remove the source or layer (preserves re-activation performance).
- [ ] T040 Implement `stopSync()` in `CountryDetailSyncEngine`: unsubscribe all viewport and sublayer event listeners.
- [ ] T041 Run CountryDetailSyncEngine unit tests from T035 — confirm all pass.

### Wiring — App.tsx Integration

- [ ] T042 Implement `useViewportSync` hook in `apps/web/src/hooks/useViewportSync.ts`: accepts `viewportController: ViewportController | null` and `countryDetailManager: ICountryDetailManager | null`; calls `viewportController.onViewportChange` and forwards `center` + `zoom` to `countryDetailManager.evaluateViewport`; returns cleanup on unmount.
- [ ] T043 Implement `useCountryDetailManager` hook in `apps/web/src/hooks/useCountryDetailManager.ts`: creates a `CountryDetailManager` instance (or accepts one via param); subscribes to `SublayerEvent`; exposes reactive state: `activeDefinitions: CountrySublayerDefinition[]`, `visibleDefinitions: CountrySublayerDefinition[]`; returns manager instance and state.
- [ ] T044 Update `apps/web/src/App.tsx`: instantiate `CountryDetailManager` via `useCountryDetailManager`; instantiate `CountryDetailSyncEngine` in a `useEffect` (parallel to existing `LayerSyncEngine` effect); wire `useViewportSync` with the `ViewportController` instance from `MapCanvas`; ensure `CountryDetailSyncEngine.stopSync()` is called in the effect cleanup.

**Checkpoint**: User Story 1 fully functional. Sublayers auto-activate and deactivate based on zoom and viewport position. Validate with Quickstart Scenario 1.

---

## Phase 4: User Story 2 — Configuration & Registration Management (Priority: P2)

**Goal**: Authorised users can add, update, and remove country detail sublayer definitions via a management interface.

**Independent Test**: Add a new country definition via the management UI, zoom into that country, confirm the sublayer renders. Remove the definition, zoom out and back in — sublayer no longer activates. Validate with Quickstart Scenario 3.

### Implementation — CountryDetailManager CRUD

- [ ] T045 [P] Write unit test file `packages/core/src/services/__tests__/country-detail-manager-crud.test.ts`. Cover: `addDefinition` generates UUID `id`, sets `createdAt`/`updatedAt`, appends to `config.definitions`, emits `sublayer:config-updated`; `addDefinition` with invalid `countryCode` (e.g., lowercase, >3 chars) throws `SchemaValidationError`; `updateDefinition` modifies only specified fields, updates `updatedAt`, emits `sublayer:config-updated`; `updateDefinition` with unknown `id` throws `LayerNotFoundError` (or a new `DefinitionNotFoundError`); `removeDefinition` removes entry from `config.definitions`, clears any visibility override for that id, emits `sublayer:config-updated`; `removeDefinition` with unknown `id` throws. Confirm tests FAIL.
- [ ] T046 Implement `addDefinition(options: CreateCountrySublayerOptions): CountrySublayerDefinition` in `CountryDetailManager`: generate UUID, set timestamps, validate with `CountrySublayerDefinitionSchema`, push to `config.definitions`, emit `sublayer:config-updated`.
- [ ] T047 Implement `updateDefinition(id: string, patch: UpdateCountrySublayerOptions): CountrySublayerDefinition` in `CountryDetailManager`: find by id (throw if not found), merge patch fields, update `updatedAt`, validate updated record, replace in `config.definitions`, emit `sublayer:config-updated`.
- [ ] T048 Implement `removeDefinition(id: string): void` in `CountryDetailManager`: find by id (throw if not found), remove from `config.definitions`, delete any override in `sublayerVisibilityOverrides`, if currently auto-active emit `sublayer:deactivated` for that id, emit `sublayer:config-updated`.
- [ ] T049 Run CRUD unit tests from T045 — confirm all pass.

### Implementation — Configuration Management UI

- [ ] T050 [P] Write unit test file `apps/web/src/components/layers/__tests__/CountrySublayerManager.test.tsx` (using Vitest + React Testing Library if available, or document as manual validation). Cover: form renders with country code, name, detail category, min zoom threshold, tile source URL fields; submit with valid data calls `onAddDefinition`; submit with empty name is blocked (form validation); existing definitions are listed with remove buttons; clicking remove calls `onRemoveDefinition` with correct id.
- [ ] T051 Create `apps/web/src/components/layers/CountrySublayerManager.tsx`: a panel/modal component that displays existing `CountryDetailConfig.definitions` in a list (name, country code, category, zoom threshold), provides a form to add a new definition (fields: country code, name, detail category dropdown, min zoom threshold, tile source URL), and a remove button per definition. Props: `config: CountryDetailConfig`, `onAddDefinition: (opts: CreateCountrySublayerOptions) => void`, `onRemoveDefinition: (id: string) => void`.
- [ ] T052 Add `addDefinition` and `removeDefinition` callbacks to `useCountryDetailManager` hook in `apps/web/src/hooks/useCountryDetailManager.ts` (wrap `manager.addDefinition` and `manager.removeDefinition` in `useCallback`).
- [ ] T053 Add a "Manage Detail Layers" button to the `WorkspaceMenu` or a dedicated toolbar button in `apps/web/src/App.tsx` that toggles visibility of `CountrySublayerManager`. Wire `onAddDefinition` and `onRemoveDefinition` from `useCountryDetailManager`.
- [ ] T054 Run CountrySublayerManager unit/manual tests from T050 — confirm all pass.

**Checkpoint**: User Story 2 complete. Definitions can be created and removed via UI. Validate with Quickstart Scenario 3.

---

## Phase 5: User Story 3 — Visibility Control in Layer Dock (Priority: P3)

**Goal**: Active country detail sublayers appear in the layer dock as labelled, read-only entries grouped below semantic layers. Users can toggle visibility per sublayer; that state persists across zoom cycles.

**Independent Test**: Zoom into a country with two active sublayers → both appear in dock. Toggle one off → disappears from map. Zoom out and back in → still hidden. Toggle back on → reappears. Validate with Quickstart Scenarios 1–2.

### Implementation — Visibility Override in CountryDetailManager

- [ ] T055 [P] Write unit test file `packages/core/src/services/__tests__/country-detail-manager-overrides.test.ts`. Cover: `setVisibilityOverride(id, false)` stores override; `getVisibleDefinitions()` excludes user-hidden sublayer even when auto-active; subsequent `evaluateViewport` call does NOT emit `sublayer:activated` for user-hidden sublayer; `setVisibilityOverride(id, true)` clears the hidden override; `clearVisibilityOverride(id)` restores auto-control; `exportConfig()` includes `sublayerVisibilityOverrides` in output; `loadConfig(config)` restores overrides from imported config and emits `sublayer:config-updated`. Confirm tests FAIL.
- [ ] T056 Implement `setVisibilityOverride(definitionId: string, visible: boolean): void` in `CountryDetailManager`: set `config.sublayerVisibilityOverrides[definitionId] = visible`; if `visible === false` and sublayer is currently auto-active, emit `sublayer:visibility-override-changed` with `visible: false` (so sync engine hides it); if `visible === true`, emit `sublayer:visibility-override-changed` with `visible: true`.
- [ ] T057 Implement `clearVisibilityOverride(definitionId: string): void` in `CountryDetailManager`: delete `config.sublayerVisibilityOverrides[definitionId]`; if sublayer is currently auto-active, emit `sublayer:visibility-override-changed` with `visible: true` to restore.
- [ ] T058 Implement `loadConfig(config: CountryDetailConfig): void` in `CountryDetailManager`: replace `this.config` with validated config; reset `activationState`; emit `sublayer:config-updated`. Call this in `deserializeWorkspace` consumer code (App.tsx workspace load path).
- [ ] T059 Implement `exportConfig(): CountryDetailConfig` in `CountryDetailManager`: return a deep copy of `this.config` (definitions + sublayerVisibilityOverrides).
- [ ] T060 Run override unit tests from T055 — confirm all pass.

### Implementation — CountryDetailSyncEngine Visibility Override Handling

- [ ] T061 [P] Write unit test `packages/map-engine/src/sync/__tests__/country-detail-sync-engine-overrides.test.ts`. Cover: `sublayer:visibility-override-changed` with `visible: false` → `map.setLayoutProperty(id, 'visibility', 'none')`; with `visible: true` and layer exists → `map.setLayoutProperty(id, 'visibility', 'visible')`; `sublayer:config-updated` event → sync engine calls `map.setLayoutProperty('visibility', 'none')` for all previously active layers then re-evaluates visible definitions. Confirm tests FAIL.
- [ ] T062 Add handler for `sublayer:visibility-override-changed` in `CountryDetailSyncEngine.startSync()`: subscribe to `countryDetailManager` for this event type; on `visible: false` → call `map.setLayoutProperty(layerId, 'visibility', 'none')`; on `visible: true` → call `map.setLayoutProperty(layerId, 'visibility', 'visible')` (only if layer exists in map).
- [ ] T063 Add handler for `sublayer:config-updated` in `CountryDetailSyncEngine.startSync()`: hide all currently tracked sublayer map layers (set `visibility: 'none'`), then re-read `countryDetailManager.getVisibleDefinitions()` and re-show the ones that should be active.
- [ ] T064 Run override sync engine tests from T061 — confirm all pass.

### Implementation — CountrySublayerItem UI Component

- [ ] T065 [P] Write unit test `apps/web/src/components/layers/__tests__/CountrySublayerItem.test.tsx`. Cover: renders sublayer name and category badge; visibility toggle button calls `onToggleVisibility`; clicking the entry does NOT call any `setActiveLayer` callback; no reorder, lock, or delete controls are present; a visual "read-only" indicator (e.g., lock icon or "REF" badge) is rendered. Confirm tests FAIL.
- [ ] T066 Implement `CountrySublayerItem` component in `apps/web/src/components/layers/CountrySublayerItem.tsx`. Props: `definition: CountrySublayerDefinition`, `isVisible: boolean`, `onToggleVisibility: (visible: boolean) => void`. Renders: sublayer name label, detail category badge (colour-coded by category), visibility toggle icon button. No select-as-active, no reorder arrows, no delete button, no lock button. Include a small "REF" or lock indicator to communicate read-only status visually.
- [ ] T067 Run CountrySublayerItem unit tests from T065 — confirm all pass.

### Implementation — LayerDock Extension

- [ ] T068 [P] Write unit test `apps/web/src/components/layers/__tests__/LayerDock-sublayers.test.tsx`. Cover: when `activeSublayers` is empty, no sublayer group section renders; when `activeSublayers` has entries, a "MAP DETAIL LAYERS" (or equivalent) group heading renders below the semantic layers list; each active sublayer renders as a `CountrySublayerItem`; the group is visually separated from the semantic layers section. Confirm tests FAIL.
- [ ] T069 Update `LayerDock` component in `apps/web/src/components/layers/LayerDock.tsx`: add props `activeSublayers: CountrySublayerDefinition[]`, `sublayerVisibilityOverrides: Record<string, boolean>`, `onToggleSublayerVisibility: (definitionId: string, visible: boolean) => void`; render a "MAP DETAIL LAYERS" section below the semantic layers list (only when `activeSublayers.length > 0`); render one `CountrySublayerItem` per entry, passing correct `isVisible` (derived from override map and auto-activation state) and `onToggleVisibility` callback.
- [ ] T070 Update `apps/web/src/App.tsx`: pass `activeSublayers`, `sublayerVisibilityOverrides`, and `onToggleSublayerVisibility` (which calls `countryDetailManager.setVisibilityOverride`) from `useCountryDetailManager` into `LayerDock`.
- [ ] T071 Run LayerDock sublayer tests from T068 — confirm all pass.

**Checkpoint**: User Story 3 complete. Sublayers appear in dock, visibility is toggleable and sticky across zoom cycles. Validate with Quickstart Scenarios 1 and 2.

---

## Phase 6: User Story 4 — Sublayer Coexistence with Semantic Layers (Priority: P4)

**Goal**: Country detail sublayers never interfere with semantic layer data, z-order, interactivity, or serialization. Workspace export/import preserves full sublayer config including visibility overrides.

**Independent Test**: Create semantic layers with entities → zoom into country with sublayers → entity positions and layer state unchanged → export workspace → import → sublayer config (including overrides) fully restored. Validate with Quickstart Scenarios 4 and 5.

### Implementation — Layer Isolation Verification

- [ ] T072 [P] Write integration test `packages/map-engine/src/sync/__tests__/layer-isolation.test.ts`. Cover: after `sublayer:activated`, the `LayerManager`'s layers array is unchanged (no entries added/modified); `LayerSyncEngine` listeners are not triggered by sublayer events; `CountryDetailSyncEngine` does not call `LayerManager.updateLayer`, `setLayerVisibility`, `setLayerOpacity`, or `setLayerLocked`. Confirm tests FAIL.
- [ ] T073 Verify `CountryDetailSyncEngine` has no import of or reference to `LayerManager` or `ILayerManager`. Verify `CountryDetailManager` has no import of or reference to `SemanticLayer` or `LayerManager`. Add a comment block at the top of each file documenting this isolation contract.
- [ ] T074 Run layer isolation tests from T072 — confirm all pass.

### Implementation — Workspace Serialization with Sublayer Config

- [ ] T075 [P] Write unit test `packages/core/src/services/__tests__/workspace-sublayer-serialization.test.ts`. Cover: `serializeWorkspace` on a v1.1.0 workspace with non-empty `countryDetailConfig` serializes `definitions` and `sublayerVisibilityOverrides` correctly; `deserializeWorkspace` on that JSON restores the exact `countryDetailConfig` (deep equality); per-sublayer visibility override `{ "<id>": false }` survives round-trip; workspace with zero definitions and empty overrides serializes and restores cleanly. Confirm tests FAIL.
- [ ] T076 Update `useWorkspacePersistence` hook in `apps/web/src/hooks/useWorkspacePersistence.ts`: after `deserializeWorkspace` succeeds, call `countryDetailManager.loadConfig(workspace.countryDetailConfig)` so imported sublayer config is applied. Add `countryDetailManager` as a parameter to this hook.
- [ ] T077 Update `apps/web/src/App.tsx`: pass `countryDetailManager` instance (from `useCountryDetailManager`) into `useWorkspacePersistence`. Ensure `countryDetailManager.exportConfig()` result is included in the workspace object passed to `serializeWorkspace` before export (wire `exportConfig` call into the workspace menu export action in `WorkspaceMenu.tsx`).
- [ ] T078 Run serialization tests from T075 — confirm all pass.

### Implementation — MapLibre Z-Order Enforcement

- [ ] T079 [P] Write unit test `packages/map-engine/src/sync/__tests__/sublayer-zorder.test.ts`. Cover: `addLayer` called by `CountryDetailSyncEngine` always passes `beforeId` equal to `"layer-<firstSemanticLayerId>"`; when semantic layers are reordered (a `layer:reordered` event fires in `LayerSyncEngine`), the next sublayer activation still uses the updated first semantic layer's MapLibre ID as `beforeId`. Confirm tests FAIL.
- [ ] T080 Update `CountryDetailSyncEngine` to subscribe to `LayerManager` events (via a second `EventBroker` reference or by accepting `ILayerManager` as a constructor param): on `layer:reordered` or `workspace:loaded`, update the cached `beforeSemanticLayerId` to reflect the new lowest-order semantic layer's MapLibre layer ID (`layer-${orderedLayers[0].id}`).
- [ ] T081 Run z-order unit tests from T079 — confirm all pass.

**Checkpoint**: User Story 4 complete. Full isolation verified. Workspace export/import with sublayer config tested. Validate with Quickstart Scenarios 4 and 5.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Graceful degradation, edge cases, telemetry, and final quality pass.

- [ ] T082 [P] Implement tile source unavailability handling in `CountryDetailSyncEngine`: wrap `map.addSource` / `map.addLayer` in try-catch; on failure emit a custom `console.warn` with the failing `tileSourceUrl` and sublayer name; do not crash the sync engine. Validate with Quickstart Scenario (offline tile simulation).
- [ ] T083 [P] Handle "no registered definitions" and "country with no matching definitions" gracefully in `CountryDetailManager.evaluateViewport`: early return with no events emitted. Add a defensive check that skips deactivation emit when nothing was previously active.
- [ ] T084 [P] Handle very small country bounding regions (e.g., Vatican City, Monaco — bounding box < 0.5° × 0.5°): add a minimum bounding-box expansion factor in `getBoundingBox` (expand by 0.1° on each side) so the pre-filter does not miss valid viewport center positions near the centroid of tiny countries. Add a unit test covering Monaco (`MC`) coordinates in `packages/core/src/__tests__/geo-utils.test.ts`.
- [ ] T085 Implement debounce teardown edge case in `CountryDetailSyncEngine.stopSync()`: call `clearTimeout` on the pending debounce timer (if any) before unsubscribing, to prevent a post-unmount `evaluateViewport` call.
- [ ] T086 [P] Add `data-testid` attributes to `CountrySublayerItem` (`"sublayer-item-{definitionId}"`, `"btn-sublayer-toggle-{definitionId}"`) and to the `LayerDock` sublayer group section (`"sublayer-group-section"`), consistent with existing `data-testid` conventions in `LayerDock.tsx` and `LayerItem.tsx`.
- [ ] T087 [P] Update `packages/core/src/errors/index.ts`: add `DefinitionNotFoundError` class (extends existing error base) for use in `CountryDetailManager.updateDefinition` and `removeDefinition` when the given `id` does not exist.
- [ ] T088 Run all package test suites: `npm run test` in `packages/core` and `packages/map-engine`. Fix any regressions. All tests must pass with zero failures.
- [ ] T089 Run full quickstart validation against all 7 scenarios in `quickstart.md` in a live browser session. Document any deviations.
- [ ] T090 [P] Update `packages/core/src/index.ts` and `packages/map-engine/src/index.ts` JSDoc: add `@since 1.1.0` annotations to all newly exported symbols.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational) — BLOCKS all stories
        ├── Phase 3 (US1 — Auto-Activation) ─── MVP
        │     └── Phase 4 (US2 — Config Management) — builds on CountryDetailManager
        │           └── Phase 5 (US3 — Layer Dock Visibility) — builds on overrides + US1 dock rendering
        │                 └── Phase 6 (US4 — Coexistence) — integration + serialization
        │                       └── Phase 7 (Polish)
        └─ (US2/US3/US4 can begin in parallel with US1 after Phase 2, if staffed)
```

### User Story Dependencies

| Story | Can Start After | Depends On US | Independent? |
|-------|----------------|---------------|--------------|
| US1 (P1) | Phase 2 | — | ✅ Yes |
| US2 (P2) | Phase 2 + T030 (`CountryDetailManager` exists) | US1 (partial) | ✅ Yes (CRUD only) |
| US3 (P3) | Phase 2 + T030 + T056 | US1 (activationState), US2 (optional) | ✅ Yes |
| US4 (P4) | Phase 3 + Phase 5 | US1, US3 | ✅ Yes |

### Within Each Phase

- Tests marked `[P]` can be written in parallel before any implementation.
- Models/schemas before services; services before UI.
- All `[P]` tasks within a phase operate on different files — no conflicts.

---

## Parallel Execution Examples

### Phase 2 Parallel Opportunities

```
T009 (schema tests)   ──────────────────────► T013 (run schema tests)
T014 (event tests)    ──────────────────────► T018 (run event tests)     All parallel
T019 (migration tests)──────────────────────► T022 (run migration tests)
T023 (geo-utils tests)──────────────────────► T026 (run geo-utils tests)
```

### Phase 3 Parallel Opportunities

```
T029 (CountryDetailManager tests) ──────────► T034 (run tests)    ┐
T035 (SyncEngine tests)           ──────────► T041 (run tests)    ├── All parallel
                                                                   │
T042 (useViewportSync)                                             │
T043 (useCountryDetailManager) ─────────────────────────────────► T044 (App.tsx wiring)
```

### Phase 5 Parallel Opportunities

```
T055 (override manager tests) ──► T060  ┐
T061 (override sync tests)    ──► T064  ├── All parallel
T065 (CountrySublayerItem tests) ► T067 │
T068 (LayerDock sublayer tests) ─► T071 ┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schemas + events + migration + geo-utils)
3. Complete Phase 3: User Story 1 (auto-activation + sync engine + App wiring)
4. **STOP AND VALIDATE**: Run Quickstart Scenario 1 — sublayer auto-activates on zoom
5. Ship or demo MVP: base map + auto zoom-triggered country detail sublayers

### Incremental Delivery

| Step | Delivers |
|------|---------|
| Phase 1–2 | Foundation (no visible feature yet) |
| + Phase 3 | **MVP**: sublayers activate/deactivate automatically on zoom |
| + Phase 4 | Admins can configure country definitions via management UI |
| + Phase 5 | Users can see and toggle sublayers in the layer dock |
| + Phase 6 | Workspace export/import persists full sublayer config |
| + Phase 7 | Production-ready: edge cases, graceful degradation, telemetry |

### Parallel Team Strategy (3 Developers)

1. All complete Phase 1 + 2 together (foundation is shared)
2. Once Phase 2 is done:
   - **Dev A**: Phase 3 (US1 — auto-activation core)
   - **Dev B**: Phase 4 (US2 — config CRUD, can mock CountryDetailManager with Phase 2 types)
   - **Dev C**: Phase 5 (US3 — UI dock, can stub with empty active definitions)
3. Phase 6 + 7 require Phase 3+5 to be complete — integrate together

---

## Notes

- `[P]` = task operates on a different file from sibling tasks — can be started concurrently
- `[US1]–[US4]` label = task belongs to that user story for traceability
- **TDD is mandatory per Constitution §IV**: every test task must produce failing tests *before* the implementation task it covers
- Each phase checkpoint is a valid stop point for demo or deployment validation
- `data-testid` conventions must be consistent with existing `LayerDock.tsx` and `LayerItem.tsx` patterns
- Country boundary GeoJSON (T008) is a one-time data task — it may be sourced from `https://github.com/nvkelso/natural-earth-vector` (public domain) and processed offline
