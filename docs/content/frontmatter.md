---
title: "Frontmatter"
description: "How to use YAML frontmatter to define page metadata in your docmd Markdown files."
---

# Frontmatter

Every Markdown (`.md`) file that `docmd` processes **must** begin with YAML frontmatter. Frontmatter is a block of YAML (YAML Ain't Markup Language) enclosed by triple-dashed lines (`---`) at the very beginning of your file. It's used to set metadata for each page.

## Basic Structure

```yaml
---
title: "My Awesome Page Title"
description: "A concise and informative description for this page, used for SEO and potentially in listings."
# You can add other custom fields here if needed for your templates or logic
order: 1 # Example: for custom sorting if you implement such logic
tags:
  - guide
  - advanced
---
```

## Required Fields

*   **`title`** (String, Required)
    *   **Purpose:** This is the primary title of the page.
    *   **Usage:**
        *   Used for the HTML `<title>` tag (e.g., `Page Title : Site Title`).
        *   Often used as the main heading (`<h1>`) on the page by default (though themes can customize this).
        *   Used as the display text for links in the navigation sidebar if the path matches.
    *   **Example:** `title: "Installation Guide"`

## Optional Fields (Recommended)

*   **`description`** (String, Optional)
    *   **Purpose:** A brief summary of the page's content.
    *   **Usage:**
        *   Used for the HTML `<meta name="description">` tag, which is important for search engine optimization (SEO) and search result snippets.
    *   **Example:** `description: "Learn how to install and configure the XYZ widget."`

## Custom Fields

You can include any other custom fields in your frontmatter. These fields won't be used by `docmd`'s core functionality directly but can be accessed if you decide to customize EJS templates or write plugins in the future.

Examples of custom fields you *might* add (these are not built-in features):

*   `author`: "Jane Doe"
*   `date`: "2023-10-26"
*   `order`: 2 (For custom sorting of pages within a section, if you implement logic for it)
*   `draft`: true (To mark a page as a draft, if you implement logic to exclude drafts from builds)
*   `tags`: ["tag1", "tag2"]
*   `permalink`: "https://example.com/your-canonical-url/" (Sets the canonical URL for SEO purposes)

## Page-Specific Behavior Fields

*   **`toc`** (Boolean, Optional)
    *   **Purpose:** Controls the visibility of the "On This Page" table of contents sidebar.
    *   **Default:** `true` (TOC is visible if the page has headings).
    *   **Usage:** Set to `false` to completely hide the TOC sidebar for a specific page. This is useful for landing pages or pages with minimal content.
    *   **Example:** `toc: false`

## Example Usage

Consider a file named `docs/guides/installation.md`:

```markdown
---
title: "Installation Steps"
description: "A step-by-step guide to installing our application on various platforms."
order: 1
---

# Application Installation

This guide will walk you through installing our application...
```

In this example:
*   The browser tab will show "Installation Steps : Your Site Title".
*   The `<meta name="description">` will be set.
*   The `order: 1` field is available if you later want to sort "guides" pages by this value.

Using frontmatter consistently ensures your pages are well-defined, SEO-friendly, and integrate smoothly with `docmd`'s navigation and theming systems.