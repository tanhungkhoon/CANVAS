import { CanvasWorkspace, CanvasWorkspaceSchema } from '../schemas/workspace.js';
import { SchemaValidationError } from '../errors/index.js';

export function serializeWorkspace(workspace: CanvasWorkspace): string {
  const validation = CanvasWorkspaceSchema.safeParse(workspace);
  if (!validation.success) {
    throw new SchemaValidationError('Cannot serialize invalid workspace state', validation.error.issues);
  }
  return JSON.stringify(validation.data, null, 2);
}

export function deserializeWorkspace(jsonString: string): CanvasWorkspace {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new SchemaValidationError(
      `Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const result = CanvasWorkspaceSchema.safeParse(parsed);
  if (!result.success) {
    throw new SchemaValidationError('Failed to validate workspace schema', result.error.issues);
  }

  return result.data;
}
