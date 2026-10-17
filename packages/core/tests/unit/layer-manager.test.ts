import { describe, it, expect, beforeEach } from 'vitest';
import { LayerManager } from '../../src/services/layer-manager.js';
import {
  InvalidLayerCountError,
  LayerNotFoundError,
  LayerLockedError,
  DuplicateOrderError,
} from '../../src/errors/index.js';

describe('LayerManager Unit Tests', () => {
  let manager: LayerManager;

  beforeEach(() => {
    manager = new LayerManager();
  });

  it('initializes with a default layer and activeLayerId', () => {
    const layers = manager.getLayers();
    expect(layers.length).toBe(1);
    expect(layers[0].name).toBe('Layer 1');
    expect(layers[0].semanticType).toBe('baseline');
    expect(manager.getActiveLayer().id).toBe(layers[0].id);
  });

  it('creates new layer and appends to hierarchy with correct order', () => {
    const newLayer = manager.createLayer({
      name: 'Tactical Grid',
      semanticType: 'tactical',
    });

    expect(newLayer).toBeDefined();
    expect(newLayer.name).toBe('Tactical Grid');
    expect(newLayer.semanticType).toBe('tactical');
    expect(newLayer.order).toBe(1);

    const layers = manager.getLayers();
    expect(layers.length).toBe(2);
    expect(layers[1].id).toBe(newLayer.id);
  });

  it('prevents deleting the last remaining layer (FR-012)', () => {
    const initialLayer = manager.getLayers()[0];
    expect(() => {
      manager.deleteLayer(initialLayer.id);
    }).toThrow(InvalidLayerCountError);
  });

  it('allows deleting a layer when more than one layer exists and updates active layer', () => {
    const layer2 = manager.createLayer({
      name: 'Layer 2',
      semanticType: 'annotation',
    });
    manager.setActiveLayer(layer2.id);

    manager.deleteLayer(layer2.id);

    const layers = manager.getLayers();
    expect(layers.length).toBe(1);
    expect(manager.getActiveLayer().id).toBe(layers[0].id);
  });

  it('throws LayerNotFoundError when querying or deleting non-existent layer', () => {
    expect(() => {
      manager.deleteLayer('00000000-0000-0000-0000-000000000000');
    }).toThrow(LayerNotFoundError);
  });

  it('toggles layer visibility', () => {
    const layer = manager.getLayers()[0];
    expect(layer.visible).toBe(true);

    manager.setLayerVisibility(layer.id, false);
    expect(manager.getLayerById(layer.id)?.visible).toBe(false);

    manager.setLayerVisibility(layer.id, true);
    expect(manager.getLayerById(layer.id)?.visible).toBe(true);
  });

  it('adjusts and clamps layer opacity between 0.0 and 1.0', () => {
    const layer = manager.getLayers()[0];

    manager.setLayerOpacity(layer.id, 0.45);
    expect(manager.getLayerById(layer.id)?.opacity).toBe(0.45);

    manager.setLayerOpacity(layer.id, 1.5);
    expect(manager.getLayerById(layer.id)?.opacity).toBe(1.0);

    manager.setLayerOpacity(layer.id, -0.2);
    expect(manager.getLayerById(layer.id)?.opacity).toBe(0.0);
  });

  it('locks layer and prevents updates', () => {
    const layer = manager.getLayers()[0];
    manager.setLayerLocked(layer.id, true);

    expect(manager.getLayerById(layer.id)?.locked).toBe(true);

    expect(() => {
      manager.updateLayer(layer.id, { name: 'New Name' });
    }).toThrow(LayerLockedError);

    manager.setLayerLocked(layer.id, false);
    const updated = manager.updateLayer(layer.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  it('reorders layers and updates their order properties', () => {
    const l1 = manager.getLayers()[0];
    const l2 = manager.createLayer({ name: 'L2', semanticType: 'custom' });
    const l3 = manager.createLayer({ name: 'L3', semanticType: 'tactical' });

    // Reverse order: L3, L2, L1
    const reordered = manager.reorderLayers([l3.id, l2.id, l1.id]);
    expect(reordered[0].id).toBe(l3.id);
    expect(reordered[0].order).toBe(0);
    expect(reordered[1].id).toBe(l2.id);
    expect(reordered[1].order).toBe(1);
    expect(reordered[2].id).toBe(l1.id);
    expect(reordered[2].order).toBe(2);
  });

  it('rejects invalid or duplicate order array during reordering', () => {
    const l1 = manager.getLayers()[0];
    const l2 = manager.createLayer({ name: 'L2', semanticType: 'custom' });

    expect(() => {
      manager.reorderLayers([l1.id, l1.id]);
    }).toThrow(DuplicateOrderError);

    expect(() => {
      manager.reorderLayers([l1.id]); // missing l2
    }).toThrow(DuplicateOrderError);
  });
});
