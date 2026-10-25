import { z } from 'zod';
import { BaseMapConfigSchema } from './basemap.js';
import { SemanticLayerSchema } from './layer.js';
import { CountryDetailConfigSchema } from './country-sublayer.js';

export const CanvasWorkspaceSchema = z.object({
  schemaVersion: z.literal('1.1.0'),
  workspaceId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title must not be empty').max(200, 'Title must be <= 200 characters'),
  baseMap: BaseMapConfigSchema,
  layers: z.array(SemanticLayerSchema).min(1, 'Canvas workspace must maintain at least one layer'),
  activeLayerId: z.string().uuid(),
  countryDetailConfig: CountryDetailConfigSchema.default({
    definitions: [],
    sublayerVisibilityOverrides: {},
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).refine(
  (data) => data.layers.some((layer) => layer.id === data.activeLayerId),
  {
    message: 'activeLayerId must reference an existing layer ID within the workspace layers list',
    path: ['activeLayerId'],
  }
);

export type CanvasWorkspace = z.infer<typeof CanvasWorkspaceSchema>;
