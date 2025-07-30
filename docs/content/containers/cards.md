---
title: "Container: Cards"
description: "How to use cards to group related content into visually distinct blocks with an optional title."
---

# Cards

Cards provide a visually distinct block for grouping related content. They are a versatile component that can be used for feature overviews, summaries, or linking to other sections.

## Usage

The `card` container can be used with or without a title.

::: callout info
Container blocks (like `::: card`) should be preceded by a blank line to ensure proper parsing by the markdown processor.
:::

**Syntax:**
```markdown
::: card Optional Card Title
The main body content of the card.
Supports **Markdown** formatting.
:::
```
-   `Optional Card Title`: If you provide text after `card`, it becomes the title of the card.

---

## Examples

### Card with a Title

This is the most common use case, where the card has a clear heading.

**Code:**
```markdown
::: card My Feature Overview
This card describes an amazing feature.
* It's easy to use.
* It solves a common problem.

Learn more by reading the full guide.
:::
```

**Rendered Preview:**
::: card My Feature Overview
This card describes an amazing feature.
* It's easy to use.
* It solves a common problem.

Learn more by reading the full guide.
:::

### Card without a Title

If you omit the title, the content starts directly. This is ideal for small, self-contained snippets or quotes.

**Code:**
```markdown
::: card
This is a card without an explicit title. The content starts directly, which is great for simple, focused information.
:::
```

**Rendered Preview:**
::: card
This is a card without an explicit title. The content starts directly, which is great for simple, focused information.
:::

### Nesting Content in Cards

Cards are great for composition. You can easily place other elements, like buttons, inside a card to create a call to action.

**Code:**
```markdown
::: card Download the App
Get the latest version for your platform and start building today.

::: button Learn_More #customization
::: button View_GitHub external:https://github.com/mgks/docmd color:#5865f2
:::
```

**Rendered Preview:**

::: card Download the App
Get the latest version for your platform and start building today.

::: button Learn_More #customization
::: button View_GitHub external:https://github.com/mgks/docmd color:#5865f2

:::