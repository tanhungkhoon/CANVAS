import { z } from 'zod';
import { SpatialEntitySchema } from './entity.js';

export const SemanticCategorySchema = z.enum([
  'baseline',
  'tactical',
  'infrastructure',
  'environmental',
  'annotation',
  'custom',
]);

export type SemanticCategory = z.infer<typeof SemanticCategorySchema>;

export const SemanticLayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Layer name must not be empty').max(100, 'Layer name must be <= 100 characters'),
  semanticType: SemanticCategorySchema,
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  visible: z.boolean().default(true),
  opacity: z.number().min(0.0, 'Opacity must be >= 0.0').max(1.0, 'Opacity must be <= 1.0').default(1.0),
  locked: z.boolean().default(false),
  entities: z.array(SpatialEntitySchema).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SemanticLayer = z.infer<typeof SemanticLayerSchema>;

export interface CreateLayerOptions {
  name: string;
  semanticType: SemanticCategory;
  opacity?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateLayerOptions {
  name?: string;
  semanticType?: SemanticCategory;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  metadata?: Record<string, unknown>;
}
