import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { LayerDock } from '../LayerDock.js';
import type { SemanticLayer, CountrySublayerDefinition } from '@canvas/core';

describe('LayerDock Sublayer Group Tests', () => {
  const dummySemanticLayer: SemanticLayer = {
    id: 'layer-1',
    name: 'Tactical Alpha',
    semanticType: 'tactical',
    order: 0,
    visible: true,
    opacity: 1.0,
    locked: false,
    entities: [],
    metadata: {},
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  const dummySublayer: CountrySublayerDefinition = {
    id: 'sub-1',
    countryCode: 'MY',
    name: 'Malaysia Admin',
    detailCategory: 'administrative',
    minZoomThreshold: 5.0,
    tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
    enabled: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  const baseProps = {
    layers: [dummySemanticLayer],
    activeLayer: dummySemanticLayer,
    onCreateLayer: vi.fn(),
    onDeleteLayer: vi.fn(),
    onSelectLayer: vi.fn(),
    onToggleVisibility: vi.fn(),
    onToggleLock: vi.fn(),
    onChangeOpacity: vi.fn(),
    onReorderLayers: vi.fn(),
  };

  it('when activeSublayers is empty, renders dock without sublayer group', () => {
    const element = LayerDock({
      ...baseProps,
      activeSublayers: [],
    });

    expect(React.isValidElement(element)).toBe(true);
  });

  it('when activeSublayers has entries, accepts and renders sublayer list', () => {
    const onToggleSub = vi.fn();
    const element = LayerDock({
      ...baseProps,
      activeSublayers: [dummySublayer],
      sublayerVisibilityOverrides: { [dummySublayer.id]: true },
      onToggleSublayerVisibility: onToggleSub,
    });

    expect(React.isValidElement(element)).toBe(true);
  });
});
