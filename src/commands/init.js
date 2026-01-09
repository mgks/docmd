// Source file from the docmd project — https://github.com/docmd-io/docmd

const fs = require('../core/fs-utils');
const path = require('path');
const readline = require('readline');
const { version } = require('../../package.json');

const defaultConfigContent = `// docmd.config.js
module.exports = {
  // --- Core Metadata ---
  siteTitle: 'My Documentation',
  siteUrl: '', // e.g. https://mysite.com (Critical for SEO/Sitemap)

  // --- Branding ---
  logo: {
    light: 'assets/images/docmd-logo-dark.png',
    dark: 'assets/images/docmd-logo-light.png',
    alt: 'Logo',
    href: './',
  },
  favicon: 'assets/favicon.ico',

  // --- Source & Output ---
  srcDir: 'docs',
  outputDir: 'site',

  // --- Theme & Layout ---
  theme: {
    name: 'sky',            // Options: 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'system',  // 'light', 'dark', or 'system'
    enableModeToggle: true, // Show mode toggle button
    positionMode: 'top',    // 'top' or 'bottom'
    codeHighlight: true,    // Enable Highlight.js
    customCss: [],          // e.g. ['assets/css/custom.css']
  },

  // --- Features ---
  search: true,           // Built-in offline search
  minify: true,           // Minify HTML/CSS/JS in build
  autoTitleFromH1: true,  // Auto-generate page title from first H1
  copyCode: true,         // Show "copy" button on code blocks
  pageNavigation: true,   // Prev/Next buttons at bottom

  // --- Navigation (Sidebar) ---
  navigation: [
    { title: 'Introduction', path: '/', icon: 'home' },
    {
      title: 'Guide',
      icon: 'book-open',
      collapsible: true,
      children: [
        { title: 'Getting Started', path: 'https://docs.docmd.io/getting-started/installation', icon: 'rocket', external: true },
        { title: 'Configuration', path: 'https://docs.docmd.io/configuration', icon: 'settings', external: true },
      ],
    },
    { title: 'Live Editor', path: 'https://live.docmd.io', icon: 'pencil-ruler', external: true },
    { title: 'GitHub', path: 'https://github.com/docmd-io/docmd', icon: 'github', external: true },
  ],

  // --- Plugins ---
  plugins: {
    seo: {
      defaultDescription: 'Documentation built with docmd.',
      openGraph: {
        defaultImage: '',   // e.g. 'assets/images/og-image.png'
      },
      twitter: {
        cardType: 'summary_large_image',
      }
    },
    analytics: {
      googleV4: {
        measurementId: 'G-X9WTDL262N' // Replace with your Google Analytics Measurement ID
      }
    },
    sitemap: {
      defaultChangefreq: 'weekly',  // e.g. 'daily', 'weekly', 'monthly'
      defaultPriority: 0.8          // Priority between 0.0 and 1.0
    }
  },

  // --- Footer ---
  footer: '© ' + new Date().getFullYear() + ' My Project. Built with [docmd](https://docmd.io).',
  
  // --- Edit Link ---
  editLink: {
    enabled: false,
    baseUrl: 'https://github.com/USERNAME/REPO/edit/main/docs',
    text: 'Edit this page'
  }
};
`;

const defaultIndexMdContent = `---
title: "Welcome"
description: "Welcome to your new documentation site."
---

# Welcome to Your Docs

Congratulations! You have successfully initialized a new **docmd** project.

## 🚀 Quick Start

You are currently viewing the content of \`docs/index.md\`.

\`\`\`bash
npm start   # Start the dev server
docmd build # Build for production
\`\`\`

## ✨ Features Demo

docmd comes with built-in components to make your documentation beautiful.

::: callout tip
**Try this:** Edit this file and save it. The browser will live reload instantly!
:::

### Container Examples

::: card Flexible Structure
**Organize your way.**
Create Markdown files in the \`docs/\` folder and map them in \`docmd.config.js\`.
:::

::: tabs
== tab "Simple"
This is a simple tab content.

== tab "Nested"
::: callout info
You can even nest other components inside tabs!
:::
:::

## 📚 Next Steps

*   [Check the Official Documentation](https://docs.docmd.io)
*   [Customize your Theme](https://docs.docmd.io/theming)
*   [Deploy to GitHub Pages](https://docs.docmd.io/deployment)
`;

const defaultPackageJson = {
  name: "my-docs",
  version: "0.0.1",
  private: true,
  scripts: {
    "dev": "docmd dev",
    "build": "docmd build",
    "preview": "npx serve site"
  },
  dependencies: {
    "@mgks/docmd": `^${version}`
  }
};

async function initProject() {
  const baseDir = process.cwd();
  const packageJsonFile = path.join(baseDir, 'package.json');
  const configFile = path.join(baseDir, 'docmd.config.js');
  const docsDir = path.join(baseDir, 'docs');
  const indexMdFile = path.join(docsDir, 'index.md');
  const assetsDir = path.join(baseDir, 'assets');
  const assetsCssDir = path.join(assetsDir, 'css');
  const assetsJsDir = path.join(assetsDir, 'js');
  const assetsImagesDir = path.join(assetsDir, 'images');
  
  const existingFiles = [];
  const dirExists = {
    docs: false,
    assets: false
  };
  
  // Check if package.json exists
  if (!await fs.pathExists(packageJsonFile)) {
    await fs.writeJson(packageJsonFile, defaultPackageJson, { spaces: 2 });
    console.log('📦 Created `package.json` (Deployment Ready)');
  } else {
    console.log('⏭️  Skipped existing `package.json`');
  }

  // Check each file individually
  if (await fs.pathExists(configFile)) {
    existingFiles.push('docmd.config.js');
  }

  // Check for the legacy config.js
  const oldConfigFile = path.join(baseDir, 'config.js');
  if (await fs.pathExists(oldConfigFile)) {
    existingFiles.push('config.js');
  }
  
  // Check if docs directory exists
  if (await fs.pathExists(docsDir)) {
    dirExists.docs = true;
    if (await fs.pathExists(indexMdFile)) {
      existingFiles.push('docs/index.md');
    }
  }

  // Check if assets directory exists
  if (await fs.pathExists(assetsDir)) {
    dirExists.assets = true;
  }
  
  // Determine if we should override existing files
  let shouldOverride = false;
  if (existingFiles.length > 0) {
    console.warn('⚠️  The following files already exist:');
    existingFiles.forEach(file => console.warn(`   - ${file}`));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Do you want to override these files? (y/N): ', resolve);
    });
    
    rl.close();
    
    shouldOverride = answer.toLowerCase() === 'y';
    
    if (!shouldOverride) {
      console.log('⏭️  Skipping existing files. Will only create new files.');
    }
  }
  
  // Create docs directory if it doesn't exist
  if (!dirExists.docs) {
    await fs.ensureDir(docsDir);
    console.log('📁 Created `docs/` directory');
  } else {
    console.log('📁 Using existing `docs/` directory');
  }

  // Create assets directory structure if it doesn't exist
  if (!dirExists.assets) {
    await fs.ensureDir(assetsDir);
    await fs.ensureDir(assetsCssDir);
    await fs.ensureDir(assetsJsDir);
    await fs.ensureDir(assetsImagesDir);
    console.log('📁 Created `assets/` directory with css, js, and images subdirectories');
  } else {
    console.log('📁 Using existing `assets/` directory');
    
    if (!await fs.pathExists(assetsCssDir)) await fs.ensureDir(assetsCssDir);
    if (!await fs.pathExists(assetsJsDir)) await fs.ensureDir(assetsJsDir);
    if (!await fs.pathExists(assetsImagesDir)) await fs.ensureDir(assetsImagesDir);
  }
  
  // Write config file if it doesn't exist or user confirmed override
  if (!await fs.pathExists(configFile) || shouldOverride) {
    await fs.writeFile(configFile, defaultConfigContent, 'utf8');
    console.log(`📄 ${shouldOverride ? 'Updated' : 'Created'} \`docmd.config.js\``);
  } else {
    console.log('⏭️  Skipped existing `docmd.config.js`');
  }
  
  // Write index.md file if it doesn't exist or user confirmed override
  if (!await fs.pathExists(indexMdFile) || shouldOverride) {
    await fs.writeFile(indexMdFile, defaultIndexMdContent, 'utf8');
    console.log('📄 Created `docs/index.md`');
  } else if (shouldOverride) {
    await fs.writeFile(indexMdFile, defaultIndexMdContent, 'utf8');
    console.log('📄 Updated `docs/index.md`');
  } else {
    console.log('⏭️  Skipped existing `docs/index.md`');
  }
  
  console.log('✅ Project initialization complete!');
  console.log('👉 Run `npm install` to setup dependencies.');
}

module.exports = { initProject };