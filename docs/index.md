---
title: "Minimalist Markdown Docs Generator"
description: "Generate beautiful, lightweight static documentation sites directly from your Markdown files with docmd. Zero clutter, just content."
---

# docmd

**Generate beautiful, lightweight static documentation sites directly from your Markdown files. Zero clutter, just content.**

`docmd` is a Node.js-based command-line tool that transforms a directory of Markdown files (`.md`) into a clean, fast, and themeable static website. It prioritizes simplicity for the author, leveraging standard Markdown and intuitive configuration, while producing elegant and functional documentation sites.

::: callout tip
This very documentation site is built using `docmd`!
:::

## Core Philosophy

*   **Markdown First:** Your content lives in standard `.md` files with simple YAML frontmatter.
*   **Minimal Configuration:** Sensible defaults with straightforward overrides via `config.js`.
*   **Lightweight Build:** Fast generation process using Node.js, no complex framework dependencies for the build itself.
*   **Beautiful Defaults:** Clean, responsive design with light/dark themes and syntax highlighting out-of-the-box.
*   **Static Output:** Deploy the generated `site/` folder anywhere (GitHub Pages, Netlify, Vercel, etc.).

## Key Features

*   📝 **Standard Markdown & Frontmatter:** Write content naturally, define page metadata (title, description) easily.
*   🎨 **Themeable:** Built-in light/dark modes, customizable via CSS variables. Uses `highlight.js` for code blocks.
*   🧩 **Custom Containers:** Add richer components like callouts, cards, and steps using simple `::: name :::` syntax.
*   ⚙️ **Config-Driven Navigation:** Define your site structure and sidebar navigation in `config.js`. Supports nested items.
*   🚀 **Fast Static Build:** Node.js script quickly processes files into optimized HTML & CSS.
*   💻 **Simple CLI:** Easy-to-use commands (`docmd build`, `docmd init`, `docmd dev`) with clear feedback.
*   🌐 **Deploy Anywhere:** Generates a standard static `site/` directory.

## Get Started Quickly

1.  **Install `docmd`:**
    ```bash
    npm install -g docmd # Or your scoped package name
    ```
2.  **Initialize Your Project:**
    ```bash
    cd my-project-docs
    docmd init
    ```
3.  **Write Your Content:**
    Create `.md` files in the `docs/` directory.
4.  **Preview Live:**
    ```bash
    docmd dev
    ```
5.  **Build for Production:**
    ```bash
    docmd build
    ```

Dive into the [Getting Started](/getting-started/installation/) guide for more details, or explore the sidebar to learn about specific features.