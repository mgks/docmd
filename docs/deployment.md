---
title: "Deployment"
description: "Learn how to deploy your docmd-generated static site to various hosting platforms, including GitHub Pages."
---

# Deploying Your docmd Site

Once you've built your documentation site using `docmd build`, the entire static site is generated into the `site/` directory (or your configured `outputDir`). This `site/` directory contains all the HTML, CSS, JavaScript, and assets needed, making it deployable to any static hosting service.

## Building for Production

Before deployment, ensure you build your site in production mode:

```bash
docmd build
```

This generates optimized HTML, CSS, and assets ready for production use. In production, `docmd` may:
- Minify CSS and JavaScript assets (future feature)
- Optimize HTML output

## Deployment Options

Since `docmd` generates a standard static site, you can use any static hosting service. Here are some popular options:

### GitHub Pages

GitHub Pages is a popular and free way to host static sites directly from your GitHub repository. `docmd` sites are perfectly suited for this.

#### Option 1: Deploy from a Branch

1. **Push your source files and built site to GitHub.**
2. **Go to your repository settings.**
3. **Navigate to the "Pages" section.**
4. **Under "Source", select the branch and directory where your built site is located.**

The simplest approach is to choose one of:

*   **Built site in the `docs/` folder on the main branch:**
    *   Configure `docmd`'s `outputDir` to be `docs` in your `config.js` (e.g., `outputDir: 'docs'`).
    *   Select "Deploy from a branch" → "main" → "/docs"
    
If you set `outputDir: 'docs'`, your `config.js` for `docmd` itself (when building its own docs) would look like:

```javascript
// config.js for docmd's own docs, deploying from /docs on main
module.exports = {
  siteTitle: 'docmd Docs',
  srcDir: 'documentation', // Assuming actual source MD files are NOT in the output 'docs'
  outputDir: 'docs',
  // ... other config ...
};
```

#### Option 2: GitHub Actions (Recommended)

The most robust and automated way to deploy to GitHub Pages is using a GitHub Actions workflow. This workflow will run `docmd build` and then deploy the resulting `site/` directory.

Create a file at `.github/workflows/deploy-docs.yml` with the following content:

```yaml
name: Deploy docmd docs to Pages

on:
  # Run on pushes to main branch
  push:
    branches: ["main"]
  # Allows manual workflow trigger from Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20' # Or the Node.js version docmd supports/requires
          cache: 'npm'
      - name: Install docmd (globally or from devDependencies)
        # If docmd is a dev dependency of the project being documented:
        # run: npm ci && npm run build:docs # Assuming 'build:docs' script runs 'docmd build'
        # If installing docmd globally for this action:
        run: npm install -g docmd # Or your scoped package name e.g. @mgks/docmd
      - name: Build site with docmd
        run: docmd build # Assumes config.js is in the root and correctly points to srcDir/outputDir
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          # This should be your outputDir path
          path: './site' # or './docs' if you set outputDir: 'docs'
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

Then:
1.  **Enable GitHub Pages in your repository settings**, selecting "GitHub Actions" as the source.
2.  **Push the workflow file to your repository**.
3.  On the next push to `main` (or if you manually trigger the workflow), the Action will run, build your `docmd` site, and deploy it. The URL will be something like `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.

### Other Hosting Options

* **Netlify, Vercel, Cloudflare Pages** - Upload or connect your Git repository and set the build command to your npm script that runs `docmd build`.
* **Any Web Server** - Simply upload the contents of the `site/` directory to any web server that can serve static files.

By following these guidelines, you can easily get your `docmd`-powered documentation online and accessible to your users.