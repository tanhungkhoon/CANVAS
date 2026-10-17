import { CanvasWorkspace } from '../schemas/workspace.js';
import { SemanticLayer, CreateLayerOptions, UpdateLayerOptions } from '../schemas/layer.js';
import { BaseMapConfig, DEFAULT_BASEMAP_CONFIG } from '../schemas/basemap.js';
import { EventBroker, LayerEvent, EventListener } from '../events/event-broker.js';
import { serializeWorkspace, deserializeWorkspace } from './workspace-serializer.js';
import {
  InvalidLayerCountError,
  LayerNotFoundError,
  LayerLockedError,
  DuplicateOrderError,
  SchemaValidationError,
} from '../errors/index.js';

export interface ILayerManager {
  getWorkspace(): CanvasWorkspace;
  getLayers(): readonly SemanticLayer[];
  getLayerById(id: string): SemanticLayer | undefined;
  getActiveLayer(): SemanticLayer;
  setActiveLayer(id: string): void;
  createLayer(options: CreateLayerOptions): SemanticLayer;
  updateLayer(id: string, options: UpdateLayerOptions): SemanticLayer;
  deleteLayer(id: string): void;
  reorderLayers(orderedIds: string[]): readonly SemanticLayer[];
  setLayerVisibility(id: string, visible: boolean): void;
  setLayerOpacity(id: string, opacity: number): void;
  setLayerLocked(id: string, locked: boolean): void;
  updateBaseMap(config: Partial<BaseMapConfig>): void;
  subscribe(listener: EventListener): () => void;
  serialize(): string;
  deserialize(json: string): void;
  reset(title?: string): void;
}

export class LayerManager implements ILayerManager {
  private workspace: CanvasWorkspace;
  private eventBroker: EventBroker;

  constructor(initialTitle: string = 'Untitled Canvas') {
    this.eventBroker = new EventBroker();
    const defaultLayerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const defaultLayer: SemanticLayer = {
      id: defaultLayerId,
      name: 'Layer 1',
      semanticType: 'baseline',
      order: 0,
      visible: true,
      opacity: 1.0,
      locked: false,
      entities: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.workspace = {
      schemaVersion: '1.0.0',
      workspaceId: crypto.randomUUID(),
      title: initialTitle,
      baseMap: { ...DEFAULT_BASEMAP_CONFIG },
      layers: [defaultLayer],
      activeLayerId: defaultLayerId,
      createdAt: now,
      updatedAt: now,
    };
  }

  public getWorkspace(): CanvasWorkspace {
    return { ...this.workspace, layers: [...this.workspace.layers] };
  }

  public getLayers(): readonly SemanticLayer[] {
    return this.workspace.layers;
  }

  public getLayerById(id: string): SemanticLayer | undefined {
    return this.workspace.layers.find((layer) => layer.id === id);
  }

  public getActiveLayer(): SemanticLayer {
    const active = this.getLayerById(this.workspace.activeLayerId);
    if (!active) {
      return this.workspace.layers[0];
    }
    return active;
  }

  public setActiveLayer(id: string): void {
    const layer = this.getLayerById(id);
    if (!layer) {
      throw new LayerNotFoundError(id);
    }
    this.workspace.activeLayerId = id;
    this.workspace.updatedAt = new Date().toISOString();

    this.eventBroker.emit({
      type: 'layer:activated',
      workspaceId: this.workspace.workspaceId,
      timestamp: this.workspace.updatedAt,
      layerId: id,
    });
  }

  public createLayer(options: CreateLayerOptions): SemanticLayer {
    const now = new Date().toISOString();
    const newLayer: SemanticLayer = {
      id: crypto.randomUUID(),
      name: options.name.trim(),
      semanticType: options.semanticType,
      order: this.workspace.layers.length,
      visible: true,
      opacity: Math.max(0.0, Math.min(1.0, options.opacity ?? 1.0)),
      locked: false,
      entities: [],
      metadata: options.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.workspace.layers.push(newLayer);
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:created',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layer: newLayer,
    });

    return newLayer;
  }

  public updateLayer(id: string, options: UpdateLayerOptions): SemanticLayer {
    const layerIndex = this.workspace.layers.findIndex((l) => l.id === id);
    if (layerIndex === -1) {
      throw new LayerNotFoundError(id);
    }

    const currentLayer = this.workspace.layers[layerIndex];
    if (currentLayer.locked && options.locked === undefined) {
      throw new LayerLockedError(id);
    }

    const now = new Date().toISOString();
    const updatedLayer: SemanticLayer = {
      ...currentLayer,
      name: options.name !== undefined ? options.name.trim() : currentLayer.name,
      semanticType: options.semanticType ?? currentLayer.semanticType,
      visible: options.visible !== undefined ? options.visible : currentLayer.visible,
      opacity: options.opacity !== undefined ? Math.max(0.0, Math.min(1.0, options.opacity)) : currentLayer.opacity,
      locked: options.locked !== undefined ? options.locked : currentLayer.locked,
      metadata: options.metadata ? { ...currentLayer.metadata, ...options.metadata } : currentLayer.metadata,
      updatedAt: now,
    };

    this.workspace.layers[layerIndex] = updatedLayer;
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:updated',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layer: updatedLayer,
    });

    return updatedLayer;
  }

  public deleteLayer(id: string): void {
    const layerIndex = this.workspace.layers.findIndex((l) => l.id === id);
    if (layerIndex === -1) {
      throw new LayerNotFoundError(id);
    }

    if (this.workspace.layers.length <= 1) {
      throw new InvalidLayerCountError();
    }

    this.workspace.layers.splice(layerIndex, 1);

    // Re-index orders
    this.workspace.layers.forEach((l, idx) => {
      l.order = idx;
    });

    // Handle active layer re-assignment if deleted layer was active
    let nextActiveId = this.workspace.activeLayerId;
    if (this.workspace.activeLayerId === id) {
      nextActiveId = this.workspace.layers[Math.max(0, layerIndex - 1)].id;
      this.workspace.activeLayerId = nextActiveId;
    }

    const now = new Date().toISOString();
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:deleted',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layerId: id,
      nextActiveLayerId: nextActiveId,
    });
  }

  public reorderLayers(orderedIds: string[]): readonly SemanticLayer[] {
    if (orderedIds.length !== this.workspace.layers.length) {
      throw new DuplicateOrderError('Provided ID count does not match existing layer count.');
    }

    const idSet = new Set(orderedIds);
    if (idSet.size !== orderedIds.length) {
      throw new DuplicateOrderError('Layer IDs in reorder request must be unique.');
    }

    const layerMap = new Map<string, SemanticLayer>();
    for (const l of this.workspace.layers) {
      layerMap.set(l.id, l);
    }

    for (const id of orderedIds) {
      if (!layerMap.has(id)) {
        throw new LayerNotFoundError(id);
      }
    }

    const reordered: SemanticLayer[] = orderedIds.map((id, index) => {
      const layer = layerMap.get(id)!;
      layer.order = index;
      return layer;
    });

    this.workspace.layers = reordered;
    const now = new Date().toISOString();
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:reordered',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layers: reordered,
    });

    return reordered;
  }

  public setLayerVisibility(id: string, visible: boolean): void {
    const layer = this.getLayerById(id);
    if (!layer) throw new LayerNotFoundError(id);

    layer.visible = visible;
    const now = new Date().toISOString();
    layer.updatedAt = now;
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:visibility-changed',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layerId: id,
      visible,
    });
  }

  public setLayerOpacity(id: string, opacity: number): void {
    const layer = this.getLayerById(id);
    if (!layer) throw new LayerNotFoundError(id);

    const clamped = Math.max(0.0, Math.min(1.0, opacity));
    layer.opacity = clamped;
    const now = new Date().toISOString();
    layer.updatedAt = now;
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:opacity-changed',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layerId: id,
      opacity: clamped,
    });
  }

  public setLayerLocked(id: string, locked: boolean): void {
    const layer = this.getLayerById(id);
    if (!layer) throw new LayerNotFoundError(id);

    layer.locked = locked;
    const now = new Date().toISOString();
    layer.updatedAt = now;
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'layer:lock-changed',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      layerId: id,
      locked,
    });
  }

  public updateBaseMap(config: Partial<BaseMapConfig>): void {
    this.workspace.baseMap = {
      ...this.workspace.baseMap,
      ...config,
    };
    const now = new Date().toISOString();
    this.workspace.updatedAt = now;

    this.eventBroker.emit({
      type: 'basemap:updated',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      config: this.workspace.baseMap,
    });
  }

  public subscribe(listener: EventListener): () => void {
    return this.eventBroker.subscribe(listener);
  }

  public serialize(): string {
    return serializeWorkspace(this.workspace);
  }

  public deserialize(json: string): void {
    const loaded = deserializeWorkspace(json);
    this.workspace = loaded;
    this.eventBroker.emit({
      type: 'workspace:loaded',
      workspaceId: this.workspace.workspaceId,
      timestamp: new Date().toISOString(),
      workspace: this.workspace,
    });
  }

  public reset(title: string = 'Untitled Canvas'): void {
    const defaultLayerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const defaultLayer: SemanticLayer = {
      id: defaultLayerId,
      name: 'Layer 1',
      semanticType: 'baseline',
      order: 0,
      visible: true,
      opacity: 1.0,
      locked: false,
      entities: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.workspace = {
      schemaVersion: '1.0.0',
      workspaceId: crypto.randomUUID(),
      title,
      baseMap: { ...DEFAULT_BASEMAP_CONFIG },
      layers: [defaultLayer],
      activeLayerId: defaultLayerId,
      createdAt: now,
      updatedAt: now,
    };

    this.eventBroker.emit({
      type: 'workspace:reset',
      workspaceId: this.workspace.workspaceId,
      timestamp: now,
      workspace: this.workspace,
    });
  }
}
