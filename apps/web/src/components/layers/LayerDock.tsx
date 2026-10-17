import React, { useState } from 'react';
import type { SemanticCategory, SemanticLayer } from '@canvas/core';
import { LayerItem } from './LayerItem.js';

interface LayerDockProps {
  layers: readonly SemanticLayer[];
  activeLayer: SemanticLayer;
  onCreateLayer: (name: string, category: SemanticCategory) => void;
  onDeleteLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onReorderLayers: (orderedIds: string[]) => void;
}

export const LayerDock: React.FC<LayerDockProps> = ({
  layers,
  activeLayer,
  onCreateLayer,
  onDeleteLayer,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onChangeOpacity,
  onReorderLayers,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerCategory, setNewLayerCategory] = useState<SemanticCategory>('tactical');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;

    onCreateLayer(newLayerName.trim(), newLayerCategory);
    setNewLayerName('');
    setIsCreating(false);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const newOrder = [...layers];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    onReorderLayers(newOrder.map((l) => l.id));
  };

  return (
    <aside
      data-testid="layer-dock"
      style={{
        width: '320px',
        backgroundColor: '#171923',
        borderLeft: '1px solid #2d3748',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 15,
      }}
    >
      {/* Dock Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2d3748',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.5px' }}>
            LAYERS
          </h2>
          <span
            style={{
              backgroundColor: '#2d3748',
              color: '#a0aec0',
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
            }}
          >
            {layers.length}
          </span>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          data-testid="btn-add-layer"
          style={{
            backgroundColor: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Add Layer
        </button>
      </div>

      {/* New Layer Form Modal/Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          style={{
            padding: '12px 16px',
            backgroundColor: '#1a202c',
            borderBottom: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#63b3ed' }}>Create New Layer</div>
          <input
            type="text"
            placeholder="Layer Name"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            autoFocus
            data-testid="input-new-layer-name"
            style={{
              backgroundColor: '#2d3748',
              color: '#fff',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          />
          <select
            value={newLayerCategory}
            onChange={(e) => setNewLayerCategory(e.target.value as SemanticCategory)}
            data-testid="select-new-layer-category"
            style={{
              backgroundColor: '#2d3748',
              color: '#fff',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '12px',
            }}
          >
            <option value="tactical">Tactical</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="environmental">Environmental</option>
            <option value="annotation">Annotation</option>
            <option value="baseline">Baseline</option>
            <option value="custom">Custom</option>
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#a0aec0',
                border: 'none',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-confirm-add-layer"
              style={{
                backgroundColor: '#38a169',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Layer Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayer.id}
            canDelete={layers.length > 1}
            onSelect={() => onSelectLayer(layer.id)}
            onToggleVisibility={(visible) => onToggleVisibility(layer.id, visible)}
            onToggleLock={(locked) => onToggleLock(layer.id, locked)}
            onChangeOpacity={(opacity) => onChangeOpacity(layer.id, opacity)}
            onDelete={() => onDeleteLayer(layer.id)}
            onMoveUp={index > 0 ? () => handleMove(index, 'up') : undefined}
            onMoveDown={index < layers.length - 1 ? () => handleMove(index, 'down') : undefined}
          />
        ))}
      </div>
    </aside>
  );
};
