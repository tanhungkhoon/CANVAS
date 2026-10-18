# Data Model: Country Detail Sublayers

**Feature**: `002-country-detail-sublayers`
**Phase**: 1 — Design
**Date**: 2026-10-18
**Research**: [research.md](./research.md)

---

## Overview

This feature introduces four new domain entities alongside modifications to the existing `CanvasWorkspace` schema. All new schemas are defined using **Zod** (consistent with existing schemas) and live in `packages/core/src/schemas/country-sublayer.ts`.

---

## New Entities

### 1. `CountrySublayerDetailCategory`

An enumeration of the types of geographic detail a sublayer can represent.

```
Enum values:
  "administrative"  — Country-level administrative boundary divisions (states, provinces, districts)
  "transport"       — Road and rail networks
  "terrain"         — Elevation, contours, land cover
  "urban"           — Urban area footprints, city boundaries
  "hydrography"     — Rivers, lakes, water bodies
  "custom"          — User-defined/plugin-defined detail category
```

---

### 2. `CountrySublayerDefinition`

A single country-sublayer configuration record. One country may have many definitions (one per detail category / zoom threshold).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` (UUID) | required, unique | Stable identifier for this definition record |
| `countryCode` | `string` | ISO 3166-1 alpha-2 (2 chars, uppercase) or alpha-3 (3 chars, uppercase) | Identifies the target country |
| `name` | `string` | 1–100 chars, trimmed | Human-readable sublayer label shown in the layer dock |
| `detailCategory` | `CountrySublayerDetailCategory` | enum | The type of geographic detail this sublayer displays |
| `minZoomThreshold` | `number` | 0.0–24.0 (MapLibre zoom scale) | Zoom level at or above which this sublayer activates |
| `tileSourceUrl` | `string` | valid URL template (`{z}/{x}/{y}` or TileJSON URL) | The vector/raster tile source URL for this sublayer's geographic data |
| `enabled` | `boolean` | default `true` | When `false`, the sublayer is globally disabled and never activates |
| `createdAt` | `string` (ISO 8601 datetime) | required | Creation timestamp |
| `updatedAt` | `string` (ISO 8601 datetime) | required | Last modification timestamp |

**Validation rules**:
- `countryCode` must match `/^[A-Z]{2,3}$/`
- `minZoomThreshold` clamped to `[0.0, 24.0]`
- `tileSourceUrl` must be a non-empty string beginning with `http://`, `https://`, or `mapbox://` (permissive validation; tile source reachability is runtime-checked)

---

### 3. `CountryDetailConfig`

The top-level configuration container embedded in the workspace document. Holds all country sublayer definitions and all user visibility overrides.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `definitions` | `CountrySublayerDefinition[]` | default `[]` | All registered country sublayer definitions |
| `sublayerVisibilityOverrides` | `Record<string, boolean>` | keys are `CountrySublayerDefinition.id` | User-explicit visibility overrides. `true` = user has forced visible; `false` = user has forced hidden. Absent key = auto (controlled by zoom activation). |

---

### 4. `SublayerActivationState` *(runtime only — not persisted)*

Tracks which sublayers are currently auto-active (zoom threshold met and viewport within country). This is computed at runtime by `CountryDetailManager` and is not stored in the workspace JSON.

| Field | Type | Description |
|-------|------|-------------|
| `activeDefinitionIds` | `Set<string>` | IDs of `CountrySublayerDefinition` records currently auto-activated by zoom/viewport |
| `currentCountryCode` | `string \| null` | ISO code of the country currently in viewport (null if no match) |
| `lastEvaluatedZoom` | `number` | Zoom level at which the last activation evaluation ran |
| `lastEvaluatedCenter` | `[number, number]` | `[lng, lat]` at which the last evaluation ran |

---

## Modified Entities

### `CanvasWorkspace` (modified — `packages/core/src/schemas/workspace.ts`)

Schema version bumped from `"1.0.0"` → `"1.1.0"`. New field added:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `schemaVersion` | `"1.1.0"` | literal | Updated schema version |
| `countryDetailConfig` | `CountryDetailConfig` | default `{ definitions: [], sublayerVisibilityOverrides: {} }` | Country sublayer configuration embedded in the workspace document |

**Migration**: `deserializeWorkspace` detects `schemaVersion: "1.0.0"` and adds an empty `countryDetailConfig` before Zod validation. After migration, the document is treated as `1.1.0` internally.

---

## New Event Types

Added to `packages/core/src/events/event-broker.ts` under a new `sublayer:*` namespace. These events are emitted by `CountryDetailManager` and consumed by `CountryDetailSyncEngine`.

| Event Type | Payload Fields | Trigger |
|------------|---------------|---------|
| `sublayer:activated` | `definitionIds: string[]`, `countryCode: string` | One or more sublayers auto-activated by zoom/viewport |
| `sublayer:deactivated` | `definitionIds: string[]` | One or more sublayers auto-deactivated |
| `sublayer:visibility-override-changed` | `definitionId: string`, `visible: boolean` | User toggled a sublayer in the layer dock |
| `sublayer:config-updated` | `config: CountryDetailConfig` | Full config replaced (e.g., on workspace load) |

---

## `CountryDetailManager` Service Interface

Defined in `packages/core/src/services/country-detail-manager.ts`. Manages configuration state and activation state; emits `sublayer:*` events.

```
interface ICountryDetailManager {
  // Configuration
  getConfig(): CountryDetailConfig
  addDefinition(def: Omit<CountrySublayerDefinition, 'id' | 'createdAt' | 'updatedAt'>): CountrySublayerDefinition
  updateDefinition(id: string, patch: Partial<Omit<CountrySublayerDefinition, 'id' | 'createdAt'>>): CountrySublayerDefinition
  removeDefinition(id: string): void

  // Visibility override (user toggle from layer dock)
  setVisibilityOverride(definitionId: string, visible: boolean): void
  clearVisibilityOverride(definitionId: string): void

  // Activation (called by CountryDetailSyncEngine on viewport change)
  evaluateViewport(center: [number, number], zoom: number): void

  // Read activation state
  getActivationState(): SublayerActivationState
  getVisibleDefinitions(): CountrySublayerDefinition[]  // activated AND not user-hidden

  // Subscription
  subscribe(listener: (event: SublayerEvent) => void): () => void

  // Serialization integration
  loadConfig(config: CountryDetailConfig): void  // called on workspace import
  exportConfig(): CountryDetailConfig            // called on workspace export
}
```

**Key invariants**:
- `evaluateViewport` runs bounding-box pre-filter → ray-casting on `center`. Results in `SublayerActivationState` update + `sublayer:activated` / `sublayer:deactivated` events only when the active set changes (no no-op events).
- `getVisibleDefinitions()` applies the priority rule: `auto-activated AND NOT user-hidden`. User override of `false` suppresses even auto-activated sublayers. User override of `true` on a non-auto-activated sublayer has no effect (sublayer doesn't activate until zoom threshold met).
- `setVisibilityOverride(id, false)` persists across zoom cycles (FR-014).

---

## `CountryDetailSyncEngine` Service Interface

Defined in `packages/map-engine/src/sync/country-detail-sync-engine.ts`. Bridges `CountryDetailManager` events to MapLibre GL JS rendering. Parallel structure to the existing `LayerSyncEngine`.

```
class CountryDetailSyncEngine {
  constructor(
    mapAdapter: MapLibreMapAdapter,
    viewportController: ViewportController,
    countryDetailManager: ICountryDetailManager
  )

  startSync(): void     // subscribe to ViewportController.onViewportChange + CountryDetailManager events
  stopSync(): void      // unsubscribe all listeners
}
```

**Rendering rules**:
- Sublayer map layers are always inserted with `beforeId` = first semantic layer's MapLibre layer ID (to ensure sublayers render below semantic layers at all times).
- On activation: call `map.addSource` + `map.addLayer(..., beforeSemanticLayerId)` if not already present; or `map.setLayoutProperty(id, 'visibility', 'visible')` if layer exists.
- On deactivation / user-hide: `map.setLayoutProperty(id, 'visibility', 'none')`.
- SLA: ≤ 50 ms per event (inherited from `LayerSyncEngine` pattern; log warning if exceeded).

---

## State Transitions

### Sublayer Visibility State Machine

```
             zoom in (threshold met)
[INACTIVE] ─────────────────────────▶ [AUTO-ACTIVE]
             zoom out                  │        │
[INACTIVE] ◀────────────────────────  │  user hide (dock toggle)
                                       ▼        │
                                  [USER-HIDDEN] ◀┘
                                       │
                        user show (dock toggle)
                                       │
                                       ▼
                              [AUTO-ACTIVE again]
                          (if still within zoom + region)
```

Key constraint: **user hide is "sticky"** — zooming out and back in does NOT override a user-hidden state. Only an explicit user "show" toggle restores visibility.

---

## Data Relationships

```
CanvasWorkspace 1──────────────────── 1 CountryDetailConfig
                                              │
                           ┌──────────────────┤
                           │                  │
                    [definitions]    [sublayerVisibilityOverrides]
                           │                  │
                 CountrySublayerDefinition    Map<id, boolean>
                    id ───────────────────────▶ (keyed by definition id)
                    countryCode
                    detailCategory
                    minZoomThreshold
                    tileSourceUrl
                    enabled
```
