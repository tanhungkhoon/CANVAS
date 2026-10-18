# Feature Specification: Country Detail Sublayers

**Feature Branch**: `002-country-detail-sublayers`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "create sublayers under the base map layer to display more detailed map for specific country when zoom in to that region of that country"

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are PRIORITIZED as user journeys ordered by importance.
  Each story is independently testable and delivers standalone value.
-->

### User Story 1 - Automatic Detail Sublayer Activation on Zoom (Priority: P1)

As a spatial analyst using CANVAS, I want the map to automatically display richer country-specific detail when I zoom in to a country's geographic region, so that I can see meaningful contextual information (such as administrative boundaries, roads, or points of interest) appropriate to the zoom level without manually switching layers.

**Why this priority**: This is the core behaviour of the feature — automatic contextual map detail enhancement based on geographic zoom depth. Without it, the sublayer system has no value.

**Independent Test**: Can be fully tested by zooming into any registered country's bounding region, confirming that country-specific detail sublayers activate at the correct zoom threshold and deactivate when zooming back out.

**Acceptance Scenarios**:

1. **Given** an open CANVAS workspace with a standard base map, **When** the user zooms into a geographic region that corresponds to a country with registered detail sublayers, **Then** those sublayers automatically become visible beneath all user-created semantic layers without any manual action.
2. **Given** active country detail sublayers are visible, **When** the user zooms back out beyond the activation threshold for that country, **Then** the detail sublayers automatically hide themselves, restoring the standard base map appearance.
3. **Given** the user is viewing a region that spans multiple countries at a boundary zoom level, **When** the view is centred on one country, **Then** only the sublayers for the country whose territory is primarily within the viewport are activated.

---

### User Story 2 - Country Detail Sublayer Configuration & Registration (Priority: P2)

As a workspace administrator or power user, I want to configure which countries have detail sublayers, what data each sublayer represents, and at what zoom level each sublayer activates, so that I can tailor the level of geographic detail shown per country to match my domain needs.

**Why this priority**: The system needs a way to register country-to-sublayer mappings. Without configuration, the P1 behaviour has nothing to display. This is a close dependency but kept at P2 because a sensible default configuration can be shipped without user configuration.

**Independent Test**: Can be tested by adding a country detail sublayer configuration for a new country, zooming into that country's region, and verifying the correct sublayer is rendered at the configured zoom threshold.

**Acceptance Scenarios**:

1. **Given** a country detail sublayer configuration panel is accessible, **When** the user selects a country, defines a sublayer name, assigns a detail category (e.g., administrative divisions, transport network, terrain), and sets a minimum zoom level, **Then** the new sublayer configuration is saved and becomes active on the next map view within that country.
2. **Given** multiple sublayers are configured for the same country at different zoom thresholds, **When** the user progressively zooms in, **Then** each sublayer activates in sequence as the corresponding zoom level is reached.
3. **Given** a country has an existing sublayer configuration, **When** the user removes or disables a sublayer entry, **Then** that sublayer no longer appears for that country in any viewport.

---

### User Story 3 - Country Sublayer Visibility Control in Layer Dock (Priority: P3)

As a canvas user, I want to see country detail sublayers listed in the layer dock panel and be able to individually toggle their visibility on or off, so that I can control which geographic detail layers are shown without needing to zoom in or out.

**Why this priority**: Making sublayers visible in the layer dock gives users direct, explicit control over geographic detail — they can suppress a sublayer that clutters their workspace or force-hide it regardless of zoom state. This closes the gap between the automatic zoom-based activation and deliberate user intent.

**Independent Test**: Can be fully tested by zooming into a country with multiple configured sublayers, confirming they appear in the layer dock as labelled read-only entries, toggling each one off and on, and verifying the map rendering updates immediately while all semantic layers are unaffected.

**Acceptance Scenarios**:

1. **Given** the user zooms into a country with registered detail sublayers, **When** those sublayers activate, **Then** each active sublayer appears as a distinct, labelled entry in the layer dock panel, grouped below all user-created semantic layer entries.
2. **Given** a country detail sublayer is listed in the layer dock, **When** the user toggles its visibility to off, **Then** that sublayer disappears from the map immediately while all other sublayers and semantic layers remain unaffected.
3. **Given** a user has manually hidden a country detail sublayer via the layer dock, **When** the user zooms out and then back in (which would ordinarily auto-activate the sublayer), **Then** the sublayer respects the user's explicit hidden state and does not reappear automatically until the user re-enables it in the layer dock.
4. **Given** country detail sublayers are listed in the layer dock, **When** the user attempts to reorder, lock, or draw on them, **Then** the system prevents those actions and indicates clearly that country detail sublayers are read-only reference entries.

---

### User Story 4 - Sublayer Coexistence with Semantic Layers (Priority: P4)

As a canvas user who has created semantic drawing layers on top of the base map, I want country detail sublayers to appear cleanly below my drawing layers and never interfere with them, so that my plotted entities remain visually prominent and spatially accurate while enriched geographic context is visible underneath.

**Why this priority**: CANVAS's core architecture mandates strict layer isolation. This story verifies that country detail sublayers integrate safely without violating layer boundaries or corrupting user-created layer state.

**Independent Test**: Can be tested by creating two semantic layers with plotted entities, zooming into a country with configured detail sublayers, and verifying that entity positions, z-order, and interactivity on semantic layers are completely unaffected.

**Acceptance Scenarios**:

1. **Given** a workspace with user-created semantic layers containing plotted entities, **When** country detail sublayers activate due to zoom, **Then** the detail sublayers are always rendered below all semantic layers in the visual stack and do not alter any entity data or layer properties.
2. **Given** country detail sublayers are active, **When** the user interacts with a semantic layer (selecting, moving, or drawing entities), **Then** the detail sublayers do not intercept, interfere with, or respond to those interactions.
3. **Given** a workspace with country detail sublayers visible, **When** the workspace is exported to a persistent file, **Then** the sublayer configuration, per-sublayer visibility overrides, and activation state are included in the serialized workspace document and are correctly restored on import.

---

### Edge Cases

- **Country with No Registered Sublayers**: When the user zooms into a country that has no configured detail sublayers, the base map displays as normal without any error or visual artefact.
- **Ambiguous Region at Borders**: When the viewport straddles the border between two countries that both have detail sublayers, the system must resolve which country's sublayers to display without rendering duplicate overlapping detail layers.
- **Rapid Zoom Transitions**: When the user rapidly zooms through multiple zoom thresholds (e.g., scroll wheel fast spin), sublayer activation and deactivation must resolve deterministically to the final resting zoom level without visual flickering or stale layer states.
- **Data Unavailability for Country Detail**: When a country is registered for detail sublayers but the underlying geographic data source is temporarily unavailable, the system must display the standard base map and notify the user without crashing.
- **Very Small or Isolated Countries**: When a country has a very small geographic bounding area (e.g., city-states like Monaco or Vatican City), the zoom activation threshold must still function correctly without triggering prematurely or failing to trigger.
- **Workspace Reset / Layer Clear**: When all semantic layers are cleared or the workspace is reset, country detail sublayer configuration must persist independently and not be lost.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register a set of country detail sublayer definitions, each associating a country (uniquely identified by a standard geographic code) with one or more named detail sublayers and their corresponding minimum zoom activation threshold.
- **FR-002**: The system MUST automatically activate the appropriate country detail sublayers when the map viewport's zoom level meets or exceeds the configured activation threshold and the viewport is positioned within that country's geographic boundaries.
- **FR-003**: The system MUST automatically deactivate country detail sublayers when the map viewport zooms back below the activation threshold or navigates outside the country's geographic boundaries.
- **FR-004**: Country detail sublayers MUST always be rendered at a fixed position below all user-created semantic layers and above the base map tile surface, with no ability to reorder them relative to semantic layers.
- **FR-005**: Country detail sublayers MUST be strictly read-only in terms of editing — users MUST NOT be able to select, move, edit, draw entities, reorder, or lock/unlock a country detail sublayer. Toggling visibility via the layer dock is the sole permitted user interaction.
- **FR-006**: When multiple detail sublayers are configured for the same country at different zoom thresholds, the system MUST activate each sublayer progressively as the appropriate threshold is crossed during zooming.
- **FR-007**: The system MUST allow authorised users to create, update, and remove country detail sublayer configurations through a dedicated management interface.
- **FR-008**: Country detail sublayer configuration MUST be included in workspace serialization, ensuring configurations are preserved across save, export, and import operations. Per-sublayer user visibility overrides MUST also be serialized and restored.
- **FR-009**: When the viewport spans a boundary between two countries with conflicting sublayer activations, the system MUST apply a deterministic resolution rule (primary activation based on the country covering the majority of the viewport area) to prevent duplicate sublayer rendering.
- **FR-010**: The system MUST gracefully handle data unavailability for any country detail sublayer by displaying the base map as fallback and surfacing a non-blocking user notification.
- **FR-011**: Country detail sublayer activation and deactivation MUST NOT mutate the data, visibility state, opacity, z-index, or lock state of any existing user-created semantic layer.
- **FR-012**: The system MUST support at least 50 simultaneously registered country-sublayer configurations without performance degradation in viewport calculations.
- **FR-013**: Country detail sublayers that are currently active MUST appear as labelled, read-only entries in the layer dock panel, visually grouped and distinguished from user-created semantic layers. Users MUST be able to toggle the visibility of each sublayer entry on or off directly from the layer dock.
- **FR-014**: When a user explicitly hides a country detail sublayer via the layer dock, that hidden state MUST persist across subsequent zoom-out and zoom-in cycles for that country — the sublayer MUST NOT re-activate automatically until the user manually restores its visibility in the layer dock.

### Key Entities

- **Country Detail Sublayer Definition**: A configuration record linking a geographic country identifier (e.g., ISO 3166-1 alpha-2/alpha-3 code), a sublayer name, a detail category (e.g., administrative boundaries, transport, terrain, urban areas), a minimum zoom activation level, and an enabled/disabled flag.
- **Country Bounding Region**: The geographic bounding polygon or bounding box representing a country's territory, used to determine whether the current viewport falls within the country's area.
- **Sublayer Activation State**: A runtime record tracking which country detail sublayers are currently active for the given viewport, updated reactively as zoom level and map position change.
- **Base Map Sublayer Stack**: The ordered collection of country detail sublayers occupying the layer position between the base map tile surface and the lowest user-created semantic layer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Country detail sublayers activate within 500 milliseconds of the viewport reaching the configured zoom threshold, as observed by the user.
- **SC-002**: Sublayer activation and deactivation produce no visual flicker or frame drop below 60 FPS during normal zoom interactions.
- **SC-003**: 100% of user-created semantic layer entity positions, z-orders, and interaction states remain unchanged before, during, and after country detail sublayer activations in controlled tests.
- **SC-004**: The system correctly resolves viewport-country matching and activates the appropriate sublayers for at least 50 configured countries with zero false activations in automated tests.
- **SC-005**: A workspace with country detail sublayer configurations exports and re-imports with 100% configuration fidelity (all country bindings, zoom thresholds, and sublayer names fully restored).
- **SC-006**: First-time users can configure a detail sublayer for a new country in under 2 minutes using the management interface without requiring external documentation.

## Assumptions

- Country boundaries are defined using established, standardised geographic datasets (e.g., Natural Earth or equivalent openly licensed source) pre-loaded within the application's geographic reference data.
- Country identification follows ISO 3166-1 standard codes, which are assumed to be consistently applied across all geographic datasets used.
- The minimum zoom threshold values follow the same zoom level scale used by the existing base map implementation (as established in Feature 001).
- Detail sublayers display geographic reference data only (boundaries, roads, terrain) — they do not display user-generated or domain-specific semantic entity data.
- Multi-user collaborative editing of country detail sublayer configurations is out of scope for this feature.
- Country detail sublayers are system-managed reference layers. They appear in the layer dock in a dedicated read-only group, separate from and below user-created semantic layers. Users may toggle their visibility but cannot reorder, lock, draw on, or otherwise edit them.
- The feature builds directly on the foundational layer architecture delivered in Feature 001 (`001-base-map-layers`) and depends on the Layer Hierarchy and Base Map entities defined there.
