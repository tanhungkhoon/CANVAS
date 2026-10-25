import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CountryDetailManager,
  type ICountryDetailManager,
  type CountryDetailConfig,
  type CountrySublayerDefinition,
  type CreateCountrySublayerOptions,
  type UpdateCountrySublayerOptions,
  type SublayerEvent,
} from '@canvas/core';

export interface UseCountryDetailManagerReturn {
  manager: ICountryDetailManager;
  config: CountryDetailConfig;
  activeDefinitions: CountrySublayerDefinition[];
  visibleDefinitions: CountrySublayerDefinition[];
  sublayerVisibilityOverrides: Record<string, boolean>;
  addDefinition: (options: CreateCountrySublayerOptions) => CountrySublayerDefinition;
  updateDefinition: (id: string, patch: UpdateCountrySublayerOptions) => CountrySublayerDefinition;
  removeDefinition: (id: string) => void;
  setVisibilityOverride: (definitionId: string, visible: boolean) => void;
  clearVisibilityOverride: (definitionId: string) => void;
}

export function useCountryDetailManager(
  existingManager?: ICountryDetailManager
): UseCountryDetailManagerReturn {
  const managerRef = useRef<ICountryDetailManager>(
    existingManager || new CountryDetailManager()
  );
  const manager = managerRef.current;

  const [config, setConfig] = useState<CountryDetailConfig>(manager.getConfig());
  const [activeDefinitions, setActiveDefinitions] = useState<CountrySublayerDefinition[]>([]);
  const [visibleDefinitions, setVisibleDefinitions] = useState<CountrySublayerDefinition[]>(
    manager.getVisibleDefinitions()
  );
  const [sublayerVisibilityOverrides, setSublayerVisibilityOverrides] = useState<
    Record<string, boolean>
  >(manager.getConfig().sublayerVisibilityOverrides);

  const updateState = useCallback(() => {
    const currentConfig = manager.getConfig();
    const activeState = manager.getActivationState();
    const active = currentConfig.definitions.filter((d) =>
      activeState.activeDefinitionIds.has(d.id)
    );
    const visible = manager.getVisibleDefinitions();

    setConfig(currentConfig);
    setActiveDefinitions(active);
    setVisibleDefinitions(visible);
    setSublayerVisibilityOverrides(currentConfig.sublayerVisibilityOverrides);
  }, [manager]);

  useEffect(() => {
    updateState();
    const unsubscribe = manager.subscribe((_event: SublayerEvent) => {
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, [manager, updateState]);

  const addDefinition = useCallback(
    (options: CreateCountrySublayerOptions) => {
      const def = manager.addDefinition(options);
      updateState();
      return def;
    },
    [manager, updateState]
  );

  const updateDefinition = useCallback(
    (id: string, patch: UpdateCountrySublayerOptions) => {
      const def = manager.updateDefinition(id, patch);
      updateState();
      return def;
    },
    [manager, updateState]
  );

  const removeDefinition = useCallback(
    (id: string) => {
      manager.removeDefinition(id);
      updateState();
    },
    [manager, updateState]
  );

  const setVisibilityOverride = useCallback(
    (definitionId: string, visible: boolean) => {
      manager.setVisibilityOverride(definitionId, visible);
      updateState();
    },
    [manager, updateState]
  );

  const clearVisibilityOverride = useCallback(
    (definitionId: string) => {
      manager.clearVisibilityOverride(definitionId);
      updateState();
    },
    [manager, updateState]
  );

  return {
    manager,
    config,
    activeDefinitions,
    visibleDefinitions,
    sublayerVisibilityOverrides,
    addDefinition,
    updateDefinition,
    removeDefinition,
    setVisibilityOverride,
    clearVisibilityOverride,
  };
}
