import React, { useState, useEffect, useRef } from 'react';
import { MapCanvas } from './components/canvas/MapCanvas.js';
import { LayerDock } from './components/layers/LayerDock.js';
import { WorkspaceMenu } from './components/menu/WorkspaceMenu.js';
import { useLayerManager } from './hooks/useLayerManager.js';
import { useWorkspacePersistence } from './hooks/useWorkspacePersistence.js';
import { LayerSyncEngine, CountryDetailSyncEngine } from '@canvas/map-engine';
import type { MapLibreMapAdapter, ViewportController } from '@canvas/map-engine';
import { useCountryDetailManager } from './hooks/useCountryDetailManager.js';
import { useViewportSync } from './hooks/useViewportSync.js';

import { CountrySublayerManager } from './components/layers/CountrySublayerManager.js';

export const App: React.FC = () => {
  const [isSublayerManagerOpen, setIsSublayerManagerOpen] = useState(false);

  const {
    manager,
    layers,
    activeLayer,
    createLayer,
    deleteLayer,
    setActiveLayer,
    reorderLayers,
    setLayerVisibility,
    setLayerOpacity,
    setLayerLocked,
  } = useLayerManager();

  const {
    manager: countryDetailManager,
    config,
    activeDefinitions,
    visibleDefinitions,
    sublayerVisibilityOverrides,
    addDefinition,
    removeDefinition,
    setVisibilityOverride,
  } = useCountryDetailManager();

  // Enable localStorage caching with sublayer config persistence
  useWorkspacePersistence(manager, countryDetailManager);

  const [mapAdapter, setMapAdapter] = useState<MapLibreMapAdapter | null>(null);
  const [viewportController, setViewportController] = useState<ViewportController | null>(null);

  const syncEngineRef = useRef<LayerSyncEngine | null>(null);
  const countryDetailSyncEngineRef = useRef<CountryDetailSyncEngine | null>(null);

  // Sync viewport movements to country detail manager
  useViewportSync(viewportController, countryDetailManager);

  useEffect(() => {
    if (!mapAdapter) return;

    const syncEngine = new LayerSyncEngine(mapAdapter, manager);
    syncEngine.startSync();
    syncEngineRef.current = syncEngine;

    return () => {
      syncEngine.stopSync();
      syncEngineRef.current = null;
    };
  }, [mapAdapter, manager]);

  useEffect(() => {
    if (!mapAdapter || !viewportController) return;

    const countrySync = new CountryDetailSyncEngine(
      mapAdapter,
      viewportController,
      countryDetailManager,
      manager
    );
    countrySync.startSync();
    countryDetailSyncEngineRef.current = countrySync;

    return () => {
      countrySync.stopSync();
      countryDetailSyncEngineRef.current = null;
    };
  }, [mapAdapter, viewportController, countryDetailManager, manager]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#12161a',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: '48px',
          backgroundColor: '#1a202c',
          borderBottom: '1px solid #2d3748',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#63b3ed', letterSpacing: '1px' }}>
            CANVAS
          </span>
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>
            Context-Aware Naturally Vibe AI Sketcher
          </span>
        </div>

        {/* Workspace and detail layers actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsSublayerManagerOpen(true)}
            data-testid="btn-manage-detail-layers"
            style={{
              backgroundColor: '#2d3748',
              color: '#e2e8f0',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Manage Detail Layers
          </button>
          <WorkspaceMenu manager={manager} countryDetailManager={countryDetailManager} />
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Map Viewport Area */}
        <main style={{ flex: 1, position: 'relative', height: '100%' }}>
          <MapCanvas
            onMapReady={(adapter, controller) => {
              setMapAdapter(adapter);
              if (controller) setViewportController(controller);
            }}
          />
        </main>

        {/* Right Sidebar Layer Dock */}
        <LayerDock
          layers={layers}
          activeLayer={activeLayer}
          activeSublayers={activeDefinitions}
          sublayerVisibilityOverrides={sublayerVisibilityOverrides}
          onCreateLayer={(name, category) => createLayer({ name, semanticType: category })}
          onDeleteLayer={(id) => deleteLayer(id)}
          onSelectLayer={(id) => setActiveLayer(id)}
          onToggleVisibility={(id, visible) => setLayerVisibility(id, visible)}
          onToggleSublayerVisibility={(id, visible) => setVisibilityOverride(id, visible)}
          onToggleLock={(id, locked) => setLayerLocked(id, locked)}
          onChangeOpacity={(id, opacity) => setLayerOpacity(id, opacity)}
          onReorderLayers={(orderedIds) => reorderLayers(orderedIds)}
        />
      </div>

      {isSublayerManagerOpen && (
        <CountrySublayerManager
          config={config}
          onAddDefinition={addDefinition}
          onRemoveDefinition={removeDefinition}
          onClose={() => setIsSublayerManagerOpen(false)}
        />
      )}
    </div>
  );
};
