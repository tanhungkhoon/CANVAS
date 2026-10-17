# CANVAS Constitution

## Core Principles

### I. Multimodal Intent & Semantic Grounding (NON-NEGOTIABLE)
CANVAS MUST blend naturally spoken vibe descriptions with freehand visual sketching intent to generate spatial graphical objects. Every plotted object MUST be grounded in an explicit semantic entity model with domain attributes and contextual relationships. Raw or cosmetic geometric primitives without semantic context are prohibited in core layer representations.
*Rationale: CANVAS is not a generic drawing application; its primary value lies in translating human vibe and visual gestures into structured, context-rich spatial entities.*

### II. Layer-Isolated Geospatial Architecture
The drawing canvas MUST operate on a layered architecture anchored to a geographical base map. Every layer MUST maintain strict isolation, support independent visibility/ordering/serialization, and reference standardized geospatial coordinate systems (defaulting to WGS84 / EPSG:4326 coordinates projected to EPSG:3857 for web visualization). Direct cross-layer mutations are prohibited; inter-layer communication MUST occur through explicit event brokers or state providers.
*Rationale: High-fidelity mapping and multi-domain spatial analysis demand modularity, preventing state corruption across independent thematic and data layers.*

### III. Extensible Plugin & MCP Integration
Support for custom layers, specialized drawing semantics, and domain-specific object generators MUST be implemented through modular AI skill plugins or Model Context Protocol (MCP) servers. External integrations MUST adhere strictly to typed schema contracts, execute within defined permission boundaries, and implement graceful degradation paths when remote skills or servers are unreachable.
*Rationale: The platform must evolve organically across diverse industries without bloating core drawing engine logic.*

### IV. Test-First Quality & Contract Verification (NON-NEGOTIABLE)
Test-Driven Development (TDD) is mandatory across all modules. Automated unit tests for coordinate transformations, multimodal intent parsers, and drawing primitive generators MUST be committed before implementation. Any change touching inter-layer contracts, MCP integration interfaces, or project serialization schemas MUST include automated integration tests.
*Rationale: Multimodal AI parsing and geospatial transformations are susceptible to subtle drift and regressions; comprehensive tests ensure spatial accuracy and system stability.*

### V. Observability, Performance & Simplicity
All multimodal translation pipelines, plugin invocations, and layer transformations MUST emit structured telemetry and maintain human-readable text/JSON debug logs. The interactive sketching loop MUST deliver responsive user feedback (targeting ≤ 16ms frame rendering and ≤ 200ms latency for streaming vibe intent resolution). Architectural additions MUST prioritize simplicity and avoid premature optimization (YAGNI).
*Rationale: Real-time visual sketchers require uncompromised responsiveness, while AI-driven workflows require transparency for debugging and auditing.*

## Technical Constraints & Standards

CANVAS enforces the following technical baselines:
- **Geospatial Standards**: All spatial data structures MUST comply with OGC standards and GeoJSON specifications. Coordinates MUST be validated for projection fidelity before persisting to layer storage.
- **Protocol Standards**: Integrations with MCP servers MUST adhere to the Model Context Protocol specification over standard transports with strict JSON-RPC validation.
- **Serialization**: Canvas state, layer hierarchies, and entity metadata MUST be fully serializable to deterministic, schema-versioned JSON.
- **Dependency Management**: Core engine libraries MUST remain decoupled from UI frameworks and specific mapping renderers to ensure embeddability and testability.

## Development Workflow & Quality Gates

Development in CANVAS adheres to the Spec Kit governance lifecycle:
- **Specification First**: Features MUST have an approved specification and implementation plan created via the Spec Kit workflow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`) before feature code is merged.
- **Testing Gates**: Pull requests MUST pass all test suites (unit, integration, contract) with zero test failures and no regression in test coverage.
- **Linting & Code Standards**: All code MUST satisfy strict static analysis and linting rules before review.
- **Review Compliance**: Code reviews MUST explicitly verify that proposed changes uphold the core principles, specifically verifying semantic entity modeling and layer isolation.

## Governance

This Constitution serves as the authoritative governing standard for the CANVAS project:
- **Constitutional Supremacy**: In any conflict between ad-hoc engineering practices and this document, the Constitution supersedes.
- **Amendment Procedure**: Amendments require an explicit RFC pull request detailing rationale, affected systems, and backward compatibility impact. Approval from project maintainers is required before merging.
- **Versioning Policy**: This Constitution adheres to semantic versioning (`MAJOR.MINOR.PATCH`):
  - **MAJOR**: Removals or breaking redefinitions of core principles or governance rules.
  - **MINOR**: Addition of new principles, sections, or materially expanded architectural requirements.
  - **PATCH**: Non-semantic clarifications, wording improvements, and formatting refinements.
- **Compliance Monitoring**: Active feature plans and tasks MUST validate compliance against this Constitution at every phase of implementation.

**Version**: 1.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
