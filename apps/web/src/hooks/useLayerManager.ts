import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LayerManager,
  SemanticLayer,
  CreateLayerOptions,
  UpdateLayerOptions,
  LayerEvent,
} from '@canvas/core';

export function useLayerManager(initialManager?: LayerManager) {
  const managerRef = useRef<LayerManager>(initialManager ?? new LayerManager());
  const manager = managerRef.current;

  const [layers, setLayers] = useState<readonly SemanticLayer[]>(() => manager.getLayers());
  const [activeLayer, setActiveLayerState] = useState<SemanticLayer>(() => manager.getActiveLayer());

  useEffect(() => {
    const unsubscribe = manager.subscribe((_event: LayerEvent) => {
      setLayers([...manager.getLayers()]);
      setActiveLayerState(manager.getActiveLayer());
    });

    return () => {
      unsubscribe();
    };
  }, [manager]);

  const createLayer = useCallback(
    (options: CreateLayerOptions) => {
      const created = manager.createLayer(options);
      manager.setActiveLayer(created.id);
      return created;
    },
    [manager]
  );

  const deleteLayer = useCallback(
    (id: string) => {
      manager.deleteLayer(id);
    },
    [manager]
  );

  const setActiveLayer = useCallback(
    (id: string) => {
      manager.setActiveLayer(id);
    },
    [manager]
  );

  const updateLayer = useCallback(
    (id: string, options: UpdateLayerOptions) => {
      return manager.updateLayer(id, options);
    },
    [manager]
  );

  const reorderLayers = useCallback(
    (orderedIds: string[]) => {
      return manager.reorderLayers(orderedIds);
    },
    [manager]
  );

  const setLayerVisibility = useCallback(
    (id: string, visible: boolean) => {
      manager.setLayerVisibility(id, visible);
    },
    [manager]
  );

  const setLayerOpacity = useCallback(
    (id: string, opacity: number) => {
      manager.setLayerOpacity(id, opacity);
    },
    [manager]
  );

  const setLayerLocked = useCallback(
    (id: string, locked: boolean) => {
      manager.setLayerLocked(id, locked);
    },
    [manager]
  );

  return {
    manager,
    layers,
    activeLayer,
    createLayer,
    deleteLayer,
    setActiveLayer,
    updateLayer,
    reorderLayers,
    setLayerVisibility,
    setLayerOpacity,
    setLayerLocked,
  };
}
