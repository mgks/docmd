---
title: "Comparison"
description: "A detailed comparison of docmd against Docusaurus, MkDocs, Mintlify, and Docsify."
---

# Comparing Documentation Tools

Choosing the right tool depends on your specific needs. `docmd` was built to fill the gap between "too simple" (basic parsers) and "too heavy" (full application frameworks).

## Feature Matrix

| Feature | docmd | Docusaurus | MkDocs (Material) | Mintlify | Docsify |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core Tech** | Node.js (Native) | React.js | Python | Proprietary | JS (Runtime) |
| **Output** | Static HTML | React SPA (Hydrated) | Static HTML | Hosted / Next.js | None (Runtime SPA) |
| **Browser Engine** | **Yes (Isomorphic)** | No | No | No | Yes |
| **Setup Time** | ~1 minute | ~15 mins | ~10 mins (Python env) | Instant (SaaS) | Instant |
| **Client JS Size** | **Tiny (< 15kb)** | Heavy (React Bundle) | Minimal | Medium | Medium |
| **Search** | **Built-in (Offline)** | Algolia (Requires Setup) | Built-in (Lunr) | Built-in | Client-side Plugin |
| **SEO** | **Excellent** | Excellent | Excellent | Excellent | **Poor** |
| **Hosting** | **Anywhere** | Anywhere | Anywhere | **Vendor Locked** | Anywhere |
| **Cost** | **100% Free OSS** | 100% Free OSS | 100% Free OSS | Freemium | 100% Free OSS |

## Detailed Breakdown

### The "Live" Advantage
Unlike Docusaurus or MkDocs, which are strictly "Build Tools" that run on your server/computer, `docmd` has a **modular, isomorphic core**.
*   **Run it anywhere:** You can run the full `docmd` compilation engine directly in a web browser.
*   **Live Previews:** This enables features like the [Live Editor](/live/), allowing you to build CMS interfaces or live preview tools for your users without needing a backend server.

### The Search Advantage
*   **Docusaurus and others** often rely on 3rd party services like Algolia. This is great for enterprise scale, but for most projects, it's a hassle. You have to apply for an account, manage API keys, and configure crawlers.
*   **docmd** includes a production-grade search engine out of the box. It generates a local index during the build. This means your documentation is **searchable even offline** (perfect for Intranets or air-gapped networks) and respects user privacy completely.

### vs. Docusaurus
**Docusaurus** is the gold standard for large-scale React projects (like Meta's own docs).
*   **Choose Docusaurus if:** You need to embed complex React components inside your markdown, need versioning *today*, or are building a massive site with thousands of pages.
*   **Choose docmd if:** You want a fast, lightweight site that is just HTML/CSS. You don't want to maintain a React dependency tree just to display documentation.

### vs. MkDocs (Material)
**MkDocs** is widely loved but requires a Python environment.
*   **Choose MkDocs if:** You are already in the Python ecosystem or need its mature plugin ecosystem immediately.
*   **Choose docmd if:** You are a JavaScript/Node.js developer. You want to run `npm install` and go, without dealing with `pip`, `requirements.txt`, or Python version conflicts.

### vs. Docsify
**Docsify** is a "magical" generator that parses Markdown on the fly in the browser.
*   **Choose Docsify if:** You absolutely cannot run a build step (e.g., you are hosting on a legacy server that only serves static files and you can't run CI/CD).
*   **Choose docmd if:** You care about **SEO** and **Performance**. Docsify requires the user's browser to download the Markdown parser and the content before rendering anything, which is bad for search engines. `docmd` gives you the best of both worlds: Static HTML for SEO, plus a Browser Engine if you need dynamic previews.

## The docmd Philosophy

We believe documentation tools shouldn't be heavy. `docmd` generates **zero-clutter** websites. We don't ship a heavy JavaScript framework to the client just to render text. This results in:

1.  **Better SEO:** Search engines love clean, semantic HTML.
2.  **Faster Load Times:** No "hydration" delay or runtime parsing.
3.  **Easier Maintenance:** Standard web technologies (CSS/JS), no framework knowledge required.