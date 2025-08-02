// Source file from the docmd project — https://github.com/mgks/docmd

const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const hljs = require('highlight.js');
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

function createMarkdownItInstance(config) {
  const mdOptions = {
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  };
   
  // Conditionally enable highlighting
  if (config.theme?.codeHighlight !== false) {
    mdOptions.highlight = function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch (e) { console.error(`Highlighting error for lang ${lang}:`, e); }
      }
      return `<pre class="hljs"><code>${new MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
    };
  }

  const md = new MarkdownIt(mdOptions);

  // --- Attach all plugins and rules to this instance ---
  md.use(attrs, { leftDelimiter: '{', rightDelimiter: '}' });
  md.use(markdown_it_footnote);
  md.use(markdown_it_task_lists);
  md.use(markdown_it_abbr);
  md.use(markdown_it_deflist);

  // Register renderers for all containers
  Object.keys(containers).forEach(containerName => {
    const container = containers[containerName];
    md.renderer.rules[`container_${containerName}_open`] = container.render;
    md.renderer.rules[`container_${containerName}_close`] = container.render;
  });

  // Register the enhanced rules
  md.block.ruler.before('fence', 'steps_container', stepsContainerRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });
  md.block.ruler.before('fence', 'enhanced_tabs', enhancedTabsRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });
  md.block.ruler.before('paragraph', 'advanced_container', advancedContainerRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });

  // Register all custom renderers
  md.renderer.rules.ordered_list_open = customOrderedListOpenRenderer;
  md.renderer.rules.list_item_open = customListItemOpenRenderer;
  md.renderer.rules.image = customImageRenderer;
  
  // Register tabs renderers
  md.renderer.rules.tabs_open = tabsOpenRenderer;
  md.renderer.rules.tabs_nav_open = tabsNavOpenRenderer;
  md.renderer.rules.tabs_nav_close = tabsNavCloseRenderer;
  md.renderer.rules.tabs_nav_item = tabsNavItemRenderer;
  md.renderer.rules.tabs_content_open = tabsContentOpenRenderer;
  md.renderer.rules.tabs_content_close = tabsContentCloseRenderer;
  md.renderer.rules.tab_pane_open = tabPaneOpenRenderer;
  md.renderer.rules.tab_pane_close = tabPaneCloseRenderer;
  md.renderer.rules.tabs_close = tabsCloseRenderer;
  
  // Register heading ID plugin
  md.use(headingIdPlugin);
  
  // Register standalone closing rule
  md.block.ruler.before('paragraph', 'standalone_closing', standaloneClosingRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });

  return md;
}

// ===================================================================
// --- ADVANCED NESTED CONTAINER SYSTEM ---
// ===================================================================

// Container definitions
// To add a new container type:
// 1. Add it to this containers object
// 2. Define the render function for opening (nesting === 1) and closing (nesting === -1)
// 3. The system will automatically register it and support nesting
const containers = {
  card: {
    name: 'card',
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const title = tokens[idx].info ? tokens[idx].info.trim() : '';
        return `<div class="docmd-container card">${title ? `<div class="card-title">${title}</div>` : ''}<div class="card-content">`;
      }
      return '</div></div>';
    }
  },
  callout: {
    name: 'callout',
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const [type, ...titleParts] = tokens[idx].info.split(' ');
        const title = titleParts.join(' ');
        return `<div class="docmd-container callout callout-${type}">${title ? `<div class="callout-title">${title}</div>` : ''}<div class="callout-content">`;
      }
      return '</div></div>';
    }
  },
  button: {
    name: 'button',
    selfClosing: true, // Mark as self-closing
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const parts = tokens[idx].info.split(' ');
        const text = parts[0];
        const url = parts[1];
        const color = parts[2];
        const colorStyle = color && color.startsWith('color:') ? ` style="background-color: ${color.split(':')[1]}"` : '';
        
        // Check if URL starts with 'external:' for new tab behavior
        let finalUrl = url;
        let targetAttr = '';
        if (url && url.startsWith('external:')) {
          finalUrl = url.substring(9); // Remove 'external:' prefix
          targetAttr = ' target="_blank" rel="noopener noreferrer"';
        }
        
        return `<a href="${finalUrl}" class="docmd-button"${colorStyle}${targetAttr}>${text.replace(/_/g, ' ')}</a>`;
      }
      return '';
    }
  },
  steps: {
    name: 'steps',
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        // Add a unique class for steps containers to enable CSS-based numbering reset
        // The steps-numbering class will style only direct ol > li children as numbered steps
        return '<div class="docmd-container steps steps-reset steps-numbering">';
      }
      return '</div>';
    }
  }
  // Future containers can be added here:
  // timeline: {
  //   name: 'timeline',
  //   render: (tokens, idx) => {
  //     if (tokens[idx].nesting === 1) {
  //       return '<div class="docmd-container timeline">';
  //     }
  //     return '</div>';
  //   }
  // },
  // changelog: {
  //   name: 'changelog',
  //   render: (tokens, idx) => {
  //     if (tokens[idx].nesting === 1) {
  //       return '<div class="docmd-container changelog">';
  //     }
  //     return '</div>';
  //   }
  // }
};



// Advanced container rule with proper nesting support
function advancedContainerRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();
  
  // Check if this is a container opening
  const containerMatch = lineContent.match(/^:::\s*(\w+)(?:\s+(.+))?$/);
  if (!containerMatch) return false;
  
  const [, containerName, params] = containerMatch;
  const container = containers[containerName];
  
  if (!container) return false;
  
  if (silent) return true;
  
  // Handle self-closing containers (like buttons)
  if (container.selfClosing) {
    const openToken = state.push(`container_${containerName}_open`, 'div', 1);
    openToken.info = params || '';
    const closeToken = state.push(`container_${containerName}_close`, 'div', -1);
    state.line = startLine + 1;
    return true;
  }
  
  // Find the closing tag with proper nesting handling
  let nextLine = startLine;
  let found = false;
  let depth = 1;
  
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    // Check for opening tags (any container)
    if (nextContent.startsWith(':::')) {
      const containerMatch = nextContent.match(/^:::\s*(\w+)/);
      if (containerMatch && containerMatch[1] !== containerName) {
        // Only increment depth for non-self-closing containers
        const innerContainer = containers[containerMatch[1]];
        if (innerContainer && innerContainer.render && !innerContainer.selfClosing) {
          depth++;
        }
        continue;
      }
    }
    
    // Check for closing tags
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) {
        found = true;
        break;
      }
    }
  }
  
  if (!found) return false;
  
  // Create tokens
  const openToken = state.push(`container_${containerName}_open`, 'div', 1);
  openToken.info = params || '';
  
  // Process content recursively
  const oldParentType = state.parentType;
  const oldLineMax = state.lineMax;
  
  state.parentType = 'container';
  state.lineMax = nextLine;
  
  // Process the content inside the container
  state.md.block.tokenize(state, startLine + 1, nextLine);
  
  const closeToken = state.push(`container_${containerName}_close`, 'div', -1);
  
  state.parentType = oldParentType;
  state.lineMax = oldLineMax;
  state.line = nextLine + 1;
  
  return true;
}

// --- Simple Steps Container Rule ---
function stepsContainerRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();
  if (lineContent !== '::: steps') return false;
  if (silent) return true;

  // Find the closing ':::' for the steps container
  let nextLine = startLine;
  let found = false;
  let depth = 1;
  
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    // Skip tab markers as they don't affect container depth
    if (nextContent.startsWith('== tab')) {
      continue;
    }
    
    // Check for opening tags (any container)
    if (nextContent.startsWith(':::')) {
      const containerMatch = nextContent.match(/^:::\s*(\w+)/);
      if (containerMatch) {
        const containerName = containerMatch[1];
        // Only count non-self-closing containers for depth
        const innerContainer = containers[containerName];
        if (innerContainer && !innerContainer.selfClosing) {
          depth++;
        }
        continue;
      }
    }
    
    // Check for closing tags
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) {
        found = true;
        break;
      }
    }
  }
  
  if (!found) return false;

  // Create tokens for steps container
  const openToken = state.push('container_steps_open', 'div', 1);
  openToken.info = '';
  
  // Process content normally but disable automatic list processing
  const oldParentType = state.parentType;
  const oldLineMax = state.lineMax;
  
  state.parentType = 'container';
  state.lineMax = nextLine;
  
  // Process the content inside the container
  state.md.block.tokenize(state, startLine + 1, nextLine);
  
  const closeToken = state.push('container_steps_close', 'div', -1);
  
  state.parentType = oldParentType;
  state.lineMax = oldLineMax;
  state.line = nextLine + 1;
  
  return true;
}

// --- Enhanced tabs rule with nested content support ---
function enhancedTabsRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  if (lineContent !== '::: tabs') return false;
  if (silent) return true;

  // Find the closing tag with proper nesting handling
  let nextLine = startLine;
  let found = false;
  let depth = 1;
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    // Check for opening tags (any container)
    if (nextContent.startsWith(':::')) {
      const containerMatch = nextContent.match(/^:::\s*(\w+)/);
      if (containerMatch && containerMatch[1] !== 'tabs') {
        // Don't increment depth for steps - they have their own depth counting
        if (containerMatch[1] === 'steps') {
          continue;
        }
        // Only increment depth for non-self-closing containers
        const innerContainer = containers[containerMatch[1]];
        if (innerContainer && !innerContainer.selfClosing) {
          depth++;
        }
        continue;
      }
    }
    
    // Check for closing tags
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) {
        found = true;
        break;
      }
    }
  }
  if (!found) return false;

  // Get the raw content by manually extracting lines
  let content = '';
  for (let i = startLine + 1; i < nextLine; i++) {
    const lineStart = state.bMarks[i] + state.tShift[i];
    const lineEnd = state.eMarks[i];
    content += state.src.slice(lineStart, lineEnd) + '\n';
  }

  // Parse tabs manually
  const lines = content.split('\n');
  const tabs = [];
  let currentTab = null;
  let currentContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const tabMatch = line.match(/^==\s*tab\s+(?:"([^"]+)"|(\S+))$/);
    
    if (tabMatch) {
      // Save previous tab if exists
      if (currentTab) {
        currentTab.content = currentContent.join('\n').trim();
        tabs.push(currentTab);
      }
      // Start new tab
      const title = tabMatch[1] || tabMatch[2];
      currentTab = { title: title, content: '' };
      currentContent = [];
    } else if (currentTab) {
      // Add line to current tab content (only if not empty and not a tab marker)
      if (lines[i].trim() && !lines[i].trim().startsWith('==')) {
        currentContent.push(lines[i]);
      }
    }
  }
  
  // Save the last tab
  if (currentTab) {
    currentTab.content = currentContent.join('\n').trim();
    tabs.push(currentTab);
  }

  // Create tabs structure
  const openToken = state.push('tabs_open', 'div', 1);
  openToken.attrs = [['class', 'docmd-tabs']];
  
  // Create navigation
  const navToken = state.push('tabs_nav_open', 'div', 1);
  navToken.attrs = [['class', 'docmd-tabs-nav']];
  tabs.forEach((tab, index) => {
    const navItemToken = state.push('tabs_nav_item', 'div', 0);
    navItemToken.attrs = [['class', `docmd-tabs-nav-item ${index === 0 ? 'active' : ''}`]];
    navItemToken.content = tab.title;
  });
  state.push('tabs_nav_close', 'div', -1);
  
  // Create content
  const contentToken = state.push('tabs_content_open', 'div', 1);
  contentToken.attrs = [['class', 'docmd-tabs-content']];
  tabs.forEach((tab, index) => {
    const paneToken = state.push('tab_pane_open', 'div', 1);
    paneToken.attrs = [['class', `docmd-tab-pane ${index === 0 ? 'active' : ''}`]];
    
    // Process tab content with the main markdown-it instance
    if (tab.content.trim()) {
      const tabContent = tab.content.trim();
      
      // Create a separate markdown-it instance for tab content to avoid double processing
      const tabMd = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return '<pre class="hljs"><code>' +
                     hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                     '</code></pre>';
            } catch (e) { console.error(`Error highlighting language ${lang}:`, e); }
          }
          return '<pre class="hljs"><code>' + MarkdownIt.utils.escapeHtml(str) + '</code></pre>';
        }
      });
      
      // Register the same plugins for the tab markdown instance
      tabMd.use(attrs, { leftDelimiter: '{', rightDelimiter: '}' });
      tabMd.use(markdown_it_footnote);
      tabMd.use(markdown_it_task_lists);
      tabMd.use(markdown_it_abbr);
      tabMd.use(markdown_it_deflist);
      
      // Register container renderers for the tab markdown instance
      Object.keys(containers).forEach(containerName => {
        const container = containers[containerName];
        tabMd.renderer.rules[`container_${containerName}_open`] = container.render;
        tabMd.renderer.rules[`container_${containerName}_close`] = container.render;
      });
      
      // Register the enhanced rules for the tab markdown instance
      tabMd.block.ruler.before('fence', 'enhanced_tabs', enhancedTabsRule, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
      tabMd.block.ruler.before('paragraph', 'steps_container', stepsContainerRule, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
      tabMd.block.ruler.before('paragraph', 'advanced_container', advancedContainerRule, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
      
      // Register custom renderers for the tab markdown instance
      tabMd.renderer.rules.ordered_list_open = customOrderedListOpenRenderer;
      tabMd.renderer.rules.list_item_open = customListItemOpenRenderer;
      tabMd.renderer.rules.image = customImageRenderer;
      
      // Register tabs renderers for the tab markdown instance
      tabMd.renderer.rules.tabs_open = tabsOpenRenderer;
      tabMd.renderer.rules.tabs_nav_open = tabsNavOpenRenderer;
      tabMd.renderer.rules.tabs_nav_close = tabsNavCloseRenderer;
      tabMd.renderer.rules.tabs_nav_item = tabsNavItemRenderer;
      tabMd.renderer.rules.tabs_content_open = tabsContentOpenRenderer;
      tabMd.renderer.rules.tabs_content_close = tabsContentCloseRenderer;
      tabMd.renderer.rules.tab_pane_open = tabPaneOpenRenderer;
      tabMd.renderer.rules.tab_pane_close = tabPaneCloseRenderer;
      tabMd.renderer.rules.tabs_close = tabsCloseRenderer;
      
      // Register heading ID plugin for the tab markdown instance
      tabMd.use(headingIdPlugin);
      
      // Register standalone closing rule for the tab markdown instance
      tabMd.block.ruler.before('paragraph', 'standalone_closing', standaloneClosingRule, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
      
      // Render the tab content
      const renderedContent = tabMd.render(tabContent);
      const htmlToken = state.push('html_block', '', 0);
      htmlToken.content = renderedContent;
    }
    
    state.push('tab_pane_close', 'div', -1);
  });
  state.push('tabs_content_close', 'div', -1);
  state.push('tabs_close', 'div', -1);
  state.line = nextLine + 1;
  return true;
}

// Add a rule to handle standalone closing tags
const standaloneClosingRule = (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();
  
  if (lineContent === ':::') {
    if (silent) return true;
    // Skip this line by not creating any tokens
    state.line = startLine + 1;
    return true;
  }
  
  return false;
};

// Custom renderer for ordered lists in steps containers
const customOrderedListOpenRenderer = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  // Check if we're inside a steps container by looking at the context
  let isInSteps = false;
  
  // Look back through tokens to see if we're in a steps container
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'container_steps_open') {
      isInSteps = true;
      break;
    }
    if (tokens[i].type === 'container_steps_close') {
      break;
    }
  }
  
  if (isInSteps) {
    const start = token.attrGet('start');
    return start ? 
      `<ol class="steps-list" start="${start}">` : 
      '<ol class="steps-list">';
  }
  
  // Default behavior for non-steps ordered lists
  const start = token.attrGet('start');
  return start ? `<ol start="${start}">` : '<ol>';
};

// Custom renderer for list items in steps containers
const customListItemOpenRenderer = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  // Check if we're inside a steps container and this is a direct child
  let isInStepsList = false;
  
  // Look back through tokens to see if we're in a steps list
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'ordered_list_open' && 
        tokens[i].markup && 
        tokens[i].level < token.level) {
      // Check if this ordered list has steps-list class (meaning it's in steps container)
      let j = i - 1;
      while (j >= 0) {
        if (tokens[j].type === 'container_steps_open') {
          isInStepsList = true;
          break;
        }
        if (tokens[j].type === 'container_steps_close') {
          break;
        }
        j--;
      }
      break;
    }
  }
  
  if (isInStepsList) {
    return '<li class="step-item">';
  }
  
  // Default behavior for non-step list items
  return '<li>';
};

// Enhanced tabs renderers
const tabsOpenRenderer = (tokens, idx) => {
  const token = tokens[idx];
  return `<div class="${token.attrs.map(attr => attr[1]).join(' ')}">`;
};

const tabsNavOpenRenderer = () => '<div class="docmd-tabs-nav">';
const tabsNavCloseRenderer = () => '</div>';

const tabsNavItemRenderer = (tokens, idx) => {
  const token = tokens[idx];
  return `<div class="${token.attrs[0][1]}">${token.content}</div>`;
};

const tabsContentOpenRenderer = () => '<div class="docmd-tabs-content">';
const tabsContentCloseRenderer = () => '</div>';

const tabPaneOpenRenderer = (tokens, idx) => {
  const token = tokens[idx];
  return `<div class="${token.attrs[0][1]}">`;
};

const tabPaneCloseRenderer = () => '</div>';

const tabsCloseRenderer = () => '</div>';

// Override the default image renderer to properly handle attributes like {.class}.
const customImageRenderer = function(tokens, idx, options, env, self) {
  const defaultImageRenderer = function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
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
const headingIdPlugin = (md) => {
  const defaultRender = function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  const headingOpenRenderer = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline') {
      const headingText = contentToken.content;
      const id = headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
      if (id) { token.attrSet('id', id); }
    }
    return defaultRender(tokens, idx, options, env, self);
  }
}


// ===================================================================
// --- SAFE CONTAINER WRAPPER (FOR SIMPLE CONTAINERS) ---
// The safeContainer function has been replaced by the advanced nested container system
// which provides better nesting support and more robust parsing.

// ===================================================================
// --- ADVANCED NESTED CONTAINER SYSTEM IMPLEMENTATION ---
// ===================================================================

// The advanced nested container system is now implemented above
// All containers (card, callout, button, steps, tabs) are handled by the new system
// which supports seamless nesting of any container within any other container.


// --- UTILITY AND PROCESSING FUNCTIONS ---

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

async function processMarkdownFile(filePath, md, config) {
  const rawContent = await fs.readFile(filePath, 'utf8');
  let frontmatter, markdownContent;

  try {
    ({ data: frontmatter, content: markdownContent } = matter(rawContent));
  } catch (e) {
    console.error(`❌ Error parsing frontmatter in ${formatPathForDisplay(filePath)}:`);
    console.error(`   ${e.message}`);
    console.error('   This page will be skipped. Please fix the YAML syntax.');
    return null;
  }

  if (!frontmatter.title) {
    if (config.autoTitleFromH1 !== false) {
        const h1Match = markdownContent.match(/^#\s+(.*)/m);
        if (h1Match && h1Match[1]) {
            frontmatter.title = h1Match[1].trim();
        }
    }
    if (!frontmatter.title) {
        console.warn(`⚠️ Warning: Markdown file ${formatPathForDisplay(filePath)} has no title in frontmatter and no H1 fallback. The page header will be hidden.`);
    }
  }

  let htmlContent, headings;
  if (frontmatter.noStyle === true) {
    // For noStyle pages, NO markdown processing at all
    // Pass the raw content directly as-is
    htmlContent = markdownContent;
    headings = [];
  } else {
    htmlContent = md.render(markdownContent);
    headings = extractHeadingsFromHtml(htmlContent);
  }

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
  createMarkdownItInstance,
  extractHeadingsFromHtml,
  findMarkdownFiles
};