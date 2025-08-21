// Source file from the docmd project — https://github.com/mgks/docmd

const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('../core/config-loader');
const { createMarkdownItInstance, processMarkdownFile, findMarkdownFiles } = require('../core/file-processor');
const { generateHtmlPage, generateNavigationHtml } = require('../core/html-generator');
const { renderIcon, clearWarnedIcons } = require('../core/icon-renderer');
const { generateSitemap } = require('../plugins/sitemap');
const { version } = require('../../package.json');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

// Debug function to log navigation information
function logNavigationPaths(pagePath, navPath, normalizedPath) {
  console.log(`\nPage: ${pagePath}`);
  console.log(`Navigation Path: ${navPath}`);
  console.log(`Normalized Path: ${normalizedPath}`);
}

// Add a global or scoped flag to track if the warning has been shown in the current dev session
let highlightWarningShown = false;

// Asset version metadata - update this when making significant changes to assets
const ASSET_VERSIONS = {
  'css/docmd-main.css': { version: version, description: 'Core styles' },
  'css/docmd-theme-sky.css': { version: version, description: 'Sky theme' },
  'css/docmd-highlight-light.css': { version: version, description: 'Light syntax highlighting' },
  'css/docmd-highlight-dark.css': { version: version, description: 'Dark syntax highlighting' },
  'js/docmd-theme-toggle.js': { version: version, description: 'Theme toggle functionality' },
  // Add other assets here with their versions
};

/**
 * Format paths for display to make them relative to CWD
 * @param {string} absolutePath - The absolute path to format
 * @param {string} cwd - Current working directory
 * @returns {string} - Formatted relative path
 */
function formatPathForDisplay(absolutePath, cwd) {
  // Get the relative path from CWD
  const relativePath = path.relative(cwd, absolutePath);
  
  // If it's not a subdirectory, prefix with ./ for clarity
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  
  // Return the relative path
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

  if (!await fs.pathExists(SRC_DIR)) {
    throw new Error(`Source directory not found: ${formatPathForDisplay(SRC_DIR, CWD)}`);
  }

  // Create output directory if it doesn't exist
  await fs.ensureDir(OUTPUT_DIR);

  // Instead of emptying the entire directory, we'll selectively clean up HTML files
  // This preserves custom assets while ensuring we don't have stale HTML files
  if (await fs.pathExists(OUTPUT_DIR)) {
    const cleanupFiles = await findFilesToCleanup(OUTPUT_DIR);
    for (const file of cleanupFiles) {
      await fs.remove(file);
    }
    if (!options.isDev) {
      console.log(`🧹 Cleaned HTML files from output directory: ${formatPathForDisplay(OUTPUT_DIR, CWD)}`);
    }
  }

  // Track preserved files for summary report
  const preservedFiles = [];
  const userAssetsCopied = [];

  // Copy user assets from root assets/ directory if it exists
  if (await fs.pathExists(USER_ASSETS_DIR)) {
    const assetsDestDir = path.join(OUTPUT_DIR, 'assets');
    await fs.ensureDir(assetsDestDir);
    
    if (!options.isDev) {
      console.log(`📂 Copying user assets from ${formatPathForDisplay(USER_ASSETS_DIR, CWD)} to ${formatPathForDisplay(assetsDestDir, CWD)}...`);
    }
    
    const userAssetFiles = await getAllFiles(USER_ASSETS_DIR);
    
    for (const srcFile of userAssetFiles) {
      const relativePath = path.relative(USER_ASSETS_DIR, srcFile);
      const destFile = path.join(assetsDestDir, relativePath);
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(destFile));
      await fs.copyFile(srcFile, destFile);
      userAssetsCopied.push(relativePath);
    }
    
    if (!options.isDev && userAssetsCopied.length > 0) {
      console.log(`📦 Copied ${userAssetsCopied.length} user assets`);
    }
  }

  // Copy assets
  const assetsSrcDir = path.join(__dirname, '..', 'assets');
  const assetsDestDir = path.join(OUTPUT_DIR, 'assets');
  
  if (await fs.pathExists(assetsSrcDir)) {
    if (!options.isDev) {
      console.log(`📂 Copying docmd assets to ${formatPathForDisplay(assetsDestDir, CWD)}...`);
    }
    
    // Create destination directory if it doesn't exist
    await fs.ensureDir(assetsDestDir);
    
    // Get all files from source directory recursively
    const assetFiles = await getAllFiles(assetsSrcDir);
    
    // Copy each file individually, checking for existing files if preserve flag is set
    for (const srcFile of assetFiles) {
      const relativePath = path.relative(assetsSrcDir, srcFile);
      const destFile = path.join(assetsDestDir, relativePath);
      
      // Check if destination file already exists
      const fileExists = await fs.pathExists(destFile);
      
      // Skip if the file exists and either:
      // 1. The preserve flag is set, OR
      // 2. The file was copied from user assets (user assets take precedence)
      if (fileExists && (options.preserve || userAssetsCopied.includes(relativePath))) {
        // Skip file and add to preserved list
        preservedFiles.push(relativePath);
        if (!options.isDev && options.preserve) {
          console.log(`  Preserving existing file: ${relativePath}`);
        }
      } else {
        // Copy file (either it doesn't exist or we're not preserving)
        await fs.ensureDir(path.dirname(destFile));
        await fs.copyFile(srcFile, destFile);
      }
    }
  } else {
    console.warn(`⚠️  Assets source directory not found: ${formatPathForDisplay(assetsSrcDir, CWD)}`);
  }

  // Check for Highlight.js themes
  const lightThemePath = path.join(__dirname, '..', 'assets', 'css', 'docmd-highlight-light.css');
  const darkThemePath = path.join(__dirname, '..', 'assets', 'css', 'docmd-highlight-dark.css');

  const themesMissing = !await fs.pathExists(lightThemePath) || !await fs.pathExists(darkThemePath);

  if (themesMissing) {
    // For 'docmd build', always show.
    // For 'docmd dev', show only once per session if not already shown.
    if (!options.isDev || (options.isDev && !highlightWarningShown)) {
      console.warn(`⚠️ Highlight.js themes not found in assets. Please ensure these files exist:
      - ${path.relative(CWD, lightThemePath)}
      - ${path.relative(CWD, darkThemePath)}
    Syntax highlighting may not work correctly.`);
      if (options.isDev) {
        highlightWarningShown = true; // Mark as shown for this dev session
      }
    }
  }

  // Array to collect information about all processed pages for sitemap
  const processedPages = [];

  // Set to track processed files for dev mode
  const processedFiles = new Set();

  // Find all Markdown files in the source directory
  const markdownFiles = await findMarkdownFiles(SRC_DIR);
  if (!options.isDev) {
    console.log(`📄 Found ${markdownFiles.length} markdown files.`);
  }

  // Process each Markdown file
  for (const filePath of markdownFiles) {
    try {
      const relativePath = path.relative(SRC_DIR, filePath);
      
      // Skip file if already processed in this dev build cycle
      if (options.noDoubleProcessing && processedFiles.has(relativePath)) {
        continue;
      }
      processedFiles.add(relativePath);

      // Pass the md instance to the processor
      const processedData = await processMarkdownFile(filePath, md, config);

      // If processing failed (e.g., bad frontmatter), skip this file.
      if (!processedData) {
        continue;
      }
      
      // Destructure the valid data
      const { frontmatter: pageFrontmatter, htmlContent, headings } = processedData;
      
      const isIndexFile = path.basename(relativePath) === 'index.md';
      
      let outputHtmlPath;
      if (isIndexFile) {
        const dirPath = path.dirname(relativePath);
        outputHtmlPath = path.join(dirPath, 'index.html');
      } else {
        outputHtmlPath = relativePath.replace(/\.md$/, '/index.html');
      }

      const finalOutputHtmlPath = path.join(OUTPUT_DIR, outputHtmlPath);

      const depth = outputHtmlPath.split(path.sep).length - 1;
      const relativePathToRoot = depth > 0 ? '../'.repeat(depth) : './';

      let normalizedPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
      if (path.basename(normalizedPath) === 'index.md') {
        normalizedPath = path.dirname(normalizedPath);
        if (normalizedPath === '.') {
          normalizedPath = '';
        }
      } else {
        normalizedPath = normalizedPath.replace(/\.md$/, '');
      }

      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      if (normalizedPath.length > 1 && !normalizedPath.endsWith('/')) {
        normalizedPath += '/';
      }

      const currentPagePathForNav = normalizedPath;

      const navigationHtml = await generateNavigationHtml(
        config.navigation,
        currentPagePathForNav,
        relativePathToRoot,
        config
      );

      let prevPage = null;
      let nextPage = null;
      let currentPageIndex = -1;
      
      const flatNavigation = [];
      
      function createNormalizedPath(item) {
        if (!item.path) return null;
        return item.path.startsWith('/') ? item.path : '/' + item.path;
      }
      
      function extractNavigationItems(items) {
        if (!items || !Array.isArray(items)) return;
        
        for (const item of items) {
          if (item.external) continue;
          
          if (item.path) {
            let normalizedItemPath = createNormalizedPath(item);
            if (item.children && !normalizedItemPath.endsWith('/')) {
              normalizedItemPath += '/';
            }
            flatNavigation.push({
              title: item.title,
              path: normalizedItemPath,
            });
          }
          
          if (item.children && Array.isArray(item.children)) {
            extractNavigationItems(item.children);
          }
        }
      }
      
      extractNavigationItems(config.navigation);
      
      currentPageIndex = flatNavigation.findIndex(item => {
        const itemPath = item.path;
        const currentPagePath = normalizedPath;
        if (itemPath === currentPagePath) {
          return true;
        }
        if (itemPath.endsWith('/') && itemPath.slice(0, -1) === currentPagePath) {
          return true;
        }
        if (currentPagePath.endsWith('/') && currentPagePath.slice(0, -1) === itemPath) {
          return true;
        }        
        return false;
      });
      
      if (currentPageIndex >= 0) {
        if (currentPageIndex > 0) prevPage = flatNavigation[currentPageIndex - 1];
        if (currentPageIndex < flatNavigation.length - 1) nextPage = flatNavigation[currentPageIndex + 1];
      }
      
      if (prevPage) {
        const cleanPath = prevPage.path.startsWith('/') ? prevPage.path.substring(1) : prevPage.path;
        prevPage.url = relativePathToRoot + (cleanPath.endsWith('/') ? cleanPath : cleanPath + '/');
        if (prevPage.path === '/') prevPage.url = relativePathToRoot;
      }
      
      if (nextPage) {
        const cleanPath = nextPage.path.startsWith('/') ? nextPage.path.substring(1) : nextPage.path;
        nextPage.url = relativePathToRoot + (cleanPath.endsWith('/') ? cleanPath : cleanPath + '/');
        if (nextPage.path === '/') nextPage.url = relativePathToRoot;
      }

      const pageDataForTemplate = {
        content: htmlContent,
        pageTitle: pageFrontmatter.title || 'Untitled',
        siteTitle: config.siteTitle,
        navigationHtml,
        relativePathToRoot: relativePathToRoot,
        config: config,
        frontmatter: pageFrontmatter,
        outputPath: outputHtmlPath.replace(/\\/g, '/'),
        prevPage: prevPage,
        nextPage: nextPage,
        currentPagePath: normalizedPath,
        headings: headings || [],
      };

      const pageHtml = await generateHtmlPage(pageDataForTemplate);

      await fs.ensureDir(path.dirname(finalOutputHtmlPath));
      await fs.writeFile(finalOutputHtmlPath, pageHtml);

      const sitemapOutputPath = isIndexFile 
          ? (path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath) + '/')
          : relativePath.replace(/\.md$/, '/');

      processedPages.push({
        outputPath: sitemapOutputPath.replace(/\\/g, '/'),
        frontmatter: pageFrontmatter
      });
    } catch (error) {
      console.error(`❌ An unexpected error occurred while processing file ${path.relative(CWD, filePath)}:`, error);
    }
  }

  // Generate sitemap if enabled in config
  if (config.plugins?.sitemap !== false) {
    try {
      await generateSitemap(config, processedPages, OUTPUT_DIR, { isDev: options.isDev });
    } catch (error) {
      console.error(`❌ Error generating sitemap: ${error.message}`);
    }
  }

  // Print summary of preserved files at the end of build
  if (preservedFiles.length > 0 && !options.isDev) {
    console.log(`\n📋 Build Summary: ${preservedFiles.length} existing files were preserved:`);
    preservedFiles.forEach(file => console.log(`  - assets/${file}`));
    console.log(`\nTo update these files in future builds, run without the --preserve flag.`);
  }
  
  if (userAssetsCopied.length > 0 && !options.isDev) {
    console.log(`\n📋 User Assets: ${userAssetsCopied.length} files were copied from your assets/ directory:`);
    if (userAssetsCopied.length <= 10) {
      userAssetsCopied.forEach(file => console.log(`  - assets/${file}`));
    } else {
      userAssetsCopied.slice(0, 5).forEach(file => console.log(`  - assets/${file}`));
      console.log(`  - ... and ${userAssetsCopied.length - 5} more files`);
    }
  }

  return {
    config,
    processedPages,
    markdownFiles,
  };
}

// Helper function to find HTML files and sitemap.xml to clean up
async function findFilesToCleanup(dir) {
  const filesToRemove = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Don't delete the assets directory
      if (item.name !== 'assets') {
        const subDirFiles = await findFilesToCleanup(fullPath);
        filesToRemove.push(...subDirFiles);
      }
    } else if (
      item.name.endsWith('.html') || 
      item.name === 'sitemap.xml'
    ) {
      filesToRemove.push(fullPath);
    }
  }
  
  return filesToRemove;
}

// Helper function to recursively get all files in a directory
async function getAllFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

module.exports = { buildSite };