// Source file from the docmd project — https://github.com/docmd-io/docmd

const path = require('path');
const fs = require('../core/fs-utils');
const MiniSearch = require('minisearch');
const { loadConfig } = require('../core/config-loader');
const { createMarkdownItInstance, findMarkdownFiles, processMarkdownFile } = require('../core/file-processor');
const { generateHtmlPage, generateNavigationHtml } = require('../core/html-generator');
const { clearWarnedIcons } = require('../core/icon-renderer');
const { findPageNeighbors } = require('../core/navigation-helper');
const { generateSitemap } = require('../plugins/sitemap');
const { processAssets } = require('../core/asset-manager');

// Add a global or scoped flag to track if the warning has been shown in the current dev session
let highlightWarningShown = false;

/**
 * Format paths for display to make them relative to CWD
 */
function formatPathForDisplay(absolutePath, cwd) {
  const relativePath = path.relative(cwd, absolutePath);
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  return relativePath;
}

async function buildSite(configPath, options = { isDev: false, preserve: false, noDoubleProcessing: false }) {
  clearWarnedIcons(); // Clear warnings at the start of every build

  const config = await loadConfig(configPath);
  const CWD = process.cwd();
  const SRC_DIR = path.resolve(CWD, config.srcDir);
  const OUTPUT_DIR = path.resolve(CWD, config.outputDir);
  const USER_ASSETS_DIR = path.resolve(CWD, 'assets');
  const md = createMarkdownItInstance(config);
  const shouldMinify = !options.isDev && config.minify !== false;
  const searchIndexData = [];
  const isOfflineMode = options.offline === true;

  if (!await fs.exists(SRC_DIR)) {
    throw new Error(`Source directory not found: ${formatPathForDisplay(SRC_DIR, CWD)}`);
  }

  // Create output directory if it doesn't exist
  await fs.ensureDir(OUTPUT_DIR);

  // Clean HTML files
  if (await fs.exists(OUTPUT_DIR)) {
    const cleanupFiles = await findFilesToCleanup(OUTPUT_DIR);
    for (const file of cleanupFiles) {
      await fs.remove(file);
    }
    if (!options.isDev) {
      console.log(`🧹 Cleaned HTML files from output directory: ${formatPathForDisplay(OUTPUT_DIR, CWD)}`);
    }
  }

  // --- ASSET PROCESSING ---
  const assetsDestDir = path.join(OUTPUT_DIR, 'assets');
  await fs.ensureDir(assetsDestDir);

  // 1. Process Internal Assets First (Base)
  const assetsSrcDir = path.join(__dirname, '..', 'assets');
  if (await fs.exists(assetsSrcDir)) {
    if (!options.isDev) console.log(`📂 Processing docmd assets...`);
    await processAssets(assetsSrcDir, assetsDestDir, { minify: shouldMinify });
  } else {
    console.warn(`⚠️  Assets source directory not found: ${formatPathForDisplay(assetsSrcDir, CWD)}`);
  }

  // 2. Process User Assets Second (Overrides Internal)
  if (await fs.exists(USER_ASSETS_DIR)) {
    if (!options.isDev) console.log(`📂 Processing user assets...`);
    await processAssets(USER_ASSETS_DIR, assetsDestDir, { minify: shouldMinify });

    // Copy favicon to root if exists
    const userFavicon = path.join(USER_ASSETS_DIR, 'favicon.ico');
    if (await fs.exists(userFavicon)) {
      await fs.copy(userFavicon, path.join(OUTPUT_DIR, 'favicon.ico'));
    }
  }

  // Check for Highlight.js themes presence (sanity check)
  const lightThemePath = path.join(__dirname, '..', 'assets', 'css', 'docmd-highlight-light.css');
  if (!await fs.exists(lightThemePath)) {
    if (!options.isDev || (options.isDev && !highlightWarningShown)) {
      console.warn(`⚠️ Highlight.js themes not found in assets. Syntax highlighting may break.`);
      if (options.isDev) highlightWarningShown = true;
    }
  }

  // 3. Process Markdown Content
  const processedPages = [];
  const processedFiles = new Set();
  const markdownFiles = await findMarkdownFiles(SRC_DIR);
  if (!options.isDev) console.log(`📄 Found ${markdownFiles.length} markdown files.`);

  for (const filePath of markdownFiles) {
    try {
      const relativePath = path.relative(SRC_DIR, filePath);

      // Skip file if already processed in this dev build cycle
      if (options.noDoubleProcessing && processedFiles.has(relativePath)) continue;
      processedFiles.add(relativePath);

      const processedData = await processMarkdownFile(filePath, md, config);
      if (!processedData) continue;

      const { frontmatter: pageFrontmatter, htmlContent, headings, searchData } = processedData;
      const isIndexFile = path.basename(relativePath) === 'index.md';

      let outputHtmlPath;
      if (isIndexFile) {
        outputHtmlPath = path.join(path.dirname(relativePath), 'index.html');
      } else {
        outputHtmlPath = relativePath.replace(/\.md$/, '/index.html');
      }

      const finalOutputHtmlPath = path.join(OUTPUT_DIR, outputHtmlPath);
      
      let relativePathToRoot = path.relative(path.dirname(finalOutputHtmlPath), OUTPUT_DIR);
      relativePathToRoot = relativePathToRoot === '' ? './' : relativePathToRoot.replace(/\\/g, '/') + '/';

      let normalizedPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
      if (path.basename(normalizedPath) === 'index.md') {
        normalizedPath = path.dirname(normalizedPath);
        if (normalizedPath === '.') normalizedPath = '';
      } else {
        normalizedPath = normalizedPath.replace(/\.md$/, '');
      }

      if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
      if (normalizedPath.length > 1 && !normalizedPath.endsWith('/')) normalizedPath += '/';

      const navigationHtml = await generateNavigationHtml(
          config.navigation, normalizedPath, relativePathToRoot, config, isOfflineMode
      );

      const { prevPage, nextPage } = findPageNeighbors(config.navigation, normalizedPath);

      if (prevPage) prevPage.url = relativePathToRoot + prevPage.path.substring(1);
      if (nextPage) nextPage.url = relativePathToRoot + nextPage.path.substring(1);

      const pageDataForTemplate = {
        content: htmlContent,
        pageTitle: pageFrontmatter.title || 'Untitled',
        siteTitle: config.siteTitle,
        navigationHtml, relativePathToRoot, config, frontmatter: pageFrontmatter,
        outputPath: outputHtmlPath.replace(/\\/g, '/'),
        prevPage, nextPage, currentPagePath: normalizedPath,
        headings: headings || [], isOfflineMode,
      };

      const pageHtml = await generateHtmlPage(pageDataForTemplate, isOfflineMode);
      await fs.ensureDir(path.dirname(finalOutputHtmlPath));
      await fs.writeFile(finalOutputHtmlPath, pageHtml);

      const sitemapOutputPath = isIndexFile
        ? (path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath) + '/')
        : relativePath.replace(/\.md$/, '/');

      processedPages.push({
        outputPath: sitemapOutputPath.replace(/\\/g, '/'),
        frontmatter: pageFrontmatter
      });

      // Collect Search Data
      if (searchData) {
        let pageUrl = outputHtmlPath.replace(/\\/g, '/');
        if (pageUrl.endsWith('/index.html')) pageUrl = pageUrl.substring(0, pageUrl.length - 10);
        
        searchIndexData.push({
          id: pageUrl, 
          title: searchData.title, 
          text: searchData.content, 
          headings: searchData.headings.join(' ')
        });
      }

    } catch (error) {
      console.error(`❌ Error processing ${path.relative(CWD, filePath)}:`, error);
    }
  }

  // 4. Generate Sitemap
  if (config.plugins?.sitemap !== false) {
    try {
      await generateSitemap(config, processedPages, OUTPUT_DIR, { isDev: options.isDev });
    } catch (error) {
      console.error(`❌ Error generating sitemap: ${error.message}`);
    }
  }

  // 5. Generate Search Index
  if (config.search !== false) {
    if (!options.isDev) console.log('🔍 Generating search index...');
    
    // MiniSearch build process (server-side)
    const miniSearch = new MiniSearch({
      fields: ['title', 'headings', 'text'],
      storeFields: ['title', 'id', 'text'],
      searchOptions: { boost: { title: 2, headings: 1.5 }, fuzzy: 0.2 }
    });
    
    miniSearch.addAll(searchIndexData);
    
    // Save the index JSON
    await fs.writeFile(path.join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(miniSearch.toJSON()));
    
    if (!options.isDev) console.log(`✅ Search index generated.`);
  }

  return { config, processedPages, markdownFiles };
}

// Helper function to find HTML files and sitemap.xml to clean up
async function findFilesToCleanup(dir) {
  let filesToRemove = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (item.name !== 'assets') {
        const subDirFiles = await findFilesToCleanup(fullPath);
        filesToRemove = filesToRemove.concat(subDirFiles);
      }
    } else if (item.name.endsWith('.html') || item.name === 'sitemap.xml') {
      filesToRemove.push(fullPath);
    }
  }
  return filesToRemove;
}

module.exports = { buildSite };