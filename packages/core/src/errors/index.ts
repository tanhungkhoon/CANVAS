export class CanvasError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'CANVAS_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LayerNotFoundError extends CanvasError {
  constructor(layerId: string) {
    super(`Layer with ID "${layerId}" not found.`, 'LAYER_NOT_FOUND');
  }
}

export class DefinitionNotFoundError extends CanvasError {
  constructor(definitionId: string) {
    super(`Country sublayer definition with ID "${definitionId}" not found.`, 'DEFINITION_NOT_FOUND');
  }
}

export class InvalidLayerCountError extends CanvasError {
  constructor(message: string = 'A canvas workspace must maintain at least one layer.') {
    super(message, 'INVALID_LAYER_COUNT');
  }
}

export class InvalidCoordinatesError extends CanvasError {
  constructor(message: string = 'Coordinates are outside valid WGS84 boundaries [-180, 180], [-90, 90].') {
    super(message, 'INVALID_COORDINATES');
  }
}

export class SchemaValidationError extends CanvasError {
  public readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message, 'SCHEMA_VALIDATION_ERROR');
    this.issues = issues;
  }
}

export class LayerLockedError extends CanvasError {
  constructor(layerId: string) {
    super(`Layer "${layerId}" is locked against modification.`, 'LAYER_LOCKED_ERROR');
  }
}

export class DuplicateOrderError extends CanvasError {
  constructor(message: string = 'Layer ordering must contain unique, non-duplicate IDs.') {
    super(message, 'DUPLICATE_ORDER_ERROR');
  }
}
