import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CountryDetailSyncEngine } from '../country-detail-sync-engine.js';
import type { CountrySublayerDefinition } from '@canvas/core';

describe('CountryDetailSyncEngine Overrides Tests', () => {
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
        return () => {};
      }),
    };

    mockLayerManager = {
      getLayers: vi.fn(() => [{ id: 'semantic-1', name: 'Layer 1' }]),
      subscribe: vi.fn(() => () => {}),
    };
  });

  it('sublayer:visibility-override-changed with visible: false sets layout visibility to none', () => {
    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      mockLayerManager
    );
    engine.startSync();

    const listener = sublayerListeners[0];
    // Activate layer first
    listener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    // Toggle override off
    listener({
      type: 'sublayer:visibility-override-changed',
      definitionId: def1.id,
      visible: false,
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
      `layer-sublayer-${def1.id}`,
      'visibility',
      'none'
    );
  });

  it('sublayer:visibility-override-changed with visible: true restores layer visibility to visible', () => {
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

    listener({
      type: 'sublayer:visibility-override-changed',
      definitionId: def1.id,
      visible: true,
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
      `layer-sublayer-${def1.id}`,
      'visibility',
      'visible'
    );
  });

  it('sublayer:config-updated hides existing layers and re-activates visible definitions', () => {
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

    listener({
      type: 'sublayer:config-updated',
      config: { definitions: [def1], sublayerVisibilityOverrides: {} },
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
      `layer-sublayer-${def1.id}`,
      'visibility',
      'none'
    );
  });
});
