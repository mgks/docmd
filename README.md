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

## Installation and Usage

**Prerequisites:** [Node.js](https://nodejs.org/) (version 22.x or higher) is required.

### Global Installation (Recommended)

This is the recommended approach for developers who will use `docmd` across multiple projects. It makes the `docmd` command available system-wide.

**1. Install Globally:**
```bash
npm install -g @mgks/docmd
```

**2. Basic Workflow:**
Once installed, you can use the `docmd` command directly in any project folder.

*   **Initialize a Project:**
    ```bash
    # This creates docs/, docmd.config.js, and a sample index.md
    docmd init
    ```

*   **Start the Dev Server:**
    ```bash
    # Starts a live-reloading server at http://localhost:3000
    docmd dev
    ```

*   **Build for Production:**
    ```bash
    # Generates the static site into the `site/` directory
    docmd build
    ```

### Quick Start (Alternative)

If you prefer not to install packages globally, you can use `npx` to run `docmd` on-demand. This is a great way to try it out or use it in a single project.

1.  **Create and Initialize Your Project:**
    This command will download the latest version, create a `my-docs` folder, and set up the project files inside it.
    ```bash
    npx @mgks/docmd init my-docs
    ```

2.  **Start the Development Server:**
    Navigate into your new project and use `npx` again to start the server.
    ```bash
    cd my-docs
    npx @mgks/docmd dev
    ```

Your new documentation site is now running at `http://localhost:3000`.

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