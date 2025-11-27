---
title: "Container: Changelogs"
description: "Create a beautiful, timeline-style version history for your project."
---

# Changelog Container

The `changelog` container allows you to present version history and release notes in a clean, timeline layout. It separates metadata (dates/versions) from the narrative content, making it easy for users to scan updates.

## Usage

The changelog container uses a specific syntax where entries are separated by `==` markers.

::: callout info
Container blocks (like `::: changelog`) should be preceded by a blank line.
:::

**Syntax:**
```markdown
::: changelog

== Version/Date String
Content for this version.
Supports **Markdown**, lists, and other containers.

== Next Version/Date String
Content for the next version.

:::
```

**`==`**: This marker denotes the start of a new entry. Everything after `==` on the same line is treated as the "Date" or "Version" badge on the left side of the timeline.

---

## Examples

### Basic Version History

**Code:**
```markdown
::: changelog

== v2.0.0 (2025-01-15)
### Major Update 🚀
We completely rewrote the core engine for better performance.

*   Added new plugin system
*   Improved build speed by 50%

== v1.1.0 (2024-12-01)
### Feature Drop
Added support for custom themes and dark mode.

== v1.0.0 (2024-11-10)
Initial public release.
:::
```

**Rendered Preview:**

::: changelog

== v2.0.0 (2025-01-15)
### Major Update 🚀
We completely rewrote the core engine for better performance.

*   Added new plugin system
*   Improved build speed by 50%

== v1.1.0 (2024-12-01)
### Feature Drop
Added support for custom themes and dark mode.

== v1.0.0 (2024-11-10)
Initial public release.
:::

### Changelog with Nested Elements

You can put anything inside a changelog entry, including callouts and code blocks.

**Code:**
````markdown
::: changelog

== v3.0.0-beta
### The Future is Here

::: callout warning Breaking Changes
This release changes the config format. Please update your `docmd.config.js`.
:::

**New Config Example:**
```javascript
module.exports = {
  version: 3,
  // ...
}
```

== v2.5.0
Maintenance release with bug fixes.
:::
````

**Rendered Preview:**

::: changelog

== v3.0.0-beta
### The Future is Here

::: callout warning Breaking Changes
This release changes the config format. Please update your `docmd.config.js`.
:::

**New Config Example:**
```javascript
module.exports = {
  version: 3,
  // ...
}
```

== v2.5.0
Maintenance release with bug fixes.
:::