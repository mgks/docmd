---
title: "Available Themes"
description: "An overview of the built-in themes provided by docmd."
---

# Available Themes

`docmd` allows you to choose from a selection of built-in themes to quickly change the overall look and feel of your documentation site. You can specify the theme in your config file using the `theme.name` property.

```javascript
module.exports = {
  // ...
  theme: {
    name: 'theme-name', // Options: 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'light', // or 'dark' to set as landing mode
    // ...
  },
  // ...
};
```

## 1. `default` Theme

*   **`theme.name: 'default'`**
*   **Description:** The foundation of all docmd themes. This is not a separate theme but the base styling that's always included regardless of which theme you select. It provides:
    *   Basic layout structure with sidebar and content area
    *   Essential typography and spacing
    *   Core styling for documentation elements like code blocks, tables, and custom containers
    *   Light and dark mode foundation
*   **When to use:** When you want a minimalist, clean interface without additional styling layers. This is the most lightweight option.

## 2. `sky` Theme

*   **`theme.name: 'sky'`** (This is the default if `theme.name` is not specified)
*   **Description:** A modern theme inspired by popular documentation platforms, with a fresh and airy design. It features:
    *   A clean, minimalist interface with subtle shadows and rounded corners
    *   Custom typography with improved readability
    *   Refined color palette for both light and dark modes
    *   Enhanced callout and container styles
    *   Premium documentation feel with careful attention to spacing and contrast
*   **When to use:** When you want a premium, polished look for your documentation site.

## 3. `ruby` Theme

*   **`theme.name: 'ruby'`**
*   **Description:** An elegant, vibrant theme inspired by the precious gemstone. It features:
    *   Rich, jewel-toned color palette centered around ruby reds and complementary colors
    *   Sophisticated typography with serif headings and sans-serif body text
    *   Distinctive card and callout designs with gem-like faceted styling
    *   Subtle gradients and depth effects that evoke the brilliance of gemstones
    *   Luxurious dark mode with deep, rich backgrounds and vibrant accent colors
*   **When to use:** When you want your documentation to have a distinctive, premium feel with rich colors and elegant typography.

## 4. `retro` Theme

*   **`theme.name: 'retro'`**
*   **Description:** A nostalgic theme inspired by 1980s-90s computing aesthetics. It features:
    *   Terminal-style black backgrounds with phosphor green text in dark mode
    *   Light mode with dark green text on light gray backgrounds
    *   Monospace typography (Fira Code) for authentic retro feel
    *   Neon accent colors (cyan, pink, amber) with glow effects
    *   Animated scanlines and CRT flicker effects
    *   Terminal-style code blocks with `[TERMINAL]` labels
    *   Retro-styled containers with pixel-art inspired elements
    *   Blinking cursor effects on links and active elements
*   **When to use:** Perfect for developer tools, gaming documentation, tech blogs with vintage computing focus, or anyone wanting a unique, eye-catching retro aesthetic.

## How Themes Work

Each theme consists of CSS files located within `docmd`'s internal assets. When you select a theme name, `docmd` links the corresponding stylesheet in your site's HTML:

- `default` theme uses the base CSS with no additional theme stylesheet
- `sky` theme loads `docmd-theme-sky.css` with its custom styling on top of the default CSS
- `ruby` theme loads `docmd-theme-ruby.css` with its custom styling on top of the default CSS
- `retro` theme loads `docmd-theme-retro.css` with its custom styling on top of the default CSS

You can further customize any chosen theme using the `theme.customCss` option in your config file to add your own overrides or additional styles. See [Custom CSS & JS](/theming/custom-css-js/) for details.