import { describe, it, expect } from 'vitest';
import {
  BaseMapConfigSchema,
  DEFAULT_BASEMAP_CONFIG,
  createDefaultBaseMapConfig,
  validateBaseMapConfig,
} from '../../src/models/basemap.js';

describe('BaseMapConfig & Model Unit Tests', () => {
  it('generates valid default basemap configuration', () => {
    const config = createDefaultBaseMapConfig();
    expect(config).toBeDefined();
    expect(config.center).toEqual([0.0, 20.0]);
    expect(config.zoom).toBe(2.0);
    expect(config.styleUrl).toBe('https://demotiles.maplibre.org/style.json');
    expect(config.bearing).toBe(0.0);
    expect(config.pitch).toBe(0.0);
  });

  it('validates correct coordinates within bounds', () => {
    const validConfig = {
      styleUrl: 'https://tiles.example.com/style.json',
      center: [-122.4194, 37.7749] as [number, number],
      zoom: 12.5,
      bearing: 45,
      pitch: 30,
    };
    const validated = validateBaseMapConfig(validConfig);
    expect(validated.center[0]).toBe(-122.4194);
    expect(validated.center[1]).toBe(37.7749);
  });

  it('rejects out-of-bounds longitude (> 180 or < -180)', () => {
    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        center: [181.0, 0.0],
      });
    }).toThrow();

    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        center: [-185.0, 0.0],
      });
    }).toThrow();
  });

  it('rejects out-of-bounds latitude (> 90 or < -90)', () => {
    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        center: [0.0, 95.0],
      });
    }).toThrow();

    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        center: [0.0, -91.0],
      });
    }).toThrow();
  });

  it('rejects invalid zoom levels (< 0 or > 24)', () => {
    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        zoom: -1,
      });
    }).toThrow();

    expect(() => {
      validateBaseMapConfig({
        ...DEFAULT_BASEMAP_CONFIG,
        zoom: 25,
      });
    }).toThrow();
  });
});
