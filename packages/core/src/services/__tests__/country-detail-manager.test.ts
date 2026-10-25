import { describe, it, expect, vi } from 'vitest';
import { CountryDetailManager } from '../country-detail-manager.js';
import type { CountrySublayerDefinition } from '../../schemas/country-sublayer.js';
import type { SublayerEvent } from '../../events/event-broker.js';

describe('CountryDetailManager Unit Tests', () => {
  // Malaysia center roughly: [101.97, 4.21]
  const malaysiaCenter: [number, number] = [101.97, 4.21];
  // Outside any country or in ocean: [0.0, 0.0]
  const oceanCenter: [number, number] = [0.0, 0.0];

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

  it('emits sublayer:activated with correct definitionIds and countryCode when center inside country and zoom >= threshold', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.evaluateViewport(malaysiaCenter, 6.0);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('sublayer:activated');
    if (events[0].type === 'sublayer:activated') {
      expect(events[0].definitionIds).toEqual([myDef.id]);
      expect(events[0].countryCode).toBe('MY');
    }

    const activeState = manager.getActivationState();
    expect(activeState.activeDefinitionIds.has(myDef.id)).toBe(true);
    expect(activeState.currentCountryCode).toBe('MY');
  });

  it('no activation when center inside country but zoom < threshold', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.evaluateViewport(malaysiaCenter, 4.0);

    expect(events.length).toBe(0);
    expect(manager.getActivationState().activeDefinitionIds.size).toBe(0);
  });

  it('no activation when center outside country even if zoom >= threshold', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.evaluateViewport(oceanCenter, 10.0);

    expect(events.length).toBe(0);
    expect(manager.getActivationState().activeDefinitionIds.size).toBe(0);
  });

  it('repeated calls with same state do not emit duplicate events', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(events.length).toBe(1);

    manager.evaluateViewport(malaysiaCenter, 6.5);
    expect(events.length).toBe(1); // No new event
  });

  it('emits sublayer:deactivated when zooming out below threshold', () => {
    const manager = new CountryDetailManager({
      definitions: [myDef],
      sublayerVisibilityOverrides: {},
    });

    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    manager.evaluateViewport(malaysiaCenter, 6.0);
    expect(events.length).toBe(1);

    manager.evaluateViewport(malaysiaCenter, 4.0);
    expect(events.length).toBe(2);
    expect(events[1].type).toBe('sublayer:deactivated');
    if (events[1].type === 'sublayer:deactivated') {
      expect(events[1].definitionIds).toEqual([myDef.id]);
    }
  });

  it('with no registered definitions, evaluateViewport causes no error and emits no events', () => {
    const manager = new CountryDetailManager();
    const events: SublayerEvent[] = [];
    manager.subscribe((evt) => events.push(evt));

    expect(() => manager.evaluateViewport(malaysiaCenter, 8.0)).not.toThrow();
    expect(events.length).toBe(0);
  });
});
