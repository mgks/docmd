---
title: "Basic Usage"
description: "Learn the basic commands to initialize, build, and preview your docmd site."
---

# Basic Usage

Once `docmd` is [installed](/getting-started/installation/), using it involves a few simple commands to manage your documentation project.

## 1. Initialize Your Project (`docmd init`)

Navigate to the directory where you want to create your documentation project. If the directory doesn't exist, create it first.

```bash
mkdir my-awesome-docs
cd my-awesome-docs
```

Then, run the `init` command:

```bash
docmd init
```

This command sets up the basic structure for your `docmd` project:

*   `docs/`: An empty directory where your Markdown source files will live.
    *   `docs/index.md`: A sample Markdown file to get you started.
*   `docmd.config.js`: A configuration file for your site, pre-filled with sensible defaults.

You'll typically edit config file to set your site title and define the navigation structure, and then start adding your `.md` files to the `docs/` directory.

## 2. Add and Structure Content

Create your Markdown (`.md`) files inside the `docs/` directory. You can organize them into subdirectories as needed. For example:

```
my-awesome-docs/
├── assets/
├── docs/
│   ├── index.md
│   └── api/
│       ├── introduction.md
│       └── endpoints.md
│   └── guides/
│       ├── setup.md
│       └── advanced.md
└── docmd.config.js
```

Each Markdown file should start with YAML frontmatter to define metadata like the page title. See [Content > Frontmatter](/content/frontmatter/) for details.

## 3. Preview Your Site (`docmd dev`)

While you're writing content or configuring your site, you'll want to see a live preview. The `dev` command starts a local development server with live reloading.

In your project's root directory (e.g., `my-awesome-docs/`), run:

```bash
docmd dev
```

This will:
1.  Perform an initial build of your site.
2.  Start a web server, typically at `http://localhost:3000`.
3.  Watch your `docs/` directory and `docmd.config.js` for changes.
4.  Automatically rebuild the site and refresh your browser when changes are detected.

Open `http://localhost:3000` in your web browser to see your site. Any changes you save to your Markdown files or config file will be reflected live in the browser.

To stop the development server, press `Ctrl+C` in your terminal.

## 4. Build Your Static Site (`docmd build`)

When you're ready to deploy your documentation or create a production version, use the `build` command:

```bash
docmd build
```

This command:
1.  Reads your `docmd.config.js`.
2.  Processes all `.md` files in your `docs/` directory.
3.  Generates the complete static HTML, CSS, and JavaScript assets.
4.  Outputs the entire site into a `site/` directory (by default, configurable in `docmd.config.js`).

The contents of the `site/` directory are all you need to deploy your documentation. You can upload this folder to any static web hosting provider. See [Deployment](/deployment/) for more information.

This covers the fundamental workflow of using `docmd`. Next, you'll want to learn more about [Content](/content/) and [Configuration](/configuration/).