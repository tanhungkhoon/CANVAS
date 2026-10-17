# @canvas/map-engine

MapLibre GL JS adapter and layer synchronization engine for CANVAS.

## Overview

`@canvas/map-engine` bridges `@canvas/core` domain events to WebGL GPU-accelerated rendering:
- **MapLibreMapAdapter**: Encapsulates MapLibre GL map instance, event bindings, and camera navigation (`flyTo`, `getCenter`, `getZoom`).
- **ViewportController**: Tracks real-time viewport state and coordinate bounds.
- **LayerSyncEngine**: Subscribes to `LayerManager` events and updates MapLibre style layers in < 50ms.

## Usage

```typescript
import { MapLibreMapAdapter, LayerSyncEngine } from '@canvas/map-engine';
import { LayerManager, DEFAULT_BASEMAP_CONFIG } from '@canvas/core';

const adapter = new MapLibreMapAdapter();
adapter.initialize('map-container', DEFAULT_BASEMAP_CONFIG);

const manager = new LayerManager();
const syncEngine = new LayerSyncEngine(adapter, manager);
syncEngine.startSync();
```
