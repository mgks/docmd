const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter'); // Uses js-yaml internally
const hljs = require('highlight.js');

// markdown-it setup
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'; // fallback
  }
});

// For custom containers (we'll implement this plugin later)
// const container = require('markdown-it-container');
// md.use(container, 'callout', { /* options */ });
// md.use(container, 'card', { /* options */ });
// md.use(container, 'steps', { /* options */ });


async function processMarkdownFile(filePath) {
  const rawContent = await fs.readFile(filePath, 'utf8');
  const { data: frontmatter, content: markdownContent } = matter(rawContent);

  if (!frontmatter.title) {
    console.warn(`⚠️  Warning: Markdown file ${filePath} is missing a 'title' in its frontmatter.`);
    // throw new Error(`Markdown file ${filePath} is missing a 'title' in its frontmatter.`);
  }

  const htmlContent = md.render(markdownContent);

  return {
    frontmatter: {
        title: "Untitled Page", // Default if not provided
        ...frontmatter
    },
    htmlContent,
    // originalPath: filePath, // Might be useful for debugging
  };
}

module.exports = { processMarkdownFile };