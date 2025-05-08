const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('../core/config-loader');
const { processMarkdownFile } = require('../core/file-processor');
const { generateHtmlPage, generateNavigationHtml } = require('../core/html-generator');

async function buildSite(configPath) {
  const config = await loadConfig(configPath);
  const CWD = process.cwd();
  const SRC_DIR = path.resolve(CWD, config.srcDir);
  const OUTPUT_DIR = path.resolve(CWD, config.outputDir);

  if (!await fs.pathExists(SRC_DIR)) {
    throw new Error(`Source directory not found: ${SRC_DIR}`);
  }

  // Clean output directory
  await fs.emptyDir(OUTPUT_DIR);
  console.log(`🧹 Cleaned output directory: ${OUTPUT_DIR}`);

  // Copy static assets
  const assetsSrcDir = path.join(__dirname, '..', 'assets');
  const assetsDestDir = path.join(OUTPUT_DIR, 'assets');
  if (await fs.pathExists(assetsSrcDir)) {
    await fs.copy(assetsSrcDir, assetsDestDir);
    console.log(`📂 Copied assets to ${assetsDestDir}`);
  } else {
    console.warn(`⚠️  Assets source directory not found: ${assetsSrcDir}`);
  }
  // Copy highlight.js themes from node_modules (or include directly in assets)
  // For simplicity now, assume they are in src/assets/css
  const lightThemePath = path.join(__dirname, '..', 'assets', 'css', 'highlight-light.css');
  const darkThemePath = path.join(__dirname, '..', 'assets', 'css', 'highlight-dark.css');

  if (!await fs.pathExists(lightThemePath) || !await fs.pathExists(darkThemePath)) {
      console.warn(`⚠️ Highlight.js themes not found in assets. Please add:
      - ${lightThemePath} (e.g., from 'node_modules/highlight.js/styles/atom-one-light.css')
      - ${darkThemePath} (e.g., from 'node_modules/highlight.js/styles/atom-one-dark.css')`);
  }


  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(SRC_DIR);
  if (markdownFiles.length === 0) {
      console.warn(`⚠️ No Markdown files found in ${SRC_DIR}. Nothing to build.`);
      return;
  }
  console.log(`📄 Found ${markdownFiles.length} markdown files.`);

  for (const mdFilePath of markdownFiles) {
    const relativeMdPath = path.relative(SRC_DIR, mdFilePath);
    let outputHtmlPath = relativeMdPath.replace(/\.md$/, '.html');
    if (path.basename(outputHtmlPath) === 'index.html' && path.dirname(outputHtmlPath) === '.') {
        // Root index.md -> site/index.html
    } else if (path.basename(outputHtmlPath) === 'index.html') {
        // folder/index.md -> site/folder/index.html
    } else {
        // folder/file.md -> site/folder/file.html
    }
    const finalOutputHtmlPath = path.join(OUTPUT_DIR, outputHtmlPath);

    const depth = outputHtmlPath.split(path.sep).length -1;
    const relativePathToRoot = depth > 0 ? '../'.repeat(depth) : './';

    const { frontmatter, htmlContent } = await processMarkdownFile(mdFilePath);

    const currentPagePathForNav = outputHtmlPath.replace(/\\/g, '/'); // Normalize for nav comparison

    const navigationHtml = await generateNavigationHtml(
        config.navigation,
        currentPagePathForNav,
        relativePathToRoot
    );

    const pageHtml = await generateHtmlPage({
      content: htmlContent,
      pageTitle: frontmatter.title || 'Untitled',
      description: frontmatter.description,
      siteTitle: config.siteTitle,
      navigationHtml,
      defaultTheme: config.theme.defaultTheme,
      relativePathToRoot: relativePathToRoot,
    });

    await fs.ensureDir(path.dirname(finalOutputHtmlPath));
    await fs.writeFile(finalOutputHtmlPath, pageHtml);
    console.log(`✅ Generated: ${path.relative(CWD, finalOutputHtmlPath)}`);
  }
}

async function findMarkdownFiles(dir) {
  let files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(await findMarkdownFiles(fullPath));
    } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
      files.push(fullPath);
    }
  }
  return files;
}

module.exports = { buildSite };