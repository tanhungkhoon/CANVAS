# Technical Research: Base Map & Layer Management

**Feature**: `001-base-map-layers`  
**Date**: 2026-10-17  
**Status**: Completed  

---

## 1. Geospatial & Mapping Engine

### Decision
Adopt **MapLibre GL JS** (v4.x) as the primary base map renderer, integrated via an abstraction adapter in `packages/map-engine`.

### Rationale
- **WebGL Hardware Acceleration**: Renders vector tiles and GeoJSON data directly on the GPU, guaranteeing smooth 60 FPS pan/zoom and multi-layer rendering under high entity loads (satisfying `SC-003`).
- **Open Standards & Freedom**: Fully open-source (fork of Mapbox GL before license change), with no mandatory telemetry or vendor-locked API keys.
- **Geographic Fidelity**: Native support for WGS84 coordinates (`[longitude, latitude]` format) with standard Web Mercator (`EPSG:3857`) projection, fulfilling Constitution Principle II and `FR-011`.
- **Layer & Style Architecture**: Native concepts of source vs. layer, allowing fine-grained control over layer ordering (z-index), opacity, visibility toggles, and coordinate clipping.

### Alternatives Considered
- **Leaflet**: Simpler API, but relies heavily on DOM elements and Canvas 2D. Degrades noticeably beyond several hundred dynamic vector entities and lacks smooth continuous vector zoom.
- **OpenLayers**: Feature-complete enterprise GIS library, but significantly larger bundle size and steeper learning curve without performance advantages over MapLibre GL for client-side sketching.
- **Raw HTML5 Canvas / WebGL**: Maximum flexibility, but requires reimplementing tile fetching, coordinate reprojection, tile caching, and gesture physics from scratch.

---

## 2. Decoupled Core Architecture & Monorepo Layout

### Decision
Structure the codebase as a clean TypeScript workspace separating core logic from rendering and UI:
- `packages/core`: Pure TypeScript library containing spatial math, layer data models, layer manager, serialization schemas (Zod), and event broker. Zero DOM, UI, or map renderer dependencies.
- `packages/map-engine`: MapLibre GL JS adapter binding `packages/core` layer models and events to map styles and sources.
- `apps/web`: Vite + React UI application providing the canvas viewport, layer management dock/panel, and workspace file import/export controls.

### Rationale
- **Constitutional Compliance**: Principle II and Technical Constraints mandate: *"Core engine libraries MUST remain decoupled from UI frameworks and specific mapping renderers to ensure embeddability and testability."*
- **Test-First Simplicity**: 100% of spatial calculations, layer state mutations, and JSON serialization can be tested in pure Node.js environments via Vitest in milliseconds without spinning up a browser or WebGL context.

### Alternatives Considered
- **Single Monolithic Web App**: Faster initial boilerplate, but leads to tight coupling between map renderer APIs and business logic, violating the constitution and making automated testing fragile.

---

## 3. State Management & Layer Isolation

### Decision
Implement an immutable, event-driven **Layer Manager** with an explicit **EventBroker** in `packages/core`.

### Rationale
- **Layer Isolation (Principle II)**: Each layer maintains its own isolated entity collection, visibility flag, opacity, and lock state. Direct mutation of layer state from outside or cross-layer mutation is strictly prevented.
- **Event-Driven Synchronization**: The layer manager emits typed lifecycle events (`layer:created`, `layer:reordered`, `layer:visibility-changed`, `layer:opacity-changed`, `layer:locked`, `layer:deleted`). The map engine subscribes to these events and synchronizes the visual display in ≤ 50ms (`SC-002`).

### Alternatives Considered
- **Direct Mutating Arrays**: Modifying an in-memory layer array directly introduces race conditions, breaks undo/redo capabilities, and makes rendering synchronization error-prone.
- **External Heavy State Stores (Redux/MobX)**: Adds unnecessary external dependency overhead to `packages/core`. A clean, typed event broker and immutable store in core provides zero-dependency isolation.

---

## 4. Schema Validation & Serialization

### Decision
Use **Zod** (v3.x) for all data models, layer definitions, GeoJSON spatial entities, and workspace file persistence schemas.

### Rationale
- **Deterministic Serialization (`FR-009`, `FR-010`)**: Guarantees that exported workspaces adhere strictly to schema version 1 (`schemaVersion: "1.0.0"`).
- **Runtime Validation**: When importing workspace files, Zod validates all coordinate bounds (lat: [-90, 90], lon: [-180, 180]) and structural constraints, preventing corrupt files from loading (`SC-004`).
- **Static TypeScript Invariance**: Generates inferred TypeScript types directly from schemas, eliminating schema-code drift.

### Alternatives Considered
- **Manual Type Guards / JSON.parse()**: High risk of unhandled edge cases, missing coordinate validations, and security vulnerabilities from malformed inputs.
- **JSON Schema / AJV**: Effective, but lacks ergonomic TypeScript integration and code-sharing compared to Zod.

---

## 5. Testing Framework & Quality Verification

### Decision
Pair **Vitest** for unit and contract testing in `packages/core` and `packages/map-engine`, with **Playwright** for browser-based integration testing in `apps/web`.

### Rationale
- **TDD Enforcement (Principle IV)**: Vitest provides sub-second watch mode for rapid Red-Green-Refactor cycles.
- **Contract Verification**: Contract test suites in `packages/core/tests/contract/` verify layer serialization schemas and event payloads against static fixtures.
- **Integration Tests**: Playwright verifies real WebGL canvas rendering, user drag-and-drop layer reordering, and file export/import workflows in automated browser sessions.

### Alternatives Considered
- **Jest**: Slower startup and complex ESM configuration compared to Vitest.
- **Cypress**: Slower execution and higher resource footprint than Playwright for modern multi-package workspaces.
