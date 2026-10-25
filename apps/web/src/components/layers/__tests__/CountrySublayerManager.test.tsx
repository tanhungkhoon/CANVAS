import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { CountrySublayerManager } from '../CountrySublayerManager.js';
import type { CountryDetailConfig } from '@canvas/core';

describe('CountrySublayerManager Component Tests', () => {
  const dummyConfig: CountryDetailConfig = {
    definitions: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        countryCode: 'MY',
        name: 'Malaysia Admin',
        detailCategory: 'administrative',
        minZoomThreshold: 5.0,
        tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
        enabled: true,
        createdAt: '2026-10-18T00:00:00.000Z',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
    ],
    sublayerVisibilityOverrides: {},
  };

  it('renders correctly as a React component function', () => {
    expect(typeof CountrySublayerManager).toBe('function');
  });

  it('props contract accepts config, onAddDefinition, onRemoveDefinition, and onClose', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onClose = vi.fn();

    const element = CountrySublayerManager({
      config: dummyConfig,
      onAddDefinition: onAdd,
      onRemoveDefinition: onRemove,
      onClose,
    });

    expect(React.isValidElement(element)).toBe(true);
    if (React.isValidElement(element)) {
      expect((element.props as Record<string, unknown>)['data-testid']).toBe('country-sublayer-manager-modal');
    }
  });
});
