import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CountryDetailSyncEngine } from '../country-detail-sync-engine.js';
import type { ICountryDetailManager, CountrySublayerDefinition } from '@canvas/core';

describe('CountryDetailSyncEngine Unit Tests', () => {
  let mockMap: any;
  let mockMapAdapter: any;
  let mockViewportController: any;
  let mockCountryDetailManager: any;
  let mockLayerManager: any;
  let sublayerListeners: Array<(evt: any) => void>;

  const def1: CountrySublayerDefinition = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    countryCode: 'MY',
    name: 'Malaysia Admin',
    detailCategory: 'administrative',
    minZoomThreshold: 5.0,
    tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
    enabled: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  beforeEach(() => {
    sublayerListeners = [];
    const layersMap = new Map<string, any>();
    const sourcesMap = new Map<string, any>();

    mockMap = {
      getSource: vi.fn((id: string) => sourcesMap.get(id)),
      addSource: vi.fn((id: string, src: any) => sourcesMap.set(id, src)),
      getLayer: vi.fn((id: string) => layersMap.get(id)),
      addLayer: vi.fn((layer: any, beforeId?: string) => {
        layersMap.set(layer.id, { ...layer, beforeId });
      }),
      setLayoutProperty: vi.fn((id: string, prop: string, val: any) => {
        const l = layersMap.get(id);
        if (l) {
          l.layout = l.layout || {};
          l.layout[prop] = val;
        }
      }),
    };

    mockMapAdapter = {
      getMapInstance: vi.fn(() => mockMap),
      loaded: true,
      whenLoaded: vi.fn((cb: () => void) => cb()),
    };

    mockViewportController = {
      onViewportChange: vi.fn(() => () => {}),
      getViewportState: vi.fn(() => ({ center: [100, 5], zoom: 6 })),
    };

    mockCountryDetailManager = {
      getConfig: vi.fn(() => ({ definitions: [def1], sublayerVisibilityOverrides: {} })),
      getVisibleDefinitions: vi.fn(() => [def1]),
      evaluateViewport: vi.fn(),
      subscribe: vi.fn((listener: (evt: any) => void) => {
        sublayerListeners.push(listener);
        return () => {
          const idx = sublayerListeners.indexOf(listener);
          if (idx >= 0) sublayerListeners.splice(idx, 1);
        };
      }),
    };

    mockLayerManager = {
      getLayers: vi.fn(() => [{ id: 'semantic-1', name: 'Layer 1' }]),
      subscribe: vi.fn(() => () => {}),
    };
  });

  it('sublayer:activated event calls map.addSource and map.addLayer with correct beforeId', () => {
    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    const listener = sublayerListeners[0];
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.addSource).toHaveBeenCalledWith(
      `source-sublayer-${def1.id}`,
      expect.objectContaining({
        type: 'vector',
        tiles: [def1.tileSourceUrl],
      })
    );
    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: `layer-sublayer-${def1.id}`,
        source: `source-sublayer-${def1.id}`,
      }),
      'layer-semantic-1'
    );
  });

  it('sublayer:deactivated event sets layout visibility to none', () => {
    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    const listener = sublayerListeners[0];
    // First activate
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    // Then deactivate
    listener({
      type: 'sublayer:deactivated',
      definitionIds: [def1.id],
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
      `layer-sublayer-${def1.id}`,
      'visibility',
      'none'
    );
  });

  it('re-activation of existing layer calls setLayoutProperty to visible without re-adding', () => {
    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    const listener = sublayerListeners[0];
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });
    expect(mockMap.addLayer).toHaveBeenCalledTimes(1);

    // Deactivate
    listener({
      type: 'sublayer:deactivated',
      definitionIds: [def1.id],
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    // Reactivate
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.addLayer).toHaveBeenCalledTimes(1);
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
      `layer-sublayer-${def1.id}`,
      'visibility',
      'visible'
    );
  });

  it('logs SLA warning if event handler takes > 50 ms', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    // Mock performance.now to simulate a slow run (> 50ms)
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 100 : 160;
    });

    const listener = sublayerListeners[0];
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('exceeded 50ms SLA')
    );
    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
