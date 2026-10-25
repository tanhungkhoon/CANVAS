import { z } from 'zod';

export const CountrySublayerDetailCategorySchema = z.enum([
  'administrative',
  'transport',
  'terrain',
  'urban',
  'hydrography',
  'custom',
]);

export type CountrySublayerDetailCategory = z.infer<typeof CountrySublayerDetailCategorySchema>;

export const CountrySublayerDefinitionSchema = z.object({
  id: z.string().uuid(),
  countryCode: z.string().regex(/^[A-Z]{2,3}$/, 'Country code must be ISO 3166-1 alpha-2 or alpha-3 uppercase'),
  name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name must not exceed 100 characters'),
  detailCategory: CountrySublayerDetailCategorySchema,
  minZoomThreshold: z.number().min(0.0).max(24.0),
  tileSourceUrl: z.string().min(1, 'Tile source URL cannot be empty'),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CountrySublayerDefinition = z.infer<typeof CountrySublayerDefinitionSchema>;

export const CountryDetailConfigSchema = z.object({
  definitions: z.array(CountrySublayerDefinitionSchema).default([]),
  sublayerVisibilityOverrides: z.record(z.string(), z.boolean()).default({}),
});

export type CountryDetailConfig = z.infer<typeof CountryDetailConfigSchema>;

export interface SublayerActivationState {
  activeDefinitionIds: Set<string>;
  currentCountryCode: string | null;
  lastEvaluatedZoom: number;
  lastEvaluatedCenter: [number, number];
}

export type CreateCountrySublayerOptions = Omit<CountrySublayerDefinition, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateCountrySublayerOptions = Partial<Omit<CountrySublayerDefinition, 'id' | 'createdAt'>>;
