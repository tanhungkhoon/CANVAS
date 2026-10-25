import { describe, it, expect } from 'vitest';
import { serializeWorkspace, deserializeWorkspace } from '../workspace-serializer.js';
import type { CanvasWorkspace } from '../../schemas/workspace.js';

describe('Workspace Sublayer Serialization Tests', () => {
  const baseWorkspace: CanvasWorkspace = {
    schemaVersion: '1.1.0',
    workspaceId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Workspace with Sublayers',
    baseMap: {
      styleUrl: 'https://demotiles.maplibre.org/style.json',
      center: [100.0, 5.0],
      zoom: 6.0,
      bearing: 0.0,
      pitch: 0.0,
    },
    layers: [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Layer 1',
        semanticType: 'baseline',
        order: 0,
        visible: true,
        opacity: 1.0,
        locked: false,
        entities: [],
        metadata: {},
        createdAt: '2026-10-18T00:00:00.000Z',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
    ],
    activeLayerId: '223e4567-e89b-12d3-a456-426614174001',
    countryDetailConfig: {
      definitions: [
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
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
      sublayerVisibilityOverrides: {
        '323e4567-e89b-12d3-a456-426614174002': false,
      },
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  it('serializes and deserializes v1.1.0 workspace with non-empty countryDetailConfig losslessly', () => {
    const json = serializeWorkspace(baseWorkspace);
    const parsed = JSON.parse(json);

    expect(parsed.schemaVersion).toBe('1.1.0');
    expect(parsed.countryDetailConfig.definitions.length).toBe(1);
    expect(parsed.countryDetailConfig.sublayerVisibilityOverrides['323e4567-e89b-12d3-a456-426614174002']).toBe(false);

    const restored = deserializeWorkspace(json);
    expect(restored.countryDetailConfig).toEqual(baseWorkspace.countryDetailConfig);
  });

  it('workspace with zero definitions and empty overrides serializes and restores cleanly', () => {
    const emptyConfigWs: CanvasWorkspace = {
      ...baseWorkspace,
      countryDetailConfig: {
        definitions: [],
        sublayerVisibilityOverrides: {},
      },
    };

    const json = serializeWorkspace(emptyConfigWs);
    const restored = deserializeWorkspace(json);

    expect(restored.countryDetailConfig.definitions).toEqual([]);
    expect(restored.countryDetailConfig.sublayerVisibilityOverrides).toEqual({});
  });
});
