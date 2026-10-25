import { describe, it, expect } from 'vitest';
import { LayerManager } from '../../src/services/layer-manager.js';
import { serializeWorkspace, deserializeWorkspace } from '../../src/services/workspace-serializer.js';

describe('Workspace Serialization Contract Tests', () => {
  it('serializes workspace into deterministic JSON containing all required fields', () => {
    const manager = new LayerManager('Test Project');
    const json = serializeWorkspace(manager.getWorkspace());

    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe('1.1.0');
    expect(parsed.workspaceId).toBeDefined();
    expect(parsed.title).toBe('Test Project');
    expect(parsed.baseMap).toBeDefined();
    expect(parsed.baseMap.styleUrl).toBeDefined();
    expect(parsed.baseMap.center).toEqual([0.0, 20.0]);
    expect(parsed.layers).toBeInstanceOf(Array);
    expect(parsed.layers.length).toBe(1);
    expect(parsed.activeLayerId).toBe(parsed.layers[0].id);
  });

  it('preserves multi-layer configuration and properties across serialization round-trip', () => {
    const manager = new LayerManager('Mission Alpha');
    manager.createLayer({ name: 'Tactical Area', semanticType: 'tactical', opacity: 0.65 });
    manager.createLayer({ name: 'Evacuation Route', semanticType: 'infrastructure', opacity: 0.9 });

    const originalWorkspace = manager.getWorkspace();
    const json = serializeWorkspace(originalWorkspace);

    const restoredWorkspace = deserializeWorkspace(json);

    expect(restoredWorkspace.title).toBe('Mission Alpha');
    expect(restoredWorkspace.layers.length).toBe(3);
    expect(restoredWorkspace.layers[1].name).toBe('Tactical Area');
    expect(restoredWorkspace.layers[1].opacity).toBe(0.65);
    expect(restoredWorkspace.layers[2].name).toBe('Evacuation Route');
    expect(restoredWorkspace.layers[2].opacity).toBe(0.9);
  });
});
