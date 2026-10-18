/**
 * Sublayer Event Types Contract
 * Package: @canvas/core  →  packages/core/src/events/event-broker.ts (additions)
 *
 * These types extend the existing LayerEvent union in event-broker.ts.
 * They are emitted by CountryDetailManager and consumed by CountryDetailSyncEngine.
 *
 * Naming convention: sublayer:* (distinct from layer:* semantic layer events)
 */

// ─── Event Type Literals ────────────────────────────────────────────────────

export type SublayerEventType =
  | 'sublayer:activated'
  | 'sublayer:deactivated'
  | 'sublayer:visibility-override-changed'
  | 'sublayer:config-updated';

// ─── Base ───────────────────────────────────────────────────────────────────

export interface BaseSublayerEvent {
  type: SublayerEventType;
  timestamp: string;       // ISO 8601
  workspaceId: string;     // correlates to CanvasWorkspace.workspaceId
}

// ─── Concrete Event Shapes ──────────────────────────────────────────────────

/**
 * Emitted when one or more sublayers transition from INACTIVE → AUTO-ACTIVE
 * due to the viewport entering a country's region at or above the zoom threshold.
 */
export interface SublayerActivatedEvent extends BaseSublayerEvent {
  type: 'sublayer:activated';
  definitionIds: string[];   // IDs of newly activated CountrySublayerDefinitions
  countryCode: string;       // ISO 3166-1 code of the country now in viewport
}

/**
 * Emitted when one or more sublayers transition from AUTO-ACTIVE → INACTIVE
 * due to zoom falling below threshold or viewport moving outside the country.
 */
export interface SublayerDeactivatedEvent extends BaseSublayerEvent {
  type: 'sublayer:deactivated';
  definitionIds: string[];   // IDs of sublayers that are no longer auto-active
}

/**
 * Emitted when the user toggles a sublayer's visibility in the layer dock.
 * This override persists across zoom cycles (FR-014).
 *
 * visible=false → user-hidden (sticky until user re-enables)
 * visible=true  → user-override cleared; auto-activation resumes control
 *
 * Note: Setting visible=true does NOT force the sublayer to appear if zoom
 * threshold is not met — it only lifts the user-hidden suppression.
 */
export interface SublayerVisibilityOverrideChangedEvent extends BaseSublayerEvent {
  type: 'sublayer:visibility-override-changed';
  definitionId: string;    // ID of the affected CountrySublayerDefinition
  visible: boolean;        // true = user cleared hide override; false = user hidden
}

/**
 * Emitted when the full CountryDetailConfig is replaced, e.g., after a
 * workspace import (deserializeWorkspace) or a workspace reset.
 * Consumers should re-sync their entire sublayer state.
 */
export interface SublayerConfigUpdatedEvent extends BaseSublayerEvent {
  type: 'sublayer:config-updated';
  config: {
    definitions: unknown[];                      // CountrySublayerDefinition[]
    sublayerVisibilityOverrides: Record<string, boolean>;
  };
}

// ─── Union ──────────────────────────────────────────────────────────────────

export type SublayerEvent =
  | SublayerActivatedEvent
  | SublayerDeactivatedEvent
  | SublayerVisibilityOverrideChangedEvent
  | SublayerConfigUpdatedEvent;

export type SublayerEventListener = (event: SublayerEvent) => void;
