import React from 'react';
import { useBaseMap } from '../../hooks/useBaseMap.js';

interface MapCanvasProps {
  onMapReady?: (adapter: ReturnType<typeof useBaseMap>['adapter']) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onMapReady }) => {
  const { containerRef, isReady, viewport, resetViewport, adapter } = useBaseMap();

  React.useEffect(() => {
    if (isReady && adapter && onMapReady) {
      onMapReady(adapter);
    }
  }, [isReady, adapter, onMapReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        data-testid="map-container"
        style={{ width: '100%', height: '100%' }}
      />

      {!isReady && (
        <div
          data-testid="map-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        >
          Loading Base Map...
        </div>
      )}

      {/* Viewport Coordinates Hud */}
      <div
        data-testid="map-coordinates-hud"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(20, 24, 30, 0.85)',
          color: '#a0aec0',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid #2d3748',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <span>Lon: {viewport.center[0].toFixed(4)}°</span>
        <span style={{ margin: '0 8px' }}>|</span>
        <span>Lat: {viewport.center[1].toFixed(4)}°</span>
        <span style={{ margin: '0 8px' }}>|</span>
        <span>Zoom: {viewport.zoom.toFixed(1)}</span>
      </div>

      {/* Floating Reset Button */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
        }}
      >
        <button
          onClick={resetViewport}
          data-testid="btn-reset-viewport"
          style={{
            backgroundColor: '#2b6cb0',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2c5282')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2b6cb0')}
        >
          Reset View
        </button>
      </div>
    </div>
  );
};
