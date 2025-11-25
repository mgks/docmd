---
title: "Recipe: Custom Favicon"
description: "How to add a custom favicon to your documentation site."
---

# Adding a Custom Favicon

A favicon is the small icon that appears in the browser tab next to your page title. `docmd` makes it easy to add your own.

## 1. Prepare your image
You can use `.ico`, `.png`, or `.svg` files. For the best compatibility, an `.ico` file is recommended.

## 2. Add to Assets
Place your image file in your project's assets directory.

```bash
# Example structure
my-project/
  ├── assets/
  │   └── my-icon.ico  <-- Your file here
  ├── docs/
  └── docmd.config.js
```

## 3. Update Configuration
Open `docmd.config.js` and update the `favicon` property with the path relative to the output root.

```javascript
module.exports = {
  // ...
  // Points to site/assets/my-icon.ico
  favicon: '/assets/my-icon.ico', 
  // ...
};
```

## 4. Build
Run `docmd build` (or `docmd dev`). `docmd` will automatically copy your asset file to the site build and link it in the `<head>` of every page.