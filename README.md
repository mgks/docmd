<div align="center">

  <!-- PROJECT TITLE -->
  <h1>
    <img src="https://github.com/docmd-io/docmd/blob/main/src/assets/images/docmd-logo-dark.png?raw=true" alt="docmd logo" width="150" />
    <!-- docmd -->
  </h1>
  
  <!-- ONE LINE SUMMARY -->
  <p>
    <b>The minimalist, zero-config documentation generator.</b>
  </p>
  
  <!-- BADGES -->
  <p>
    <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/v/@mgks/docmd.svg?style=flat-square&color=d25353" alt="npm version"></a>
    <a href="https://github.com/docmd-io/docmd/commits/main/"><img src="https://img.shields.io/github/commit-activity/m/docmd-io/docmd?style=flat-square&color=38bd24" alt="commits"></a>
    <a href="https://www.npmjs.com/package/@mgks/docmd?activeTab=versions"><img src="https://img.shields.io/npm/dt/@mgks/docmd.svg?style=flat-square&color=38bd24" alt="downloads"></a>
    <a href="https://github.com/docmd-io/docmd/stargazers"><img src="https://img.shields.io/github/stars/docmd-io/docmd?style=flat-square&logo=github" alt="stars"></a>
    <a href="https://github.com/docmd-io/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/docmd-io/docmd.svg?style=flat-square&color=blue" alt="license"></a>
  </p>

  <!-- MENU -->
  <p>
    <h4>
      <a href="https://docmd.io">View Demo</a> • 
      <a href="https://docs.docmd.io/getting-started/installation/">Documentation</a> • 
      <a href="https://live.docmd.io">Live Editor</a> •
      <a href="https://github.com/docmd-io/docmd/issues">Report Bug</a>
    </h4>
  </p>

  <!-- PREVIEW -->
  <p>
    <img width="800" alt="docmd preview" src="https://github.com/user-attachments/assets/1a74d6f7-10f9-41fa-be8a-faeee278dbb9" />
    <br/>
    <sup><i>docmd noStyle page preview in light mode</i></sup>
  </p>

</div>

## Features

- **Zero Config**: Works out of the box with sensible defaults. Just `init` and go.
- **Blazing Fast**: Generates **pure, static HTML**. No React hydration lag, no heavy bundles.
- **Smart Search**: Built-in, **offline-capable** full-text search with fuzzy matching. No API keys required.
- **Isomorphic Core**: Runs anywhere, Node.js CLI, CI/CD pipelines, or **directly in the browser**.
- **Rich Content**: Built-in support for Callouts, Cards, Tabs, Steps, Changelogs, and Mermaid diagrams.
- **Theming**: Beautiful light/dark modes and multiple pre-built themes (`sky`, `ruby`, `retro`).

## Installation

```bash
npm install -g @mgks/docmd
```

## Usage

### CLI

The Command Line Interface is the primary way to interact with `docmd`.

```bash
docmd init      # Initialize a new project with config and assets
docmd dev       # Start a local development server with hot-reload
docmd build     # Generate a production-ready static site in ./site
docmd live      # Launch the browser-based Live Editor locally
```

### API

`docmd` exports its core engine, allowing you to build documentation programmatically within your own Node.js scripts or build tools.

```javascript
const { build, buildLive } = require('@mgks/docmd');

// Trigger a standard documentation build
await build('./docmd.config.js', { 
  isDev: false, 
  preserve: true 
});

// Trigger a Live Editor bundle build
await buildLive(); 
```

### Live Editor

`docmd` features a modular architecture that allows the core engine to run client-side. 

Running `docmd live` builds a standalone web application where you can write Markdown and see the preview instantly without any server-side processing. You can embed the generated `docmd-live.js` bundle to add Markdown capabilities to your own applications.

## Project Structure

`docmd` keeps it simple. Your content lives in `docs/`, your config in `docmd.config.js`.

```bash
my-docs/
├── docs/                  # Your Markdown files
│   ├── index.md           # Homepage
│   └── guide.md           # Content page
├── assets/                # Images and custom CSS
├── docmd.config.js        # Configuration
└── package.json
```

## Configuration

Customize your site in seconds via `docmd.config.js`:

```javascript
module.exports = {
  siteTitle: 'My Project',
  siteUrl: 'https://mysite.com',
  srcDir: 'docs',
  outputDir: 'site',
  
  // Theme Settings
  theme: {
    name: 'sky',           // 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'system', // 'light', 'dark', or 'system'
    enableModeToggle: true
  },
  
  // Sidebar Navigation
  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    { 
      title: 'Guide', 
      icon: 'book',
      children: [
        { title: 'Installation', path: '/guide/install' }
      ]
    }
  ],

  // Plugins
  plugins: {
    seo: { /* ... */ },
    sitemap: { /* ... */ }
  }
}
```

## Comparison

| Feature | docmd | Docusaurus | MkDocs | Mintlify |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | **Node.js** | React.js | Python | Proprietary |
| **Output** | **Static HTML** | React SPA | Static HTML | Hosted |
| **JS Payload** | **Tiny (< 15kb)** | Heavy | Minimal | Medium |
| **Search** | **Built-in (Offline)** | Algolia (Ext) | Built-in | Built-in |
| **Setup** | **~1 min** | ~15 mins | ~10 mins | Instant |
| **Cost** | **Free OSS** | Free OSS | Free OSS | Freemium |

## Community & Support

- **Contributing**: We welcome PRs! See [CONTRIBUTING.md](.github/CONTRIBUTING.md).
- **Support**: If you find `docmd` useful, please consider [sponsoring the project](https://github.com/sponsors/mgks) or giving it a star ⭐.

## License

Distributed under the MIT License. See `LICENSE` for more information.

> **{ github.com/mgks }**
> 
> ![Website Badge](https://img.shields.io/badge/Visit-mgks.dev-blue?style=flat&link=https%3A%2F%2Fmgks.dev) ![Sponsor Badge](https://img.shields.io/badge/%20%20Become%20a%20Sponsor%20%20-red?style=flat&logo=github&link=https%3A%2F%2Fgithub.com%2Fsponsors%2Fmgks)