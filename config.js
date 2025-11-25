// Source file from the docmd project — https://github.com/mgks/docmd

// Configuration for the docmd project's own documentation
module.exports = {
  // Core Site Metadata
  siteTitle: 'docmd',
  // Define a base URL for your site, crucial for SEO and absolute paths
  // No trailing slash
  siteUrl: 'https://docmd.mgks.dev', // Replace with your actual deployed URL

  // Logo Configuration
  logo: {
    light: '/assets/images/docmd-logo-light.png', // Path relative to outputDir root
    dark: '/assets/images/docmd-logo-dark.png',   // Path relative to outputDir root
    alt: 'docmd Logo',                      // Alt text for the logo
    href: '/',                              // Link for the logo, defaults to site root
  },

  // Directory Configuration
  srcDir: 'docs',       // Source directory for Markdown files
  outputDir: 'site',    // Directory for generated static site

  // Sidebar Configuration
  sidebar: {
    collapsible: true,        // or false to disable
    defaultCollapsed: false,  // or true to start collapsed
  },

  // Theme Configuration
  theme: {
    name: 'sky',          // Themes: 'default', 'sky', 'retro', 'ruby'
    defaultMode: 'light',   // Initial color mode: 'light' or 'dark'
    enableModeToggle: true, // Show UI button to toggle light/dark modes
    positionMode: 'top',    // 'top' or 'bottom' for the theme toggle
    codeHighlight: true,   // Enable/disable codeblock highlighting and import of highlight.js
    customCss: [            // Array of paths to custom CSS files
      // '/assets/css/custom.css', // Custom TOC styles
    ],
  },

  // Custom JavaScript Files
  customJs: [               // Array of paths to custom JS files, loaded at end of body
     '/assets/js/docmd-image-lightbox.js', // Image lightbox functionality
  ],

  // Content Processing
  autoTitleFromH1: true, // Set to true to automatically use the first H1 as page title
  copyCode: true, // Enable/disable the copy code button on code blocks

  // Plugins Configuration (Object format)
  // Plugins are configured here. docmd will look for these keys.
  plugins: {
    // SEO Plugin Configuration
    // These are site-wide fallbacks. For detailed per-page SEO controls,
    // including structured data (LD+JSON), use the `seo` key in your page's frontmatter.
    // See the SEO plugin documentation for all available frontmatter options.
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
      { title: 'Welcome', path: '/', icon: 'feather' },
      { title: 'Overview', path: '/overview', icon: 'home' },
      // { title: 'Support the Project', path: 'https://github.com/sponsors/mgks', icon: 'heart', external: true },
      {
        title: 'Getting Started',
        icon: 'rocket',
        path: '/getting-started/',
        children: [
          { title: 'Installation', path: '/getting-started/installation', icon: 'download' },
          { title: 'Basic Usage', path: '/getting-started/basic-usage', icon: 'play' },
        ],
      },
      {
        title: 'Content',
        icon: 'layout-template',
        path: '/content/',
        collapsible: true,
        children: [
          { title: 'Frontmatter', path: '/content/frontmatter', icon: 'file-text' },
          { title: 'Markdown Syntax', path: '/content/markdown-syntax', icon: 'code-2' },
          { title: 'Images', path: '/content/images', icon: 'image' },
          { title: 'Mermaid Diagrams', path: '/content/mermaid', icon: 'network' },
          {
            title: 'Custom Containers',
            path: '/content/containers/',
            icon: 'box',
            collapsible: true,
            children: [
              { title: 'Callouts', path: '/content/containers/callouts', icon: 'megaphone' },
              { title: 'Cards', path: '/content/containers/cards', icon: 'panel-top' },
              { title: 'Steps', path: '/content/containers/steps', icon: 'list-ordered' },
              { title: 'Tabs', path: '/content/containers/tabs', icon: 'columns-3' },
              { title: 'Buttons', path: '/content/containers/buttons', icon: 'mouse-pointer-click' },
              { title: 'Nested Containers', path: '/content/containers/nested-containers', icon: 'folder-tree' },
            ]
          },
          { title: 'No-Style Pages', path: '/content/no-style-pages', icon: 'layout' },
          { title: 'No-Style Example', path: '/content/no-style-example', icon: 'sparkles' },
        ],
      },
      { title: 'Configuration', path: '/configuration', icon: 'settings' },
      {
        title: 'Theming',
        icon: 'palette',
        path: '/theming/',
        collapsible: true,
        children: [
          { title: 'Available Themes', path: '/theming/available-themes', icon: 'layout-grid' },
          { title: 'Light & Dark Mode', path: '/theming/light-dark-mode', icon: 'sun-moon' },
          { title: 'Custom CSS & JS', path: '/theming/custom-css-js', icon: 'file-code' },
          { title: 'Icons', path: '/theming/icons', icon: 'pencil-ruler' },
        ],
      },
      {
        title: 'Plugins',
        icon: 'puzzle',
        path: '/plugins/',
        collapsible: true,
        children: [
          { title: 'SEO & Meta Tags', path: '/plugins/seo', icon: 'search' },
          { title: 'Analytics', path: '/plugins/analytics', icon: 'bar-chart' },
          { title: 'Sitemap', path: '/plugins/sitemap', icon: 'map' },
        ],
      },
      {
        title: 'Recipes',
        icon: 'chef-hat',
        path: '/recipes/',
        collapsible: true,
        children: [
          { title: 'Landing Page', path: '/recipes/landing-page', icon: 'panel-top' },
          { title: 'Custom Fonts', path: '/recipes/custom-fonts', icon: 'type-outline' },
          { title: 'Favicon', path: '/recipes/favicon', icon: 'circle-dashed' },
        ],
      },
      { title: 'CLI Commands', path: '/cli-commands', icon: 'terminal' },
      { title: 'Deployment', path: '/deployment', icon: 'upload-cloud' },
      { title: 'Contributing', path: '/contributing', icon: 'users-2' },
      { title: 'Comparison', path: '/comparison', icon: 'shapes' },

      { title: 'GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true },
      { title: 'Discussions', path: 'https://github.com/mgks/docmd/discussions', icon: 'message-square', external: true },
      { title: 'Issues', path: 'https://github.com/mgks/docmd/issues', icon: 'badge-alert', external: true }
  ],

  pageNavigation: true, // Enable previous / next page navigation at the bottom of each page

  // Sponsor Ribbon Configuration
  sponsor: {
    enabled: true,                    // Enable/disable the sponsor ribbon
    title: 'Sponsor',     // Text to display on the ribbon
    link: 'https://github.com/sponsors/mgks', // URL for the sponsor link
  },

  // Footer Configuration
  // Markdown is supported here.
  footer: '© ' + new Date().getFullYear() + ' Project docmd.',

  // Favicon Configuration
  // Path relative to outputDir root
  favicon: '/assets/favicon.ico',
};