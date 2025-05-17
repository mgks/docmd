// src/plugins/seo.js
function generateSeoMetaTags(config, pageData, relativePathToRoot) {
    let metaTagsHtml = '';
    const { frontmatter, outputPath } = pageData;
  
    if (frontmatter.noindex) {
      metaTagsHtml += '  <meta name="robots" content="noindex">\n';
      return metaTagsHtml; // No other SEO tags if noindex
    }
  
    const siteTitle = config.siteTitle;
    const pageTitle = frontmatter.title || 'Untitled'; // Ensure pageTitle is always defined
    const description = frontmatter.description || config.plugins?.seo?.defaultDescription || '';
  
    // Construct pageUrl - ensure siteUrl in config has no trailing slash
    const siteUrl = config.siteUrl ? config.siteUrl.replace(/\/$/, '') : '';
    const pageSegment = outputPath.replace(/index\.html$/, '').replace(/\.html$/, '');
    const pageUrl = `${siteUrl}${pageSegment.startsWith('/') ? pageSegment : '/' + pageSegment}`;
  
    metaTagsHtml += `  <meta name="description" content="${description}">\n`;
  
    // Canonical URL - use permalink first, fall back to canonicalUrl, then default to pageUrl
    const canonicalUrl = frontmatter.permalink || frontmatter.canonicalUrl || pageUrl;
    metaTagsHtml += `  <link rel="canonical" href="${canonicalUrl}">\n`;
  
    // Open Graph
    metaTagsHtml += `  <meta property="og:title" content="${pageTitle} | ${siteTitle}">\n`;
    metaTagsHtml += `  <meta property="og:description" content="${description}">\n`;
    metaTagsHtml += `  <meta property="og:url" content="${pageUrl}">\n`;
    metaTagsHtml += `  <meta property="og:site_name" content="${config.plugins?.seo?.openGraph?.siteName || siteTitle}">\n`;
  
    const ogImage = frontmatter.image || frontmatter.ogImage || config.plugins?.seo?.openGraph?.defaultImage;
    if (ogImage) {
      const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
      metaTagsHtml += `  <meta property="og:image" content="${ogImageUrl}">\n`;
    }
    metaTagsHtml += `  <meta property="og:type" content="${frontmatter.ogType || 'website'}">\n`;
  
    // Twitter Card
    const twitterCardType = frontmatter.twitterCard || config.plugins?.seo?.twitter?.cardType || 'summary';
    metaTagsHtml += `  <meta name="twitter:card" content="${twitterCardType}">\n`;
    if (config.plugins?.seo?.twitter?.siteUsername) {
      metaTagsHtml += `  <meta name="twitter:site" content="${config.plugins.seo.twitter.siteUsername}">\n`;
    }
    const twitterCreator = frontmatter.twitterCreator || config.plugins?.seo?.twitter?.creatorUsername;
    if (twitterCreator) {
      metaTagsHtml += `  <meta name="twitter:creator" content="${twitterCreator}">\n`;
    }
    // Twitter title, description, image often fallback to OG tags if not explicitly set by Twitter.
    // For explicitness:
    metaTagsHtml += `  <meta name="twitter:title" content="${pageTitle} | ${siteTitle}">\n`;
    metaTagsHtml += `  <meta name="twitter:description" content="${description}">\n`;
    if (ogImage) { // Re-use ogImage for twitter:image if not specified differently
      const twitterImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
      metaTagsHtml += `  <meta name="twitter:image" content="${twitterImageUrl}">\n`;
    }
  
  
    // Keywords (optional, less impact nowadays)
    if (frontmatter.keywords) {
      const keywordsString = Array.isArray(frontmatter.keywords) ? frontmatter.keywords.join(', ') : frontmatter.keywords;
      metaTagsHtml += `  <meta name="keywords" content="${keywordsString}">\n`;
    }
  
  
    return metaTagsHtml;
  }
  
  module.exports = { generateSeoMetaTags };