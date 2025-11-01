---
title: "Assets Management"
description: "Learn how to manage and customize your assets (CSS, JavaScript, images) in your docmd site."
---

# Assets Management

Managing your custom assets (CSS, JavaScript, images) is an important part of customizing your documentation site. `docmd` provides flexible ways to include and manage these assets.

## Project Structure

When you initialize a new project with `docmd init`, it creates the following structure:

```
your-project/
├── assets/           # User assets directory
│   ├── css/          # Custom CSS files
│   ├── js/           # Custom JavaScript files
│   └── images/       # Custom images
├── docs/             # Markdown content
├── docmd.config.js
└── ...
```

This structure makes it easy to organize and manage your custom assets.

## How Assets Are Handled

There are two main ways to manage assets in your docmd site:

### 1. Root-Level Assets Directory (Recommended)

The simplest and recommended approach is to use the `assets/` directory in your project root:

**How it works:**
- During the build process, docmd automatically copies everything from your root `assets/` directory to the output `site/assets/` directory
- Your custom assets take precedence over docmd's built-in assets with the same name
- This approach is ideal for GitHub Pages deployments and other hosting scenarios

**Example workflow:**
1. Create or modify files in your project's `assets/` directory:
   ```
   assets/css/custom-styles.css
   assets/js/interactive-features.js
   assets/images/logo.png
   ```

2. Reference these files in your config file:
   ```javascript
   module.exports = {
     // ...
     theme: {
       // ...
       customCss: [
         '/assets/css/custom-styles.css',
       ],
     },
     customJs: [
       '/assets/js/interactive-features.js',
     ],
     // ...
   };
   ```

3. Use images in your Markdown content:
   ```markdown
   ![Logo](/assets/images/logo.png)
   ```

4. Build your site:
   ```bash
   docmd build
   ```

### 2. Customizing Default Assets

If you want to modify docmd's default assets:

1. First, build your site normally to generate all assets:
   ```bash
   docmd build
   ```

2. Modify the generated files in the `site/assets` directory as needed.

3. When rebuilding, use the `--preserve` flag to keep your customized files:
   ```bash
   docmd build --preserve
   ```

4. If you want to update to the latest docmd assets (for example, after updating the package), run without the preserve flag:
   ```bash
   docmd build
   ```

This approach allows you to:
- Get the latest assets by default when you update the package
- Preserve your customizations when needed with `--preserve`
- See which files are being preserved during the build process

The preservation behavior works with both `build` and `dev` commands:
```bash
# Preserve custom assets during development
docmd dev --preserve
```

## Asset Precedence

When multiple assets with the same name exist, docmd follows this precedence order:

1. **User assets** from the root `assets/` directory (highest priority)
2. **Preserved assets** from previous builds (if `--preserve` is enabled, which is the default)
3. **Built-in assets** from the docmd package (lowest priority)

This ensures your custom assets always take precedence over default ones.

## GitHub Pages Deployment

When deploying to GitHub Pages, your assets structure is preserved. If you're using a custom domain or GitHub Pages URL, make sure your asset paths are correctly configured.

For more information on deployment, see the [Deployment](/deployment/) documentation.

## Related Topics

- [Custom CSS & JS](/theming/custom-css-js/) - Learn how to configure custom CSS and JavaScript
- [Theming](/theming/) - Explore other theming options for your documentation site