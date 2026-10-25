import type { BaseMapConfig } from '../schemas/basemap.js';
import type { SemanticLayer } from '../schemas/layer.js';
import type { CanvasWorkspace } from '../schemas/workspace.js';
import type { CountryDetailConfig } from '../schemas/country-sublayer.js';

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
  timestamp: string;
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

export interface LayerUpdatedEvent extends BaseEvent {
  type: 'layer:updated';
  layer: SemanticLayer;
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

export interface WorkspaceResetEvent extends BaseEvent {
  type: 'workspace:reset';
  workspace: CanvasWorkspace;
}

export type LayerEvent =
  | LayerCreatedEvent
  | LayerDeletedEvent
  | LayerActivatedEvent
  | LayerUpdatedEvent
  | LayerReorderedEvent
  | LayerVisibilityChangedEvent
  | LayerOpacityChangedEvent
  | LayerLockChangedEvent
  | BaseMapUpdatedEvent
  | WorkspaceLoadedEvent
  | WorkspaceResetEvent;

// ─── Sublayer Events ─────────────────────────────────────────────────────────

export type SublayerEventType =
  | 'sublayer:activated'
  | 'sublayer:deactivated'
  | 'sublayer:visibility-override-changed'
  | 'sublayer:config-updated';

export interface BaseSublayerEvent {
  type: SublayerEventType;
  timestamp: string;
  workspaceId: string;
}

export interface SublayerActivatedEvent extends BaseSublayerEvent {
  type: 'sublayer:activated';
  definitionIds: string[];
  countryCode: string;
}

export interface SublayerDeactivatedEvent extends BaseSublayerEvent {
  type: 'sublayer:deactivated';
  definitionIds: string[];
}

export interface SublayerVisibilityOverrideChangedEvent extends BaseSublayerEvent {
  type: 'sublayer:visibility-override-changed';
  definitionId: string;
  visible: boolean;
}

export interface SublayerConfigUpdatedEvent extends BaseSublayerEvent {
  type: 'sublayer:config-updated';
  config: CountryDetailConfig;
}

export type SublayerEvent =
  | SublayerActivatedEvent
  | SublayerDeactivatedEvent
  | SublayerVisibilityOverrideChangedEvent
  | SublayerConfigUpdatedEvent;

export type SublayerEventListener = (event: SublayerEvent) => void;

export type CanvasEvent = LayerEvent | SublayerEvent;
export type LayerEventListener = (event: LayerEvent) => void;
export type EventListener = LayerEventListener;

export class EventBroker<T extends { type: string } = CanvasEvent> {
  private listeners: Set<(event: T) => void> = new Set();

  public subscribe(listener: (event: T) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(event: T): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(`[EventBroker] Error in event listener for ${event.type}:`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public get listenerCount(): number {
    return this.listeners.size;
  }
}
