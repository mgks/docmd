---
title: "No-Style Pages"
description: "Create custom standalone pages with minimal styling and only the components you need."
---

# No-Style Pages

docmd offers a "no-style" page format that gives you maximum flexibility to create custom standalone pages while still leveraging the docmd infrastructure. This is perfect for creating:

- Landing pages with custom layouts
- Welcome pages with unique designs
- Single-page websites
- Special marketing pages
- Any page that needs a completely custom design

## How It Works

To create a no-style page, add `noStyle: true` to your page's frontmatter. This tells docmd to use a special template that only includes the components you explicitly request.

By default, a no-style page will render just your content with minimal HTML structure. **All components are disabled by default** and must be explicitly enabled via the `components` object in frontmatter.

> **Note:** This behavior changed in v0.2.0. Previously, some components were enabled by default and had to be disabled. Now all components are opt-in only.

## HTML Support

No-style pages fully support raw HTML content without any escaping or processing. You can write pure HTML in your markdown files, and it will be rendered exactly as written. This gives you complete control over the page structure and design.

Unlike regular markdown pages, where HTML might be processed or escaped, no-style pages treat your content as raw HTML, making them perfect for custom layouts and designs.

## Basic Example

Here's a minimal example of a no-style page:

```yaml
---
title: "Welcome"
description: "Welcome to my project"
noStyle: true
components:
  meta: true  # Include meta tags, title, description
  # css: false  # Not needed - CSS is disabled by default
---

<div style="text-align: center; padding: 50px;">
  <h1>Welcome to My Project</h1>
  <p>This is a completely custom page with only the components I need.</p>
  <a href="/docs/" class="button">View Documentation</a>
</div>
```

## Available Components

You can control exactly which components are included in your page by setting them to `true` in the `components` object. **All components are disabled by default** and must be explicitly enabled:

| Component | Description | Required Setting |
|-----------|-------------|------------------|
| `meta` | Meta tags, title, description | `meta: true` |
| `siteTitle` | Include site title after page title | `siteTitle: true` |
| `favicon` | Include favicon | `favicon: true` |
| `css` | Include main CSS | `css: true` |
| `highlight` | Include syntax highlighting CSS | `highlight: true` |
| `theme` | Include theme-specific CSS | `theme: true` |
| `themeMode` | Include theme mode toggle functionality | `themeMode: true` |
| `customCss` | Include custom CSS files from config | `customCss: true` |
| `pluginStyles` | Include plugin-specific CSS | `pluginStyles: true` |
| `pluginHeadScripts` | Include plugin scripts in head | `pluginHeadScripts: true` |
| `layout` | Use main content layout (`true`, `'full'`, or `false`) | `layout: true` or `layout: 'full'` |
| `sidebar` | Include sidebar | `sidebar: true` |
| `header` | Include page header | `header: true` |
| `pageTitle` | Include page title in header | `pageTitle: true` |
| `footer` | Include page footer | `footer: true` |
| `branding` | Include docmd branding in footer | `branding: true` |
| `logo` | Include logo in sidebar | `logo: true` |
| `navigation` | Include navigation in sidebar | `navigation: true` |
| `themeToggle` | Include theme toggle button | `themeToggle: true` |
| `toc` | Include table of contents | `toc: true` |
| `scripts` | Enable script loading (required for other script components) | `scripts: true` |
| `mainScripts` | Include main JavaScript (copy code, theme toggle, etc.) | `mainScripts: true` |
| `lightbox` | Include image lightbox functionality | `lightbox: true` |
| `customJs` | Include custom JS files from config | `customJs: true` |
| `pluginBodyScripts` | Include plugin scripts at end of body | `pluginBodyScripts: true` |

## Layout Options

The `components.layout` property has three possible values:

- `false` (default): No layout wrapper, just your raw content
- `true`: Use the main content layout with optional header and footer
- `'full'`: Same as `true`, a full layout with content area

## Script Components

Script components work in a hierarchical manner:

1. **`scripts: true`** - Enables script loading (required for all other script components)
2. **`mainScripts: true`** - Includes main JavaScript functionality (copy code, theme toggle, etc.)
3. **`lightbox: true`** - Includes image lightbox functionality (requires `mainScripts: true`)

**Example:**
```yaml
components:
  scripts: true      # Enable script loading
  mainScripts: true  # Include main JavaScript
  lightbox: true     # Include lightbox (requires mainScripts)
```

## Sidebar Option

If you set `components.sidebar: true`, the sidebar will be included with optional logo, navigation, and theme toggle button.

## Custom HTML in Head and Body

You can also include custom HTML in the head and body sections:

```yaml
---
title: "Custom Page"
noStyle: true
customHead: |
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Roboto', sans-serif; }
  </style>
customScripts: |
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Page loaded!');
    });
  </script>
bodyClass: "landing-page"
---
```

## Complete Example

Here's a more complete example of a landing page:

```yaml
---
title: "My Project"
description: "A powerful tool for developers"
noStyle: true
components:
  meta: true
  favicon: true
  css: true
  theme: true
  themeMode: true
  layout: true
  header: true
  pageTitle: true
  footer: true
  branding: true
  scripts: true
  mainScripts: true
  lightbox: true
customHead: |
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; }
    .hero { text-align: center; padding: 80px 20px; }
    .cta-button { display: inline-block; padding: 12px 24px; background: #4a6cf7; color: white; 
                 text-decoration: none; border-radius: 4px; font-weight: 600; }
  </style>
bodyClass: "landing-page"
---

<div class="hero">
  <h1>Welcome to My Project</h1>
  <p>A powerful tool that helps developers build amazing things.</p>
  <a href="/docs/" class="cta-button">Get Started</a>
</div>

<div class="features">
  <div class="feature">
    <h2>Easy to Use</h2>
    <p>Simple API and clear documentation make it easy to get started.</p>
  </div>
  <div class="feature">
    <h2>Powerful</h2>
    <p>Advanced features for when you need them.</p>
  </div>
  <div class="feature">
    <h2>Flexible</h2>
    <p>Adapt to your workflow, not the other way around.</p>
  </div>
</div>
```

## HTML and Markdown Mixed Content

No-style pages support both HTML and Markdown content. You can freely mix them in your page:

```markdown
---
title: "Mixed Content"
noStyle: true
components:
  meta: true
  css: true
---

<div style="text-align: center">
  <h1>My Custom Page</h1>
</div>

## Regular Markdown Heading

This is regular **Markdown** content that will be processed normally.

<div class="custom-section">
  <h3>HTML Section</h3>
  <p>This is HTML content within the page.</p>
</div>

- Markdown list item 1
- Markdown list item 2
```

## Best Practices

1. Start with minimal components and add only what you need
2. Use the `customHead` property for page-specific styles
3. Consider creating a separate CSS file for your custom pages
4. Test your page in both light and dark modes if using theme support
5. Remember that no-style pages still benefit from docmd's plugins (SEO, analytics, etc.) 