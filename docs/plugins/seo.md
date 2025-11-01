---
title: "SEO & Meta Tags Plugin"
description: "Configure Search Engine Optimization (SEO) meta tags to improve your docmd site's discoverability."
---

# SEO & Meta Tags Plugin (`seo`)

The `seo` plugin automatically generates important meta tags in the `<head>` of your HTML pages. This helps search engines and social media platforms understand, index, and display your content more effectively.

## Enabling the Plugin

Add the `seo` plugin to the `plugins` object in your config file:

```javascript
module.exports = {
  // ...
  plugins: {
    seo: {
      defaultDescription: 'Discover insightful articles and guides on Project X. Your go-to resource for learning and development.',
      openGraph: {
        // siteName: 'Project X Documentation', // Optional, defaults to config.siteTitle
        defaultImage: '/assets/images/default-og-image.png', // Absolute path from site root
      },
      twitter: {
        cardType: 'summary_large_image', // e.g., 'summary', 'summary_large_image'
        // siteUsername: '@ProjectX_Docs', // Your site's Twitter handle
        // creatorUsername: '@YourHandle' // Default author handle (override in frontmatter)
      }
    },
    // ... other plugins
  },
  // ...
};
```

## Configuration Options

The options in the config file serve as site-wide defaults. For the best results, you should provide specific metadata for each page using frontmatter.

## Frontmatter for SEO

To control SEO on a per-page basis, add a nested `seo` object to your page's frontmatter. This keeps all SEO-related settings organized and prevents conflicts with other frontmatter keys.

```yaml
---
title: "Advanced Widget Configuration"
description: "A detailed guide on configuring advanced settings for the Super Widget."
seo:
  description: "A more specific SEO description for search engines, overriding the main description if needed."
  image: "/assets/images/widgets/super-widget-social.jpg"
  ogType: "article"
  twitterCard: "summary_large_image"
  twitterCreator: "@widgetMaster"
  keywords: ["widget", "configuration", "advanced", "performance"]
  permalink: "https://example.com/docs/widgets/advanced-configuration"
  noindex: false
---
```

::: callout info Backward Compatibility
For backward compatibility, the plugin will still recognize top-level SEO fields like `image`, `ogType`, etc. However, the nested `seo:` structure is the recommended approach.
:::

### Supported Frontmatter Fields

All fields should be placed inside the `seo:` object.

*   `description` (String): Overrides the main page description for SEO meta tags.
*   `image` or `ogImage` (String): Path to an image for `og:image` and `twitter:image`.
*   `ogType` (String): Overrides the default Open Graph type (e.g., `article`, `website`).
*   `twitterCard` (String): Overrides the default Twitter card type for this page.
*   `twitterCreator` (String): The Twitter @username of the page's author.
*   `keywords` (Array of Strings or String): Keywords for the `<meta name="keywords">` tag.
*   `permalink` or `canonicalUrl` (String): The canonical URL for the page.
*   `noindex` (Boolean): If `true`, adds `<meta name="robots" content="noindex">` to discourage search engines from indexing this page.

## Structured Data (LD+JSON)

The SEO plugin can generate [Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) (LD+JSON), which can enable rich search results. This feature is enabled per-page in your frontmatter.

### Enabling Structured Data

To generate a default LD+JSON block, add `ldJson: true` inside your `seo` frontmatter object.

```yaml
---
title: "My Article"
description: "An article about something important."
seo:
  ldJson: true
---
```

This generates a basic `Article` schema using your page's metadata.

### Customizing Structured Data

For more control, provide an object to `ldJson`. This object will be merged with the default data, allowing you to add or override any properties.

**Example: Customizing schema type and adding an author**

```yaml
---
title: "Advanced Widget Configuration"
description: "A detailed guide on configuring advanced settings for the Super Widget."
seo:
  image: "/assets/images/widgets/super-widget-social.jpg"
  ldJson:
    "@type": "TechArticle"
    author:
      "@type": "Person"
      name: "Jane Doe"
      url: "https://example.com/authors/jane-doe"
    datePublished: "2024-01-15"
    review:
      "@type": "Review"
      reviewRating:
        "@type": "Rating"
        ratingValue: "5"
        bestRating: "5"
      author:
        "@type": "Person"
        name: "John Smith"
---
```

In this example, the schema type is changed to `TechArticle`, and detailed `author`, `datePublished`, and `review` information is added, giving search engines a much richer understanding of your content.