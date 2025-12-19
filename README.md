<p align="center">
  <br>
  <a href="https://docmd.mgks.dev">
    <img src="https://github.com/mgks/docmd/blob/main/src/assets/images/docmd-logo-light.png?raw=true" alt="docmd logo" width="200" />
  </a>
</p>

<p align="center">
  <b>The minimalist, zero-config documentation generator for Node.js developers.</b>
  <br>
  Turn Markdown into beautiful, blazing-fast websites in seconds.
  <br>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/v/@mgks/docmd.svg?style=flat-square&color=007acc" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/dt/@mgks/docmd.svg?style=flat-square&color=success" alt="npm downloads"></a>
  <a href="https://github.com/mgks/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mgks/docmd.svg?style=flat-square&color=blue" alt="license"></a>
  <a href="https://github.com/mgks/docmd/stargazers"><img src="https://img.shields.io/github/stars/mgks/docmd?style=flat-square&logo=github" alt="stars"></a>
</p>

<p align="center">
  <a href="https://docmd.mgks.dev"><b>View Live Demo</b></a> • 
  <a href="https://docmd.mgks.dev/getting-started/installation/"><b>Documentation</b></a> • 
  <a href="https://github.com/mgks/docmd/issues"><b>Report Bug</b></a>
</p>

<br>

<p align="center">
  <img width="2856" height="1558" alt="519536477-8d948e18-8e2d-420d-8902-96e1aafab1ba-modified" src="https://docmd.mgks.dev/assets/images/preview-dark-welcome.png" />
  <sup><i>docmd noStyle page preview in dark mode</i></sup>
</p>

## 🚀 Why docmd?

Most documentation tools today are too heavy (React hydration, massive bundles) or require ecosystems you don't use (Python/Ruby).

**docmd** fills the gap. It is a native Node.js tool that generates **pure, static HTML**.

*   ⚡ **Blazing Fast:** No hydration delay. Instant page loads.
*   🔍 **Offline Search:** Powerful full-text search included automatically.
*   🛠 **Zero Config:** Works out of the box with sensible defaults.
*   🎨 **Theming:** Built-in light/dark modes and multiple themes (`sky`, `ruby`, `retro`).
*   📦 **Node.js Native:** No Python, no Gemfiles. Just `npm install`.
*   🧩 **Rich Content:** Built-in support for Callouts, Cards, Tabs, Steps, and Changelogs.

## 🏁 Quick Start

You don't need to install anything globally to try it out.

```bash
# 1. Initialize a new project
npx @mgks/docmd init my-docs

# 2. Enter directory
cd my-docs

# 3. Start the dev server
npm start
```

**Dev server output:**

```
                       
     _                 _ 
   _| |___ ___ _____ _| |
  | . | . |  _|     | . |
  |___|___|___|_|_|_|___|
  
   v0.x.x


🚀 Performing initial build for dev server...
✅ Generated sitemap at ./site/sitemap.xml
✅ Initial build complete.
👀 Watching for changes in:
    - Source: ./docs
    - Config: ./docmd.config.js
    - Assets: ./assets
    - docmd Templates: ./src/templates (internal)
    - docmd Assets: ./src/assets (internal)
🎉 Dev server started at http://localhost:3000
Serving content from: ./site
Live reload is active. Browser will refresh automatically when files change.
```

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **Markdown First** | Standard Markdown + Frontmatter. No proprietary syntax to learn. |
| **Smart CLI** | Intelligent config validation catches typos before they break your build. |
| **Custom Containers** | Use `::: callout`, `::: card`, `::: steps`, `::: tabs`, `::: collapsible`, `::: changelog`, and more to enrich content. |
| **Smart Search** | Built-in, offline-capable full-text search with fuzzy matching and highlighting. No API keys required. |
| **Diagrams** | Create flowcharts, relationship diagrams, journey, piecharts, graphs, timelines and more with Mermaid. |
| **No-Style Pages** | Create custom landing pages (highly customizable custom HTML pages) without theme constraints. |
| **Auto Dark Mode** | Respects system preference and saves user choice. |
| **Plugins** | SEO, Sitemap, and Analytics support included out-of-the-box. |

## 🆚 Comparison

How does `docmd` stack up against the giants?

| Feature | docmd | Docusaurus | MkDocs (Material) | Mintlify |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | **Node.js** | React.js | Python | Proprietary |
| **Output** | **Static HTML** | React SPA | Static HTML | Hosted / Next.js |
| **JS Payload** | **Tiny (< 15kb)** | Heavy | Minimal | Medium |
| **Setup** | **~2 mins** | ~15 mins | ~10 mins | Instant (SaaS) |
| **Cost** | **100% Free OSS** | 100% Free OSS | 100% Free OSS | Freemium |

👉 *[Read the full comparison](https://docmd.mgks.dev/comparison/)*

## 📦 Installation

For frequent use, install globally:

```bash
npm install -g @mgks/docmd
```

### Commands

*   `docmd init` - Create a new documentation project.
*   `docmd dev` - Start the live-reloading local server.
*   `docmd build` - Generate static files to `site/` for deployment.

## 🎨 Themes

Switching themes is as easy as changing one line in your `docmd.config.js`.

```javascript
module.exports = {
  theme: {
    name: 'sky', // Options: 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'dark'
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contribution Guidelines](.github/CONTRIBUTING.md) for details.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## ❤️ Support

This project is open source and free to use. If you find it valuable, please consider:

1.  ⭐️ **Starring the repo** on GitHub (it helps a lot!)
2.  ☕ **[Sponsoring the project](https://github.com/sponsors/mgks)** to support ongoing development.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

> **{ github.com/mgks }**
> 
> ![Website Badge](https://img.shields.io/badge/Visit-mgks.dev-blue?style=flat&link=https%3A%2F%2Fmgks.dev) ![Sponsor Badge](https://img.shields.io/badge/%20%20Become%20a%20Sponsor%20%20-red?style=flat&logo=github&link=https%3A%2F%2Fgithub.com%2Fsponsors%2Fmgks)