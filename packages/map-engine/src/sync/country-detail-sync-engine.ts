import type {
  ICountryDetailManager,
  ILayerManager,
  SublayerEvent,
  SublayerActivatedEvent,
  SublayerDeactivatedEvent,
  SublayerVisibilityOverrideChangedEvent,
  SublayerConfigUpdatedEvent,
  CountrySublayerDefinition,
} from '@canvas/core';
import type { MapLibreMapAdapter } from '../adapters/maplibre-adapter.js';
import type { ViewportController, ViewportState } from '../controllers/viewport-controller.js';

/**
 * CountryDetailSyncEngine
 *
 * Synchronizes country detail sublayers with MapLibre GL JS map rendering.
 *
 * ISOLATION CONTRACT:
 * - This engine renders sublayers strictly as read-only geographic reference layers.
 * - Sublayer map layers are ALWAYS inserted below all semantic layers using `beforeId`.
 * - Sublayers NEVER mutate semantic layers, nor trigger LayerManager mutations.
 */
export class CountryDetailSyncEngine {
  private mapAdapter: MapLibreMapAdapter;
  private viewportController: ViewportController;
  private countryDetailManager: ICountryDetailManager;
  private layerManager?: ILayerManager;

  private unsubViewport: (() => void) | null = null;
  private unsubSublayers: (() => void) | null = null;
  private unsubLayerManager: (() => void) | null = null;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private createdSublayerIds: Set<string> = new Set();
  private cachedBeforeSemanticLayerId: string | undefined = undefined;

  constructor(
    mapAdapter: MapLibreMapAdapter,
    viewportController: ViewportController,
    countryDetailManager: ICountryDetailManager,
    layerManager?: ILayerManager
  ) {
    this.mapAdapter = mapAdapter;
    this.viewportController = viewportController;
    this.countryDetailManager = countryDetailManager;
    this.layerManager = layerManager;
  }

  public startSync(): void {
    if (this.unsubViewport || this.unsubSublayers) return;

    this.updateBeforeSemanticLayerId();

    if (this.layerManager) {
      this.unsubLayerManager = this.layerManager.subscribe((event) => {
        if (event.type === 'layer:reordered' || event.type === 'workspace:loaded' || event.type === 'layer:created') {
          this.updateBeforeSemanticLayerId();
        }
      });
    }

    // Subscribe to viewport changes with 100ms debounce
    this.unsubViewport = this.viewportController.onViewportChange((state: ViewportState) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.countryDetailManager.evaluateViewport(state.center, state.zoom);
        this.debounceTimer = null;
      }, 100);
    });

    // Subscribe to country detail manager events
    this.unsubSublayers = this.countryDetailManager.subscribe((event: SublayerEvent) => {
      this.handleSublayerEvent(event);
    });

    // Initial evaluation if map is already loaded
    this.mapAdapter.whenLoaded(() => {
      const state = this.viewportController.getViewportState();
      this.countryDetailManager.evaluateViewport(state.center, state.zoom);
    });
  }

  public stopSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.unsubViewport) {
      this.unsubViewport();
      this.unsubViewport = null;
    }

    if (this.unsubSublayers) {
      this.unsubSublayers();
      this.unsubSublayers = null;
    }

    if (this.unsubLayerManager) {
      this.unsubLayerManager();
      this.unsubLayerManager = null;
    }
  }

  private updateBeforeSemanticLayerId(): void {
    if (!this.layerManager) {
      this.cachedBeforeSemanticLayerId = undefined;
      return;
    }
    const layers = this.layerManager.getLayers();
    if (layers && layers.length > 0) {
      this.cachedBeforeSemanticLayerId = `layer-${layers[0].id}`;
    } else {
      this.cachedBeforeSemanticLayerId = undefined;
    }
  }

  private handleSublayerEvent(event: SublayerEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const startTime = performance.now();

    switch (event.type) {
      case 'sublayer:activated':
        this.onSublayerActivated(event);
        break;

      case 'sublayer:deactivated':
        this.onSublayerDeactivated(event);
        break;

      case 'sublayer:visibility-override-changed':
        this.onVisibilityOverrideChanged(event);
        break;

      case 'sublayer:config-updated':
        this.onConfigUpdated(event);
        break;
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`[CountryDetailSyncEngine] Sublayer sync exceeded 50ms SLA: ${elapsed.toFixed(2)}ms`);
    }
  }

  private onSublayerActivated(event: SublayerActivatedEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const config = this.countryDetailManager.getConfig();
    const defMap = new Map(config.definitions.map((d) => [d.id, d]));

    this.updateBeforeSemanticLayerId();

    for (const defId of event.definitionIds) {
      const def = defMap.get(defId);
      if (!def) continue;

      // Check if user has explicitly hidden this sublayer
      if (config.sublayerVisibilityOverrides[defId] === false) {
        continue;
      }

      const sourceId = `source-sublayer-${def.id}`;
      const layerId = `layer-sublayer-${def.id}`;

      try {
        if (!map.getSource(sourceId)) {
          const isUrl = def.tileSourceUrl.startsWith('http://') || def.tileSourceUrl.startsWith('https://');
          const isTileJson = def.tileSourceUrl.includes('.json');

          if (isTileJson) {
            map.addSource(sourceId, {
              type: 'vector',
              url: def.tileSourceUrl,
            });
          } else {
            map.addSource(sourceId, {
              type: 'vector',
              tiles: [def.tileSourceUrl],
            });
          }
        }

        if (!map.getLayer(layerId)) {
          map.addLayer(
            {
              id: layerId,
              type: 'fill',
              source: sourceId,
              layout: {
                visibility: 'visible',
              },
              paint: {
                'fill-color': this.getCategoryColor(def.detailCategory),
                'fill-opacity': 0.4,
              },
            },
            this.cachedBeforeSemanticLayerId
          );
          this.createdSublayerIds.add(def.id);
        } else {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      } catch (err) {
        console.warn(`[CountryDetailSyncEngine] Failed to render sublayer ${def.name} (${def.tileSourceUrl}):`, err);
      }
    }
  }

  private onSublayerDeactivated(event: SublayerDeactivatedEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    for (const defId of event.definitionIds) {
      const layerId = `layer-sublayer-${defId}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  }

  private onVisibilityOverrideChanged(event: SublayerVisibilityOverrideChangedEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    const layerId = `layer-sublayer-${event.definitionId}`;
    if (!map.getLayer(layerId)) return;

    if (event.visible) {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'none');
    }
  }

  private onConfigUpdated(event: SublayerConfigUpdatedEvent): void {
    const map = this.mapAdapter.getMapInstance();
    if (!map) return;

    // Hide all currently tracked sublayers
    for (const defId of this.createdSublayerIds) {
      const layerId = `layer-sublayer-${defId}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }

    // Re-show visible definitions
    const visibleDefs = this.countryDetailManager.getVisibleDefinitions();
    if (visibleDefs.length > 0) {
      this.onSublayerActivated({
        type: 'sublayer:activated',
        timestamp: new Date().toISOString(),
        workspaceId: 'workspace-default',
        definitionIds: visibleDefs.map((d) => d.id),
        countryCode: '',
      });
    }
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'administrative':
        return '#4299e1';
      case 'transport':
        return '#ed8936';
      case 'terrain':
        return '#48bb78';
      case 'urban':
        return '#9f7aea';
      case 'hydrography':
        return '#38b2ac';
      case 'custom':
      default:
        return '#a0aec0';
    }
  }
}
