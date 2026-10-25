import { useEffect } from 'react';
import type { LayerManager, ICountryDetailManager } from '@canvas/core';
import { serializeWorkspace } from '@canvas/core';

const STORAGE_KEY = 'canvas_active_workspace_v1';

export function useWorkspacePersistence(
  manager: LayerManager,
  countryDetailManager?: ICountryDetailManager
) {
  // Load cached workspace on startup if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        manager.deserialize(cached);
        if (countryDetailManager) {
          countryDetailManager.loadConfig(manager.getWorkspace().countryDetailConfig);
        }
      }
    } catch (e) {
      console.warn('[useWorkspacePersistence] Failed to restore cached workspace from localStorage:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [manager, countryDetailManager]);

  // Subscribe to changes and debounce saving to localStorage
  useEffect(() => {
    let timeoutId: number;

    const save = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        try {
          const ws = manager.getWorkspace();
          if (countryDetailManager) {
            ws.countryDetailConfig = countryDetailManager.exportConfig();
          }
          const serialized = serializeWorkspace(ws);
          localStorage.setItem(STORAGE_KEY, serialized);
        } catch (e) {
          console.warn('[useWorkspacePersistence] Error caching workspace state:', e);
        }
      }, 500);
    };

    const unsubManager = manager.subscribe(() => {
      save();
    });

    const unsubSublayers = countryDetailManager?.subscribe(() => {
      save();
    });

    return () => {
      window.clearTimeout(timeoutId);
      unsubManager();
      if (unsubSublayers) unsubSublayers();
    };
  }, [manager, countryDetailManager]);
}
