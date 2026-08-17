---
title: "OpenAPI 0.9.3 Preview"
description: "Demonstrating OpenAPI plugin improvements including examples, nested sub-tables, and allOf resolution."
---

# OpenAPI 3.0 Specifications Preview

This page previews the new **OpenAPI plugin enhancements** in docmd 0.9.3 ([PR #200](https://github.com/docmd-io/docmd/pull/200) / [Issue #199](https://github.com/docmd-io/docmd/issues/199)):

- **Rich Schema Expansion**: Recursive `$ref` resolution and `allOf` schema flattening with merged properties and required constraints.
- **Nested Object Sub-tables**: Embedded `<details class="oa-nested-schema">` tables to inspect complex object trees without leaving the page.
- **Examples Display**: Full body response/request example sections as well as per-field inline examples.
- **Response Details**: Clean collapsible response body inspection attached directly to status badges.

```openapi
./sample-spec.json
```
