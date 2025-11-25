---
title: "Recipe: Custom Fonts"
description: "How to add Google Fonts or custom typefaces to your documentation."
---

# Adding Custom Fonts

You can easily change the typography of your `docmd` site using CSS variables and a custom stylesheet.

## 1. Select a Font
Go to [Google Fonts](https://fonts.google.com) and select the font you want (e.g., "Poppins"). Copy the `@import` URL.

## 2. Create a Custom CSS File
Create a file in your project at `assets/css/typography.css`.

```css
/* assets/css/typography.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

:root {
  /* Override the default sans-serif font variable */
  --font-family-sans: 'Poppins', system-ui, -apple-system, sans-serif;
}
```

## 3. Register in Config
Add the file to your `docmd.config.js`:

```javascript
module.exports = {
  // ...
  theme: {
    name: 'default',
    customCss: [
      '/assets/css/typography.css' // Points to your new file
    ]
  }
  // ...
}
```

## 4. Restart
Run `docmd dev`. Your site will now use Poppins!