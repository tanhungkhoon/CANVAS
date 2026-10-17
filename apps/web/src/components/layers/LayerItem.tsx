import React from 'react';
import type { SemanticLayer } from '@canvas/core';

interface LayerItemProps {
  layer: SemanticLayer;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onToggleVisibility: (visible: boolean) => void;
  onToggleLock: (locked: boolean) => void;
  onChangeOpacity: (opacity: number) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  canDelete,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onChangeOpacity,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'tactical': return '#e53e3e';
      case 'infrastructure': return '#3182ce';
      case 'environmental': return '#38a169';
      case 'annotation': return '#dd6b20';
      case 'custom': return '#805ad5';
      case 'baseline':
      default: return '#718096';
    }
  };

  return (
    <div
      data-testid={`layer-item-${layer.id}`}
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        backgroundColor: isActive ? '#2d3748' : '#1a202c',
        border: isActive ? '1px solid #4299e1' : '1px solid #2d3748',
        borderRadius: '6px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top Header: Name, Badge, Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: '13px',
              color: '#f7fafc',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              maxWidth: '120px',
            }}
          >
            {layer.name}
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: getBadgeColor(layer.semanticType),
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {layer.semanticType}
          </span>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {/* Visibility Toggle */}
          <button
            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
            onClick={() => onToggleVisibility(!layer.visible)}
            data-testid={`btn-visibility-${layer.id}`}
            style={{
              background: 'none',
              border: 'none',
              color: layer.visible ? '#63b3ed' : '#718096',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
            }}
          >
            {layer.visible ? '👁' : '🕶'}
          </button>

          {/* Lock Toggle */}
          <button
            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
            onClick={() => onToggleLock(!layer.locked)}
            data-testid={`btn-lock-${layer.id}`}
            style={{
              background: 'none',
              border: 'none',
              color: layer.locked ? '#f6ad55' : '#718096',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
            }}
          >
            {layer.locked ? '🔒' : '🔓'}
          </button>

          {/* Reorder Buttons */}
          {onMoveUp && (
            <button
              title="Move Up"
              onClick={onMoveUp}
              data-testid={`btn-move-up-${layer.id}`}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e0',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 4px',
              }}
            >
              ▲
            </button>
          )}

          {onMoveDown && (
            <button
              title="Move Down"
              onClick={onMoveDown}
              data-testid={`btn-move-down-${layer.id}`}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e0',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 4px',
              }}
            >
              ▼
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              title="Delete Layer"
              onClick={onDelete}
              data-testid={`btn-delete-${layer.id}`}
              style={{
                background: 'none',
                border: 'none',
                color: '#e53e3e',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '2px 4px',
              }}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Opacity slider row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#a0aec0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span>Opacity:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(layer.opacity * 100)}
          disabled={layer.locked}
          data-testid={`slider-opacity-${layer.id}`}
          onChange={(e) => onChangeOpacity(Number(e.target.value) / 100)}
          style={{ flex: 1, accentColor: '#4299e1', cursor: layer.locked ? 'not-allowed' : 'pointer' }}
        />
        <span style={{ width: '32px', textAlign: 'right' }}>{Math.round(layer.opacity * 100)}%</span>
      </div>
    </div>
  );
};
