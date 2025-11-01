---
title: "Light & Dark Mode"
description: "How to configure and manage light and dark themes in your docmd documentation."
---

# Light & Dark Mode

`docmd` provides built-in support for light and dark color schemes to enhance readability and user experience. Users can choose their preferred viewing mode, which improves accessibility and reduces eye strain in different lighting conditions.

## Setting the Default Theme

You can set the default theme for your site in the config file:

```javascript
module.exports = {
  // ... other config ...
  theme: {
    name: 'default', // or 'sky', 'ruby', 'retro'
    defaultMode: 'dark', // Can be 'light' or 'dark'
    enableModeToggle: true, // Enable the toggle button in the UI
    positionMode: 'bottom', // 'top' or 'bottom' - where to show the toggle
  },
  // ...
};
```

* `defaultMode: 'light'`: The site will initially render with the light color scheme.
* `defaultMode: 'dark'`: The site will initially render with the dark color scheme.
* `enableModeToggle: true`: Shows a toggle button for users to switch modes.
* `positionMode: 'bottom'`: Places the toggle button at the bottom of the sidebar (default).
* `positionMode: 'top'`: Places the toggle button in the page header (top right).

If `defaultMode` is not specified, it defaults to `'light'`.

## How It Works

The theme is controlled by a `data-theme` attribute on the `<body>` tag of your HTML pages:
* `<body data-theme="light">` for light mode.
* `<body data-theme="dark">` for dark mode.

For the `sky` theme, the values would be `sky-light` and `sky-dark`.

CSS variables in the theme files define colors, backgrounds, fonts, etc., for both modes:

```css
/* Example from main.css */
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  /* ... other light theme variables ... */
}

body[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  /* ... other dark theme variables ... */
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

## User Preference Toggle

When `enableModeToggle` is set to `true`, a toggle button appears that allows users to switch between light and dark modes. The position of this button is controlled by the `positionMode` setting:

```javascript
theme: {
  defaultMode: 'light',
  enableModeToggle: true, // Shows the toggle button
  positionMode: 'bottom', // 'bottom' (sidebar) or 'top' (header)
},
```

### Toggle Button Positions

- **`positionMode: 'bottom'`** (default): The toggle button appears at the bottom of the sidebar
- **`positionMode: 'top'`**: The toggle button appears in the page header (top right corner)

The toggle button uses Lucide icons (`sun` and `moon`) to indicate the current mode and what will happen when clicked.

### User Preference Persistence

When a user selects a theme, their preference is saved in their browser's `localStorage` so it persists across sessions and page loads. The implementation uses the following logic:

1. Check if the user has a saved preference in `localStorage`
2. If not, use the `defaultMode` from the configuration
3. When the user clicks the toggle button, update both the display and the stored preference

## Syntax Highlighting Themes

`docmd` also includes separate stylesheets for code block syntax highlighting that are compatible with light and dark modes:

* `highlight-light.css` for light mode
* `highlight-dark.css` for dark mode

The correct syntax highlighting theme is loaded automatically based on the current theme mode. When the user toggles the mode, the appropriate syntax highlighting theme is also switched dynamically.

## Customizing Theme Colors

You can customize the colors for both light and dark modes by adding custom CSS to your project. See [Custom CSS & JS](/theming/custom-css-js/) for more information.

```css
/* Example of overriding theme colors in your custom CSS */
:root {
  --link-color: #0077cc; /* Custom link color for light mode */
}

body[data-theme="dark"] {
  --link-color: #4da6ff; /* Custom link color for dark mode */
}
```