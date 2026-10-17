# Interface Contract: Event Broker & Synchronization

**Package**: `@canvas/core`  
**Target Consumer**: `@canvas/map-engine`, UI State Bridges  
**Date**: 2026-10-17  

---

## 1. Event Types

```typescript
export type LayerEventType =
  | 'layer:created'
  | 'layer:deleted'
  | 'layer:activated'
  | 'layer:updated'
  | 'layer:reordered'
  | 'layer:visibility-changed'
  | 'layer:opacity-changed'
  | 'layer:lock-changed'
  | 'basemap:updated'
  | 'workspace:loaded'
  | 'workspace:reset';

export interface BaseEvent {
  type: LayerEventType;
  timestamp: string; // ISO 8601
  workspaceId: string;
}

export interface LayerCreatedEvent extends BaseEvent {
  type: 'layer:created';
  layer: SemanticLayer;
}

export interface LayerDeletedEvent extends BaseEvent {
  type: 'layer:deleted';
  layerId: string;
  nextActiveLayerId: string;
}

export interface LayerActivatedEvent extends BaseEvent {
  type: 'layer:activated';
  layerId: string;
}

export interface LayerReorderedEvent extends BaseEvent {
  type: 'layer:reordered';
  layers: readonly SemanticLayer[];
}

export interface LayerVisibilityChangedEvent extends BaseEvent {
  type: 'layer:visibility-changed';
  layerId: string;
  visible: boolean;
}

export interface LayerOpacityChangedEvent extends BaseEvent {
  type: 'layer:opacity-changed';
  layerId: string;
  opacity: number;
}

export interface LayerLockChangedEvent extends BaseEvent {
  type: 'layer:lock-changed';
  layerId: string;
  locked: boolean;
}

export interface BaseMapUpdatedEvent extends BaseEvent {
  type: 'basemap:updated';
  config: BaseMapConfig;
}

export interface WorkspaceLoadedEvent extends BaseEvent {
  type: 'workspace:loaded';
  workspace: CanvasWorkspace;
}

export type LayerEvent =
  | LayerCreatedEvent
  | LayerDeletedEvent
  | LayerActivatedEvent
  | LayerReorderedEvent
  | LayerVisibilityChangedEvent
  | LayerOpacityChangedEvent
  | LayerLockChangedEvent
  | BaseMapUpdatedEvent
  | WorkspaceLoadedEvent;
```

---

## 2. Timing & Delivery Guarantees

- **Synchronous Emission**: Events are dispatched synchronously upon completion of state mutation in `LayerManager`.
- **UI & Renderer SLA (`SC-002`)**: `@canvas/map-engine` must ingest visibility, opacity, and reordering events and update MapLibre layer filters or layout properties within **50 milliseconds**.
- **Exception Boundary**: Handlers registered with the event broker execute within isolated try-catch blocks to prevent consumer errors from breaking the core layer manager.
