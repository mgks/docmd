---
title: "Custom CSS & JS"
description: "Learn how to add your own custom CSS and JavaScript to your docmd site for advanced customization."
---

# Custom Styles & Scripts

While `docmd` themes provide a solid foundation, you can further tailor the appearance and behavior of your site by injecting custom CSS and JavaScript files. This is configured in your `config.js` file.

## Custom CSS

You can add one or more custom CSS files using the `theme.customCss` array in your `config.js`.

```javascript
// config.js
module.exports = {
  // ...
  theme: {
    name: 'default',
    // ...
    customCss: [
      '/assets/css/my-branding.css', // Path relative to your site's root
      '/css/another-stylesheet.css'
    ],
  },
  // ...
};
```

**How it works:**
*   Each string in the `customCss` array should be an absolute path from the root of your generated `site/` directory (e.g., if your file is `site/assets/css/my-branding.css`, the path is `/assets/css/my-branding.css`).
*   These `<link rel="stylesheet">` tags will be added to the `<head>` of every page *after* the main theme CSS and `highlight.js` CSS. This allows your custom styles to override the default theme styles.
*   You are responsible for ensuring these CSS files exist at the specified locations in your final `site/` output. Typically, you would:
    1.  Create your custom CSS files (e.g., `my-branding.css`).
    2.  Place them in a folder within your project (e.g., `my-project/static-assets/css/`).
    3.  Ensure that this folder (or its contents) is copied to the correct location in your `site/` directory during `docmd`'s asset copying process. If `docmd` copies a top-level `assets/` folder from your source, place them there.

## Managing Custom Assets

By default, `docmd` will always update assets to the latest version when you run `build` or `dev` commands. This ensures your site benefits from the latest improvements and fixes.

### Customizing Default Assets

If you want to customize default assets (like theme CSS files or scripts):

1. First, build your site normally to generate all assets:
   ```bash
   docmd build
   ```

2. Modify the generated files in the `site/assets` directory as needed.

3. When rebuilding, use the `--preserve` flag to keep your customized files:
   ```bash
   docmd build --preserve
   ```

This approach allows you to:
- Always get the latest assets when you want them (default behavior)
- Preserve your customizations when needed (with `--preserve`)
- Easily see which files are being preserved during the build process

The `--preserve` flag works with both `build` and `dev` commands:
```bash
# Preserve custom assets during development
docmd dev --preserve
```

**Use Cases for Custom CSS:**
*   **Overriding CSS Variables:** The `default` theme uses CSS variables extensively. You can redefine these in your custom CSS.
    ```css
    /* my-branding.css */
    :root { /* Light mode overrides */
      --primary-color: #D65A31; /* Example: Change primary color */
      --font-family-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --text-color: #222;
    }

    body[data-theme="dark"] { /* Dark mode overrides */
      --primary-color: #E87A5A;
      --bg-color: #121212;
      --text-color: #ddd;
    }
    ```
*   **Styling Custom Components:** Add styles for specific elements or components unique to your documentation.
*   **Fine-tuning Layout:** Make minor adjustments to spacing, sizing, or layout elements.

## Custom JavaScript

You can add one or more custom JavaScript files using the top-level `customJs` array in your `config.js`.

```javascript
// config.js
module.exports = {
  // ...
  customJs: [
    '/assets/js/my-interactive-script.js', // Path relative to your site's root
    '/js/third-party-integration.js'
  ],
  // ...
};
```

**How it works:**
*   Each string in the `customJs` array should be an absolute path from the root of your generated `site/` directory.
*   These `<script src="..."></script>` tags will be added just before the closing `</body>` tag on every page. This ensures the DOM is loaded before your scripts run and is generally better for page performance.
*   Similar to custom CSS, you are responsible for ensuring these JavaScript files exist at the specified locations in your final `site/` output.

**Use Cases for Custom JS:**
*   Adding interactive elements (e.g., custom modals, tabs not provided by `docmd`).
*   Integrating third-party services or widgets.
*   Performing custom DOM manipulations after the page loads.
*   Adding simple analytics or tracking snippets if not using a built-in plugin.

By using `customCss` and `customJs`, you have significant flexibility to extend and personalize your `docmd` site beyond the standard theming options.