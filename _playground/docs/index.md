---
title: "docmd 0.9.3 Preview Playground"
description: "Interactive showcase for docmd 0.9.3 features and bug fixes."
---

# docmd 0.9.3 Preview Playground

Welcome to the manual integration playground for **docmd 0.9.3**. This environment showcases the latest release features, enhancements, and bug fixes:

---

## What's New in 0.9.3

::: card title="OpenAPI Spec Enhancements" icon="file-code"
Full support for OpenAPI 3.0 examples, nested object sub-tables, schema `$ref`/`allOf` composition, status code bodies, and field-level inline examples.

[Explore OpenAPI Preview →](./openapi-preview.md)
:::

::: card title:"Offline / Air-Gapped Mermaid" icon:"git-merge"
Self-contained Mermaid.js diagram bundling without external CDN runtime dependencies — completely operational in air-gapped environments and `--offline` builds.

[Explore Mermaid Preview →](./mermaid-preview.md)
:::

::: card title="URL Sanitization & Normalization" icon="link"
Enhanced `sanitizeUrl` in `@docmd/parser` collapses leading `//` runs while preserving genuine URL schemes, ensuring seamless same-site workspace project switching and file:// resolution.
:::

---

## Local Commands

To start the local playground dev server:

```sh
pnpm dev
```

To produce a production static build into `site/`:

```sh
pnpm build
```