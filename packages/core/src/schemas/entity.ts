import { z } from 'zod';

export const SpatialEntitySchema = z.object({
  id: z.string().uuid(),
  layerId: z.string().uuid(),
  semanticClass: z.string().min(1, 'Semantic class must not be empty'),
  geometry: z.record(z.unknown()), // Standard GeoJSON Geometry representation
  properties: z.record(z.unknown()).default({}),
});

export type SpatialEntity = z.infer<typeof SpatialEntitySchema>;
