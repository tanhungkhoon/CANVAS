# Implementation Plan: Base Map & Layer Management

**Branch**: `001-base-map-layers` | **Date**: 2026-10-17 | **Spec**: [specs/001-base-map-layers/spec.md](file:///D:/projects/aibuilder/git/CANVAS/specs/001-base-map-layers/spec.md)

**Input**: Feature specification from `specs/001-base-map-layers/spec.md`

## Summary

Implement an interactive geographical base map canvas with a robust, decoupled semantic layer management system. The solution uses MapLibre GL JS for hardware-accelerated 60 FPS WebGL map rendering, backed by a pure TypeScript core layer manager (`@canvas/core`) that enforces layer isolation, event-driven state synchronization, and deterministic schema-versioned JSON workspace serialization via Zod.

## Technical Context

**Language/Version**: TypeScript 5.6+ on Node.js v22.11+ / Browser ES2022  
**Primary Dependencies**: MapLibre GL JS v4.x, Zod v3.x, React v18+, Vite v5+  
**Storage**: Client-side JSON file import/export (`.canvas.json`), browser LocalStorage / IndexedDB cache  
**Testing**: Vitest for unit and contract testing in `@canvas/core`; Playwright for browser integration testing in `apps/web`  
**Target Platform**: Modern Desktop/Tablet Web Browsers with WebGL enabled (Chromium, Firefox, Safari)  
**Project Type**: Modular Monorepo (Decoupled Core Libraries + Web Application)  
**Performance Goals**: 60 FPS smooth pan/zoom with 20+ active layers; visual update latency < 50ms for layer toggles/reordering; initial base map load < 2 seconds  
**Constraints**: Zero DOM or UI framework dependencies in `@canvas/core`; strict geospatial alignment to WGS84 (`EPSG:4326`) and Web Mercator (`EPSG:3857`); deterministic schema version 1.0.0  
**Scale/Scope**: 20+ concurrent layers, 1,000+ spatial entities per workspace, single-user desktop/tablet canvas  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Requirement | Status | Design Evidence |
|---|---|:---:|---|
| **I. Multimodal Intent & Semantic Grounding** | All spatial elements must be grounded in a semantic entity model with domain attributes. | **PASS** | `SpatialEntity` interface in [data-model.md](./data-model.md) requires `layerId`, `semanticClass`, and structured `properties`. Pure cosmetic primitives are rejected. |
| **II. Layer-Isolated Geospatial Architecture** | Base map anchor, strict layer isolation, no cross-layer direct mutations, standard CRS (WGS84). | **PASS** | `@canvas/core` provides an immutable `LayerManager` where each layer is an isolated container; cross-layer state updates are dispatched through `EventBroker`. Base map adheres to WGS84 coordinates. |
| **III. Extensible Plugin & MCP Integration** | Extensible architecture supporting custom layers and external skill/MCP integrations. | **PASS** | `ILayerManager` API and typed `LayerEvent` streams provide clean extension points for future plugin and MCP adapters without modifying core logic. |
| **IV. Test-First Quality & Contract Verification** | TDD mandatory; unit tests for math/models; contract tests for schemas/APIs before implementation. | **PASS** | Complete contracts defined in [workspace-schema.json](./contracts/workspace-schema.json) and [layer-manager-api.md](./contracts/layer-manager-api.md). Test matrix defined in [quickstart.md](./quickstart.md). |
| **V. Observability, Performance & Simplicity** | Structured telemetry/logging, < 50ms UI update SLA, 60 FPS, YAGNI adherence. | **PASS** | Synchronous typed event emission guarantees < 50ms renderer sync. MapLibre GL GPU acceleration ensures 60 FPS. Minimal modular package structure. |

*Gate Evaluation: ALL GATES PASS with zero constitutional violations.*

## Project Structure

### Documentation (this feature)

```text
specs/001-base-map-layers/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 technology research and decisions
├── data-model.md        # Phase 1 data entities and validation invariants
├── quickstart.md        # Phase 1 verification and run walkthrough guide
├── contracts/           # Phase 1 interface specifications
│   ├── workspace-schema.json   # JSON Schema for workspace serialization
│   ├── layer-manager-api.md    # TypeScript API contract for @canvas/core
│   └── event-broker-contract.md# Event types and timing guarantees
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository layout)

```text
packages/
├── core/                        # Pure TypeScript domain logic (zero DOM / map dependencies)
│   ├── src/
│   │   ├── models/              # BaseMapConfig, SemanticLayer, CanvasWorkspace
│   │   ├── events/              # EventBroker, LayerEvent definitions
│   │   ├── schemas/             # Zod runtime validation schemas
│   │   ├── errors/              # CanvasError, InvalidCoordinatesError, etc.
│   │   └── services/            # LayerManager implementation
│   └── tests/
│       ├── contract/            # Serialization & schema contract tests
│       └── unit/                # LayerManager isolation & coordinate tests
│
├── map-engine/                  # MapLibre GL JS integration adapter
│   ├── src/
│   │   ├── adapters/            # MapLibreMapAdapter, ViewportController
│   │   └── sync/                # LayerSyncEngine (binds events to map styles)
│   └── tests/
│       └── unit/                # Mock map synchronization tests
│
apps/
└── web/                         # Interactive React + Vite application
    ├── src/
    │   ├── components/
    │   │   ├── canvas/          # MapCanvas viewport component
    │   │   ├── layers/          # LayerDock, LayerItem, LayerControls, OpacitySlider
    │   │   └── menu/            # WorkspaceMenu (Import/Export/Reset)
    │   ├── hooks/               # useLayerManager, useMapSync
    │   └── main.tsx             # Application entry point
    └── tests/
        └── e2e/                 # Playwright end-to-end user scenario tests
```

**Structure Decision**: Monorepo with two libraries (`@canvas/core`, `@canvas/map-engine`) and one web app (`apps/web`). This structure strictly fulfills the constitutional mandate to keep core spatial modeling decoupled from UI frameworks and specific mapping renderers.

## Complexity Tracking

*No constitutional violations. All architecture decisions strictly uphold the CANVAS Constitution v1.0.0.*
