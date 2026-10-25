import { describe, it, expect } from 'vitest';
import {
  CountrySublayerDetailCategorySchema,
  CountrySublayerDefinitionSchema,
  CountryDetailConfigSchema,
} from '../country-sublayer.js';

describe('CountrySublayer Schemas', () => {
  const validDef = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    countryCode: 'MY',
    name: 'Malaysia Administrative',
    detailCategory: 'administrative',
    minZoomThreshold: 5.0,
    tileSourceUrl: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('valid CountrySublayerDefinition round-trips', () => {
    const parsed = CountrySublayerDefinitionSchema.parse(validDef);
    expect(parsed).toEqual(validDef);
  });

  it('countryCode rejects lowercase and 1-char values and accepts 2 or 3 uppercase chars', () => {
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, countryCode: 'my' })
    ).toThrow();
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, countryCode: 'M' })
    ).toThrow();
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, countryCode: 'MYSX' })
    ).toThrow();
    expect(
      CountrySublayerDefinitionSchema.parse({ ...validDef, countryCode: 'MYS' }).countryCode
    ).toBe('MYS');
  });

  it('minZoomThreshold clamps or validates in [0.0, 24.0]', () => {
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, minZoomThreshold: -1 })
    ).toThrow();
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, minZoomThreshold: 25 })
    ).toThrow();
    const parsed = CountrySublayerDefinitionSchema.parse({ ...validDef, minZoomThreshold: 12.5 });
    expect(parsed.minZoomThreshold).toBe(12.5);
  });

  it('name rejects empty string and strings > 100 chars and trims', () => {
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, name: '' })
    ).toThrow();
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, name: '   ' })
    ).toThrow();
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, name: 'a'.repeat(101) })
    ).toThrow();
    const parsed = CountrySublayerDefinitionSchema.parse({ ...validDef, name: '  Trimmed Name  ' });
    expect(parsed.name).toBe('Trimmed Name');
  });

  it('detailCategory rejects unlisted enum values', () => {
    expect(() =>
      CountrySublayerDefinitionSchema.parse({ ...validDef, detailCategory: 'invalid_cat' })
    ).toThrow();
    const categories = ['administrative', 'transport', 'terrain', 'urban', 'hydrography', 'custom'];
    for (const cat of categories) {
      expect(
        CountrySublayerDefinitionSchema.parse({ ...validDef, detailCategory: cat }).detailCategory
      ).toBe(cat);
    }
  });

  it('CountryDetailConfigSchema validates defaults and structures', () => {
    const emptyConfig = CountryDetailConfigSchema.parse({});
    expect(emptyConfig.definitions).toEqual([]);
    expect(emptyConfig.sublayerVisibilityOverrides).toEqual({});

    const populated = CountryDetailConfigSchema.parse({
      definitions: [validDef],
      sublayerVisibilityOverrides: { [validDef.id]: false },
    });
    expect(populated.definitions.length).toBe(1);
    expect(populated.sublayerVisibilityOverrides[validDef.id]).toBe(false);
  });
});
