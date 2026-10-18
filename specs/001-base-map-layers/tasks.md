# Tasks: Base Map & Layer Management

**Feature**: `001-base-map-layers`  
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)  
**Status**: Completed  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization and workspace structure

- [X] T001 Initialize npm monorepo root with workspaces configuration in `package.json`
- [X] T002 [P] Configure TypeScript root configuration and base compiler settings in `tsconfig.base.json`
- [X] T003 [P] Configure shared linting and formatting rules in `.prettierrc` and `eslint.config.js`
- [X] T004 [P] Initialize package scaffold for `@canvas/core` in `packages/core/package.json` and `packages/core/tsconfig.json`
- [X] T005 [P] Initialize package scaffold for `@canvas/map-engine` in `packages/map-engine/package.json` and `packages/map-engine/tsconfig.json`
- [X] T006 [P] Initialize application scaffold for `@canvas/web` with Vite and React in `apps/web/package.json`, `apps/web/vite.config.ts`, and `apps/web/index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain types, schemas, and events that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Implement typed error hierarchy (`CanvasError`, `LayerNotFoundError`, `InvalidLayerCountError`, `InvalidCoordinatesError`, `SchemaValidationError`, `LayerLockedError`) in `packages/core/src/errors/index.ts`
- [X] T008 [P] Implement EventBroker and base event interfaces in `packages/core/src/events/event-broker.ts` per `contracts/event-broker-contract.md`
- [X] T009 [P] Implement Zod schemas and TypeScript types for `BaseMapConfig` (with constraints: `lon [-180.0, 180.0]`, `lat [-90.0, 90.0]`, `zoom [0.0, 24.0]`, `pitch [0.0, 85.0]`, `bearing [0.0, 360.0)`) and `SpatialEntity` in `packages/core/src/schemas/basemap.ts` and `packages/core/src/schemas/entity.ts`
- [X] T010 [P] Implement Zod schemas and TypeScript types for `SemanticLayer` (with constraints: `name 1-100 characters trimmed non-empty`, `semanticType enum: baseline, tactical, infrastructure, environmental, annotation, custom`, `order >= 0`, `opacity [0.0, 1.0]`, `locked boolean`) and `CanvasWorkspace` (`schemaVersion: "1.0.0"`, `layers.length >= 1`) in `packages/core/src/schemas/layer.ts` and `packages/core/src/schemas/workspace.ts`
- [X] T011 Configure Vitest testing environment and test setup in `packages/core/vitest.config.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Interactive Base Map Navigation (Priority: P1) 🎯 MVP

**Goal**: Provide an interactive geographical base map that renders smoothly with panning and zooming across WGS84 coordinates.

**Independent Test**: Application launches and renders an interactive base map within 2 seconds (`SC-001`), supporting fluid pan and zoom gestures across global coordinates.

### Tests for User Story 1 (TDD Mandatory per Constitution Principle IV) 🧪

- [X] T012 [P] [US1] Unit test for `BaseMapConfig` coordinate validation and default viewport generation in `packages/core/tests/unit/basemap.test.ts`
- [X] T013 [P] [US1] Contract test for base map configuration against schema in `packages/core/tests/contract/basemap-contract.test.ts`

### Implementation for User Story 1

- [X] T014 [US1] Implement BaseMap state model and default config generator in `packages/core/src/models/basemap.ts`
- [X] T015 [US1] Implement `MapLibreMapAdapter` wrapping MapLibre GL JS map instance with pan/zoom/bearing/pitch controls in `packages/map-engine/src/adapters/maplibre-adapter.ts`
- [X] T016 [US1] Implement `ViewportController` to manage viewport state and coordinate conversion in `packages/map-engine/src/controllers/viewport-controller.ts`
- [X] T017 [US1] Implement `useBaseMap` React hook connecting UI state to map engine in `apps/web/src/hooks/useBaseMap.ts`
- [X] T018 [US1] Implement `MapCanvas` interactive WebGL container component with zoom/pan controls in `apps/web/src/components/canvas/MapCanvas.tsx`
- [X] T019 [US1] Integrate MapCanvas into primary application layout in `apps/web/src/App.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional as a standalone MVP and can be demonstrated independently.

---

## Phase 4: User Story 2 - Semantic Layer Organization & Visibility Control (Priority: P2)

**Goal**: Allow users to create, name, categorize, reorder, lock, adjust opacity, and toggle visibility for isolated semantic spatial layers.

**Independent Test**: Create 3 distinct layers, reorder their stacking sequence, toggle visibility off/on, adjust opacity, and verify layer isolation in the layer dock.

### Tests for User Story 2 (TDD Mandatory per Constitution Principle IV) 🧪

- [X] T020 [P] [US2] Unit tests for `LayerManager` (layer creation, layer isolation, reordering, visibility toggle, opacity clamping [0.0, 1.0], lock toggle, minimum 1 layer constraint `FR-012`, prevent last layer deletion) in `packages/core/tests/unit/layer-manager.test.ts`
- [X] T021 [P] [US2] Unit tests for EventBroker emission timing and event payload validation (`layer:created`, `layer:reordered`, `layer:visibility-changed`, `layer:opacity-changed`, `layer:lock-changed`, `layer:deleted`) in `packages/core/tests/unit/layer-events.test.ts`

### Implementation for User Story 2

- [X] T022 [US2] Implement `LayerManager` fulfilling `ILayerManager` interface in `packages/core/src/services/layer-manager.ts`
- [X] T023 [US2] Implement `LayerSyncEngine` in `packages/map-engine/src/sync/layer-sync-engine.ts` to synchronize layer order, visibility, and opacity to MapLibre styles in < 50ms (`SC-002`)
- [X] T024 [US2] Implement `useLayerManager` React hook binding layer state and actions in `apps/web/src/hooks/useLayerManager.ts`
- [X] T025 [P] [US2] Implement `LayerItem` component with name, semantic badge, visibility toggle eye, lock toggle, and opacity slider in `apps/web/src/components/layers/LayerItem.tsx`
- [X] T026 [US2] Implement `LayerDock` panel with layer creation modal, active layer selection, drag-and-drop reordering, and layer deletion in `apps/web/src/components/layers/LayerDock.tsx`
- [X] T027 [US2] Integrate `LayerDock` into main UI sidebar in `apps/web/src/App.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 work together seamlessly and remain independently testable.

---

## Phase 5: User Story 3 - Layer Workspace Persistence & Serialization (Priority: P3)

**Goal**: Allow users to save/export the complete canvas state to a deterministic JSON file and reload/import an existing workspace.

**Independent Test**: Configure layers and base map positioning, export to `.canvas.json`, clear workspace, import the file, and verify 100% fidelity restoration (`SC-004`).

### Tests for User Story 3 (TDD Mandatory per Constitution Principle IV) 🧪

- [X] T028 [P] [US3] Contract tests verifying workspace serialization matches `workspace-schema.json` draft-2020-12 schema in `packages/core/tests/contract/workspace-serialization.test.ts`
- [X] T029 [P] [US3] Unit tests for workspace deserialization, rejection of malformed or out-of-bounds coordinates, and version checking in `packages/core/tests/unit/workspace-deserializer.test.ts`

### Implementation for User Story 3

- [X] T030 [US3] Implement workspace serialization and deserialization functions with Zod validation in `packages/core/src/services/workspace-serializer.ts`
- [X] T031 [US3] Integrate `serialize()` and `deserialize()` into `LayerManager` in `packages/core/src/services/layer-manager.ts`
- [X] T032 [US3] Implement `WorkspaceMenu` component with "New Workspace", "Export Workspace (.canvas.json)", and "Import Workspace" file dialog in `apps/web/src/components/menu/WorkspaceMenu.tsx`
- [X] T033 [US3] Connect `WorkspaceMenu` to `LayerManager` and persist workspace state to browser localStorage cache in `apps/web/src/hooks/useWorkspacePersistence.ts`

**Checkpoint**: All three user stories are now complete, offering full base map navigation, multi-layer management, and persistent workspace storage.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: System integration, end-to-end verification, performance validation, and documentation

- [X] T034 [P] Implement Playwright end-to-end integration test validating base map load (< 2s, `SC-001`), layer creation, reordering (< 50ms, `SC-002`), and workspace export/import (`SC-004`) in `apps/web/tests/e2e/layers.spec.ts`
- [X] T035 [P] Implement performance benchmark script measuring frame rate (60 FPS, `SC-003`) with 20 layers and 1,000 spatial entities in `packages/map-engine/tests/perf/render-benchmark.test.ts`
- [X] T036 Run complete quickstart validation scenarios from `specs/001-base-map-layers/quickstart.md` and verify all tests pass
- [X] T037 [P] Create developer and API documentation in `packages/core/README.md` and `packages/map-engine/README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```
[Phase 1: Setup]
       │
       ▼
[Phase 2: Foundational] (BLOCKS all user stories)
       │
       ├────────────────────────┬────────────────────────┐
       ▼                        ▼                        ▼
[Phase 3: User Story 1]  [Phase 4: User Story 2]  [Phase 5: User Story 3]
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                    [Phase 6: Polish & E2E]
```

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — blocks User Stories.
- **User Stories (Phase 3+)**: Depend on Phase 2 completion. Can be executed sequentially (P1 → P2 → P3) or in parallel by separate developers.
- **Polish (Phase 6)**: Depends on completion of User Stories.

### Within Each User Story

- TDD Tests (`tests/*`) MUST be authored and fail before implementation code is written (Constitution Principle IV).
- Models and schemas precede services.
- Core services (`@canvas/core`) precede map engine adapters (`@canvas/map-engine`).
- Map engine adapters precede UI components and hooks (`apps/web`).

---

## Parallel Execution Opportunities

### Phase 1: Setup
```bash
# Can be executed in parallel:
Task: "T002 Configure TypeScript root configuration in tsconfig.base.json"
Task: "T003 Configure shared linting and formatting in .prettierrc and eslint.config.js"
Task: "T004 Initialize package scaffold for @canvas/core in packages/core/"
Task: "T005 Initialize package scaffold for @canvas/map-engine in packages/map-engine/"
Task: "T006 Initialize application scaffold for @canvas/web in apps/web/"
```

### Phase 2: Foundational
```bash
# Can be executed in parallel after T007:
Task: "T008 Implement EventBroker in packages/core/src/events/event-broker.ts"
Task: "T009 Implement BaseMapConfig & SpatialEntity schemas in packages/core/src/schemas/"
Task: "T010 Implement SemanticLayer & CanvasWorkspace schemas in packages/core/src/schemas/"
```

### Phase 3: User Story 1
```bash
# Launch tests together:
Task: "T012 Unit test for BaseMapConfig in packages/core/tests/unit/basemap.test.ts"
Task: "T013 Contract test for base map configuration in packages/core/tests/contract/basemap-contract.test.ts"
```

### Phase 4: User Story 2
```bash
# Launch tests together:
Task: "T020 Unit tests for LayerManager in packages/core/tests/unit/layer-manager.test.ts"
Task: "T021 Unit tests for EventBroker in packages/core/tests/unit/layer-events.test.ts"
# UI components in parallel:
Task: "T025 Implement LayerItem component in apps/web/src/components/layers/LayerItem.tsx"
```

### Phase 5: User Story 3
```bash
# Launch tests together:
Task: "T028 Contract tests for workspace serialization in packages/core/tests/contract/"
Task: "T029 Unit tests for workspace deserializer in packages/core/tests/unit/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1: Setup** (T001–T006)
2. Complete **Phase 2: Foundational** (T007–T011)
3. Complete **Phase 3: User Story 1** (T012–T019)
4. **STOP and VALIDATE**: Verify interactive base map renders and navigates at 60 FPS. Delivers an immediate usable MVP base map.

### Incremental Delivery
1. Add **Phase 4: User Story 2** (T020–T027) → Adds layer panel, layer reordering, visibility toggles, and opacity adjustments.
2. Add **Phase 5: User Story 3** (T028–T033) → Adds workspace persistence and `.canvas.json` import/export.
3. Complete **Phase 6: Polish** (T034–T037) → Playwright E2E verification, performance benchmark, and documentation.
