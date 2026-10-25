import { describe, it, expect, vi } from 'vitest';
import {
  EventBroker,
  type SublayerActivatedEvent,
  type SublayerDeactivatedEvent,
  type SublayerVisibilityOverrideChangedEvent,
  type SublayerConfigUpdatedEvent,
  type SublayerEvent,
} from '../event-broker.js';

describe('Sublayer Events & EventBroker', () => {
  it('correctly delivers sublayer:activated event', () => {
    const broker = new EventBroker();
    const received: SublayerEvent[] = [];
    broker.subscribe((evt) => {
      if (evt.type.startsWith('sublayer:')) {
        received.push(evt as SublayerEvent);
      }
    });

    const activated: SublayerActivatedEvent = {
      type: 'sublayer:activated',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
      definitionIds: ['def-1', 'def-2'],
      countryCode: 'MY',
    };

    broker.emit(activated as any);

    expect(received.length).toBe(1);
    expect(received[0].type).toBe('sublayer:activated');
    if (received[0].type === 'sublayer:activated') {
      expect(received[0].definitionIds).toEqual(['def-1', 'def-2']);
      expect(received[0].countryCode).toBe('MY');
    }
  });

  it('correctly delivers sublayer:deactivated event', () => {
    const broker = new EventBroker();
    const received: SublayerEvent[] = [];
    broker.subscribe((evt) => {
      if (evt.type.startsWith('sublayer:')) {
        received.push(evt as SublayerEvent);
      }
    });

    const deactivated: SublayerDeactivatedEvent = {
      type: 'sublayer:deactivated',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
      definitionIds: ['def-1'],
    };

    broker.emit(deactivated as any);

    expect(received.length).toBe(1);
    expect(received[0].type).toBe('sublayer:deactivated');
    if (received[0].type === 'sublayer:deactivated') {
      expect(received[0].definitionIds).toEqual(['def-1']);
    }
  });

  it('correctly delivers sublayer:visibility-override-changed event', () => {
    const broker = new EventBroker();
    const received: SublayerEvent[] = [];
    broker.subscribe((evt) => {
      if (evt.type.startsWith('sublayer:')) {
        received.push(evt as SublayerEvent);
      }
    });

    const overrideEvt: SublayerVisibilityOverrideChangedEvent = {
      type: 'sublayer:visibility-override-changed',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
      definitionId: 'def-1',
      visible: false,
    };

    broker.emit(overrideEvt as any);

    expect(received.length).toBe(1);
    expect(received[0].type).toBe('sublayer:visibility-override-changed');
    if (received[0].type === 'sublayer:visibility-override-changed') {
      expect(received[0].definitionId).toBe('def-1');
      expect(received[0].visible).toBe(false);
    }
  });

  it('correctly delivers sublayer:config-updated event', () => {
    const broker = new EventBroker();
    const received: SublayerEvent[] = [];
    broker.subscribe((evt) => {
      if (evt.type.startsWith('sublayer:')) {
        received.push(evt as SublayerEvent);
      }
    });

    const configEvt: SublayerConfigUpdatedEvent = {
      type: 'sublayer:config-updated',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
      config: {
        definitions: [],
        sublayerVisibilityOverrides: {},
      },
    };

    broker.emit(configEvt as any);

    expect(received.length).toBe(1);
    expect(received[0].type).toBe('sublayer:config-updated');
  });

  it('provides listener isolation (one throwing listener does not block others)', () => {
    const broker = new EventBroker();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const received: string[] = [];

    broker.subscribe(() => {
      throw new Error('Listener 1 failed!');
    });

    broker.subscribe((evt) => {
      received.push(evt.type);
    });

    const activated: SublayerActivatedEvent = {
      type: 'sublayer:activated',
      timestamp: new Date().toISOString(),
      workspaceId: 'ws-1',
      definitionIds: ['def-1'],
      countryCode: 'MY',
    };

    broker.emit(activated as any);

    expect(received).toEqual(['sublayer:activated']);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
