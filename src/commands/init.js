const fs = require('fs-extra');
const path = require('path');

const defaultConfigContent = `// config.js: basic config for docmd
module.exports = {
  // Core Site Metadata
  siteTitle: 'docmd',
  // Define a base URL for your site, crucial for SEO and absolute paths
  // No trailing slash
  siteUrl: '', // Replace with your actual deployed URL

  // Logo Configuration
  logo: {
    light: '/assets/images/docmd-logo-light.png', // Path relative to outputDir root
    dark: '/assets/images/docmd-logo-dark.png',   // Path relative to outputDir root
    alt: 'docmd logo',                      // Alt text for the logo
    href: '/',                              // Link for the logo, defaults to site root
  },

  // Directory Configuration
  srcDir: 'docs',       // Source directory for Markdown files
  outputDir: 'site',    // Directory for generated static site

  // Theme Configuration
  theme: {
    name: 'sky',            // Themes: 'default', 'sky'
    defaultMode: 'light',   // Initial color mode: 'light' or 'dark'
    enableModeToggle: true, // Show UI button to toggle light/dark modes
    customCss: [            // Array of paths to custom CSS files
      // '/assets/css/custom.css', // Custom TOC styles
    ]
  },

  // Custom JavaScript Files
  customJs: [  // Array of paths to custom JS files, loaded at end of body
    // '/assets/js/custom-script.js', // Paths relative to outputDir root
  ],

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
        defaultImage: '/assets/images/docmd-preview.png',
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
        measurementId: 'G-8QVBDQ4KM1' // Replace with your actual GA4 Measurement ID
      }
    },
    // Enable Sitemap plugin
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
    // Add other future plugin configurations here by their key
  },

  // Navigation Structure (Sidebar)
  // Icons are kebab-case names from Lucide Icons (https://lucide.dev/)
  navigation: [
      { title: 'Welcome', path: '/', icon: 'home' }, // Corresponds to docs/index.md
      // External links:
      { title: 'GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true },
      { title: 'Documentation', path: 'https://github.com/mgks/docmd', icon: 'scroll', external: true }
  ],

  // Footer Configuration
  // Markdown is supported here.
  footer: '© ' + new Date().getFullYear() + ' Project.',

  // Favicon Configuration
  // Path relative to outputDir root
  favicon: '/assets/favicon.ico',
};
`;

const defaultIndexMdContent = `---
title: "Welcome"
description: "Your documentation starts here."
---

# Hello, docmd!

Start writing your Markdown content here.
`;

async function initProject() {
  const baseDir = process.cwd();
  const docsDir = path.join(baseDir, 'docs');
  const configFile = path.join(baseDir, 'config.js');
  const indexMdFile = path.join(docsDir, 'index.md');

  if (await fs.pathExists(configFile) || await fs.pathExists(docsDir)) {
    console.warn('⚠️  `docs/` directory or `config.js` already exists. Skipping creation to avoid overwriting.');
  } else {
    await fs.ensureDir(docsDir);
    await fs.writeFile(configFile, defaultConfigContent, 'utf8');
    await fs.writeFile(indexMdFile, defaultIndexMdContent, 'utf8');
    console.log('📄 Created `config.js`');
    console.log('📁 Created `docs/` directory with a sample `index.md`');
  }
}

module.exports = { initProject };