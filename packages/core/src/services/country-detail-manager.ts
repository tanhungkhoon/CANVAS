/**
 * ISOLATION CONTRACT:
 * - CountryDetailManager manages geographic reference sublayer definitions, runtime activation,
 *   and user visibility overrides.
 * - It maintains strict isolation from SemanticLayer, LayerManager, and interactive entity models.
 * - Sublayers never participate in semantic entity operations or user drawing targets.
 */

import {
  type CountryDetailConfig,
  type CountrySublayerDefinition,
  type SublayerActivationState,
  type CreateCountrySublayerOptions,
  type UpdateCountrySublayerOptions,
  CountryDetailConfigSchema,
  CountrySublayerDefinitionSchema,
} from '../schemas/country-sublayer.js';
import type {
  SublayerEvent,
  SublayerEventListener,
  SublayerActivatedEvent,
  SublayerDeactivatedEvent,
  SublayerVisibilityOverrideChangedEvent,
  SublayerConfigUpdatedEvent,
} from '../events/event-broker.js';
import { pointInPolygon, getBoundingBox, type BoundingBox } from '../utils/geo-utils.js';
import { DefinitionNotFoundError } from '../errors/index.js';
import countryBoundariesGeoJson from '../data/country-boundaries.geo.json';

interface CountryBoundaryRecord {
  isoA2: string;
  isoA3: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: BoundingBox;
}

export interface ICountryDetailManager {
  getConfig(): CountryDetailConfig;
  addDefinition(options: CreateCountrySublayerOptions): CountrySublayerDefinition;
  updateDefinition(id: string, patch: UpdateCountrySublayerOptions): CountrySublayerDefinition;
  removeDefinition(id: string): void;
  setVisibilityOverride(definitionId: string, visible: boolean): void;
  clearVisibilityOverride(definitionId: string): void;
  evaluateViewport(center: [number, number], zoom: number): void;
  getActivationState(): SublayerActivationState;
  getVisibleDefinitions(): CountrySublayerDefinition[];
  subscribe(listener: SublayerEventListener): () => void;
  loadConfig(config: CountryDetailConfig): void;
  exportConfig(): CountryDetailConfig;
}

export class CountryDetailManager implements ICountryDetailManager {
  private config: CountryDetailConfig;
  private activationState: SublayerActivationState;
  private eventListeners: Set<SublayerEventListener> = new Set();
  private static boundaryRecords: CountryBoundaryRecord[] | null = null;
  private static boundaryLookup: Map<string, CountryBoundaryRecord> | null = null;

  constructor(initialConfig?: CountryDetailConfig) {
    this.config = initialConfig ? CountryDetailConfigSchema.parse(initialConfig) : {
      definitions: [],
      sublayerVisibilityOverrides: {},
    };

    this.activationState = {
      activeDefinitionIds: new Set<string>(),
      currentCountryCode: null,
      lastEvaluatedZoom: 0,
      lastEvaluatedCenter: [0, 0],
    };

    CountryDetailManager.initializeBoundaries();
  }

  private static initializeBoundaries(): void {
    if (CountryDetailManager.boundaryRecords && CountryDetailManager.boundaryLookup) {
      return;
    }

    const records: CountryBoundaryRecord[] = [];
    const lookup = new Map<string, CountryBoundaryRecord>();

    const featureCollection = countryBoundariesGeoJson as unknown as GeoJSON.FeatureCollection<
      GeoJSON.Polygon | GeoJSON.MultiPolygon,
      { ISO_A2: string; ISO_A3: string; NAME: string }
    >;

    for (const feature of featureCollection.features) {
      const isoA2 = (feature.properties.ISO_A2 || '').toUpperCase();
      const isoA3 = (feature.properties.ISO_A3 || '').toUpperCase();
      const name = feature.properties.NAME || '';
      const geometry = feature.geometry;
      const bbox = getBoundingBox(geometry);

      const record: CountryBoundaryRecord = {
        isoA2,
        isoA3,
        name,
        geometry,
        bbox,
      };

      records.push(record);
      if (isoA2) lookup.set(isoA2, record);
      if (isoA3) lookup.set(isoA3, record);
    }

    CountryDetailManager.boundaryRecords = records;
    CountryDetailManager.boundaryLookup = lookup;
  }

  public getConfig(): CountryDetailConfig {
    return {
      definitions: [...this.config.definitions],
      sublayerVisibilityOverrides: { ...this.config.sublayerVisibilityOverrides },
    };
  }

  public getActivationState(): SublayerActivationState {
    return {
      activeDefinitionIds: new Set(this.activationState.activeDefinitionIds),
      currentCountryCode: this.activationState.currentCountryCode,
      lastEvaluatedZoom: this.activationState.lastEvaluatedZoom,
      lastEvaluatedCenter: [...this.activationState.lastEvaluatedCenter],
    };
  }

  public getVisibleDefinitions(): CountrySublayerDefinition[] {
    return this.config.definitions.filter((def) => {
      const isActive = this.activationState.activeDefinitionIds.has(def.id);
      const isUserHidden = this.config.sublayerVisibilityOverrides[def.id] === false;
      return isActive && !isUserHidden;
    });
  }

  public subscribe(listener: SublayerEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private emit(event: SublayerEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(`[CountryDetailManager] Listener error on ${event.type}:`, err);
      }
    }
  }

  public evaluateViewport(center: [number, number], zoom: number): void {
    const [lng, lat] = center;

    // Early exit if no definitions
    if (!this.config.definitions || this.config.definitions.length === 0) {
      if (this.activationState.activeDefinitionIds.size > 0) {
        const deactivatedIds = Array.from(this.activationState.activeDefinitionIds);
        this.activationState.activeDefinitionIds.clear();
        this.activationState.currentCountryCode = null;
        this.emit({
          type: 'sublayer:deactivated',
          timestamp: new Date().toISOString(),
          workspaceId: 'workspace-default',
          definitionIds: deactivatedIds,
        });
      }
      this.activationState.lastEvaluatedCenter = [lng, lat];
      this.activationState.lastEvaluatedZoom = zoom;
      return;
    }

    // 1. Gather all countries that have enabled definitions
    const enabledCountryCodes = new Set<string>();
    for (const def of this.config.definitions) {
      if (def.enabled !== false) {
        enabledCountryCodes.add(def.countryCode.toUpperCase());
      }
    }

    // 2. Bounding-box pre-filter
    const candidates: Array<{ record: CountryBoundaryRecord; depth: number }> = [];
    const lookup = CountryDetailManager.boundaryLookup;

    if (lookup) {
      for (const code of enabledCountryCodes) {
        const record = lookup.get(code);
        if (!record) continue;

        const [minLng, minLat, maxLng, maxLat] = record.bbox;
        if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
          // Bbox matched, run ray-casting
          if (pointInPolygon(center, record.geometry)) {
            // Distance from point to bounding box edges (depth inside bbox)
            const depth = Math.min(lng - minLng, maxLng - lng, lat - minLat, maxLat - lat);
            candidates.push({ record, depth });
          }
        }
      }
    }

    // 3. Resolve single country tie-break (deepest inside bounding box)
    let matchedCountry: CountryBoundaryRecord | null = null;
    if (candidates.length === 1) {
      matchedCountry = candidates[0].record;
    } else if (candidates.length > 1) {
      candidates.sort((a, b) => b.depth - a.depth);
      matchedCountry = candidates[0].record;
    }

    const matchedCountryCode = matchedCountry ? matchedCountry.isoA2 || matchedCountry.isoA3 : null;

    // 4. Compute newly activated definition IDs
    const newActiveSet = new Set<string>();
    if (matchedCountry) {
      for (const def of this.config.definitions) {
        if (def.enabled === false) continue;
        const code = def.countryCode.toUpperCase();
        const matchesCountry = code === matchedCountry.isoA2 || code === matchedCountry.isoA3;
        if (matchesCountry && zoom >= def.minZoomThreshold) {
          newActiveSet.add(def.id);
        }
      }
    }

    const prevActiveSet = this.activationState.activeDefinitionIds;

    // 5. Determine changes
    const newlyActivated: string[] = [];
    const newlyDeactivated: string[] = [];

    for (const id of newActiveSet) {
      if (!prevActiveSet.has(id)) {
        newlyActivated.push(id);
      }
    }

    for (const id of prevActiveSet) {
      if (!newActiveSet.has(id)) {
        newlyDeactivated.push(id);
      }
    }

    this.activationState.activeDefinitionIds = newActiveSet;
    this.activationState.currentCountryCode = matchedCountryCode;
    this.activationState.lastEvaluatedCenter = [lng, lat];
    this.activationState.lastEvaluatedZoom = zoom;

    // 6. Emit events only when active set changes
    const timestamp = new Date().toISOString();
    const workspaceId = 'workspace-default';

    if (newlyDeactivated.length > 0) {
      const deactEvent: SublayerDeactivatedEvent = {
        type: 'sublayer:deactivated',
        timestamp,
        workspaceId,
        definitionIds: newlyDeactivated,
      };
      this.emit(deactEvent);
    }

    if (newlyActivated.length > 0 && matchedCountryCode) {
      const actEvent: SublayerActivatedEvent = {
        type: 'sublayer:activated',
        timestamp,
        workspaceId,
        definitionIds: newlyActivated,
        countryCode: matchedCountryCode,
      };
      this.emit(actEvent);
    }
  }

  public addDefinition(options: CreateCountrySublayerOptions): CountrySublayerDefinition {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const candidate = {
      ...options,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const definition = CountrySublayerDefinitionSchema.parse(candidate);
    this.config.definitions.push(definition);

    this.emit({
      type: 'sublayer:config-updated',
      timestamp: now,
      workspaceId: 'workspace-default',
      config: this.exportConfig(),
    });

    return definition;
  }

  public updateDefinition(id: string, patch: UpdateCountrySublayerOptions): CountrySublayerDefinition {
    const index = this.config.definitions.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new DefinitionNotFoundError(id);
    }

    const now = new Date().toISOString();
    const current = this.config.definitions[index];
    const candidate = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now,
    };

    const updated = CountrySublayerDefinitionSchema.parse(candidate);
    this.config.definitions[index] = updated;

    this.emit({
      type: 'sublayer:config-updated',
      timestamp: now,
      workspaceId: 'workspace-default',
      config: this.exportConfig(),
    });

    return updated;
  }

  public removeDefinition(id: string): void {
    const index = this.config.definitions.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new DefinitionNotFoundError(id);
    }

    this.config.definitions.splice(index, 1);
    delete this.config.sublayerVisibilityOverrides[id];

    const now = new Date().toISOString();

    if (this.activationState.activeDefinitionIds.has(id)) {
      this.activationState.activeDefinitionIds.delete(id);
      this.emit({
        type: 'sublayer:deactivated',
        timestamp: now,
        workspaceId: 'workspace-default',
        definitionIds: [id],
      });
    }

    this.emit({
      type: 'sublayer:config-updated',
      timestamp: now,
      workspaceId: 'workspace-default',
      config: this.exportConfig(),
    });
  }

  public setVisibilityOverride(definitionId: string, visible: boolean): void {
    this.config.sublayerVisibilityOverrides[definitionId] = visible;
    const now = new Date().toISOString();
    this.emit({
      type: 'sublayer:visibility-override-changed',
      timestamp: now,
      workspaceId: 'workspace-default',
      definitionId,
      visible,
    });
  }

  public clearVisibilityOverride(definitionId: string): void {
    delete this.config.sublayerVisibilityOverrides[definitionId];
    const now = new Date().toISOString();
    if (this.activationState.activeDefinitionIds.has(definitionId)) {
      this.emit({
        type: 'sublayer:visibility-override-changed',
        timestamp: now,
        workspaceId: 'workspace-default',
        definitionId,
        visible: true,
      });
    }
  }

  public loadConfig(config: CountryDetailConfig): void {
    this.config = CountryDetailConfigSchema.parse(config);
    this.activationState = {
      activeDefinitionIds: new Set<string>(),
      currentCountryCode: null,
      lastEvaluatedZoom: 0,
      lastEvaluatedCenter: [0, 0],
    };
    this.emit({
      type: 'sublayer:config-updated',
      timestamp: new Date().toISOString(),
      workspaceId: 'workspace-default',
      config: this.exportConfig(),
    });
  }

  public exportConfig(): CountryDetailConfig {
    return {
      definitions: JSON.parse(JSON.stringify(this.config.definitions)),
      sublayerVisibilityOverrides: { ...this.config.sublayerVisibilityOverrides },
    };
  }
}
