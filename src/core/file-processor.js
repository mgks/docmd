// Source file from the docmd project — https://github.com/mgks/docmd

const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { createMarkdownItInstance } = require('./markdown/setup');
const striptags = require('striptags');

function decodeHtmlEntities(html) {
    return html.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, "'").replace(/ /g, ' ');
}
  
function extractHeadingsFromHtml(htmlContent) {
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*?id="([^"]*)"[^>]*?>([\s\S]*?)<\/h\1>/g;
    let match;
    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1], 10);
      const id = match[2];
      const text = decodeHtmlEntities(match[3].replace(/<\/?[^>]+(>|$)/g, ''));
      headings.push({ id, level, text });
    }
    return headings;
}

function formatPathForDisplay(absolutePath) {
  const CWD = process.cwd();
  const relativePath = path.relative(CWD, absolutePath);
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  return relativePath;
}

async function processMarkdownFile(filePath, md, config) {
    const rawContent = await fs.readFile(filePath, 'utf8');
    let frontmatter, markdownContent;
  
    try {
      ({ data: frontmatter, content: markdownContent } = matter(rawContent));
    } catch (e) {
      console.error(`❌ Error parsing frontmatter in ${formatPathForDisplay(filePath)}:`);
      console.error(`   ${e.message}`);
      return null;
    }
  
    if (!frontmatter.title && config.autoTitleFromH1 !== false) {
        const h1Match = markdownContent.match(/^#\s+(.*)/m);
        if (h1Match) frontmatter.title = h1Match[1].trim();
    }
  
    let htmlContent, headings;
    if (frontmatter.noStyle === true) {
      htmlContent = markdownContent;
      headings = [];
    } else {
      htmlContent = md.render(markdownContent);
      headings = extractHeadingsFromHtml(htmlContent);
    }

    let searchData = null;
    if (!frontmatter.noindex) {
        const rawText = decodeHtmlEntities(striptags(htmlContent));
        searchData = {
            title: frontmatter.title || 'Untitled',
            content: rawText.slice(0, 5000), // Safety cap to prevent massive JSON
            headings: headings.map(h => h.text)
        };
    }
  
    return { frontmatter, htmlContent, headings, searchData };
}
  
async function findMarkdownFiles(dir) {
    let files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(await findMarkdownFiles(fullPath));
      } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
        files.push(fullPath);
      }
    }
    return files;
}

module.exports = {
  processMarkdownFile,
  createMarkdownItInstance,
  extractHeadingsFromHtml,
  findMarkdownFiles
};