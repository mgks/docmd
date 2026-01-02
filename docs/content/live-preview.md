---
title: "Live Preview"
description: "Run docmd entirely in the browser without a server using the new Live architecture."
---

# Live Preview & Browser Support

::: button Open_Live_Editor /live/ color:#007bff
:::

Starting with version 0.3.4, `docmd` features a modular architecture that separates file system operations from core processing logic. This allows the documentation engine to run **entirely in the browser** (client-side), opening up possibilities for live editors, CMS previews, and zero-latency feedback loops.

## The Live Editor

`docmd` comes with a built-in "Live Editor" that demonstrates this capability. It provides a split-pane interface where you can write Markdown on the left and see the rendered documentation on the right—instantly, without a server round-trip.

### Running the Editor Locally

To launch the live editor on your machine:

```bash
docmd live
```

This command will:
1.  Bundle the core logic into `dist/docmd-live.js`.
2.  Copy necessary assets (CSS, templates).
3.  Start a local static server opening the editor.

## Embedding docmd in Your Site

You can use the browser-compatible bundle to add Markdown preview capabilities to your own applications.

### 1. Include the Script and Assets

You need to serve the `docmd-live.js` bundle and the `assets/` folder (which contains themes and styles).

```html
<link rel="stylesheet" href="/assets/css/docmd-main.css">
<link rel="stylesheet" href="/assets/css/docmd-theme-sky.css">
<script src="/docmd-live.js"></script>
```

### 2. Use the API

The bundle exposes a global `docmd` object. You can use the `compile` function to transform Markdown into a full HTML page string.

```javascript
const markdown = "# Hello World\n\nThis is **live** documentation.";

const config = {
  siteTitle: 'My Live Doc',
  theme: { 
    name: 'sky', 
    defaultMode: 'light' 
  }
};

// Compile returns the full HTML string including <head>, <body>, etc.
const html = docmd.compile(markdown, config, {
    // Optional: Help the renderer resolve relative paths
    relativePathToRoot: './' 
});

// Inject into an iframe or DOM element
document.getElementById('preview-frame').srcdoc = html;
```

::: callout warning Limitation
The Live browser build cannot scan your local hard drive for files. Features that rely on file scanning (like automatically generating the Sidebar Navigation based on folder structure) must be passed explicitly via the `config` object or navigation options.
:::