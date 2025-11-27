// Source file from the docmd project — https://github.com/mgks/docmd

const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const attrs = require('markdown-it-attrs');
const markdown_it_footnote = require('markdown-it-footnote');
const markdown_it_task_lists = require('markdown-it-task-lists');
const markdown_it_abbr = require('markdown-it-abbr');
const markdown_it_deflist = require('markdown-it-deflist');

const { containers } = require('./containers');
const rules = require('./rules');
const renderers = require('./renderers');

// Custom plugin for Heading IDs
const headingIdPlugin = (md) => {
  const originalHeadingOpen = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline' && contentToken.content) {
      const headingText = contentToken.content;
      const id = headingText
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      if (id) token.attrSet('id', id);
    }
    return originalHeadingOpen(tokens, idx, options, env, self);
  };
};

function createMarkdownItInstance(config) {
  const mdOptions = {
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  };
  
  const highlightFn = (str, lang) => {
    if (lang === 'mermaid') {
      return `<pre class="mermaid">${new MarkdownIt().utils.escapeHtml(str)}</pre>`;
    }
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (e) { console.error(e); }
    }
    return `<pre class="hljs"><code>${new MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
  };

  mdOptions.highlight = config.theme?.codeHighlight !== false ? highlightFn : (str, lang) => {
      if (lang === 'mermaid') return `<pre class="mermaid">${new MarkdownIt().utils.escapeHtml(str)}</pre>`;
      return `<pre><code>${new MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
  };

  const md = new MarkdownIt(mdOptions);

  // Plugins
  md.use(attrs, { leftDelimiter: '{', rightDelimiter: '}' });
  md.use(markdown_it_footnote);
  md.use(markdown_it_task_lists);
  md.use(markdown_it_abbr);
  md.use(markdown_it_deflist);
  md.use(headingIdPlugin);

  // Register Containers
  Object.keys(containers).forEach(containerName => {
    const container = containers[containerName];
    md.renderer.rules[`container_${containerName}_open`] = container.render;
    md.renderer.rules[`container_${containerName}_close`] = container.render;
  });

  // Register Rules (Order Matters)
  md.block.ruler.before('fence', 'steps_container', rules.stepsContainerRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.block.ruler.before('fence', 'enhanced_tabs', rules.enhancedTabsRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.block.ruler.before('fence', 'changelog_timeline', rules.changelogTimelineRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.block.ruler.before('paragraph', 'advanced_container', rules.advancedContainerRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.block.ruler.before('paragraph', 'standalone_closing', rules.standaloneClosingRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

  // Register Renderers
  md.renderer.rules.ordered_list_open = renderers.customOrderedListOpenRenderer;
  md.renderer.rules.list_item_open = renderers.customListItemOpenRenderer;
  md.renderer.rules.image = renderers.customImageRenderer;
  md.renderer.rules.table_open = renderers.tableOpenRenderer;
  md.renderer.rules.table_close = renderers.tableCloseRenderer;

  // Tabs Renderers
  md.renderer.rules.tabs_open = renderers.tabsOpenRenderer;
  md.renderer.rules.tabs_nav_open = renderers.tabsNavOpenRenderer;
  md.renderer.rules.tabs_nav_close = renderers.tabsNavCloseRenderer;
  md.renderer.rules.tabs_nav_item = renderers.tabsNavItemRenderer;
  md.renderer.rules.tabs_content_open = renderers.tabsContentOpenRenderer;
  md.renderer.rules.tabs_content_close = renderers.tabsContentCloseRenderer;
  md.renderer.rules.tab_pane_open = renderers.tabPaneOpenRenderer;
  md.renderer.rules.tab_pane_close = renderers.tabPaneCloseRenderer;
  md.renderer.rules.tabs_close = renderers.tabsCloseRenderer;

  return md;
}

module.exports = { createMarkdownItInstance };