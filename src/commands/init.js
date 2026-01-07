// Source file from the docmd project — https://github.com/mgks/docmd

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { version } = require('../../package.json');

const defaultConfigContent = `// docmd.config.js: basic config for docmd
module.exports = {
  // Core Site Metadata
  siteTitle: 'docmd',
  // Define a base URL for your site, crucial for SEO and absolute paths
  // No trailing slash
  siteUrl: '', // Replace with your actual deployed URL

  // Logo Configuration
  logo: {
    light: 'assets/images/docmd-logo-light.png', // Path relative to outputDir root
    dark: 'assets/images/docmd-logo-dark.png',   // Path relative to outputDir root
    alt: 'docmd logo',                      // Alt text for the logo
    href: './',                              // Link for the logo, defaults to site root
  },

  // Directory Configuration
  srcDir: 'docs',       // Source directory for Markdown files
  outputDir: 'site',    // Directory for generated static site

  // Search Configuration
  search: true,        // Enable/disable search functionality

  // Build Options
  minify: true,        // Enable/disable HTML/CSS/JS minification

  // Sidebar Configuration
  sidebar: {
    collapsible: true,        // or false to disable
    defaultCollapsed: false,  // or true to start collapsed
  },

  // Theme Configuration
  theme: {
    name: 'sky',            // Themes: 'default', 'sky'
    defaultMode: 'light',   // Initial color mode: 'light' or 'dark'
    enableModeToggle: true, // Show UI button to toggle light/dark modes
    positionMode: 'top', // 'top' or 'bottom' for the theme toggle
    codeHighlight: true,    // Enable/disable codeblock highlighting and import of highlight.js
    customCss: [            // Array of paths to custom CSS files
      // 'assets/css/custom.css', // Custom TOC styles
    ]
  },

  // Custom JavaScript Files
  customJs: [  // Array of paths to custom JS files, loaded at end of body
    // 'assets/js/custom-script.js', // Paths relative to outputDir root
    'assets/js/docmd-image-lightbox.js', // Image lightbox functionality
  ],

  // Content Processing
  autoTitleFromH1: true, // Set to true to automatically use the first H1 as page title
  copyCode: true, // Enable/disable the copy code button on code blocks

  // Plugins Configuration
  // Plugins are configured here. docmd will look for these keys.
  plugins: {
    // SEO Plugin Configuration
    // Most SEO data is pulled from page frontmatter (title, description, image, etc.)
    // These are fallbacks or site-wide settings.
    seo: {
      // Default meta description if a page doesn't have one in its frontmatter
      defaultDescription: 'docmd is a Node.js command-line tool for generating beautiful, lightweight static documentation sites from Markdown files.',
      openGraph: { // For Facebook, LinkedIn, etc.
        // siteName: 'docmd Documentation', // Optional, defaults to config.siteTitle
        // Default image for og:image if not specified in page frontmatter
        // Path relative to outputDir root
        defaultImage: 'assets/images/docmd-preview.png',
      },
      twitter: { // For Twitter Cards
        cardType: 'summary_large_image',     // 'summary', 'summary_large_image'
        // siteUsername: '@docmd_handle',    // Your site's Twitter handle (optional)
        // creatorUsername: '@your_handle',  // Default author handle (optional, can be overridden in frontmatter)
      }
    },
    // Analytics Plugin Configuration
    analytics: {
      // Google Analytics 4 (GA4)
      googleV4: {
        measurementId: 'G-X9WTDL262N' // Replace with your actual GA4 Measurement ID
      }
    },
    // Enable Sitemap plugin
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
    // Add other future plugin configurations here by their key
  },

  // "Edit this page" Link Configuration
  editLink: {
    enabled: false,
    // The URL to the folder containing your docs in the git repo
    // Note: It usually ends with /edit/main/docs or /blob/main/docs
    baseUrl: 'https://github.com/mgks/docmd/edit/main/docs',
    text: 'Edit this page on GitHub'
  },

  // Navigation Structure (Sidebar)
  // Icons are kebab-case names from Lucide Icons (https://lucide.dev/)
  navigation: [
      { title: 'Welcome', path: '/', icon: 'home' }, // Corresponds to docs/index.md
      {
        title: 'Getting Started',
        icon: 'rocket',
        path: '#',
        collapsible: true, // This makes the menu section collapsible
        children: [
          { title: 'Documentation', path: 'https://docmd.mgks.dev', icon: 'scroll', external: true },
          { title: 'Installation', path: 'https://docmd.mgks.dev/getting-started/installation', icon: 'download', external: true },
          { title: 'Basic Usage', path: 'https://docmd.mgks.dev/getting-started/basic-usage', icon: 'play', external: true },
          { title: 'Content', path: 'https://docmd.mgks.dev/content', icon: 'layout-template', external: true },
        ],
      },
      // External links:
      { title: 'GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true },
      { title: 'Support the Project', path: 'https://github.com/sponsors/mgks', icon: 'heart', external: true },
    ],
    
  pageNavigation: true, // Enable previous / next page navigation at the bottom of each page

  // Sponsor Ribbon Configuration
  Sponsor: {
    enabled: false,
    title: 'Support docmd',
    link: 'https://github.com/sponsors/mgks',
  },

  // Footer Configuration
  // Markdown is supported here.
  footer: '© ' + new Date().getFullYear() + ' Project.',

  // Favicon Configuration
  // Path relative to outputDir root
  favicon: 'assets/favicon.ico',
};
`;

const defaultIndexMdContent = `---
title: "Welcome"
description: "Your documentation starts here."
---

# Hello, docmd!

Start writing your Markdown content here.
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

  // Check for the config.js as well to warn the user
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
    
    // Create subdirectories if they don't exist
    if (!await fs.pathExists(assetsCssDir)) {
      await fs.ensureDir(assetsCssDir);
      console.log('📁 Created `assets/css/` directory');
    }
    
    if (!await fs.pathExists(assetsJsDir)) {
      await fs.ensureDir(assetsJsDir);
      console.log('📁 Created `assets/js/` directory');
    }
    
    if (!await fs.pathExists(assetsImagesDir)) {
      await fs.ensureDir(assetsImagesDir);
      console.log('📁 Created `assets/images/` directory');
    }
  }
  
  // Write config file if it doesn't exist or user confirmed override
  if (!await fs.pathExists(configFile) || shouldOverride) {
    await fs.writeFile(configFile, defaultConfigContent, 'utf8');
    console.log(`📄 ${shouldOverride ? 'Updated' : 'Created'} \`docmd.config.js\``);
  } else {
    console.log('⏭️  Skipped existing `docmd.config.js`');
  }
  
  // Write index.md file if it doesn't exist or user confirmed override
  if (!await fs.pathExists(indexMdFile)) {
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