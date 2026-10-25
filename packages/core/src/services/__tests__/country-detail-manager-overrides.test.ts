import { describe, it, expect } from 'vitest';
import { CountryDetailManager } from '../country-detail-manager.js';
import type { CountrySublayerDefinition } from '../../schemas/country-sublayer.js';
import type { SublayerEvent } from '../../events/event-broker.js';

describe('CountryDetailManager Overrides Unit Tests', () => {
  const malaysiaCenter: [number, number] = [101.97, 4.21];

  const myDef: CountrySublayerDefinition = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    countryCode: 'MY',
    name: 'Malaysia Admin',
    detailCategory: 'administrative',
    minZoomThreshold: 5.0,
    tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
    enabled: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };

  it('setVisibilityOverride(id, false) stores override and excludes sublayer from getVisibleDefinitions even when auto-active', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(manager.getActivationState().activeDefinitionIds.has(myDef.id)).toBe(true);
    expect(manager.getVisibleDefinitions().length).toBe(1);

    manager.setVisibilityOverride(myDef.id, false);
    expect(manager.getConfig().sublayerVisibilityOverrides[myDef.id]).toBe(false);
    expect(manager.getVisibleDefinitions().length).toBe(0);
  });

  it('subsequent evaluateViewport call does not make user-hidden sublayer visible', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: { [myDef.id]: false },
    });

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(manager.getActivationState().activeDefinitionIds.has(myDef.id)).toBe(true);
    expect(manager.getVisibleDefinitions().length).toBe(0);
  });

  it('setVisibilityOverride(id, true) clears the hidden override state', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: { [myDef.id]: false },
    });

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(manager.getVisibleDefinitions().length).toBe(0);

    manager.setVisibilityOverride(myDef.id, true);
    expect(manager.getConfig().sublayerVisibilityOverrides[myDef.id]).toBe(true);
    expect(manager.getVisibleDefinitions().length).toBe(1);
  });

  it('clearVisibilityOverride(id) restores auto-control', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: { [myDef.id]: false },
    });

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(manager.getVisibleDefinitions().length).toBe(0);

    manager.clearVisibilityOverride(myDef.id);
    expect(manager.getConfig().sublayerVisibilityOverrides[myDef.id]).toBeUndefined();
    expect(manager.getVisibleDefinitions().length).toBe(1);
  });

  it('exportConfig includes sublayerVisibilityOverrides in output', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: { [myDef.id]: false },
    });

    const exported = manager.exportConfig();
    expect(exported.sublayerVisibilityOverrides[myDef.id]).toBe(false);
  });

  it('loadConfig(config) restores overrides from imported config and emits sublayer:config-updated', () => {
    const manager = new CountryDetailManager();
    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.loadConfig({
      definitions: [myDef],
      sublayerVisibilityOverrides: { [myDef.id]: false },
    });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('sublayer:config-updated');
    expect(manager.getConfig().definitions.length).toBe(1);
    expect(manager.getConfig().sublayerVisibilityOverrides[myDef.id]).toBe(false);
  });
});
