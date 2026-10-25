import { describe, it, expect, vi } from 'vitest';
import { CountryDetailSyncEngine } from '../country-detail-sync-engine.js';
import { LayerManager } from '@canvas/core';
import type { CountrySublayerDefinition } from '@canvas/core';

describe('Layer Isolation Integration Tests', () => {
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

  it('sublayer activation does not mutate LayerManager layers array or trigger LayerManager mutations', () => {
    const layerManager = new LayerManager();
    const initialLayers = layerManager.getLayers();
    const initialCount = initialLayers.length;
    const initialFirstId = initialLayers[0].id;

    // Spy on mutation methods of LayerManager
    const updateLayerSpy = vi.spyOn(layerManager, 'updateLayer');
    const setVisibilitySpy = vi.spyOn(layerManager, 'setLayerVisibility');
    const setOpacitySpy = vi.spyOn(layerManager, 'setLayerOpacity');
    const setLockedSpy = vi.spyOn(layerManager, 'setLayerLocked');

    let sublayerListener: any = null;
    const mockCountryDetailManager: any = {
      getConfig: vi.fn(() => ({ definitions: [def1], sublayerVisibilityOverrides: {} })),
      getVisibleDefinitions: vi.fn(() => [def1]),
      evaluateViewport: vi.fn(),
      subscribe: vi.fn((listener: any) => {
        sublayerListener = listener;
        return () => {};
      }),
    };

    const mockMap: any = {
      getSource: vi.fn(),
      addSource: vi.fn(),
      getLayer: vi.fn(),
      addLayer: vi.fn(),
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

    const engine = new CountryDetailSyncEngine(
      mockMapAdapter,
      mockViewportController,
      mockCountryDetailManager,
      layerManager
    );
    engine.startSync();

    // Trigger sublayer activation
    sublayerListener({
      type: 'sublayer:activated',
      definitionIds: [def1.id],
      countryCode: 'MY',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
    });

    // Check isolation
    expect(layerManager.getLayers().length).toBe(initialCount);
    expect(layerManager.getLayers()[0].id).toBe(initialFirstId);
    expect(updateLayerSpy).not.toHaveBeenCalled();
    expect(setVisibilitySpy).not.toHaveBeenCalled();
    expect(setOpacitySpy).not.toHaveBeenCalled();
    expect(setLockedSpy).not.toHaveBeenCalled();
  });
});
