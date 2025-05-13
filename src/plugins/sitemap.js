const fs = require('fs-extra');
const path = require('path');

// Function to format paths for display (relative to CWD)
function formatPathForDisplay(absolutePath) {
  const CWD = process.cwd();
  const relativePath = path.relative(CWD, absolutePath);
  
  // If it's not a subdirectory, prefix with ./ for clarity
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  
  // Return the relative path
  return relativePath;
}

/**
 * Generate sitemap.xml in the output directory root
 * @param {Object} config - The full configuration object
 * @param {Array} pages - Array of page objects with data about each processed page
 * @param {string} outputDir - Path to the output directory
 * @param {Object} options - Additional options
 * @param {boolean} options.isDev - Whether running in development mode
 */
async function generateSitemap(config, pages, outputDir, options = { isDev: false }) {
  // Skip if no siteUrl is defined (sitemap needs absolute URLs)
  if (!config.siteUrl) {
    if (!options.isDev) {
      console.warn('⚠️ No siteUrl defined in config. Skipping sitemap generation.');
    }
    return;
  }

  // Normalize siteUrl to ensure it has no trailing slash
  const siteUrl = config.siteUrl.replace(/\/$/, '');
  
  // Sitemap XML header
  let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Get default settings from config
  const defaultChangefreq = config.plugins?.sitemap?.defaultChangefreq || 'weekly';
  const defaultPriority = config.plugins?.sitemap?.defaultPriority || 0.8;

  const rootPriority = config.plugins?.sitemap?.rootPriority || 1.0;

  // Helper function to convert paths to URLs
  function pathToUrl(pagePath) {
    // Handle index.html
    if (pagePath === 'index.html') {
      return siteUrl + '/';
    }
    
    // For paths already using pretty URLs (ending with slash)
    if (pagePath.endsWith('/')) {
      return siteUrl + '/' + pagePath;
    }
    
    // For paths still using .html extension
    // Convert to no-extension format
    if (pagePath.endsWith('.html')) {
      const pathWithoutExt = pagePath.substring(0, pagePath.length - 5);
      if (pathWithoutExt === '') {
        return siteUrl + '/';
      } else {
        return siteUrl + '/' + pathWithoutExt + '/';
      }
    }
    
    // Default case
    return siteUrl + '/' + pagePath;
  }

  for (const page of pages) {
    // Parse frontmatter for sitemap-specific overrides and metadata
    const frontmatter = page.frontmatter || {};
    const pagePath = page.outputPath || '';
    
    // Skip if page is explicitly excluded from sitemap
    if (frontmatter.sitemap === false) {
      continue;
    }

    // Determine URL for this page
    let url = pathToUrl(pagePath);

    // Set priority
    let priority = frontmatter.priority || 
                   (pagePath === 'index.html' ? rootPriority : defaultPriority);
    
    // Set change frequency
    const changefreq = frontmatter.changefreq || defaultChangefreq;
    
    // Add page to sitemap
    sitemapXml += '  <url>\n';
    sitemapXml += `    <loc>${url}</loc>\n`;
    
    // Add lastmod if available in frontmatter
    if (frontmatter.lastmod) {
      sitemapXml += `    <lastmod>${frontmatter.lastmod}</lastmod>\n`;
    }
    
    sitemapXml += `    <changefreq>${changefreq}</changefreq>\n`;
    sitemapXml += `    <priority>${priority}</priority>\n`;
    sitemapXml += '  </url>\n';
  }
  
  sitemapXml += '</urlset>';
  
  // Write sitemap file
  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  await fs.writeFile(sitemapPath, sitemapXml);
  
  // Only show sitemap generation message in production mode or if DOCMD_DEV is true
  if (!options.isDev || process.env.DOCMD_DEV === 'true') {
    console.log(`✅ Generated sitemap at ${formatPathForDisplay(sitemapPath)}`);
  }
}

module.exports = { generateSitemap }; 