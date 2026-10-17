import React, { useState, useEffect, useRef } from 'react';
import { MapCanvas } from './components/canvas/MapCanvas.js';
import { LayerDock } from './components/layers/LayerDock.js';
import { WorkspaceMenu } from './components/menu/WorkspaceMenu.js';
import { useLayerManager } from './hooks/useLayerManager.js';
import { useWorkspacePersistence } from './hooks/useWorkspacePersistence.js';
import { LayerSyncEngine } from '@canvas/map-engine';
import type { MapLibreMapAdapter } from '@canvas/map-engine';

export const App: React.FC = () => {
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

  // Enable localStorage caching
  useWorkspacePersistence(manager);

  const [mapAdapter, setMapAdapter] = useState<MapLibreMapAdapter | null>(null);
  const syncEngineRef = useRef<LayerSyncEngine | null>(null);

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

        {/* Workspace import/export actions */}
        <WorkspaceMenu manager={manager} />
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Map Viewport Area */}
        <main style={{ flex: 1, position: 'relative', height: '100%' }}>
          <MapCanvas onMapReady={(adapter) => setMapAdapter(adapter)} />
        </main>

        {/* Right Sidebar Layer Dock */}
        <LayerDock
          layers={layers}
          activeLayer={activeLayer}
          onCreateLayer={(name, category) => createLayer({ name, semanticType: category })}
          onDeleteLayer={(id) => deleteLayer(id)}
          onSelectLayer={(id) => setActiveLayer(id)}
          onToggleVisibility={(id, visible) => setLayerVisibility(id, visible)}
          onToggleLock={(id, locked) => setLayerLocked(id, locked)}
          onChangeOpacity={(id, opacity) => setLayerOpacity(id, opacity)}
          onReorderLayers={(orderedIds) => reorderLayers(orderedIds)}
        />
      </div>
    </div>
  );
};
