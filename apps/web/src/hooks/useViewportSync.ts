import { useEffect } from 'react';
import type { ViewportController, ViewportState } from '@canvas/map-engine';
import type { ICountryDetailManager } from '@canvas/core';

export function useViewportSync(
  viewportController: ViewportController | null,
  countryDetailManager: ICountryDetailManager | null
): void {
  useEffect(() => {
    if (!viewportController || !countryDetailManager) return;

    // Initial evaluation
    const initial = viewportController.getViewportState();
    countryDetailManager.evaluateViewport(initial.center, initial.zoom);

    const unsubscribe = viewportController.onViewportChange((state: ViewportState) => {
      countryDetailManager.evaluateViewport(state.center, state.zoom);
    });

    return () => {
      unsubscribe();
    };
  }, [viewportController, countryDetailManager]);
}
