const fs = require('fs-extra');
const path = require('path');

const defaultConfigContent = `// config.js
module.exports = {
  siteTitle: 'My Awesome Project Docs',
  srcDir: 'docs',
  outputDir: 'site',
  theme: {
    defaultMode: 'light', // 'light' or 'dark'
  },
  navigation: [
    { title: 'Home', path: '/' }, // Corresponds to docs/index.md
    // {
    //   title: 'Category',
    //   children: [
    //     { title: 'Page 1', path: '/category/page1' },
    //   ],
    // },
  ],
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