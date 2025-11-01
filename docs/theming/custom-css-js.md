---
title: "Custom Styles & Scripts"
description: "Learn how to add your own custom CSS and JavaScript to your docmd site for advanced customization."
---

# Custom Styles & Scripts

While `docmd` themes provide a solid foundation, you can further tailor the appearance and behavior of your site by injecting custom CSS and JavaScript files. This is configured in your config file.

## Custom CSS

You can add one or more custom CSS files using the `theme.customCss` array in your config file.

```javascript
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

> **Note:** For information on how to manage your custom asset files (CSS, JS, images), see the [Assets Management](/theming/assets-management/) documentation.

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

You can add one or more custom JavaScript files using the top-level `customJs` array in your config file.

```javascript
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

**Use Cases for Custom JS:**
*   Adding interactive elements (e.g., custom modals, tabs not provided by `docmd`).
*   Integrating third-party services or widgets.
*   Performing custom DOM manipulations after the page loads.
*   Adding simple analytics or tracking snippets if not using a built-in plugin.

By using `customCss` and `customJs`, you have significant flexibility to extend and personalize your `docmd` site beyond the standard theming options.