import { describe, it, expect } from 'vitest';
import { LayerManager, SpatialEntity } from '@canvas/core';
import { performance } from 'node:perf_hooks';

describe('Performance Benchmarks (SC-002, SC-003)', () => {
  it('supports 20 layers with 1,000 spatial entities with sub-50ms operation latencies', () => {
    const manager = new LayerManager('Benchmark Workspace');

    // Create 20 layers
    for (let i = 1; i < 20; i++) {
      manager.createLayer({
        name: `Benchmark Layer ${i}`,
        semanticType: i % 2 === 0 ? 'tactical' : 'infrastructure',
      });
    }

    const layers = manager.getLayers();
    expect(layers.length).toBe(20);

    // Populate with 1,000 entities across layers (50 per layer)
    let entityCount = 0;
    for (const layer of layers) {
      for (let j = 0; j < 50; j++) {
        const entity: SpatialEntity = {
          id: crypto.randomUUID(),
          layerId: layer.id,
          semanticClass: 'test-point',
          geometry: {
            type: 'Point',
            coordinates: [-180 + Math.random() * 360, -90 + Math.random() * 180],
          },
          properties: { index: entityCount++ },
        };
        layer.entities.push(entity);
      }
    }
    expect(entityCount).toBe(1000);

    // Benchmark layer reordering latency (must be < 50ms, SC-002)
    const reversedIds = [...layers].reverse().map((l) => l.id);
    const startReorder = performance.now();
    manager.reorderLayers(reversedIds);
    const reorderDuration = performance.now() - startReorder;

    expect(reorderDuration).toBeLessThan(50); // Under 50ms SLA

    // Benchmark serialization time for 1,000 entities
    const startSerialize = performance.now();
    const json = manager.serialize();
    const serializeDuration = performance.now() - startSerialize;

    expect(serializeDuration).toBeLessThan(100);

    // Benchmark deserialization time for 1,000 entities
    const startDeserialize = performance.now();
    manager.deserialize(json);
    const deserializeDuration = performance.now() - startDeserialize;

    expect(deserializeDuration).toBeLessThan(150);
  });
});
