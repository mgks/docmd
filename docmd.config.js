// Source file from the docmd project — https://github.com/docmd-io/docmd

module.exports = {
  siteTitle: 'docmd dev',
  srcDir: 'docs',
  outputDir: 'site',
  logo: {
    light: 'assets/images/docmd-logo-dark.png',
    dark: 'assets/images/docmd-logo-light.png',
    alt: 'docmd logo',
    href: './'
  },
  theme: {
    name: 'default',
    defaultMode: 'system',
    enableModeToggle: true,
    positionMode: 'top'
  },
  sidebar: {
    collapsible: true,
    defaultCollapsed: false,
  },
  navigation: [
    { title: 'Playground', path: '/', icon: 'flask-conical' }
  ]
};

// docmd.config.js
module.exports = {
  siteTitle: 'Playground Documentation',
  srcDir: 'docs',
  outputDir: 'site',
  logo: {
    light: 'assets/images/docmd-logo-dark.png',
    dark: 'assets/images/docmd-logo-light.png',
    alt: 'Logo',
    href: './',
  },
  favicon: 'assets/favicon.ico',
  theme: {
    name: 'sky',
    defaultMode: 'system',
    enableModeToggle: true,
    positionMode: 'top',
    codeHighlight: true,
    customCss: [],
  },
  search: true,
  minify: true,
  autoTitleFromH1: true,
  copyCode: true,
  pageNavigation: true,
  navigation: [
    { title: 'Playground', path: '/', icon: 'flask-conical' },
    {
      title: 'Guide',
      icon: 'book-open',
      collapsible: true,
      children: [
        { title: 'Getting Started', path: 'https://docs.docmd.io/getting-started/installation', icon: 'rocket', external: true },
        { title: 'Configuration', path: 'https://docs.docmd.io/configuration', icon: 'settings', external: true },
      ],
    },
    { title: 'GitHub', path: 'https://github.com/docmd-io/docmd', icon: 'github', external: true },
  ],
  plugins: {
    seo: {
      defaultDescription: 'Documentation built with docmd.',
      openGraph: {
        defaultImage: 'assets/images/docmd-preview.png',
      },
      twitter: {
        cardType: 'summary_large_image',
      }
    },
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
  },
  footer: '© ' + new Date().getFullYear() + ' My Project. Built with [docmd](https://docmd.io).',
  editLink: {
    enabled: false,
    baseUrl: 'https://github.com/USERNAME/REPO/edit/main/docs',
    text: 'Edit this page'
  }
};