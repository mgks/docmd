// docmd/config.js
module.exports = {
    siteTitle: 'docmd',
    srcDir: 'docs', // Source directory for Markdown files
    outputDir: 'site', // Output directory for the static site
    theme: {
      defaultTheme: 'dark', // Default start new session with 'light' or 'dark'
      enableThemeToggle: true, // Enable theme toggle button
    },
    navigation: [
        {
            title: 'Home',
            path: '/'
        },
        {
            title: 'Getting Started',
            path: '/getting-started'
        },
    ],
}