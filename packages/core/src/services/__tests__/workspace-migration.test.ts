import { describe, it, expect } from 'vitest';
import { serializeWorkspace, deserializeWorkspace } from '../workspace-serializer.js';
import { SchemaValidationError } from '../../errors/index.js';
import type { CanvasWorkspace } from '../../schemas/workspace.js';

describe('Workspace Schema Migration Tests', () => {
  const v100Document = {
    schemaVersion: '1.0.0',
    workspaceId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'v1.0.0 Document',
    baseMap: {
      styleUrl: 'https://demotiles.maplibre.org/style.json',
      center: [100.0, 5.0] as [number, number],
      zoom: 6.0,
      bearing: 0.0,
      pitch: 0.0,
    },
    layers: [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Layer 1',
        semanticType: 'baseline' as const,
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
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  const v110Document: CanvasWorkspace = {
    ...v100Document,
    schemaVersion: '1.1.0' as any,
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
  };

  it('deserializeWorkspace accepts v1.0.0 document and outputs v1.1.0 document with default countryDetailConfig', () => {
    const deserialized = deserializeWorkspace(JSON.stringify(v100Document));
    expect(deserialized.schemaVersion).toBe('1.1.0');
    expect(deserialized.countryDetailConfig).toBeDefined();
    expect(deserialized.countryDetailConfig.definitions).toEqual([]);
    expect(deserialized.countryDetailConfig.sublayerVisibilityOverrides).toEqual({});
  });

  it('v1.1.0 document with full countryDetailConfig round-trips losslessly', () => {
    const serialized = serializeWorkspace(v110Document);
    const parsed = JSON.parse(serialized);
    expect(parsed.schemaVersion).toBe('1.1.0');
    const deserialized = deserializeWorkspace(serialized);
    expect(deserialized).toEqual(v110Document);
  });

  it('document with unknown schemaVersion is rejected with SchemaValidationError', () => {
    const unknown = { ...v100Document, schemaVersion: '9.9.9' };
    expect(() => deserializeWorkspace(JSON.stringify(unknown))).toThrow(SchemaValidationError);
  });

  it('serializeWorkspace always writes schemaVersion: "1.1.0"', () => {
    const serialized = serializeWorkspace(v110Document);
    const parsed = JSON.parse(serialized);
    expect(parsed.schemaVersion).toBe('1.1.0');
  });
});
