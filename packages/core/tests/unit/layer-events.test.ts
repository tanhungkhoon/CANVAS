import { describe, it, expect } from 'vitest';
import { LayerManager } from '../../src/services/layer-manager.js';
import type { LayerEvent } from '../../src/events/event-broker.js';

describe('Layer Events & EventBroker Unit Tests', () => {
  it('emits layer:created event when new layer is added', () => {
    const manager = new LayerManager();
    const events: LayerEvent[] = [];
    manager.subscribe((event) => events.push(event));

    const newLayer = manager.createLayer({
      name: 'Hazard Zones',
      semanticType: 'environmental',
    });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('layer:created');
    if (events[0].type === 'layer:created') {
      expect(events[0].layer.id).toBe(newLayer.id);
      expect(events[0].layer.name).toBe('Hazard Zones');
    }
  });

  it('emits layer:reordered event when layers are reordered', () => {
    const manager = new LayerManager();
    const l1 = manager.getLayers()[0];
    const l2 = manager.createLayer({ name: 'L2', semanticType: 'custom' });

    const events: LayerEvent[] = [];
    manager.subscribe((event) => events.push(event));

    manager.reorderLayers([l2.id, l1.id]);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('layer:reordered');
    if (events[0].type === 'layer:reordered') {
      expect(events[0].layers[0].id).toBe(l2.id);
      expect(events[0].layers[1].id).toBe(l1.id);
    }
  });

  it('emits layer:visibility-changed and layer:opacity-changed events', () => {
    const manager = new LayerManager();
    const l1 = manager.getLayers()[0];

    const events: LayerEvent[] = [];
    manager.subscribe((event) => events.push(event));

    manager.setLayerVisibility(l1.id, false);
    manager.setLayerOpacity(l1.id, 0.7);

    expect(events.length).toBe(2);
    expect(events[0].type).toBe('layer:visibility-changed');
    if (events[0].type === 'layer:visibility-changed') {
      expect(events[0].visible).toBe(false);
    }

    expect(events[1].type).toBe('layer:opacity-changed');
    if (events[1].type === 'layer:opacity-changed') {
      expect(events[1].opacity).toBe(0.7);
    }
  });

  it('emits layer:deleted event with next active layer ID', () => {
    const manager = new LayerManager();
    const l1 = manager.getLayers()[0];
    const l2 = manager.createLayer({ name: 'L2', semanticType: 'custom' });
    manager.setActiveLayer(l2.id);

    const events: LayerEvent[] = [];
    manager.subscribe((event) => events.push(event));

    manager.deleteLayer(l2.id);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('layer:deleted');
    if (events[0].type === 'layer:deleted') {
      expect(events[0].layerId).toBe(l2.id);
      expect(events[0].nextActiveLayerId).toBe(l1.id);
    }
  });
});
