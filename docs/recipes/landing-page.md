---
title: "Recipe: Marketing Landing Page"
description: "How to build a custom landing page using noStyle."
---

# Creating a Landing Page

Sometimes you want your `index.html` (the home page) to look completely different from your documentation—like a product marketing page. `docmd` makes this easy with **No-Style Pages**.

## The Concept
By adding `noStyle: true` to your frontmatter, `docmd` strips away the sidebar, header, and default CSS, giving you a blank canvas while still keeping helpful meta tags.

## Implementation

Create or edit `docs/index.md`:

```html
---
title: "My Product"
description: " The best product ever."
noStyle: true
components:
  meta: true      # Keep SEO tags
  favicon: true   # Keep favicon
  scripts: false  # Disable default docmd scripts
customHead: |
  <style>
    body { font-family: sans-serif; margin: 0; }
    .hero { background: #111; color: #fff; padding: 100px 20px; text-align: center; }
    .btn { background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
---

<div class="hero">
  <h1>Welcome to My Product</h1>
  <p>The ultimate solution for X, Y, and Z.</p>
  <br>
  <a href="/getting-started/" class="btn">Read the Docs →</a>
</div>

<div class="features">
   <!-- Your custom HTML features grid here -->
</div>
```

This page will be built as `index.html` but will look exactly like your custom HTML, serving as a perfect entry point to your documentation.