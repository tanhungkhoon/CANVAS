import { describe, it, expect } from 'vitest';
import { deserializeWorkspace } from '../../src/services/workspace-serializer.js';
import { SchemaValidationError } from '../../src/errors/index.js';
import { LayerManager } from '../../src/services/layer-manager.js';

describe('Workspace Deserializer Unit Tests', () => {
  it('throws SchemaValidationError on non-JSON input', () => {
    expect(() => {
      deserializeWorkspace('NOT_JSON');
    }).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError on unsupported schemaVersion', () => {
    const manager = new LayerManager();
    const valid = manager.getWorkspace();
    const invalidVersion = { ...valid, schemaVersion: '2.0.0' };

    expect(() => {
      deserializeWorkspace(JSON.stringify(invalidVersion));
    }).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError on empty layers list (FR-012)', () => {
    const manager = new LayerManager();
    const valid = manager.getWorkspace();
    const emptyLayers = { ...valid, layers: [] };

    expect(() => {
      deserializeWorkspace(JSON.stringify(emptyLayers));
    }).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError when activeLayerId does not exist in layers', () => {
    const manager = new LayerManager();
    const valid = manager.getWorkspace();
    const badActiveId = { ...valid, activeLayerId: '00000000-0000-0000-0000-000000000000' };

    expect(() => {
      deserializeWorkspace(JSON.stringify(badActiveId));
    }).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError when base map coordinates exceed bounds', () => {
    const manager = new LayerManager();
    const valid = manager.getWorkspace();
    const badCoords = {
      ...valid,
      baseMap: {
        ...valid.baseMap,
        center: [200.0, 0.0],
      },
    };

    expect(() => {
      deserializeWorkspace(JSON.stringify(badCoords));
    }).toThrow(SchemaValidationError);
  });
});
