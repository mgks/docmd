// Source file from the docmd project — https://github.com/mgks/docmd

/*
 * Generate SEO meta tags for a page
 */

function generateSeoMetaTags(config, pageData, relativePathToRoot) {
  let metaTagsHtml = '';
  const { frontmatter, outputPath } = pageData;
  const seoFrontmatter = frontmatter.seo || {}; // Use nested seo object, fallback to empty

  if (frontmatter.noindex || seoFrontmatter.noindex) {
    metaTagsHtml += '  <meta name="robots" content="noindex">\n';
    return metaTagsHtml; // No other SEO tags if noindex
  }

  const siteTitle = config.siteTitle;
  const pageTitle = frontmatter.title || 'Untitled';
  const description = seoFrontmatter.description || frontmatter.description || config.plugins?.seo?.defaultDescription || '';

  const siteUrl = config.siteUrl ? config.siteUrl.replace(/\/$/, '') : '';
  const pageSegment = outputPath.replace(/index\.html$/, '').replace(/\.html$/, '');
  const pageUrl = `${siteUrl}${pageSegment.startsWith('/') ? pageSegment : '/' + pageSegment}`;

  metaTagsHtml += `  <meta name="description" content="${description}">\n`;

  const canonicalUrl = seoFrontmatter.permalink || frontmatter.permalink || seoFrontmatter.canonicalUrl || frontmatter.canonicalUrl || pageUrl;
  metaTagsHtml += `  <link rel="canonical" href="${canonicalUrl}">\n`;

  // Open Graph
  metaTagsHtml += `  <meta property="og:title" content="${pageTitle} : ${siteTitle}">\n`;
  metaTagsHtml += `  <meta property="og:description" content="${description}">\n`;
  metaTagsHtml += `  <meta property="og:url" content="${pageUrl}">\n`;
  metaTagsHtml += `  <meta property="og:site_name" content="${config.plugins?.seo?.openGraph?.siteName || siteTitle}">\n`;

  const ogImage = seoFrontmatter.image || frontmatter.image || seoFrontmatter.ogImage || frontmatter.ogImage || config.plugins?.seo?.openGraph?.defaultImage;
  if (ogImage) {
    const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
    metaTagsHtml += `  <meta property="og:image" content="${ogImageUrl}">\n`;
  }
  metaTagsHtml += `  <meta property="og:type" content="${seoFrontmatter.ogType || frontmatter.ogType || 'website'}">\n`;

  // Twitter Card
  const twitterCardType = seoFrontmatter.twitterCard || frontmatter.twitterCard || config.plugins?.seo?.twitter?.cardType || 'summary';
  metaTagsHtml += `  <meta name="twitter:card" content="${twitterCardType}">\n`;
  if (config.plugins?.seo?.twitter?.siteUsername) {
    metaTagsHtml += `  <meta name="twitter:site" content="${config.plugins.seo.twitter.siteUsername}">\n`;
  }
  const twitterCreator = seoFrontmatter.twitterCreator || frontmatter.twitterCreator || config.plugins?.seo?.twitter?.creatorUsername;
  if (twitterCreator) {
    metaTagsHtml += `  <meta name="twitter:creator" content="${twitterCreator}">\n`;
  }
  metaTagsHtml += `  <meta name="twitter:title" content="${pageTitle} : ${siteTitle}">\n`;
  metaTagsHtml += `  <meta name="twitter:description" content="${description}">\n`;
  if (ogImage) {
    const twitterImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
    metaTagsHtml += `  <meta name="twitter:image" content="${twitterImageUrl}">\n`;
  }

  // Keywords
  const keywords = seoFrontmatter.keywords || frontmatter.keywords;
  if (keywords) {
    const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    metaTagsHtml += `  <meta name="keywords" content="${keywordsString}">\n`;
  }

  // LD+JSON Structured Data
  const ldJsonConfig = seoFrontmatter.ldJson || frontmatter.ldJson;
  if (ldJsonConfig) {
    try {
      const baseLdJson = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: pageTitle,
        description: description,
        url: canonicalUrl,
      };

      if (config.siteTitle) {
        baseLdJson.publisher = {
          '@type': 'Organization',
          name: config.siteTitle,
        };
        if (config.logo?.light) {
          baseLdJson.publisher.logo = {
            '@type': 'ImageObject',
            url: `${siteUrl}${config.logo.light.startsWith('/') ? config.logo.light : '/' + config.logo.light}`
          };
        }
      }
      
      if (ogImage) {
        baseLdJson.image = `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
      }

      const finalLdJson = typeof ldJsonConfig === 'object' 
        ? { ...baseLdJson, ...ldJsonConfig } 
        : baseLdJson;

      metaTagsHtml += `  <script type="application/ld+json">\n`;
      metaTagsHtml += `    ${JSON.stringify(finalLdJson, null, 2)}\n`;
      metaTagsHtml += `  </script>\n`;
    } catch (e) {
      console.error(`❌ Error generating LD+JSON for page: ${outputPath}`);
      console.error(`   Could not stringify the ldJson object. Please check its structure in the frontmatter.`);
      console.error(`   ${e.message}`);
    }
  }

  return metaTagsHtml;
}

module.exports = { generateSeoMetaTags };