import React from 'react';
import type { CountrySublayerDefinition } from '@canvas/core';

export interface CountrySublayerItemProps {
  definition: CountrySublayerDefinition;
  isVisible: boolean;
  onToggleVisibility: (visible: boolean) => void;
}

export const CountrySublayerItem: React.FC<CountrySublayerItemProps> = ({
  definition,
  isVisible,
  onToggleVisibility,
}) => {
  const getBadgeColor = (category: string) => {
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
        return '#718096';
    }
  };

  return (
    <div
      data-testid={`sublayer-item-${definition.id}`}
      style={{
        padding: '8px 10px',
        backgroundColor: '#171c26',
        border: '1px solid #2d3748',
        borderRadius: '6px',
        marginBottom: '6px',
        opacity: isVisible ? 1.0 : 0.6,
        transition: 'all 0.15s ease',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {/* Read-only / Reference Indicator */}
          <span
            data-testid="sublayer-readonly-badge"
            style={{
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '1px 4px',
              borderRadius: '3px',
              backgroundColor: '#4a5568',
              color: '#cbd5e0',
              letterSpacing: '0.5px',
            }}
            title="Geographic reference layer (read-only)"
          >
            REF
          </span>

          <span
            style={{
              fontWeight: 500,
              fontSize: '12px',
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px',
            }}
            title={definition.name}
          >
            {definition.name}
          </span>

          {/* Category Badge */}
          <span
            style={{
              fontSize: '9px',
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: getBadgeColor(definition.detailCategory),
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {definition.detailCategory}
          </span>
        </div>

        {/* Visibility Toggle Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(!isVisible);
          }}
          data-testid={`btn-sublayer-toggle-${definition.id}`}
          style={{
            background: 'none',
            border: 'none',
            color: isVisible ? '#63b3ed' : '#718096',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px 4px',
            borderRadius: '4px',
          }}
          title={isVisible ? 'Hide sublayer' : 'Show sublayer'}
        >
          {isVisible ? '👁' : '🚫'}
        </button>
      </div>
    </div>
  );
};
