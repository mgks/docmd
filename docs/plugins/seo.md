---
title: "SEO & Meta Tags Plugin"
description: "Configure Search Engine Optimization (SEO) meta tags to improve your docmd site's discoverability."
---

# SEO & Meta Tags Plugin (`seo`)

The `seo` plugin automatically generates important meta tags in the `<head>` of your HTML pages. This helps search engines and social media platforms understand, index, and display your content more effectively.

## Enabling the Plugin

Add the `seo` plugin to the `plugins` object in your `config.js`:

```javascript
// config.js
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

All options for the `seo` plugin are optional. If an option is not provided, the plugin will attempt to use sensible defaults or derive values from page frontmatter or `config.siteTitle`.

*   `defaultDescription` (String):
    *   A fallback meta description used for pages that do not have a `description` specified in their YAML frontmatter.
*   `openGraph` (Object): Configures [Open Graph](https://ogp.me/) meta tags, primarily used by Facebook, LinkedIn, Pinterest, etc.
    *   `siteName` (String): The name of your website (e.g., "My Project Documentation"). If not provided, `config.siteTitle` is used.
    *   `defaultImage` (String): Absolute path (from site root) to a default image for `og:image` when a page is shared, if the page itself doesn't specify an image in its frontmatter (e.g., via `image: /path/to/page-image.png` or `ogImage: ...`).
    *   Other tags like `og:title`, `og:description`, `og:url`, and `og:type` are automatically generated based on page frontmatter and URL.
*   `twitter` (Object): Configures [Twitter Card](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) meta tags.
    *   `cardType` (String): The type of Twitter card. Common values: `'summary'`, `'summary_large_image'`. Defaults to `'summary'`.
    *   `siteUsername` (String): The Twitter @username of the site/publisher (e.g., `@MyProjectAccount`).
    *   `creatorUsername` (String): The default Twitter @username of the content creator. Can be overridden per page via frontmatter (e.g., `twitterCreator: @PageAuthorHandle`).
    *   Twitter tags like `twitter:title`, `twitter:description`, and `twitter:image` are also derived from page frontmatter, similar to Open Graph tags.

## Frontmatter for SEO

For the best SEO results, provide specific metadata in each page's frontmatter. The `seo` plugin will prioritize these values.

```yaml
---
title: "Advanced Widget Configuration"
description: "A detailed guide on configuring advanced settings for the Super Widget, including performance tuning and security options."
image: "/assets/images/widgets/super-widget-social.jpg" # Used for og:image and twitter:image
ogType: "article" # Specify Open Graph type, e.g., article, website
twitterCreator: "@widgetMaster"
keywords: "widget, configuration, advanced, performance, security" # Optional, some argue keywords meta tag is less relevant now
permalink: "https://example.com/docs/widgets/advanced-configuration" # Canonical URL
---

# Advanced Widget Configuration
...
```
Supported frontmatter fields that the `seo` plugin may look for:
*   `title` (Used for `og:title`, `twitter:title`)
*   `description` (Used for `<meta name="description">`, `og:description`, `twitter:description`)
*   `image` or `ogImage` (Used for `og:image`, `twitter:image`)
*   `ogType` (Overrides default `og:type`)
*   `twitterCard` (Overrides `config.seo.twitter.cardType` for this page)
*   `twitterCreator` (Overrides `config.seo.twitter.creatorUsername` for this page)
*   `noindex` (Boolean): If `true`, adds `<meta name="robots" content="noindex">` to discourage search engines from indexing this specific page.
*   `permalink` (String): If provided, sets a canonical URL for the page. This is useful when you have duplicate content across different URLs and want to indicate the preferred version. If not specified, the page's URL will be used as the canonical URL. (Note: `canonicalUrl` is also supported for backward compatibility)

By configuring the `seo` plugin and utilizing frontmatter effectively, you can significantly improve how your documentation is presented and discovered online.