# Interface Contract: Layer Manager API

**Package**: `@canvas/core`  
**Target Consumer**: `@canvas/map-engine`, `@canvas/web`, Plugin Extensions  
**Date**: 2026-10-17  

---

## 1. Core Types

```typescript
export type SemanticCategory = 
  | 'baseline'
  | 'tactical'
  | 'infrastructure'
  | 'environmental'
  | 'annotation'
  | 'custom';

export interface BaseMapConfig {
  styleUrl: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface CreateLayerOptions {
  name: string;
  semanticType: SemanticCategory;
  opacity?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateLayerOptions {
  name?: string;
  semanticType?: SemanticCategory;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  metadata?: Record<string, unknown>;
}
```

---

## 2. `ILayerManager` Interface

```typescript
export interface ILayerManager {
  // Queries
  getWorkspace(): CanvasWorkspace;
  getLayers(): readonly SemanticLayer[];
  getLayerById(id: string): SemanticLayer | undefined;
  getActiveLayer(): SemanticLayer;
  
  // Layer Lifecycle Mutations
  createLayer(options: CreateLayerOptions): SemanticLayer;
  deleteLayer(id: string): void;
  setActiveLayer(id: string): void;
  updateLayer(id: string, options: UpdateLayerOptions): SemanticLayer;
  
  // Hierarchy & Visibility
  reorderLayers(orderedIds: string[]): readonly SemanticLayer[];
  setLayerVisibility(id: string, visible: boolean): void;
  setLayerOpacity(id: string, opacity: number): void;
  setLayerLocked(id: string, locked: boolean): void;
  
  // Viewport / Base Map
  updateBaseMap(config: Partial<BaseMapConfig>): void;
  
  // Workspace Persistence
  serialize(): string; // Validated JSON string
  deserialize(json: string): void; // Parses and validates against Zod schema
  reset(title?: string): void;
  
  // Event Subscription
  subscribe(listener: (event: LayerEvent) => void): () => void;
}
```

---

## 3. Error Handling Contract

All methods throw typed error instances inheriting from `CanvasError`:

| Error Code | Class | Cause |
|---|---|---|
| `LAYER_NOT_FOUND` | `LayerNotFoundError` | Requested layer ID does not exist |
| `INVALID_LAYER_COUNT` | `InvalidLayerCountError` | Attempted to delete the last remaining layer |
| `INVALID_COORDINATES` | `InvalidCoordinatesError` | Longitude outside [-180, 180] or latitude outside [-90, 90] |
| `SCHEMA_VALIDATION_ERROR`| `SchemaValidationError` | Deserialization input fails Zod schema validation |
| `DUPLICATE_ORDER_ERROR` | `DuplicateOrderError` | Reordering specifies duplicate or missing layer IDs |
| `LAYER_LOCKED_ERROR` | `LayerLockedError` | Attempted mutation on a locked layer |
