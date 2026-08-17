---
title: "Mermaid Offline Preview"
description: "Demonstrating offline-ready Mermaid diagram rendering in docmd 0.9.3."
---

# Mermaid Diagrams Preview

In docmd 0.9.3 ([Issue #198](https://github.com/docmd-io/docmd/issues/198)), the Mermaid plugin bundles its engine assets locally into `assets/js/init-mermaid.js` rather than loading from external CDNs, making diagrams 100% functional in **offline builds** (`--offline`) and air-gapped deployments.

## Architecture Workflow

```mermaid
flowchart LR
    A[Markdown Source] -->|Parser Engine| B[AST & Tokens]
    B -->|OpenAPI Plugin| C[Rendered Schema Tables & Examples]
    B -->|Mermaid Plugin| D[Offline Bundled SVG Visuals]
    C & D -->|Generator| E[Production Static HTML]
```

## Interactive Architecture Diagram

::: mermaid "System Architecture" icon=layers align=center
graph TD
    Client["Browser / Offline Consumer"]
    Core["@docmd/core Generator"]
    Parser["@docmd/parser (Normalized URLs)"]
    OpenAPI["@docmd/plugin-openapi (Examples & Schemas)"]
    Mermaid["@docmd/plugin-mermaid (Offline Assets)"]

    Client --> Core
    Core --> Parser
    Core --> OpenAPI
    Core --> Mermaid
:::

## Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer
    participant CLI as docmd CLI
    participant Engine as Build Engine
    participant Browser as Static Site (Offline/Air-gapped)

    User->>CLI: docmd build --offline
    CLI->>Engine: Resolve plugins & assets
    Engine->>Engine: Bundle Mermaid locally into assets/
    Engine->>Browser: Emit portable file:// HTML + local assets
    Browser-->>User: Instant interactive diagrams without network access
```