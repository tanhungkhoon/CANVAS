import type { ILayerManager, LayerEvent, SemanticLayer } from '@canvas/core';
import type { MapLibreMapAdapter } from '../adapters/maplibre-adapter.js';

export class LayerSyncEngine {
  private mapAdapter: MapLibreMapAdapter;
  private layerManager: ILayerManager;
  private unsubscribe: (() => void) | null = null;

  constructor(mapAdapter: MapLibreMapAdapter, layerManager: ILayerManager) {
    this.mapAdapter = mapAdapter;
    this.layerManager = layerManager;
  }

  public startSync(): void {
    if (this.unsubscribe) return;

    this.mapAdapter.whenLoaded(() => {
      this.syncAllLayers();
    });

    this.unsubscribe = this.layerManager.subscribe((event: LayerEvent) => {
      this.handleLayerEvent(event);
    });
  }

  public stopSync(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  public syncAllLayers(): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const layers = this.layerManager.getLayers();
    for (const layer of layers) {
      this.ensureMapLayer(layer);
    }
  }

  private handleLayerEvent(event: LayerEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map || !this.mapAdapter.loaded) return;

    const startTime = performance.now();

    switch (event.type) {
      case 'layer:created':
        this.ensureMapLayer(event.layer);
        break;

      case 'layer:deleted':
        this.removeMapLayer(event.layerId);
        break;

      case 'layer:visibility-changed':
        this.setLayerVisibility(event.layerId, event.visible);
        break;

      case 'layer:opacity-changed':
        this.setLayerOpacity(event.layerId, event.opacity);
        break;

      case 'layer:reordered':
        this.syncOrder(event.layers);
        break;

      case 'workspace:loaded':
      case 'workspace:reset':
        this.syncAllLayers();
        break;
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`[LayerSyncEngine] Layer sync exceeded 50ms SLA: ${elapsed.toFixed(2)}ms`);
    }
  }

  private ensureMapLayer(layer: SemanticLayer): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const sourceId = `source-${layer.id}`;
    const mapLayerId = `layer-${layer.id}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: layer.entities.map((e) => ({
            type: 'Feature',
            id: e.id,
            geometry: e.geometry as any,
            properties: {
              ...e.properties,
              semanticClass: e.semanticClass,
            },
          })),
        },
      });
    }

    if (!map.getLayer(mapLayerId)) {
      map.addLayer({
        id: mapLayerId,
        type: 'fill',
        source: sourceId,
        layout: {
          visibility: layer.visible ? 'visible' : 'none',
        },
        paint: {
          'fill-color': this.getCategoryColor(layer.semanticType),
          'fill-opacity': layer.opacity * 0.6,
        },
      });
    }
  }

  private removeMapLayer(layerId: string): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const mapLayerId = `layer-${layerId}`;
    const sourceId = `source-${layerId}`;

    if (map.getLayer(mapLayerId)) {
      map.removeLayer(mapLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private setLayerVisibility(layerId: string, visible: boolean): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const mapLayerId = `layer-${layerId}`;
    if (map.getLayer(mapLayerId)) {
      map.setLayoutProperty(mapLayerId, 'visibility', visible ? 'visible' : 'none');
    }
  }

  private setLayerOpacity(layerId: string, opacity: number): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const mapLayerId = `layer-${layerId}`;
    if (map.getLayer(mapLayerId)) {
      map.setPaintProperty(mapLayerId, 'fill-opacity', opacity * 0.6);
    }
  }

  private syncOrder(layers: readonly SemanticLayer[]): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    // Move layers sequentially according to ordered stack
    for (let i = 1; i < layers.length; i++) {
      const currentId = `layer-${layers[i].id}`;
      const beforeId = `layer-${layers[i - 1].id}`;
      if (map.getLayer(currentId) && map.getLayer(beforeId)) {
        map.moveLayer(currentId);
      }
    }
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'tactical':
        return '#e53e3e';
      case 'infrastructure':
        return '#3182ce';
      case 'environmental':
        return '#38a169';
      case 'annotation':
        return '#dd6b20';
      case 'custom':
        return '#805ad5';
      case 'baseline':
      default:
        return '#4a5568';
    }
  }
}
