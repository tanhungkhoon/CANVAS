import { BaseMapConfigSchema, BaseMapConfig, DEFAULT_BASEMAP_CONFIG } from '../schemas/basemap.js';
import { InvalidCoordinatesError, SchemaValidationError } from '../errors/index.js';

export { BaseMapConfigSchema, DEFAULT_BASEMAP_CONFIG };
export type { BaseMapConfig };

export function createDefaultBaseMapConfig(): BaseMapConfig {
  return { ...DEFAULT_BASEMAP_CONFIG };
}

export function validateBaseMapConfig(config: unknown): BaseMapConfig {
  const result = BaseMapConfigSchema.safeParse(config);
  if (!result.success) {
    const isCoordError = result.error.issues.some((issue) => issue.path.includes('center'));
    if (isCoordError) {
      throw new InvalidCoordinatesError();
    }
    throw new SchemaValidationError('Invalid base map configuration', result.error.issues);
  }
  return result.data;
}
