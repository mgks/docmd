// config.js (for docmd's own documentation)
module.exports = {
  // Core Site Metadata
  siteTitle: 'docmd',
  // Define a base URL for your site, crucial for SEO and absolute paths
  // No trailing slash
  siteUrl: 'https://docmd.mgks.dev', // Replace with your actual deployed URL

  // Logo Configuration
  logo: {
    light: '/assets/images/logo-light.png', // Path relative to outputDir root
    dark: '/assets/images/logo-dark.png',   // Path relative to outputDir root
    alt: 'docmd Logo',                      // Alt text for the logo
    href: '/',                              // Link for the logo, defaults to site root
    // height: '30px',                      // Optional: control via CSS is often better
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
      '/assets/css/toc.css', // Custom TOC styles
    ],
    // options: { /* Future: theme-specific options */ }
  },

  // Custom JavaScript Files
  customJs: [               // Array of paths to custom JS files, loaded at end of body
    // '/assets/js/custom-script.js', // Paths relative to outputDir root
  ],

  // Plugins Configuration (Object format)
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
        // Default image for `og:image` if not specified in page frontmatter
        // Path relative to outputDir root
        defaultImage: '/assets/images/docmd-preview.png',
      },
      twitter: { // For Twitter Cards
        cardType: 'summary_large_image', // 'summary', 'summary_large_image'
        // siteUsername: '@docmd_handle',    // Your site's Twitter handle (optional)
        // creatorUsername: '@your_handle', // Default author handle (optional, can be overridden in frontmatter)
      }
    },
    // Analytics Plugin Configuration
    analytics: {
      // Google Analytics 4 (GA4)
      googleV4: {
        measurementId: 'G-8QVBDQ4KM1' // Replace with your actual GA4 Measurement ID
      },
      // Google Universal Analytics (UA) - Legacy (optional)
      // googleUA: {
      //   trackingId: 'UA-XXXXXXXXX-Y' // Replace with your actual UA Tracking ID
      // }
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
      { title: 'GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true },
      { title: 'Home', path: '/', icon: 'home' }, // Corresponds to docs/index.md
      {
        title: 'Getting Started',
        icon: 'rocket', // Lucide: rocket
        path: '/getting-started/', // Path to the index.md in this folder
        children: [
          { title: 'Installation', path: '/getting-started/installation', icon: 'download' }, // Lucide: download
          { title: 'Basic Usage', path: '/getting-started/basic-usage', icon: 'play' },      // Lucide: play
        ],
      },
      {
        title: 'Writing Content',
        icon: 'pencil', // Lucide: pencil
        path: '/writing-content/',
        children: [
          { title: 'Frontmatter', path: '/writing-content/frontmatter', icon: 'file-text' },      // Lucide: file-text
          { title: 'Markdown Syntax', path: '/writing-content/markdown-syntax', icon: 'code-2' }, // Lucide: code-2
          { title: 'Custom Containers', path: '/writing-content/custom-containers', icon: 'box' }, // Lucide: box
        ],
      },
      { title: 'Configuration', path: '/configuration', icon: 'settings' }, // Lucide: settings or cog
      {
        title: 'Theming',
        icon: 'palette', // Lucide: palette
        path: '/theming/',
        children: [
          { title: 'Available Themes', path: '/theming/available-themes', icon: 'layout-grid' }, // Lucide: layout-grid
          { title: 'Light & Dark Mode', path: '/theming/light-dark-mode', icon: 'sun-moon' },     // Lucide: sun-moon
          { title: 'Custom CSS & JS', path: '/theming/custom-css-js', icon: 'file-code' },     // Lucide: file-code
          { title: 'Icons', path: '/theming/icons', icon: 'image' },                        // Lucide: image
        ],
      },
      {
        title: 'Plugins',
        icon: 'puzzle', // Lucide: puzzle
        path: '/plugins/',
        children: [
          { title: 'SEO & Meta Tags', path: '/plugins/seo', icon: 'search' },      // Lucide: search
          { title: 'Analytics', path: '/plugins/analytics', icon: 'bar-chart' },   // Lucide: bar-chart
          { title: 'Sitemap', path: '/plugins/sitemap', icon: 'map' },             // Lucide: map
        ],
      },
      { title: 'CLI Commands', path: '/cli-commands', icon: 'terminal' }, // Lucide: terminal
      { title: 'Deployment', path: '/deployment', icon: 'upload-cloud' }, // Lucide: upload-cloud
      { title: 'Contributing', path: '/contributing', icon: 'users-2' },   // Lucide: users-2
      // Example of an external link:
  ],

  // Footer Configuration
  // Markdown is supported here.
  footer: '© ' + new Date().getFullYear() + ' Project docmd.',

  // Favicon Configuration
  // Path relative to outputDir root
  favicon: '/assets/favicon.ico',
};