---
title: "Container: Collapsible"
description: "Create accordion-style toggleable sections for FAQs, spoilers, or advanced details."
---

# Collapsible Container

The `collapsible` container creates an accordion-style block that can be toggled open or closed. This is perfect for FAQs, "spoiler" content, or hiding complex details that aren't immediately necessary.

## Usage

The syntax allows you to define the title and the default state (open or closed).

**Syntax:**
```markdown
::: collapsible [open] Title Text Here
The hidden content goes here.
:::
```

-   **`open`**: (Optional) If included, the section will be expanded by default on page load.
-   **`Title Text Here`**: The text displayed on the clickable bar. If omitted, it defaults to "Click to expand".

---

## Examples

### Basic Collapsible (Closed by Default)

Use this for content that should be hidden initially, like lengthy code examples or optional details.

**Code:**
```markdown
::: collapsible View Advanced Configuration
Here are the advanced settings for power users:
*   `memory_limit`: Set the max heap size.
*   `threads`: Number of worker threads.
:::
```

**Rendered Preview:**

::: collapsible View Advanced Configuration
Here are the advanced settings for power users:
*   `memory_limit`: Set the max heap size.
*   `threads`: Number of worker threads.
:::

### Default Open

Use the `open` keyword if you want the content visible but capable of being tucked away.

**Code:**
```markdown
::: collapsible open Important Notice
This content is visible immediately but can be collapsed if it takes up too much space.
:::
```

**Rendered Preview:**

::: collapsible open Important Notice
This content is visible immediately but can be collapsed if it takes up too much space.
:::

### FAQ Pattern

Collapsibles are ideal for Frequently Asked Questions.

**Code:**
```markdown
::: collapsible Is docmd free to use?
**Yes!** docmd is 100% open-source and free under the MIT license.
:::

::: collapsible Can I host it on GitHub Pages?
Absolutely. The `build` command generates static HTML files that work perfectly on GitHub Pages, Netlify, or Vercel.
:::
```

**Rendered Preview:**

::: collapsible Is docmd free to use?
**Yes!** docmd is 100% open-source and free under the MIT license.
:::

::: collapsible Can I host it on GitHub Pages?
Absolutely. The `build` command generates static HTML files that work perfectly on GitHub Pages, Netlify, or Vercel.
:::