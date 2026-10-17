import { describe, it, expect } from 'vitest';
import { BaseMapConfigSchema, DEFAULT_BASEMAP_CONFIG } from '../../src/schemas/basemap.js';

describe('BaseMap Contract Tests', () => {
  it('conforms strictly to the BaseMapConfig schema', () => {
    const result = BaseMapConfigSchema.safeParse(DEFAULT_BASEMAP_CONFIG);
    expect(result.success).toBe(true);
  });

  it('fails contract parsing when required fields are missing', () => {
    const invalid = {
      center: [0, 0],
      // missing styleUrl and zoom
    };
    const result = BaseMapConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('fails contract parsing when coordinates are not a 2-tuple', () => {
    const invalid = {
      ...DEFAULT_BASEMAP_CONFIG,
      center: [0, 0, 50], // 3 elements instead of 2
    };
    const result = BaseMapConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
