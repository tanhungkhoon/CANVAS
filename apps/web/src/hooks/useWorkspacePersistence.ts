import { useEffect } from 'react';
import type { LayerManager } from '@canvas/core';

const STORAGE_KEY = 'canvas_active_workspace_v1';

export function useWorkspacePersistence(manager: LayerManager) {
  // Load cached workspace on startup if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        manager.deserialize(cached);
      }
    } catch (e) {
      console.warn('[useWorkspacePersistence] Failed to restore cached workspace from localStorage:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [manager]);

  // Subscribe to changes and debounce saving to localStorage
  useEffect(() => {
    let timeoutId: number;

    const unsubscribe = manager.subscribe(() => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        try {
          const serialized = manager.serialize();
          localStorage.setItem(STORAGE_KEY, serialized);
        } catch (e) {
          console.warn('[useWorkspacePersistence] Error caching workspace state:', e);
        }
      }, 500);
    });

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [manager]);
}
