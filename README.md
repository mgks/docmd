<div align="center">
  <a href="https://docmd.mgks.dev">
    <img src="https://github.com/mgks/docmd/blob/main/src/assets/images/docmd-logo-light.png?raw=true" alt="docmd logo" width="150" />
  </a>
  <p>
    <strong>The minimalist, zero-config documentation generator.</strong>
  </p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/v/@mgks/docmd.svg?style=flat-square&color=fc3b53" alt="npm version"></a>
<a href="https://github.com/mgks/docmd/commits"><img src="https://img.shields.io/github/commit-activity/m/mgks/docmd?style=flat-square&color=38bd24" alt="commits"></a>
  <a href="https://www.npmjs.com/package/@mgks/docmd"><img src="https://img.shields.io/npm/dt/@mgks/docmd.svg?style=flat-square&color=38bd24" alt="downloads"></a>
  <a href="https://github.com/mgks/docmd/stargazers"><img src="https://img.shields.io/github/stars/mgks/docmd?style=flat-square&logo=github" alt="stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mgks/docmd.svg?style=flat-square&color=blue" alt="license"></a>
</p>

<p align="center">
  <a href="https://docmd.mgks.dev"><b>View Live Demo</b></a> • 
  <a href="https://docmd.mgks.dev/getting-started/installation/"><b>Read Documentation</b></a> • 
  <a href="https://docmd.mgks.dev/live/"><b>Live Editor</b></a> •
  <a href="https://github.com/mgks/docmd/issues"><b>Report Bug</b></a>
</p>

<p align="center">
  <img width="800" alt="docmd preview" src="https://docmd.mgks.dev/assets/images/preview-dark-welcome.png" style="border-radius: 10px" />
  <br/>
  <sup><i>docmd noStyle page preview in dark mode</i></sup>
</p>

## Features

- **Zero Config**: Works out of the box with sensible defaults. Just `init` and go.
- **Blazing Fast**: Generates **pure, static HTML**. No React hydration lag, no heavy bundles.
- **Smart Search**: Built-in, **offline-capable** full-text search with fuzzy matching. No API keys required.
- **Isomorphic Core**: Runs anywhere—Node.js CLI, CI/CD pipelines, or **directly in the browser** via WASM.
- **Rich Content**: Built-in support for Callouts, Cards, Tabs, Steps, Changelogs, and Mermaid diagrams.
- **Theming**: Beautiful light/dark modes and multiple pre-built themes (`sky`, `ruby`, `retro`).

## Quick Start

**Installation:**

```bash
npm install -g @mgks/docmd
```

**Run:**

```bash
docmd init my-docs     # Initialize a new project
cd my-docs             # Enter directory
docmd dev              # Start live-reloading server
docmd build            # Generate static site for deployment
docmd live             # Launch live editor to preview and design pages
```

**Dev Server:**

```js
                       
     _                 _ 
   _| |___ ___ _____ _| |
  | . | . |  _|     | . |
  |___|___|___|_|_|_|___|
  
   v0.x.x


🚀 Performing initial build...

👀 Watching for changes in:
   - Source: ./docs
   - Config: ./config.js
   - Assets: ./assets

────────────────────────────────────────
  SERVER RUNNING  (v0.3.5)

  Local:    http://127.0.0.1:3000
  Network:  http://192.1.1.1:3000

  Serving:  ./site
────────────────────────────────────────
```

## Usage in Detail

### Project Structure

`docmd` keeps it simple. Your content lives in `docs/`, your config in `docmd.config.js`.

```bash
my-docs/
├── docs/                  # Your Markdown files
│   ├── index.md           # Homepage
│   └── guide.md           # Content page
├── assets/                # Images and custom CSS
└── docmd.config.js        # Configuration
```

### Configuration

Customize your site in seconds via `docmd.config.js`:

```javascript
module.exports = {
  siteTitle: 'My Project',
  srcDir: 'docs',
  outputDir: 'site',
  theme: {
    name: 'sky',           // 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'dark',   // 'light' or 'dark'
    enableModeToggle: true
  },
  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    { title: 'Guide', path: '/guide', icon: 'book' }
  ]
}
```

## Live Editor

`docmd` comes with a modular architecture that allows the core engine to run client-side.

**Launch locally:**
```bash
docmd live
```
This builds and serves a local editor where you can write Markdown and see the preview instantly without any server-side processing.

**Embed in your app:**
You can also use the `dist/docmd-live.js` bundle to add Markdown compilation capabilities to your own web applications.

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