---
title: "Sitemap Plugin"
description: "Automatically generate a sitemap.xml for your docmd site to improve search engine discoverability."
---

# Sitemap Plugin (`sitemap`)

The `sitemap` plugin automatically generates a `sitemap.xml` file for your documentation site. This helps search engines discover, crawl, and index your content more effectively, which can improve your site's visibility in search results.

## Enabling the Plugin

Add the `sitemap` plugin to the `plugins` object in your config file:

```javascript
module.exports = {
  // ...
  plugins: {
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    },
    // ... other plugins
  },
  // ...
};
```

## Configuration Options

All options for the `sitemap` plugin are optional. If an option is not provided, the plugin will use sensible defaults.

* `defaultChangefreq` (String): 
  * Specifies how frequently the content is likely to change
  * Possible values: `'always'`, `'hourly'`, `'daily'`, `'weekly'`, `'monthly'`, `'yearly'`, `'never'`
  * Default: `'weekly'`
  
* `defaultPriority` (Number): 
  * Indicates the relative importance of a page in your site
  * Value between 0.0 and 1.0
  * Default: `0.8`

## How It Works

The sitemap plugin automatically:

1. Scans all generated HTML pages during the build process
2. Creates a `sitemap.xml` file in the root of your site output directory
3. Includes all pages with their URLs, last modification dates, and configured priorities

The plugin uses your `siteUrl` property from the config file to create absolute URLs, which is required for a valid sitemap. Make sure you have a `siteUrl` defined:

```javascript
module.exports = {
  siteUrl: 'https://yourdomain.com', // No trailing slash
  // ... other config
};
```

## Overriding Per-Page Settings with Frontmatter

You can override the default sitemap settings for individual pages by adding specific frontmatter properties:

```yaml
---
title: "Important Page"
description: "This is a very important page that changes frequently"
sitemap:
  changefreq: 'daily'
  priority: 1.0
---
```

## Excluding Pages from the Sitemap

If you want to exclude specific pages from the sitemap, you can add the following to your frontmatter:

```yaml
---
title: "Private Page"
description: "This page should not appear in search engines"
sitemap: false
---
```

## Verifying Your Sitemap

After building your site, check the generated sitemap at `your-site/sitemap.xml`. You can also submit the sitemap URL to search engines like Google Search Console or Bing Webmaster Tools to help them discover and index your content more efficiently.