---
title: "Configuration"
description: "Detailed explanation of all options available in the docmd config.js file, including logo, theming, plugins, and more."
---

# Configuration (`config.js`)

`docmd` uses a `config.js` file in the root of your documentation project to control various aspects of your site. This file should export a JavaScript object containing your configuration options.

## Example `config.js` Structure:

```javascript
// config.js
module.exports = {
  siteTitle: 'My Awesome Project Docs',
  logo: {
    light: '/assets/images/logo-light.svg', // Path to logo for light mode
    dark: '/assets/images/logo-dark.svg',   // Path to logo for dark mode
    alt: 'My Project Logo',                 // Alt text for the logo
    // href: '/',                           // Optional: link for the logo, defaults to site root
    // height: '30px',                      // Optional: specify height via CSS is often better
  },
  srcDir: 'docs',
  outputDir: 'site',

  theme: {
    name: 'default',        // Name of the built-in theme to use (e.g., 'default', 'classic')
    defaultMode: 'light',   // 'light' or 'dark'
    enableModeToggle: true, // Show UI button to toggle light/dark modes
    customCss: [            // Array of paths to your custom CSS files
      // '/css/override-styles.css', // Paths are relative to the outputDir root
    ],
    // options: { /* Future: theme-specific options */ }
  },

  customJs: [               // Array of paths to your custom JS files
    // '/js/extra-functionality.js', // Loaded at the end of the body
  ],

  plugins: [
    // Example: Enable built-in SEO enhancements
    // ['seo', {
    //   defaultDescription: 'A fantastic site about interesting things.',
    //   openGraph: { defaultImage: '/assets/images/og-social-default.png' },
    //   twitter: { cardType: 'summary_large_image', siteUsername: '@MyProject' }
    // }],

    // Example: Enable Google Analytics (Universal Analytics)
    // ['analytics-google-ua', { trackingId: 'UA-XXXXXXXXX-Y' }],

    // Example: Enable Google Analytics 4
    // ['analytics-google-v4', { measurementId: 'G-XXXXXXXXXX' }],
  ],

  navigation: [
    { title: 'Home', path: '/', icon: 'home' }, // Icon names correspond to SVGs
    {
      title: 'Guides',
      icon: 'book-open',
      children: [
        { title: 'Installation', path: '/guides/installation', icon: 'download' },
        { title: 'Project GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true }
      ],
    },
  ],
  footer: '© ' + new Date().getFullYear() + ' My Project. Made with [docmd](https://github.com/mgks/docmd).',
  favicon: '/assets/favicon.ico', // Path relative to outputDir root
};
```

## Top-Level Options

### `siteTitle`
*   **Type:** `String`
*   **Required:** Yes
*   **Description:** The main title for your documentation site. Used as a fallback if no logo is provided, in the HTML `<title>` tag, and potentially by plugins (e.g., SEO).
*   **Example:** `siteTitle: 'My Product Documentation'`

### `logo`
*   **Type:** `Object`
*   **Optional**
*   **Description:** Configures a logo to be displayed in the site header/sidebar, typically replacing or complementing the `siteTitle` text.
*   **Properties:**
    *   `light` (String, Required if using logo): Path to the logo image file for light mode. Path should be relative to the `outputDir` root (e.g., `/assets/images/logo-light.svg`).
    *   `dark` (String, Required if using logo): Path to the logo image file for dark mode.
    *   `alt` (String, Required if using logo): Alternative text for the logo image (for accessibility).
    *   `href` (String, Optional): The URL the logo should link to. Defaults to the site root (`/`).
    *   `height` (String, Optional): Suggested height for the logo (e.g., `'30px'`, `'2rem'`). It's often better to control size via CSS for more flexibility.
*   **Note:** Ensure your logo image files are copied to the specified paths within your `outputDir` during the build. Usually, this means placing them in an assets folder that `docmd` copies.

### `srcDir`
*   **Type:** `String`
*   **Default:** `'docs'`
*   **Description:** Directory containing your Markdown source files.

### `outputDir`
*   **Type:** `String`
*   **Default:** `'site'`
*   **Description:** Directory where the static site will be generated.

## `theme` (Object)

Configures the visual theme of your site.

### `theme.name`
*   **Type:** `String`
*   **Default:** `'default'`
*   **Description:** Specifies which built-in `docmd` theme to use. Future versions may offer multiple themes like `'classic'`, `'minimalist-pro'`. Each theme would correspond to a CSS file (e.g., `theme-default.css`).
*   **See Also:** [Available Themes](/theming/available-themes/)

### `theme.defaultMode`
*   **Type:** `String`
*   **Default:** `'light'`
*   **Values:** `'light'` or `'dark'`
*   **Description:** Sets the default color mode (light or dark) for the site.

### `theme.enableModeToggle`
*   **Type:** `Boolean`
*   **Default:** `true` (assuming it's now a core feature)
*   **Description:** If `true`, a UI toggle button will be displayed allowing users to switch between light and dark modes. Their preference is typically saved in `localStorage`.

### `theme.customCss`
*   **Type:** `Array` of `String`
*   **Default:** `[]` (empty array)
*   **Description:** An array of paths to your custom CSS files. These files will be linked in the `<head>` of every page *after* the main theme CSS, allowing you to override or extend styles.
*   **Paths:** Should be relative to the `outputDir` root (e.g., `'/css/my-styles.css'`). You are responsible for ensuring these files exist at the specified location in your final `site/` output (e.g., by placing them in an assets folder that `docmd` copies, or in your project's static assets if your `srcDir` is part of a larger project).
*   **Example:** `customCss: ['/assets/css/custom-branding.css']`

### `theme.options` (Future Placeholder)
*   **Type:** `Object`
*   **Description:** A placeholder for theme-specific configuration options if a theme (`theme.name`) exposes its own settings (e.g., primary color, font choices for a more advanced theme).

## `customJs` (Array of String)
*   **Type:** `Array` of `String`
*   **Default:** `[]`
*   **Description:** An array of paths to your custom JavaScript files. These files will be included as `<script>` tags just before the closing `</body>` tag on every page.
*   **Paths:** Should be relative to the `outputDir` root (e.g., `'/js/my-analytics-alternative.js'`).
*   **Example:** `customJs: ['/assets/js/interactive-component.js']`

## `plugins` (Array)
*   **Type:** `Array`
*   **Default:** `[]`
*   **Description:** An array to configure and enable plugins. `docmd` will ship with some core "local" plugins (like SEO and Analytics) that you can enable here. Future versions might support third-party plugins.
*   **Format:** Each item in the array is typically another array: `['plugin-name', { pluginOptions }]` or a direct `require()` for local project plugins (advanced usage).
*   **Built-in Plugin Examples:**
    *   `['seo', { defaultDescription: '...', openGraph: { ... }, ... }]`
    *   `['analytics-google-ua', { trackingId: 'UA-...' }]`
    *   `['analytics-google-v4', { measurementId: 'G-...' }]`
*   **See Also:** [Plugins](/plugins/)

## `navigation` (Array of Objects)
*   **Description:** Defines the sidebar navigation. (Content mostly same as before, but add the `icon` property explanation).
*   **Navigation Item Properties:**
    *   `title` (String, Required)
    *   `path` (String, Required for direct links)
    *   `children` (Array, Optional)
    *   `icon` (String, Optional): The name of an SVG icon to display next to the navigation item. `docmd` will look for an SVG file named `icon-name.svg` in its bundled assets (e.g., `home` for `home.svg`). Ensure the chosen icon name corresponds to an available SVG. See [Theming > Icons](/theming/icons/) for more details.
    *   `external` (Boolean, Optional): If set to `true`, the `path` is treated as an absolute external URL and the link will open in a new tab (`target="_blank"`). Defaults to `false`.

## `footer` (String, Optional)
*   **Description:** Custom footer text (Markdown supported).

## `favicon` (String, Optional)
*   **Description:** Path to your favicon file, relative to `outputDir` root.

This file needs significant detail for each new option, explaining its purpose, type, default value, and how to use it with examples.