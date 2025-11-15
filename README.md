<p align="center">
  <img src="https://github.com/mgks/docmd/blob/main/src/assets/images/docmd-logo.png" alt="docmd logo" width="70" />
  <br />
  <img src="https://github.com/mgks/docmd/blob/main/src/assets/images/docmd-logo-light.png" alt="docmd dark logo" width="180" />
</p>

<p align="center">
  <b>Generate beautiful, lightweight static documentation sites from Markdown files.</b>
  <br>Zero clutter, just content.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/v/@mgks/docmd.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/d18m/@mgks/docmd.svg" alt="npm downloads"></a>
  <a href="https://github.com/mgks/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mgks/docmd.svg" alt="license"></a>
</p>

Docmd is a Node.js command-line tool for generating fast, beautiful, and lightweight static documentation sites from standard Markdown files. It champions the philosophy of "zero clutter, just content," prioritizing a simple authoring experience and a clean, performant result for readers.

**:rocket: [Live Preview](https://docmd.mgks.dev): Official documentation site powered by `docmd`.**

## Key Features

-   **Markdown First:** Write your content in standard Markdown with simple YAML frontmatter.
-   **Beautiful Themes:** Comes with multiple built-in themes (`sky`, `ruby`, `retro`) and automatic light/dark mode support.
-   **Fast & Lightweight:** Blazing fast static site generation with a minimal client-side footprint.
-   **Rich Content:** Go beyond basic Markdown with custom components like callouts, cards, steps, tabs, and Mermaid diagrams.
-   **Built-in Plugins:** SEO meta tags, sitemap, and analytics are all included out-of-the-box.
-   **No-Style Pages:** Create completely custom pages (like landing pages) with full control over the HTML.
-   **Customizable:** Easily extend or override styles with your own CSS and JavaScript.
-   **Simple CLI:** A straightforward workflow with three main commands: `init`, `dev`, and `build`.
-   **Deploy Anywhere:** The generated `site/` folder can be hosted on any static web host (GitHub Pages, Netlify, Vercel, etc.).

## Installation
**Prerequisites:** [Node.js](https://nodejs.org/) (version 22.x or higher)

### Quick Start: Your First Site in 60 Seconds

No global installation is required. You can create and run your site in a new folder with one command.

```bash
# Create a new project in 'my-docs' and navigate into it
npx @mgks/docmd init my-docs && cd my-docs

# Start the development server
npm start
```

Your new documentation site is now running at `http://localhost:3000` *(or, at your selected or available port)*.

### Global Installation

For frequent use, or if you prefer to have the command available system-wide, you can install `docmd` globally using npm.

```bash
npm install -g @mgks/docmd
```
After installation, you can run the `docmd` commands from any directory.

### Basic Workflow

1.  **Initialize a Project:**
    ```bash
    docmd init
    ```
    This creates a `docs/` directory, a `docmd.config.js` file, and a sample `index.md` to get you started.

2.  **Start the Dev Server:**
    ```bash
    docmd dev
    ```
    This starts a live-reloading server to preview your site as you write.

3.  **Build for Production:**
    ```bash
    docmd build
    ```
    This generates the complete, optimized static site into the `site/` directory, ready for deployment.

## Documentation

For a complete guide covering all features, including theming, custom containers, and plugin configuration, please visit the official documentation website: **[docmd.mgks.dev](https://docmd.mgks.dev)**.

## Contributing

We welcome contributions of all kinds! Whether it's reporting a bug, suggesting a feature, or submitting a pull request, your help is appreciated.

1.  Fork the repository.
2.  Clone your fork: `git clone https://github.com/YOUR_USERNAME/docmd.git`
3.  Install dependencies: `npm install`
4.  Make your changes and test them thoroughly.
5.  Submit a pull request to the `main` branch.

Please check our [contributing guidelines](https://docmd.mgks.dev/contributing/) for more detailed information.

## Support the Project

If you find `docmd` useful, please consider:

-   Starring the repository on GitHub.
-   Sharing it with others who might benefit.
-   Reporting issues or submitting pull requests.

❤️ **[GitHub Sponsors](https://github.com/sponsors/mgks): Become a sponsor to support the ongoing development of `docmd`.**

## License

Docmd is licensed under the [MIT License](https://github.com/mgks/docmd/blob/main/LICENSE).