import type { BaseMapConfig } from '@canvas/core';
import { MapLibreMapAdapter } from '../adapters/maplibre-adapter.js';

export interface ViewportState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export class ViewportController {
  private adapter: MapLibreMapAdapter;
  private changeListeners: Set<(state: ViewportState) => void> = new Set();

  constructor(adapter: MapLibreMapAdapter) {
    this.adapter = adapter;
  }

  public bindEvents(): () => void {
    const unbindMove = this.adapter.on('move', () => {
      this.notifyChange();
    });
    const unbindZoom = this.adapter.on('zoom', () => {
      this.notifyChange();
    });
    const unbindRotate = this.adapter.on('rotate', () => {
      this.notifyChange();
    });
    const unbindPitch = this.adapter.on('pitch', () => {
      this.notifyChange();
    });

    return () => {
      unbindMove();
      unbindZoom();
      unbindRotate();
      unbindPitch();
    };
  }

  public getViewportState(): ViewportState {
    return {
      center: this.adapter.getCenter(),
      zoom: this.adapter.getZoom(),
      bearing: this.adapter.getBearing(),
      pitch: this.adapter.getPitch(),
    };
  }

  public resetViewport(config: BaseMapConfig): void {
    this.adapter.flyTo({
      center: config.center,
      zoom: config.zoom,
      bearing: config.bearing,
      pitch: config.pitch,
      duration: 1200,
    });
  }

  public onViewportChange(listener: (state: ViewportState) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private notifyChange(): void {
    const state = this.getViewportState();
    for (const listener of this.changeListeners) {
      listener(state);
    }
  }
}
