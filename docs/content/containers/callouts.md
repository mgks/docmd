---
title: "Container: Callouts"
description: "How to use callouts to highlight important information, warnings, tips, or notes in your documentation."
---

# Callouts

Callouts are perfect for drawing the user's attention to a specific piece of information. They are visually distinct from the regular text and are ideal for tips, warnings, and important notes.

## Usage

The basic syntax uses the `callout` container name, followed by the callout type.

::: callout info
Container blocks (like `::: callout`) should be preceded by a blank line to ensure proper parsing by the markdown processor.
:::

**Syntax:**
```markdown
::: callout type
The main content of the callout.
:::
```

**With Custom Title:**
```markdown
::: callout type Custom Title Here
The main content of the callout.
:::
```

**Parameters:**
*   `type`: The type determines the color and styling of the callout. Available types are: `info`, `tip`, `warning`, `danger`, `success`.
*   `Custom Title Here` (optional): Any text following the type becomes the callout title.

::: callout info Auto Emojis
Some themes (like Sky) automatically add emojis to callout titles: ℹ️ for info, ⚠️ for warning, 💡 for tip, 🚨 for danger, and ✅ for success.
:::

---

## Examples

### Info

Use the `info` type for general notes or neutral supplementary details.

**Code:**
```markdown
::: callout info
This is an informational message. It's great for providing context or background information that is helpful but not critical.
:::
```

**Rendered Preview:**
::: callout info
This is an informational message. It's great for providing context or background information that is helpful but not critical.
:::

**With Custom Title:**
```markdown
::: callout info Quick Reference
This callout has a custom title that appears prominently at the top.
:::
```

**Rendered Preview:**
::: callout info Quick Reference
This callout has a custom title that appears prominently at the top.
:::

### Tip

Use the `tip` type for helpful tips, best practices, or suggestions.

**Code:**
```markdown
::: callout tip
Here's a helpful tip to improve your workflow. Using this shortcut can save you a lot of time!
:::
```

**Rendered Preview:**
::: callout tip
Here's a helpful tip to improve your workflow. Using this shortcut can save you a lot of time!
:::

**With Custom Title:**
```markdown
::: callout tip Pro Tip
Custom titles help organize your callouts and make them more scannable for readers.
:::
```

**Rendered Preview:**
::: callout tip Pro Tip
Custom titles help organize your callouts and make them more scannable for readers.
:::

### Warning

Use the `warning` type to indicate something that requires caution or might lead to unexpected results.

**Code:**
```markdown
::: callout warning
**Heads up!** Changing this setting can have unintended side effects. Please make sure you understand the consequences before proceeding.
:::
```

**Rendered Preview:**
::: callout warning
**Heads up!** Changing this setting can have unintended side effects. Please make sure you understand the consequences before proceeding.
:::

### Danger

Use the `danger` type for critical information, destructive actions, or security warnings.

**Code:**
```markdown
::: callout danger
**Critical!** This action is irreversible and will result in permanent data loss. Do not proceed unless you have a backup.
:::
```

**Rendered Preview:**
::: callout danger
**Critical!** This action is irreversible and will result in permanent data loss. Do not proceed unless you have a backup.
:::

## All Callout Types with Titles

Here's a quick reference showing all available callout types with custom titles:

::: callout info Documentation Note
Use info callouts for neutral supplementary information.
:::

::: callout tip Best Practice
Use tip callouts for helpful suggestions and best practices.
:::

::: callout warning Important
Use warning callouts for actions that require caution.
:::

::: callout danger Critical Alert
Use danger callouts for destructive actions or critical warnings.
:::

::: callout success Task Complete
Use success callouts to indicate completed tasks or positive outcomes.
:::