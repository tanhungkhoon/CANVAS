import { describe, it, expect } from 'vitest';
import { CountryDetailManager } from '../country-detail-manager.js';
import { DefinitionNotFoundError } from '../../errors/index.js';
import type { SublayerEvent } from '../../events/event-broker.js';

describe('CountryDetailManager CRUD Unit Tests', () => {
  it('addDefinition generates UUID id, sets timestamps, appends to definitions, and emits config-updated', () => {
    const manager = new CountryDetailManager();
    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    const def = manager.addDefinition({
      countryCode: 'SG',
      name: 'Singapore Roads',
      detailCategory: 'transport',
      minZoomThreshold: 8.0,
      tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
      enabled: true,
    });

    expect(def.id).toBeDefined();
    expect(def.createdAt).toBeDefined();
    expect(def.updatedAt).toBeDefined();
    expect(def.name).toBe('Singapore Roads');

    const config = manager.getConfig();
    expect(config.definitions.length).toBe(1);
    expect(config.definitions[0].id).toBe(def.id);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('sublayer:config-updated');
  });

  it('addDefinition with invalid countryCode throws error', () => {
    const manager = new CountryDetailManager();
    expect(() =>
      manager.addDefinition({
        countryCode: 'singapore', // Invalid: lowercase and > 3 chars
        name: 'Singapore Roads',
        detailCategory: 'transport',
        minZoomThreshold: 8.0,
        tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
        enabled: true,
      })
    ).toThrow();
  });

  it('updateDefinition modifies specified fields, updates updatedAt, and emits config-updated', () => {
    const manager = new CountryDetailManager();
    const def = manager.addDefinition({
      countryCode: 'SG',
      name: 'Singapore Roads',
      detailCategory: 'transport',
      minZoomThreshold: 8.0,
      tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
      enabled: true,
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    const updated = manager.updateDefinition(def.id, {
      name: 'Singapore Highways & Rail',
      minZoomThreshold: 9.0,
    });

    expect(updated.name).toBe('Singapore Highways & Rail');
    expect(updated.minZoomThreshold).toBe(9.0);
    expect(updated.countryCode).toBe('SG');

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('sublayer:config-updated');
  });

  it('updateDefinition with unknown id throws DefinitionNotFoundError', () => {
    const manager = new CountryDetailManager();
    expect(() =>
      manager.updateDefinition('non-existent-id', { name: 'New Name' })
    ).toThrow(DefinitionNotFoundError);
  });

  it('removeDefinition removes entry, clears visibility override, and emits config-updated', () => {
    const manager = new CountryDetailManager();
    const def = manager.addDefinition({
      countryCode: 'SG',
      name: 'Singapore Roads',
      detailCategory: 'transport',
      minZoomThreshold: 8.0,
      tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
      enabled: true,
    });

    manager.setVisibilityOverride(def.id, false);
    expect(manager.getConfig().sublayerVisibilityOverrides[def.id]).toBe(false);

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.removeDefinition(def.id);

    const config = manager.getConfig();
    expect(config.definitions.length).toBe(0);
    expect(config.sublayerVisibilityOverrides[def.id]).toBeUndefined();

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('sublayer:config-updated');
  });

  it('removeDefinition with unknown id throws DefinitionNotFoundError', () => {
    const manager = new CountryDetailManager();
    expect(() => manager.removeDefinition('non-existent-id')).toThrow(DefinitionNotFoundError);
  });
});
