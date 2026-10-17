import maplibregl, { Map, MapOptions } from 'maplibre-gl';
import type { BaseMapConfig } from '@canvas/core';

export interface FlyToOptions {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  duration?: number;
}

export class MapLibreMapAdapter {
  private map: Map | null = null;
  private isLoaded: boolean = false;
  private loadCallbacks: Array<() => void> = [];

  public initialize(container: HTMLElement | string, config: BaseMapConfig): Map {
    if (this.map) {
      this.destroy();
    }

    const options: MapOptions = {
      container,
      style: config.styleUrl,
      center: config.center,
      zoom: config.zoom,
      bearing: config.bearing,
      pitch: config.pitch,
    };

    this.map = new maplibregl.Map(options);

    this.map.on('load', () => {
      this.isLoaded = true;
      for (const cb of this.loadCallbacks) {
        cb();
      }
      this.loadCallbacks = [];
    });

    return this.map;
  }

  public whenLoaded(callback: () => void): void {
    if (this.isLoaded && this.map) {
      callback();
    } else {
      this.loadCallbacks.push(callback);
    }
  }

  public destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.isLoaded = false;
      this.loadCallbacks = [];
    }
  }

  public getCenter(): [number, number] {
    if (!this.map) {
      return [0, 0];
    }
    const center = this.map.getCenter();
    return [center.lng, center.lat];
  }

  public getZoom(): number {
    return this.map ? this.map.getZoom() : 0;
  }

  public getBearing(): number {
    return this.map ? this.map.getBearing() : 0;
  }

  public getPitch(): number {
    return this.map ? this.map.getPitch() : 0;
  }

  public flyTo(options: FlyToOptions): void {
    if (!this.map) return;
    this.map.flyTo({
      center: options.center,
      zoom: options.zoom,
      bearing: options.bearing,
      pitch: options.pitch,
      duration: options.duration ?? 1000,
    });
  }

  public on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.map) return () => {};
    this.map.on(event as any, callback);
    return () => {
      if (this.map) {
        this.map.off(event as any, callback);
      }
    };
  }

  public getMapInstance(): Map | null {
    return this.map;
  }

  public get loaded(): boolean {
    return this.isLoaded;
  }
}
