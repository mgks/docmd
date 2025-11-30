---
title: "Configuration"
description: "Detailed explanation of all options available in the docmd config file, including logo, theming, plugins, and more."
---

# Configuration (`docmd.config.js`)

`docmd` uses a `docmd.config.js` file in the root of your project... For backward compatibility, it will fall back to using `config.js` if `docmd.config.js` is not found.

## Example `docmd.config.js` Structure:

```javascript
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

  search: true,

  sidebar: {
    collapsible: true,
    defaultCollapsed: false,
  },

  theme: {
    name: 'sky',
    defaultMode: 'light',
    enableModeToggle: true,
    positionMode: 'top', // 'top' or 'bottom'
    customCss: [            // Array of paths to your custom CSS files
      // '/css/override-styles.css', // Paths are relative to the outputDir root
    ],
    // options: { /* Future: theme-specific options */ }
  },

  customJs: [               // Array of paths to your custom JS files
    // '/js/extra-functionality.js', // Loaded at the end of the body
  ],

  autoTitleFromH1: true,
  copyCode: true,

  sponsor: {
    enabled: true,
    title: 'Sponsor the Project',
    link: 'https://github.com/sponsors/mgks',
  },

  plugins: {
    // SEO Plugin Configuration
    seo: {
      defaultDescription: 'A fantastic site about interesting things.',
      openGraph: { 
        defaultImage: '/assets/images/og-social-default.png'
      },
      twitter: { 
        cardType: 'summary_large_image', 
        siteUsername: '@MyProject' 
      }
    },

    // Google Analytics 4
    analytics: {
      googleV4: { 
        measurementId: 'G-XXXXXXXXXX' 
      }
    },
    
    // Sitemap generation
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
  },

  navigation: [
    { title: 'Home', path: '/', icon: 'home' }, // Icon names correspond to SVGs
    {
      title: 'Guides',
      icon: 'book-open',
      collapsible: true, // This makes the 'Guides' section collapsible
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

### `search`
*   **Type:** `Boolean`
*   **Default:** `true`
*   **Description:** Controls the visibility of the full-text search bar in the header and the generation of the search index. Set to `false` to disable search capabilities entirely.

## `minify`
*   **Type:** `Boolean`
*   **Optional**
*   **Default:** `true` when running `docmd build`, `false` when running `docmd dev`.
*   **Description:** Controls whether CSS and JavaScript assets are minified (compressed) during the build.
*   **Usage:** You can force this to `false` if you need to debug production builds.

### `autoTitleFromH1`
*   **Type:** `Boolean`
*   **Default:** `true`
*   **Description:** If `true`, `docmd` will automatically use the content of the first H1 tag (`# Title`) as the page title if no `title` is specified in the frontmatter. If set to `false` and a page has no `title` in its frontmatter, the page header will be hidden.
*   **Example:** 
    ```javascript
    // With autoTitleFromH1: true (default)
    // Markdown file with: # My Page Title
    // Will automatically set the page title to "My Page Title"
    
    // With autoTitleFromH1: false
    // You must explicitly set title in frontmatter:
    // ---
    // title: "My Page Title"
    // ---
    ```

### `copyCode`
* **Type:** `Boolean`
* **Default:** `true`
* **Description:** If `true`, a "Copy" button will be added to the top-right corner of all code blocks, allowing users to easily copy the code to their clipboard with a single click.

**Note:** This setting only applies to regular pages. For noStyle pages, copy code functionality must be explicitly enabled via the `components.mainScripts: true` setting.

## `sidebar` (Object)

Configures the behavior of the sidebar.

### `sidebar.collapsible`
*   **Type:** `Boolean`
*   **Default:** `false`
*   **Description:** If `true`, a toggle button is added to the header, allowing users to show or hide the sidebar. The user's preference is saved in `localStorage`.

### `sidebar.defaultCollapsed`
*   **Type:** `Boolean`
*   **Default:** `false`
*   **Description:** If `sidebar.collapsible` is `true`, this option sets the default state of the sidebar to collapsed. A user's saved preference will override this.

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

### `theme.positionMode`
*   **Type:** `String`
*   **Default:** `'bottom'`
*   **Values:** `'top'` or `'bottom'`
*   **Description:** Sets the position of the light/dark mode toggle button. `'top'` places it in the page header (top right), while `'bottom'` places it at the bottom of the sidebar.
*   **Example:** `positionMode: 'top'` - Useful for sites where you want the theme toggle to be more prominent and easily accessible.

### `theme.customCss`
*   **Type:** `Array` of `String`
*   **Default:** `[]` (empty array)
*   **Description:** An array of paths to your custom CSS files. These files will be linked in the `<head>` of every regular page *after* the main theme CSS, allowing you to override or extend styles. **Note:** For noStyle pages, custom CSS must be explicitly enabled via `components.customCss: true`.
*   **Paths:** Should be relative to the `outputDir` root (e.g., `'/css/my-styles.css'`). You are responsible for ensuring these files exist at the specified location in your final `site/` output (e.g., by placing them in an assets folder that `docmd` copies, or in your project's static assets if your `srcDir` is part of a larger project).
*   **Example:** `customCss: ['/assets/css/custom-branding.css']`

### `theme.options` (Future Placeholder)
*   **Type:** `Object`
*   **Description:** A placeholder for theme-specific configuration options if a theme (`theme.name`) exposes its own settings (e.g., primary color, font choices for a more advanced theme).

## `customJs` (Array of String)
*   **Type:** `Array` of `String`
*   **Default:** `[]`
*   **Description:** An array of paths to your custom JavaScript files. These files will be included as `<script>` tags just before the closing `</body>` tag on every regular page. **Note:** For noStyle pages, custom JavaScript must be explicitly enabled via `components.customJs: true`.
*   **Paths:** Should be relative to the `outputDir` root (e.g., `'/js/my-analytics-alternative.js'`).
*   **Example:** `customJs: ['/assets/js/interactive-component.js']`

## `plugins` (Object)
*   **Type:** `Object`
*   **Default:** `{}`
*   **Description:** An object to configure and enable plugins. `docmd` ships with core plugins like SEO, Analytics, and Sitemap that you can configure here.
*   **Format:** Each key in the object represents a plugin name, and its value is an object containing the plugin's configuration options.
*   **Built-in Plugin Examples:**
    *   `seo: { defaultDescription: '...', openGraph: { ... }, ... }`
    *   `analytics: { googleV4: { measurementId: 'G-XXXXXXXXXX' } }`
    *   `sitemap: { defaultChangefreq: 'weekly', defaultPriority: 0.8 }`
*   **See Also:** [Plugins](/plugins/)

## `editLink` (Object, Optional)
*   **Type:** `Object`
*   **Description:** Configures a link in the page footer that points to the source file on GitHub (or GitLab/Bitbucket), allowing users to propose changes.
*   **Properties:**
    *   `enabled` (Boolean): Set to `true` to show the link.
    *   `baseUrl` (String): The base URL to your repository's documentation source folder.
        *   *GitHub Example:* `https://github.com/USERNAME/REPO/edit/main/docs`
        *   *Note:* Do not include a trailing slash. `docmd` appends the file path automatically.
    *   `text` (String, Optional): The text to display. Defaults to "Edit this page".
*   **Example:**
    ```javascript
    editLink: {
      enabled: true,
      baseUrl: 'https://github.com/mgks/docmd/edit/main/docs',
      text: 'Edit on GitHub'
    }
    ```

## `navigation` (Array of Objects)
*   **Description:** Defines the sidebar navigation. (Content mostly same as before, but add the `icon` property explanation).
*   **Navigation Item Properties:**
    *   `title` (String, Required)
    *   `path` (String, Required for direct links)
    *   `children` (Array, Optional)
    *   `icon` (String, Optional): The name of an SVG icon to display next to the navigation item. `docmd` will look for an SVG file named `icon-name.svg` in its bundled assets (e.g., `home` for `home.svg`). Ensure the chosen icon name corresponds to an available SVG. See [Theming > Icons](/theming/icons/) for more details.
    *   `collapsible` (Boolean, Optional): If set to `true` on a parent item (an item with `children`), the item will become a collapsible accordion. It will be collapsed by default unless one of its children is the currently active page. User interactions (opening/closing) are saved in `sessionStorage`. Defaults to `false`.
    *   `external` (Boolean, Optional): If set to `true`, the `path` is treated as an absolute external URL and the link will open in a new tab (`target="_blank"`). Defaults to `false`.
    *   `collapsible` (Boolean, Optional): If set to `true` on a parent item (an item with `children`), the item will become a collapsible accordion. It will be collapsed by default unless one of its children is the currently active page. User interactions (opening/closing) are saved in `sessionStorage`. Defaults to `false`.

## `footer` (String, Optional)
*   **Description:** Custom footer text (Markdown supported). **Note:** For noStyle pages, the footer must be explicitly enabled via `components.footer: true`.

## `sponsor` (Object, Optional)
*   **Type:** `Object`
*   **Description:** Configures a sponsor ribbon that appears in the bottom-right corner of every regular page. **Note:** For noStyle pages, the sponsor ribbon must be explicitly enabled via `components.branding: true`.
*   **Properties:**
    *   `enabled` (Boolean, Optional): Whether to show the sponsor ribbon. Defaults to `true` if the sponsor object is provided.
    *   `title` (String, Optional): Text to display on the ribbon. Defaults to `'Sponsor the Project'`.
    *   `link` (String, Required if enabled): URL for the sponsor link. Should open in a new tab.
*   **Example:**
    ```javascript
    sponsor: {
      enabled: true,
      title: 'Sponsor the Project',
      link: 'https://github.com/sponsors/mgks'
    }
    ```
*   **Note:** The ribbon is positioned fixed in the bottom-right corner and includes a heart icon with a subtle animation.

## `favicon` (String, Optional)
*   **Description:** Path to your favicon file, relative to `outputDir` root. **Note:** For noStyle pages, the favicon must be explicitly enabled via `components.favicon: true`.

This file needs significant detail for each new option, explaining its purpose, type, default value, and how to use it with examples.