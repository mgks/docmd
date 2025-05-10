---
title: "Available Themes"
description: "An overview of the built-in themes provided by docmd."
---

# Available Themes

`docmd` allows you to choose from a selection of built-in themes to quickly change the overall look and feel of your documentation site. You can specify the theme in your `config.js` file using the `theme.name` property.

## 1. `default` Theme

*   **`theme.name: 'default'`** (This is the default if `theme.name` is not specified)
*   **Description:** The standard `docmd` theme. It's designed to be clean, modern, responsive, and highly readable. It features:
    *   A collapsible sidebar for navigation.
    *   Support for light and dark color modes.
    *   Clear typography optimized for documentation.
    *   Well-styled custom containers (callouts, cards, steps).
    *   Effective syntax highlighting for code blocks.
*   **When to use:** A great general-purpose theme suitable for most documentation projects.

```javascript
// config.js
module.exports = {
  // ...
  theme: {
    name: 'default',
    defaultMode: 'light',
    // ...
  },
  // ...
};
```

## 2. `sky` Theme

*   **`theme.name: 'sky'`**
*   **Description:** A modern theme inspired by popular documentation platforms, with a fresh and airy design. It features:
    *   A clean, minimalist interface with subtle shadows and rounded corners.
    *   Custom typography with improved readability.
    *   Refined color palette for both light and dark modes.
    *   Enhanced callout and container styles.
    *   Premium documentation feel with careful attention to spacing and contrast.
*   **When to use:** When you want a premium, polished look for your documentation site.

```javascript
// config.js
module.exports = {
  // ...
  theme: {
    name: 'sky',
    defaultMode: 'light', // or 'dark'
    // ...
  },
  // ...
};
```

## Light and Dark Mode

All themes support both light and dark color modes. You can set the default mode using the `theme.defaultMode` property and enable a toggle button with `theme.enableModeToggle`:

```javascript
// config.js
module.exports = {
  // ...
  theme: {
    name: 'sky', // or 'default'
    defaultMode: 'dark', // Start in dark mode
    enableModeToggle: true, // Show a toggle button in the sidebar
    // ...
  },
  // ...
};
```

Users can switch between modes using the toggle button in the sidebar, and their preference will be saved in localStorage for future visits.

## How Themes Work

Each theme consists of CSS files located within `docmd`'s internal assets. When you select a theme name, `docmd` links the corresponding stylesheet in your site's HTML:

- `default` theme uses the base CSS with no additional theme stylesheet
- `sky` theme loads `theme-sky.css` with its custom styling

You can further customize any chosen theme using the `theme.customCss` option in your `config.js` to add your own overrides or additional styles. See [Custom CSS & JS](/theming/custom-css-js/) for details.