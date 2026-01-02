// Source file from the docmd project — https://github.com/mgks/docmd

module.exports = {
  // --- Core Metadata ---
  siteTitle: 'docmd',
  siteUrl: 'https://docmd.mgks.dev', // No trailing slash

  // --- Branding ---
  logo: {
    light: '/assets/images/docmd-logo-light.png',
    dark: '/assets/images/docmd-logo-dark.png',
    alt: 'docmd Logo',
    href: '/',
  },
  favicon: '/assets/favicon.ico',

  // --- Structure ---
  srcDir: 'docs',       // Source markdown files directory
  outputDir: 'site',    // Output directory for generated site

  // --- Features & UX ---
  search: true,           // Built-in offline search
  minify: true,           // Production build optimization
  autoTitleFromH1: true,  // Auto-generate title from first H1 if frontmatter title is missing
  copyCode: true,         // Enable "copy to clipboard" on code blocks
  pageNavigation: true,   // Next/Prev links

  // --- Sidebar & Theme ---
  sidebar: {
    collapsible: true,
    defaultCollapsed: false,
  },
  theme: {
    name: 'sky',            // 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'light',   // 'light' or 'dark'
    enableModeToggle: true, // Show theme mode toggle button 
    positionMode: 'top',    // 'top' or 'bottom' of header
    codeHighlight: true,    // Enable code syntax highlighting
    customCss: [],          // Add paths relative to outputDir here
  },
  customJs: [
    '/assets/js/docmd-image-lightbox.js',
  ],

  // --- Plugins ---
  plugins: {
    seo: {
      defaultDescription: 'The minimalist, zero-config documentation generator for Node.js developers.',
      openGraph: {
        defaultImage: '/assets/images/docmd-preview.png',
      },
      twitter: {
        cardType: 'summary_large_image',
      }
    },
    analytics: {
      googleV4: {
        measurementId: 'G-8QVBDQ4KM1'
      }
    },
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
  },

  // --- Doc Source Link ---
  editLink: {
    enabled: true,
    baseUrl: 'https://github.com/mgks/docmd/edit/main/docs',
    text: 'Edit this page on GitHub'
  },

  // --- Navigation ---
  navigation: [
    { title: 'Welcome', path: '/', icon: 'feather' },
    { title: 'Overview', path: '/overview', icon: 'home' },

    {
      title: 'Getting Started',
      icon: 'rocket',
      path: '/getting-started/',
      children: [
        { title: 'Installation', path: '/getting-started/installation', icon: 'download' },
        { title: 'Basic Usage', path: '/getting-started/basic-usage', icon: 'play' },
      ],
    },

    { title: 'Configuration', path: '/configuration', icon: 'settings' },

    {
      title: 'Content',
      icon: 'layout-template',
      path: '/content/',
      collapsible: true,
      children: [
        { title: 'Markdown Syntax', path: '/content/markdown-syntax', icon: 'code-2' },
        { title: 'Frontmatter', path: '/content/frontmatter', icon: 'file-text' },
        { title: 'Images & Lightbox', path: '/content/images', icon: 'image' },
        { title: 'Search', path: '/content/search', icon: 'search' },
        { title: 'Mermaid Diagrams', path: '/content/mermaid', icon: 'network' },
        {
          title: 'Containers',
          path: '/content/containers/',
          icon: 'box',
          collapsible: true,
          children: [
            { title: 'Callouts', path: '/content/containers/callouts', icon: 'megaphone' },
            { title: 'Cards', path: '/content/containers/cards', icon: 'panel-top' },
            { title: 'Steps', path: '/content/containers/steps', icon: 'list-ordered' },
            { title: 'Tabs', path: '/content/containers/tabs', icon: 'columns-3' },
            { title: 'Collapsible', path: '/content/containers/collapsible', icon: 'chevrons-down' },
            { title: 'Changelogs', path: '/content/containers/changelogs', icon: 'history' },
            { title: 'Buttons', path: '/content/containers/buttons', icon: 'mouse-pointer-click' },
            { title: 'Nested Containers', path: '/content/containers/nested-containers', icon: 'folder-tree' },
          ]
        },
        { title: 'No-Style Pages', path: '/content/no-style-pages', icon: 'layout' },
        { title: 'Live Preview', path: '/content/live-preview', icon: 'monitor-play' },
      ],
    },

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
        { title: 'SEO & Meta', path: '/plugins/seo', icon: 'search' },
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
        { title: 'Landing Page', path: '/recipes/landing-page', icon: 'layout-template' },
        { title: 'Custom Fonts', path: '/recipes/custom-fonts', icon: 'type' },
        { title: 'Favicon', path: '/recipes/favicon', icon: 'image-plus' },
      ],
    },

    { title: 'CLI Commands', path: '/cli-commands', icon: 'terminal' },
    { title: 'Deployment', path: '/deployment', icon: 'upload-cloud' },
    { title: 'Comparison', path: '/comparison', icon: 'scale' },
    { title: 'Contributing', path: '/contributing', icon: 'git-pull-request' },

    { title: 'GitHub', path: 'https://github.com/mgks/docmd', icon: 'github', external: true },
    { title: 'Discussions', path: 'https://github.com/mgks/docmd/discussions', icon: 'message-circle', external: true },
  ],

  // --- Footer & Sponsor ---
  footer: '© ' + new Date().getFullYear() + ' Project docmd.',
  sponsor: {
    enabled: true,
    title: 'Sponsor',
    link: 'https://github.com/sponsors/mgks',
  },
};