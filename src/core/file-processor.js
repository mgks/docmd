// src/core/file-processor.js
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const hljs = require('highlight.js');
const container = require('markdown-it-container');
const attrs = require('markdown-it-attrs');
const path = require('path');
const markdown_it_footnote = require('markdown-it-footnote');
const markdown_it_task_lists = require('markdown-it-task-lists');
const markdown_it_abbr = require('markdown-it-abbr');
const markdown_it_deflist = require('markdown-it-deflist');

/**
 * Formats an absolute path to be relative to the current working directory for cleaner logging.
 */
function formatPathForDisplay(absolutePath) {
  const CWD = process.cwd();
  const relativePath = path.relative(CWD, absolutePath);
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return `./${relativePath}`;
  }
  return relativePath;
}

// Initialize MarkdownIt with plugins and options.
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
      } catch (e) { console.error(`Error highlighting language ${lang}:`, e); }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

// Use standard markdown-it plugins for extended syntax support.
md.use(attrs, { leftDelimiter: '{', rightDelimiter: '}' });
md.use(markdown_it_footnote);
md.use(markdown_it_task_lists);
md.use(markdown_it_abbr);
md.use(markdown_it_deflist);

// Override the default image renderer to properly handle attributes like {.class}.
const defaultImageRenderer = md.renderer.rules.image;
md.renderer.rules.image = function(tokens, idx, options, env, self) {
  const renderedImage = defaultImageRenderer(tokens, idx, options, env, self);
  const nextToken = tokens[idx + 1];
  if (nextToken && nextToken.type === 'attrs_block') {
    const attrs = nextToken.attrs || [];
    const attrsStr = attrs.map(([name, value]) => `${name}="${value}"`).join(' ');
    return renderedImage.replace('<img ', `<img ${attrsStr} `);
  }
  return renderedImage;
};

// Add IDs to headings for anchor links, used by the Table of Contents.
md.use((md) => {
  const defaultRender = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline') {
      const headingText = contentToken.content;
      const id = headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
      if (id) { token.attrSet('id', id); }
    }
    return defaultRender(tokens, idx, options, env, self);
  };
});


// ===================================================================
// --- SAFE CONTAINER WRAPPER (FOR SIMPLE CONTAINERS) ---
// This wrapper creates a fence-aware version of the container plugin.
// ===================================================================
function safeContainer(mdInstance, name, options) {
    const min_markers = 3;
    const marker_str  = ':';
    const marker_char = marker_str.charCodeAt(0);
    const marker_len  = marker_str.length;

    function containerRule(state, startLine, endLine, silent) {
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let auto_closed = false;

        if (marker_char !== state.src.charCodeAt(pos)) { return false; }

        let marker_count = 1;
        pos++;
        while (pos < max && marker_char === state.src.charCodeAt(pos)) {
            marker_count++;
            pos++;
        }

        if (marker_count < min_markers) { return false; }

        const markup = state.src.slice(pos - marker_count, pos);
        const params = state.src.slice(pos, max);

        if (options.validate && !options.validate(params)) { return false; }

        if (silent) { return true; }

        let nextLine = startLine;
        for (;;) {
            nextLine++;
            if (nextLine >= endLine) {
                break;
            }

            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            // --- THIS IS THE FIREWALL ---
            // If we find a code fence, stop parsing this container.
            if (state.src.slice(pos, max).trim().startsWith('```')) {
                break;
            }
            // --- END FIREWALL ---

            if (pos < max && state.tShift[nextLine] < state.blkIndent) {
                break;
            }

            if (marker_char !== state.src.charCodeAt(pos)) { continue; }

            let pos_after_marker = state.skipChars(pos, marker_char);

            if (pos_after_marker - pos < marker_count) { continue; }

            pos = state.skipSpaces(pos_after_marker);

            if (pos < max) { continue; }

            auto_closed = true;
            break;
        }

        const old_parent = state.parentType;
        const old_line_max = state.lineMax;
        state.parentType = 'container';
        state.lineMax = nextLine;

        const open_token = state.push('container_' + name + '_open', 'div', 1);
        open_token.markup = markup;
        open_token.block = true;
        open_token.info = params;
        open_token.map = [ startLine, nextLine ];

        state.md.block.tokenize(state, startLine + 1, nextLine);

        const close_token = state.push('container_' + name + '_close', 'div', -1);
        close_token.markup = state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]);
        close_token.block = true;

        state.parentType = old_parent;
        state.lineMax = old_line_max;
        state.line = nextLine + (auto_closed ? 1 : 0);

        return true;
    }

    mdInstance.block.ruler.before('fence', 'container_' + name, containerRule, {
        alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
    });

    mdInstance.renderer.rules['container_' + name + '_open'] = options.render;
    mdInstance.renderer.rules['container_' + name + '_close'] = options.render;
}

// ===================================================================
// --- IMPLEMENTING SIMPLE CONTAINERS WITH THE SAFE WRAPPER ---
// ===================================================================

// Callouts
safeContainer(md, 'callout', {
  validate: params => params.trim().match(/^callout\s+(info|warning|tip|danger|success)$/),
  render: (tokens, idx) => {
    const token = tokens[idx];
    if (token.nesting === 1) {
      const type = token.info.trim().split(/\s+/)[1];
      return `<div class="docmd-container callout callout-${type}"><div class="callout-content">`;
    }
    return `</div></div>`;
  }
});

// Cards
safeContainer(md, 'card', {
  validate: params => params.trim().startsWith('card'),
  render: (tokens, idx) => {
    const token = tokens[idx];
    if (token.nesting === 1) {
      const titleText = token.info.trim().substring('card'.length).trim();
      let titleHtml = titleText ? `<div class="card-title">${md.renderInline(titleText)}</div>` : '';
      return `<div class="docmd-container card">${titleHtml}<div class="card-content">`;
    }
    return `</div></div>`;
  }
});

// Buttons (Self-closing)
safeContainer(md, 'button', {
    validate: params => params.trim().startsWith('button'),
    render: (tokens, idx) => {
        if (tokens[idx].nesting === 1) {
            let info = tokens[idx].info.trim().substring('button'.length).trim();
            let colorStyle = '';
            const colorMatch = info.match(/color:(#?\w+)/);
            if (colorMatch) {
                info = info.replace(colorMatch[0], '').trim();
                colorStyle = ` style="background-color: ${colorMatch[1]}"`;
            }
            const parts = info.split(/\s+/);
            const url = parts.pop() || '#';
            const text = parts.join(' ').replace(/_/g, ' ') || 'Button';
            return `<a href="${url}" class="docmd-button"${colorStyle}>${md.renderInline(text)}</a>`;
        }
        return '';
    }
});

// Steps
safeContainer(md, 'steps', {
  validate: params => params.trim() === 'steps',
  render: (tokens, idx) => {
    if (tokens[idx].nesting === 1) {
      return `<div class="docmd-container steps">`;
    }
    return `</div>`;
  }
});


// ===================================================================
// --- TABS (CUSTOM BLOCK PARSER) ---
// ===================================================================

function tabsPlugin(md) {
    function tabsRule(state, startLine, endLine, silent) {
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        if (state.src.slice(start, max).trim() !== '::: tabs') {
            return false;
        }

        if (silent) { return true; }

        let nextLine = startLine;
        let found = false;
        while (nextLine < endLine) {
            nextLine++;
            let lineStr = state.getLines(nextLine, nextLine + 1, state.blkIndent, false);
            if (lineStr.trim() === ':::') {
                found = true;
                break;
            }
        }

        if (!found) { return false; }

        const content = state.getLines(startLine + 1, nextLine, 0, true);
        const tabRegex = /==\s+tab\s+"([^"]+)"/g;
        let match;
        const tabs = [];
        let lastIndex = 0;

        while ((match = tabRegex.exec(content)) !== null) {
            if (tabs.length > 0) {
                tabs[tabs.length - 1].content = content.slice(lastIndex, match.index).trim();
            }
            tabs.push({ title: match[1], content: '' });
            lastIndex = tabRegex.lastIndex;
        }
        if (tabs.length > 0) {
            tabs[tabs.length - 1].content = content.slice(lastIndex).trim();
        }

        state.line = nextLine + 1;

        let token = state.push('tabs_open', 'div', 1);
        token.attrs = [['class', 'docmd-tabs']];

        token = state.push('tabs_nav_open', 'div', 1);
        token.attrs = [['class', 'docmd-tabs-nav']];
        tabs.forEach((tab, index) => {
            let navItem = state.push('tabs_nav_item', 'div', 0);
            navItem.attrs = [['class', 'docmd-tabs-nav-item ' + (index === 0 ? 'active' : '')]];
            navItem.content = tab.title;
        });
        token = state.push('tabs_nav_close', 'div', -1);

        token = state.push('tabs_content_open', 'div', 1);
        token.attrs = [['class', 'docmd-tabs-content']];
        tabs.forEach((tab, index) => {
            token = state.push('tab_pane_open', 'div', 1);
            token.attrs = [['class', 'docmd-tab-pane ' + (index === 0 ? 'active' : '')]];
            
            // Create a token to render the tab's markdown content
            let contentToken = state.push('html_block', '', 0);
            contentToken.content = md.render(tab.content);
            
            token = state.push('tab_pane_close', 'div', -1);
        });
        token = state.push('tabs_content_close', 'div', -1);

        token = state.push('tabs_close', 'div', -1);
        return true;
    }
    
    md.block.ruler.before('fence', 'tabs', tabsRule);

    md.renderer.rules.tabs_nav_item = (tokens, idx) => {
        return `<div${md.renderer.renderAttrs(tokens[idx])}>${tokens[idx].content}</div>`;
    };
}
md.use(tabsPlugin);

// --- UTILITY AND PROCESSING FUNCTIONS ---

function decodeHtmlEntities(html) {
  return html.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, "'").replace(/ /g, ' ');
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

async function processMarkdownFile(filePath, options = { isDev: false }, config) {
  const rawContent = await fs.readFile(filePath, 'utf8');
  let { data: frontmatter, content: markdownContent } = matter(rawContent);

  // Handle autoTitleFromH1
  if (!frontmatter.title) {
    if (config.autoTitleFromH1 !== false) { // Default to true
        const h1Match = markdownContent.match(/^#\s+(.*)/m);
        if (h1Match && h1Match[1]) {
            frontmatter.title = h1Match[1].trim();
        }
    }
    if (!frontmatter.title) {
        console.warn(`⚠️ Warning: Markdown file ${formatPathForDisplay(filePath)} has no title in frontmatter and no H1 fallback. The page header will be hidden.`);
    }
  }

  const htmlContent = md.render(markdownContent);
  const headings = extractHeadingsFromHtml(htmlContent);

  return {
    frontmatter,
    htmlContent,
    headings,
  };
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
  mdInstance: md,
  extractHeadingsFromHtml,
  findMarkdownFiles
};