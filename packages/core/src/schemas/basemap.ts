import { z } from 'zod';

export const CoordinateSchema = z.tuple([
  z.number().min(-180.0, 'Longitude must be >= -180.0').max(180.0, 'Longitude must be <= 180.0'),
  z.number().min(-90.0, 'Latitude must be >= -90.0').max(90.0, 'Latitude must be <= 90.0'),
]);

export const BaseMapConfigSchema = z.object({
  styleUrl: z.string().min(1, 'Style URL must not be empty'),
  center: CoordinateSchema,
  zoom: z.number().min(0.0, 'Zoom must be >= 0.0').max(24.0, 'Zoom must be <= 24.0'),
  bearing: z.number().min(0.0).max(360.0).default(0.0),
  pitch: z.number().min(0.0).max(85.0).default(0.0),
});

export type Coordinate = z.infer<typeof CoordinateSchema>;
export type BaseMapConfig = z.infer<typeof BaseMapConfigSchema>;

export const DEFAULT_BASEMAP_CONFIG: BaseMapConfig = {
  styleUrl: 'https://demotiles.maplibre.org/style.json',
  center: [0.0, 20.0],
  zoom: 2.0,
  bearing: 0.0,
  pitch: 0.0,
};
