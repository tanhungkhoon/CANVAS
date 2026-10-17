# @canvas/core

Core domain models, schemas, and layer management for CANVAS (Context-Aware Naturally Vibe AI Sketcher).

## Overview

`@canvas/core` is a pure TypeScript library decoupled from any UI framework or map renderer. It manages:
- **BaseMap Configuration**: Coordinate bounding, defaults, and validation for WGS84 coordinates.
- **LayerManager**: Enforces layer isolation, ordering, opacity, locking, and visibility toggles.
- **EventBroker**: Synchronous, typed event dispatch for multi-layer state changes (`layer:created`, `layer:reordered`, `layer:visibility-changed`, etc.).
- **Serialization**: Lossless Zod-validated export and import conforming to `workspace-schema.json`.

## Installation & Usage

```typescript
import { LayerManager, serializeWorkspace, deserializeWorkspace } from '@canvas/core';

// Create a new layer manager instance
const manager = new LayerManager('My Mission Workspace');

// Add a semantic layer
const tacticalLayer = manager.createLayer({
  name: 'Tactical Perimeter',
  semanticType: 'tactical',
  opacity: 0.8,
});

// Subscribe to state events
manager.subscribe((event) => {
  console.log('Layer event received:', event.type);
});

// Reorder layers
manager.reorderLayers([tacticalLayer.id, manager.getLayers()[0].id]);

// Serialize workspace
const json = manager.serialize();
```
