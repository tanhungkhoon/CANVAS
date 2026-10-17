import { useEffect, useRef, useState } from 'react';
import { MapLibreMapAdapter, ViewportController, ViewportState } from '@canvas/map-engine';
import { BaseMapConfig, DEFAULT_BASEMAP_CONFIG } from '@canvas/core';

export function useBaseMap(initialConfig: BaseMapConfig = DEFAULT_BASEMAP_CONFIG) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<MapLibreMapAdapter | null>(null);
  const controllerRef = useRef<ViewportController | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewport, setViewport] = useState<ViewportState>({
    center: initialConfig.center,
    zoom: initialConfig.zoom,
    bearing: initialConfig.bearing,
    pitch: initialConfig.pitch,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const adapter = new MapLibreMapAdapter();
    adapterRef.current = adapter;

    adapter.initialize(containerRef.current, initialConfig);

    const controller = new ViewportController(adapter);
    controllerRef.current = controller;

    const unbindEvents = controller.bindEvents();
    const unbindChange = controller.onViewportChange((newViewport) => {
      setViewport(newViewport);
    });

    adapter.whenLoaded(() => {
      setIsReady(true);
    });

    return () => {
      unbindEvents();
      unbindChange();
      adapter.destroy();
      adapterRef.current = null;
      controllerRef.current = null;
      setIsReady(false);
    };
  }, []);

  const resetViewport = () => {
    if (controllerRef.current) {
      controllerRef.current.resetViewport(initialConfig);
    }
  };

  const flyTo = (center: [number, number], zoom?: number) => {
    if (adapterRef.current) {
      adapterRef.current.flyTo({ center, zoom });
    }
  };

  return {
    containerRef,
    adapter: adapterRef.current,
    controller: controllerRef.current,
    isReady,
    viewport,
    resetViewport,
    flyTo,
  };
}
