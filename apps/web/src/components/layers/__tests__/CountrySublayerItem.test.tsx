import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { CountrySublayerItem } from '../CountrySublayerItem.js';
import type { CountrySublayerDefinition } from '@canvas/core';

describe('CountrySublayerItem Component Tests', () => {
  const dummyDef: CountrySublayerDefinition = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    countryCode: 'MY',
    name: 'Malaysia Administrative',
    detailCategory: 'administrative',
    minZoomThreshold: 5.0,
    tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
    enabled: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  it('renders correctly as a React component function', () => {
    expect(typeof CountrySublayerItem).toBe('function');
  });

  it('renders with testid and props', () => {
    const onToggle = vi.fn();
    const element = CountrySublayerItem({
      definition: dummyDef,
      isVisible: true,
      onToggleVisibility: onToggle,
    });

    expect(React.isValidElement(element)).toBe(true);
    if (React.isValidElement(element)) {
      expect((element.props as Record<string, unknown>)['data-testid']).toBe(
        `sublayer-item-${dummyDef.id}`
      );
    }
  });
});
