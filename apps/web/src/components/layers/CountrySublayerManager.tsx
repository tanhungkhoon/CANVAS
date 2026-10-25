import React, { useState } from 'react';
import type {
  CountryDetailConfig,
  CountrySublayerDetailCategory,
  CreateCountrySublayerOptions,
} from '@canvas/core';

export interface CountrySublayerManagerProps {
  config: CountryDetailConfig;
  onAddDefinition: (opts: CreateCountrySublayerOptions) => void;
  onRemoveDefinition: (id: string) => void;
  onClose?: () => void;
}

const CATEGORIES: CountrySublayerDetailCategory[] = [
  'administrative',
  'transport',
  'terrain',
  'urban',
  'hydrography',
  'custom',
];

export const CountrySublayerManager: React.FC<CountrySublayerManagerProps> = ({
  config,
  onAddDefinition,
  onRemoveDefinition,
  onClose,
}) => {
  const [countryCode, setCountryCode] = useState('MY');
  const [name, setName] = useState('');
  const [detailCategory, setDetailCategory] = useState<CountrySublayerDetailCategory>('administrative');
  const [minZoomThreshold, setMinZoomThreshold] = useState<number>(5.0);
  const [tileSourceUrl, setTileSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Layer name is required');
      return;
    }

    const code = countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(code)) {
      setError('Country code must be 2 or 3 uppercase letters (e.g. MY, US, GBR)');
      return;
    }

    const url = tileSourceUrl.trim();
    if (!url) {
      setError('Tile source URL is required');
      return;
    }

    if (minZoomThreshold < 0 || minZoomThreshold > 24) {
      setError('Min zoom threshold must be between 0 and 24');
      return;
    }

    onAddDefinition({
      countryCode: code,
      name: trimmedName,
      detailCategory,
      minZoomThreshold,
      tileSourceUrl: url,
      enabled: true,
    });

    setName('');
    setTileSourceUrl('');
  };

  return (
    <div
      data-testid="country-sublayer-manager-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '560px',
          maxHeight: '85vh',
          backgroundColor: '#1a202c',
          borderRadius: '8px',
          border: '1px solid #2d3748',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2d3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f7fafc' }}>
              Manage Country Detail Layers
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a0aec0' }}>
              Configure automatic reference sublayers triggered by country zoom.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              data-testid="btn-close-sublayer-manager"
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Add Layer Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#63b3ed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Add Detail Sublayer Definition
            </h3>

            {error && (
              <div
                data-testid="sublayer-form-error"
                style={{
                  backgroundColor: '#742a2a',
                  color: '#fff5f5',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                  Country Code (ISO 2/3)
                </label>
                <input
                  type="text"
                  data-testid="input-country-code"
                  value={countryCode}
                  maxLength={3}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MY"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                  Min Zoom Threshold
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  data-testid="input-zoom-threshold"
                  value={minZoomThreshold}
                  onChange={(e) => setMinZoomThreshold(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                Sublayer Name
              </label>
              <input
                type="text"
                data-testid="input-sublayer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malaysia Administrative Boundaries"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                  Detail Category
                </label>
                <select
                  data-testid="select-detail-category"
                  value={detailCategory}
                  onChange={(e) => setDetailCategory(e.target.value as CountrySublayerDetailCategory)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                  Tile Source URL
                </label>
                <input
                  type="text"
                  data-testid="input-tile-url"
                  value={tileSourceUrl}
                  onChange={(e) => setTileSourceUrl(e.target.value)}
                  placeholder="https://.../{z}/{x}/{y}.pbf"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="btn-add-sublayer"
              style={{
                backgroundColor: '#3182ce',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Sublayer Definition
            </button>
          </form>

          {/* Existing Definitions List */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Configured Definitions ({config.definitions.length})
            </h3>

            {config.definitions.length === 0 ? (
              <div style={{ color: '#718096', fontSize: '13px', fontStyle: 'italic', padding: '12px 0' }}>
                No country detail sublayers configured yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {config.definitions.map((def) => (
                  <div
                    key={def.id}
                    data-testid={`sublayer-def-row-${def.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: '#2d3748',
                      borderRadius: '6px',
                      border: '1px solid #4a5568',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#f7fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{def.name}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#4a5568',
                            color: '#e2e8f0',
                            textTransform: 'uppercase',
                          }}
                        >
                          {def.countryCode} · z≥{def.minZoomThreshold}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>
                        {def.detailCategory} · {def.tileSourceUrl}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveDefinition(def.id)}
                      data-testid={`btn-remove-sublayer-${def.id}`}
                      style={{
                        backgroundColor: '#742a2a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
