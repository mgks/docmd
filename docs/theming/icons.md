---
title: "Using Icons"
description: "How to use Lucide icons in your docmd site navigation and content."
---

# Using Icons

`docmd` allows you to add visual flair and improve navigation clarity with SVG icons from the [Lucide icon library](https://lucide.dev/).

## Icons in Navigation

You can specify an icon for each navigation item (including parent categories) in your config file using the `icon` property:

```javascript
// ...
navigation: [
  { title: 'Home', path: '/', icon: 'home' },
  {
    title: 'User Guides',
    icon: 'book-open', // Icon for the category
    children: [
      { title: 'Installation', path: '/user-guides/installation', icon: 'download' },
      { title: 'First Steps', path: '/user-guides/first-steps', icon: 'footprints' },
    ]
  },
  { title: 'API Reference', path: '/api-reference', icon: 'code' }
]
// ...
```

**How it Works:**
* The `icon` value (e.g., `'home'`, `'book-open'`) uses kebab-case notation that maps to Lucide icon names.
* During build, `docmd` converts these names to the appropriate Lucide icon SVGs.
* The navigation template renders these icons inline for optimal performance.

## Available Icons

`docmd` uses the [Lucide](https://lucide.dev/) icon library, which provides a comprehensive set of beautiful, consistent open-source icons.

To see all available icons and their names:
1. Visit the [Lucide Icons Gallery](https://lucide.dev/icons/)
2. When you find an icon you want to use, note its name (shown below each icon)
3. Use the kebab-case version of the name in your config (e.g., `arrow-up-right` instead of `ArrowUpRight`)

**Common Icon Examples:**
* Navigation: `home`, `book-open`, `file-text`, `settings`, `users`
* Actions: `download`, `upload-cloud`, `play`, `external-link`
* UI Elements: `sun`, `moon`, `menu`, `x`, `search`
* Indicators: `alert-circle`, `check-circle`, `info`
* Directional: `chevron-right`, `chevron-down`, `arrow-left`

## Icon Styling

Lucide icons in `docmd` are styled using CSS. They are rendered as inline SVGs with appropriate classes for targeting:

```css
/* Example styling for navigation icons */
.sidebar-nav .lucide-icon {
  width: 1.2em;
  height: 1.2em;
  margin-right: 0.5em;
  vertical-align: middle;
  stroke-width: 2px; /* Adjust line thickness */
  stroke: currentColor; /* Use current text color */
}

/* Example of targeting a specific icon */
.sidebar-nav .icon-home {
  color: #3498db; /* Blue color for home icon */
}
```

The icons have the following CSS classes you can target:
- `.lucide-icon` - Applied to all Lucide icons
- `.icon-{name}` - Applied to specific icons, e.g., `.icon-home`

You can add these styles to your custom CSS file specified in `theme.customCss` in your configuration.

## Using Icons in Content

To use icons directly in your Markdown content, you'll need to use HTML with inline SVGs. You can copy SVG code directly from the [Lucide website](https://lucide.dev/) and paste it into your Markdown.

```html
<!-- Example of inline SVG in Markdown -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info">
  <circle cx="12" cy="12" r="10"></circle>
  <path d="M12 16v-4"></path>
  <path d="M12 8h.01"></path>
</svg> This is a note with an info icon.
```

A future version of `docmd` might provide shortcodes or other simplified ways to use icons directly in Markdown content.