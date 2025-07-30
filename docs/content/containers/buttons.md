---
title: "Container: Buttons"
description: "How to create stylish, clickable buttons within your documentation for calls to action."
---

# Buttons

The `button` container allows you to easily create a stylish, clickable button. It's perfect for calls to action, such as linking to a download page, an external resource, or another section of your documentation.

## Usage

The button container is a self-contained component. You provide its text, URL, and an optional color as arguments.

::: callout info Important Notes
- Container blocks (like `::: button`) should be preceded by a blank line to ensure proper parsing by the markdown processor.
:::

**Syntax:**
```markdown
::: button Button_Text /path/to/link [color:#hexcode]
::: button Button_Text external:/external-url [color:#hexcode]
```

-   **`Button_Text`**: The text to display on the button. Use underscores (`_`) for spaces.
-   **`/path/to/link`**: The URL the button should link to. For internal links, use relative paths.
-   **`external:/external-url`**: For external links that should open in a new tab, prefix the URL with `external:`.
-   **`[color:#hexcode]`**: (Optional) A custom background color for the button. If omitted, it will use the theme's default link color.

---

## Examples

### Standard Internal Button

This button will use the default theme color and link to a section on the current page.

**Code:**
```markdown
::: button View_Examples #examples
```

**Rendered Preview:**
::: button View_Examples #examples

### External Link Button

External links open in a new tab for better user experience.

**Code:**
```markdown
::: button GitHub_Repository external:https://github.com/mgks/docmd
```

**Rendered Preview:**
::: button GitHub_Repository external:https://github.com/mgks/docmd

### Button with Custom Color

You can easily override the color for emphasis.

**Code:**
```markdown
::: button Getting_Started #getting-started color:#28a745
```

**Rendered Preview:**
::: button Getting_Started #getting-started color:#28a745

### Buttons Inside Other Containers

Buttons are flexible and can be placed inside other containers, like cards or callouts, to create powerful components. This nesting is now reliable.

**Code:**

```markdown
::: card Feature Announcement
Our latest feature is now available! Read the full documentation to learn more about how it works.
::: button Read_More /path/to/feature/docs/
:::
```

**Rendered Preview:**

::: card Feature Announcement
Our latest feature is now available! Read the full documentation to learn more about how it works.

::: button Learn_More #customization
:::