import { describe, it, expect, vi } from 'vitest';
import { CountryDetailSyncEngine } from '../country-detail-sync-engine.js';
import type { CountrySublayerDefinition } from '@canvas/core';

describe('MapLibre Z-Order Enforcement Unit Tests', () => {
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

  it('addLayer called by CountryDetailSyncEngine passes beforeId equal to lowest semantic layer ID', () => {
    const layersMap = new Map<string, any>();
    const sourcesMap = new Map<string, any>();

    const mockMap: any = {
      getSource: vi.fn((id: string) => sourcesMap.get(id)),
      addSource: vi.fn((id: string, src: any) => sourcesMap.set(id, src)),
      getLayer: vi.fn((id: string) => layersMap.get(id)),
      addLayer: vi.fn((layer: any, beforeId?: string) => {
        layersMap.set(layer.id, { ...layer, beforeId });
      }),
      setLayoutProperty: vi.fn(),
    };

    const mockMapAdapter: any = {
      getMapInstance: () => mockMap,
      loaded: true,
      whenLoaded: (cb: any) => cb(),
    };

    const mockViewportController: any = {
      onViewportChange: vi.fn(() => () => {}),
      getViewportState: vi.fn(() => ({ center: [100, 5], zoom: 6 })),
    };

    let sublayerListener: any = null;
    const mockCountryDetailManager: any = {
      getConfig: vi.fn(() => ({ definitions: [def1], sublayerVisibilityOverrides: {} })),
      getVisibleDefinitions: vi.fn(() => [def1]),
      evaluateViewport: vi.fn(),
      subscribe: vi.fn((l: any) => {
        sublayerListener = l;
        return () => {};
      }),
    };

    let layerListener: any = null;
    let semanticLayers = [
      { id: 'sem-layer-A', name: 'A' },
      { id: 'sem-layer-B', name: 'B' },
    ];

    const mockLayerManager: any = {
      getLayers: vi.fn(() => semanticLayers),
      subscribe: vi.fn((l: any) => {
        layerListener = l;
        return () => {};
      }),
    };

    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    sublayerListener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.anything(),
      'layer-sem-layer-A'
    );

    // Simulate reordering: layer B is now first
    semanticLayers = [
      { id: 'sem-layer-B', name: 'B' },
      { id: 'sem-layer-A', name: 'A' },
    ];
    layerListener({
      type: 'layer:reordered',
      layers: semanticLayers,
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    // Add a second sublayer definition
    const def2: CountrySublayerDefinition = {
      ...def1,
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Malaysia Roads',
    };
    mockCountryDetailManager.getConfig.mockReturnValue({
      definitions: [def1, def2],
      sublayerVisibilityOverrides: {},
    });

    sublayerListener({
      type: 'sublayer:activated',
      definitionIds: [def2.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.anything(),
      'layer-sem-layer-B'
    );
  });
});
