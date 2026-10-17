# Data Model: Base Map & Layer Management

**Feature**: `001-base-map-layers`  
**Date**: 2026-10-17  
**Status**: Completed  

---

## 1. Entity Definitions

### 1.1 `BaseMapConfig`
Defines the foundational geographical surface, projection, and viewport coordinates.

| Field | Type | Constraints / Validation | Description |
|---|---|---|---|
| `styleUrl` | `string` | Valid URI or built-in style identifier | Tile source style specification URL |
| `center` | `[number, number]` | `[-180.0 <= lon <= 180.0, -90.0 <= lat <= 90.0]` | Geographic center coordinate `[longitude, latitude]` |
| `zoom` | `number` | `0.0 <= zoom <= 24.0` | Initial or current zoom level |
| `bearing` | `number` | `0.0 <= bearing < 360.0`, default `0.0` | Compass bearing in degrees |
| `pitch` | `number` | `0.0 <= pitch <= 85.0`, default `0.0` | Camera pitch/tilt angle in degrees |

---

### 1.2 `SemanticLayer`
Represents an isolated thematic overlay containing spatial entities.

| Field | Type | Constraints / Validation | Description |
|---|---|---|---|
| `id` | `string` | UUID v4 format | Immutable unique identifier for the layer |
| `name` | `string` | 1–100 characters, trimmed, non-empty | User-facing display name |
| `semanticType` | `SemanticCategory` | Enum: `baseline`, `tactical`, `infrastructure`, `environmental`, `annotation`, `custom` | Semantic classification of layer content |
| `order` | `integer` | `>= 0`, unique within the workspace | Stacking order / z-index (0 is bottom-most overlay) |
| `visible` | `boolean` | Default: `true` | Visibility toggle state |
| `opacity` | `number` | `0.0 <= opacity <= 1.0`, default `1.0` | Rendering transparency multiplier |
| `locked` | `boolean` | Default: `false` | Mutation lock preventing accidental edits |
| `entities` | `SpatialEntity[]` | Default: `[]` | Collection of spatial entities belonging to this layer |
| `metadata` | `Record<string, unknown>` | JSON serializable, default `{}` | Arbitrary domain or plugin metadata |
| `createdAt` | `string` | ISO 8601 UTC timestamp | Creation timestamp |
| `updatedAt` | `string` | ISO 8601 UTC timestamp | Last modification timestamp |

---

### 1.3 `SpatialEntity` (Baseline Interface)
Represents a semantically grounded graphical object anchored to geographical coordinates (Principle I).

| Field | Type | Constraints / Validation | Description |
|---|---|---|---|
| `id` | `string` | UUID v4 format | Unique entity identifier |
| `layerId` | `string` | Must match parent `SemanticLayer.id` | Foreign key referencing owner layer |
| `semanticClass` | `string` | 1–50 characters (e.g., `zone`, `path`, `poi`) | Domain classification of the object |
| `geometry` | `GeoJSON.Geometry` | Valid GeoJSON Point, LineString, Polygon, MultiPolygon | Standard spatial geometry (EPSG:4326) |
| `properties` | `Record<string, unknown>` | Valid JSON object | Domain attributes, labels, styling hints |

---

### 1.4 `CanvasWorkspace`
Top-level container document representing the complete project state.

| Field | Type | Constraints / Validation | Description |
|---|---|---|---|
| `schemaVersion` | `string` | SemVer format, must match `"1.0.0"` | Schema version for backward compatibility |
| `workspaceId` | `string` | UUID v4 format | Unique workspace identifier |
| `title` | `string` | 1–200 characters | Human-readable title for the sketch project |
| `baseMap` | `BaseMapConfig` | Valid `BaseMapConfig` | Base map configuration and viewport |
| `layers` | `SemanticLayer[]` | `length >= 1`, sorted by `order` ascending | List of all layers in the workspace |
| `activeLayerId` | `string` | Must match one of `layers[i].id` | Currently selected layer for user interactions |
| `createdAt` | `string` | ISO 8601 UTC timestamp | Workspace creation timestamp |
| `updatedAt` | `string` | ISO 8601 UTC timestamp | Last modification timestamp |

---

## 2. Validation Rules & Invariants

1. **Layer Count Invariant (`FR-012`)**: `layers.length` must never be zero. Deletion of the final remaining layer is prevented or automatically creates a default active layer.
2. **Order Sequence Invariant (`FR-004`)**: `order` properties across all layers in a workspace must form a continuous or strictly monotonic non-negative integer sequence without duplicates.
3. **Active Target Invariant**: `activeLayerId` must always point to an existing layer ID present in `layers`. If the active layer is deleted, `activeLayerId` automatically shifts to the nearest remaining layer.
4. **Coordinate Bounds Invariant (`FR-011`)**: All longitude coordinates must fall within `[-180.0, 180.0]` and latitude coordinates within `[-90.0, 90.0]`.
5. **Layer Isolation Invariant (`FR-003`)**: Each `SpatialEntity` belongs exclusively to its parent `layerId`. Operations (clear, transform, hide, delete) on layer $A$ cannot mutate entities belonging to layer $B$.

---

## 3. State Transitions

```
[New Workspace]
       │
       ▼
[Workspace Initialized] (BaseMap ready, Default Layer active)
       │
       ├──► [Create Layer] ────────► New layer appended with order = N, active
       ├──► [Reorder Layer] ───────► Orders updated, visual z-index updated (≤ 50ms)
       ├──► [Toggle Visibility] ───► Layer visible flag toggled, rendered entities hidden
       ├──► [Adjust Opacity] ──────► Opacity clamped [0.0, 1.0], layer shader alpha updated
       ├──► [Toggle Lock] ─────────► Locked flag toggled, selections disabled
       ├──► [Delete Layer] ────────► Verified (count > 1), removed from workspace
       │
       ├──► [Export Workspace] ────► Validated via Zod, serialized to JSON
       └──► [Import Workspace] ────► Parsed & validated, restores complete workspace state
```
