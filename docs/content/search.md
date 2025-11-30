---
title: "Full-Text Search"
description: "How to use and configure the built-in, offline-capable search engine in docmd."
---

# Full-Text Search

`docmd` comes with a powerful, built-in full-text search engine. It requires **zero configuration**, works completely **offline**, and provides instant results with keyword highlighting.

## How It Works

Unlike other documentation tools that rely on external services (like Algolia) or heavy server-side indexing, `docmd` takes a modern, lightweight approach:

1.  **Build Time:** During `docmd build`, the system scans all your markdown files. It strips HTML tags, extracts headings, and compiles a highly optimized `search-index.json`.
2.  **Client Side:** When a user visits your site, a lightweight search library (MiniSearch) is loaded.
3.  **Instant Querying:** Searching happens entirely in the user's browser. There is no network latency, no API limits, and no tracking.

## Features

*   **Fuzzy Matching:** Finds results even if there are typos (e.g., "installation" matches "instalation").
*   **Smart Snippets:** Shows the exact context of the keyword in the search results, with the matching terms highlighted.
*   **Keyboard Navigation:** Full support for `ArrowUp`, `ArrowDown`, and `Enter`.
*   **Shortcuts:** Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) to open anywhere.
*   **Offline Capable:** Once the page loads, search works without an internet connection.

## Configuration

Search is **enabled by default**. You don't need to do anything to get started.

### Disabling Search
If you prefer to hide the search bar, set `search: false` in your config:

```javascript
// docmd.config.js
module.exports = {
  // ...
  search: false, 
  // ...
};
```

### Excluding Pages
Sometimes you have utility pages or draft content you don't want appearing in search results. You can exclude specific pages using frontmatter:

```yaml
---
title: "Private Draft"
noindex: true
---
```

Using `noindex: true` does two things:
1.  Removes the page from the internal **Search Index**.
2.  Adds a `<meta name="robots" content="noindex">` tag to prevent Google/Bing indexing.

## Comparison vs. Algolia

Many documentation generators (like Docusaurus) rely on **Algolia DocSearch**. While Algolia is powerful, it introduces friction:

| Feature | docmd Search | Algolia / External |
| :--- | :--- | :--- |
| **Setup** | **Zero Config** (Automatic) | Complex (API Keys, CI/CD crawling) |
| **Privacy** | **100% Private** (Client-side) | Data sent to 3rd party servers |
| **Offline** | **Yes** | No |
| **Cost** | **Free** | Free tier limits or Paid |
| **Speed** | **Instant** (In-memory) | Fast (Network latency dependent) |

`docmd` creates a frictionless experience: you write Markdown, we handle the discovery.