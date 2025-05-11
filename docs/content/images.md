---
title: "Images"
description: "Learn how to add and customize images in your docmd documentation"
---

# Images in docmd

Adding images to your documentation enhances visual understanding and makes your content more engaging. This guide covers everything you need to know about using images in docmd.

## Basic Image Syntax

The standard Markdown syntax for images works in docmd:

```markdown
![Alt text](/path/to/image.jpg "Optional title")
```

Where:
- `Alt text` is the alternative text displayed if the image cannot be loaded
- `/path/to/image.jpg` is the path to your image file
- `"Optional title"` is a tooltip shown when hovering over the image (optional)

## Image Organization

We recommend organizing your images in a dedicated directory structure:

```
docs/
  └── images/
      ├── getting-started/
      │   └── installation.png
      ├── features/
      │   └── example.jpg
      └── logo.svg
```

## Referencing Images

### Relative Paths

Use relative paths to reference images within your documentation:

```markdown
![Installation Screenshot](../images/getting-started/installation.png)
```

### Absolute Paths

For images stored in your site's assets directory:

```markdown
![Logo](/assets/images/logo.png)
```

## Image Styling

docmd provides several ways to style your images using attribute syntax:

### Image Alignment

You can align images using special class names:

```markdown
![Left-aligned image](/path/to/image.jpg){.align-left}
![Center-aligned image](/path/to/image.jpg){.align-center}
![Right-aligned image](/path/to/image.jpg){.align-right}
```

### Image Size

Control image dimensions with size classes:

```markdown
![Small image](/path/to/image.jpg){.size-small}
![Medium image](/path/to/image.jpg){.size-medium}
![Large image](/path/to/image.jpg){.size-large}
```

Or specify custom dimensions:

```markdown
![Custom size](/path/to/image.jpg){width=300 height=200}
```

### Image Borders and Shadows

Add borders or shadows to your images:

```markdown
![Image with border](/path/to/image.jpg){.with-border}
![Image with shadow](/path/to/image.jpg){.with-shadow}
![Image with border and shadow](/path/to/image.jpg){.with-border .with-shadow}
```

Note: Make sure there's a space between multiple classes in the attribute syntax.

### Responsive Images

All images in docmd are responsive by default, automatically scaling to fit their container.

## Image Captions

Add captions to your images using the figure syntax:

```markdown
<figure>
  <img src="/path/to/image.jpg" alt="Description of image">
  <figcaption>This is the caption for the image</figcaption>
</figure>
```

## Image Galleries and Lightbox

docmd includes built-in lightbox functionality for image galleries. When users click on an image in a gallery, it opens in a full-screen lightbox view.

### Basic Gallery

Create simple image galleries by grouping images in a grid layout:

```markdown
<div class="image-gallery">
  <img src="/path/to/image1.jpg" alt="Image 1">
  <img src="/path/to/image2.jpg" alt="Image 2">
  <img src="/path/to/image3.jpg" alt="Image 3">
</div>
```

### Gallery with Captions

For galleries with captions, use figure elements inside the gallery:

```markdown
<div class="image-gallery">
  <figure>
    <img src="/path/to/image1.jpg" alt="Image 1">
    <figcaption>Caption for Image 1</figcaption>
  </figure>
  <figure>
    <img src="/path/to/image2.jpg" alt="Image 2">
    <figcaption>Caption for Image 2</figcaption>
  </figure>
</div>
```

### Zoom Effect

Add a zoom effect to gallery images when hovering:

```markdown
<div class="image-gallery zoom">
  <img src="/path/to/image1.jpg" alt="Image 1">
  <img src="/path/to/image2.jpg" alt="Image 2">
</div>
```

### Individual Lightbox Images

You can also enable lightbox functionality for individual images:

```markdown
![Image with lightbox](/path/to/image.jpg){.lightbox}
```

## Image Optimization Best Practices

For optimal performance:

1. **Use appropriate formats**:
   - JPEG for photographs
   - PNG for images with transparency
   - SVG for icons and logos
   - WebP for better compression (with fallbacks)

2. **Optimize file sizes**:
   - Compress images before adding them to your documentation
   - Consider using tools like ImageOptim, TinyPNG, or Squoosh

3. **Provide responsive images**:
   - Use the HTML `<picture>` element for advanced responsive image scenarios

4. **Specify dimensions**:
   - Always include width and height attributes to prevent layout shifts

## Examples

### Basic Image

![docmd preview](/assets/images/docmd-preview.png "docmd Documentation Generator")

### Image with Border and Shadow

![preview with styling](/assets/images/docmd-preview.png){.with-border .with-shadow}

### Responsive Image Gallery

<div class="image-gallery">
  <figure>
    <img src="/assets/images/docmd-preview.png" alt="Feature 1">
    <figcaption>Feature One</figcaption>
  </figure>
  <figure>
    <img src="/assets/images/docmd-preview.png" alt="Feature 2">
    <figcaption>Feature Two</figcaption>
  </figure>
</div> 