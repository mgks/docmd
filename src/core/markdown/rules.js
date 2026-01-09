// Source file from the docmd project — https://github.com/docmd-io/docmd

const MarkdownIt = require('markdown-it'); // Required for inner rendering fallback logic
const { containers } = require('./containers');

// --- Helper: Create isolated parser for tabs (prevents recursion stack issues) ---
// Note: We pass a callback to get the main config logic from setup.js later if needed,
// but for now we reconstruct a basic one for tab/changelog internals to ensure plugins run.
// Ideally, we prefer reusing state.md.render() where possible.

// --- 1. Advanced Container Rule (Nesting Logic) ---
function advancedContainerRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();
  
  const containerMatch = lineContent.match(/^:::\s*(\w+)(?:\s+(.+))?$/);
  if (!containerMatch) return false;
  
  const [, containerName, params] = containerMatch;
  const container = containers[containerName];
  if (!container) return false;
  if (silent) return true;
  
  if (container.selfClosing) {
    const openToken = state.push(`container_${containerName}_open`, 'div', 1);
    openToken.info = params || '';
    const closeToken = state.push(`container_${containerName}_close`, 'div', -1);
    state.line = startLine + 1;
    return true;
  }
  
  let nextLine = startLine;
  let found = false;
  let depth = 1;
  
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    if (nextContent.startsWith(':::')) {
      const containerMatch = nextContent.match(/^:::\s*(\w+)/);
      if (containerMatch && containerMatch[1] !== containerName) {
        const innerContainer = containers[containerMatch[1]];
        if (innerContainer && innerContainer.render && !innerContainer.selfClosing) {
          depth++;
        }
        continue;
      }
    }
    
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) {
        found = true;
        break;
      }
    }
  }
  
  if (!found) return false;
  
  const openToken = state.push(`container_${containerName}_open`, 'div', 1);
  openToken.info = params || '';
  
  const oldParentType = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'container';
  state.lineMax = nextLine;
  
  state.md.block.tokenize(state, startLine + 1, nextLine);
  
  const closeToken = state.push(`container_${containerName}_close`, 'div', -1);
  
  state.parentType = oldParentType;
  state.lineMax = oldLineMax;
  state.line = nextLine + 1;
  
  return true;
}

// --- 2. Changelog Timeline Rule (FIXED FOR NESTING) ---
function changelogTimelineRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  if (lineContent !== '::: changelog') return false;
  if (silent) return true;

  let nextLine = startLine;
  let found = false;
  let depth = 1;
  
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    if (nextContent.startsWith(':::')) {
      const match = nextContent.match(/^:::\s*(\w+)/);
      if (match) {
        const containerName = match[1];
        // Don't count self-closing like buttons for depth
        const containerDef = containers[containerName];
        if (!containerDef || !containerDef.selfClosing) {
           depth++;
        }
      }
    }
    
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) { found = true; break; }
    }
  }
  
  if (!found) return false;

  let content = '';
  for (let i = startLine + 1; i < nextLine; i++) {
    const lineStart = state.bMarks[i] + state.tShift[i];
    const lineEnd = state.eMarks[i];
    content += state.src.slice(lineStart, lineEnd) + '\n';
  }

  const lines = content.split('\n');
  const entries = [];
  let currentEntry = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const markerMatch = line.match(/^==\s+(.+)$/);

    if (markerMatch) {
      if (currentEntry) {
        currentEntry.content = currentContent.join('\n');
        entries.push(currentEntry);
      }
      currentEntry = { meta: markerMatch[1], content: '' };
      currentContent = [];
    } else if (currentEntry) {
      currentContent.push(lines[i]); 
    }
  }
  if (currentEntry) {
    currentEntry.content = currentContent.join('\n');
    entries.push(currentEntry);
  }

  state.push('container_changelog_open', 'div', 1);

  entries.forEach(entry => {
    const entryOpen = state.push('html_block', '', 0);
    entryOpen.content = `<div class="changelog-entry">
      <div class="changelog-meta"><span class="changelog-date">${entry.meta}</span></div>
      <div class="changelog-body">`;

    // This ensures callouts/cards inside changelogs are parsed
    entryOpen.content += state.md.render(entry.content, state.env);
    
    const entryClose = state.push('html_block', '', 0);
    entryClose.content = `</div></div>`;
  });

  state.push('container_changelog_close', 'div', -1);
  state.line = nextLine + 1;
  return true;
}

// --- 3. Steps Container Rule ---
function stepsContainerRule(state, startLine, endLine, silent) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const lineContent = state.src.slice(start, max).trim();
    if (lineContent !== '::: steps') return false;
    if (silent) return true;
  
    let nextLine = startLine;
    let found = false;
    let depth = 1;
    
    while (nextLine < endLine) {
      nextLine++;
      const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const nextMax = state.eMarks[nextLine];
      const nextContent = state.src.slice(nextStart, nextMax).trim();
      
      if (nextContent.startsWith('== tab')) { continue; }
      
      if (nextContent.startsWith(':::')) {
        const containerMatch = nextContent.match(/^:::\s*(\w+)/);
        if (containerMatch) {
          const containerName = containerMatch[1];
          const innerContainer = containers[containerName];
          if (innerContainer && !innerContainer.selfClosing) {
            depth++;
          }
          continue;
        }
      }
      
      if (nextContent === ':::') {
        depth--;
        if (depth === 0) { found = true; break; }
      }
    }
    
    if (!found) return false;
  
    const openToken = state.push('container_steps_open', 'div', 1);
    openToken.info = '';
    
    const oldParentType = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'container';
    state.lineMax = nextLine;
    state.md.block.tokenize(state, startLine + 1, nextLine);
    const closeToken = state.push('container_steps_close', 'div', -1);
    state.parentType = oldParentType;
    state.lineMax = oldLineMax;
    state.line = nextLine + 1;
    return true;
}

// --- 4. Enhanced Tabs Rule ---
function enhancedTabsRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  if (lineContent !== '::: tabs') return false;
  if (silent) return true;

  let nextLine = startLine;
  let found = false;
  let depth = 1;
  while (nextLine < endLine) {
    nextLine++;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();
    
    if (nextContent.startsWith(':::')) {
      const containerMatch = nextContent.match(/^:::\s*(\w+)/);
      if (containerMatch && containerMatch[1] !== 'tabs') {
        if (containerMatch[1] === 'steps') continue;
        const innerContainer = containers[containerMatch[1]];
        if (innerContainer && !innerContainer.selfClosing) depth++;
        continue;
      }
    }
    
    if (nextContent === ':::') {
      depth--;
      if (depth === 0) { found = true; break; }
    }
  }
  if (!found) return false;

  let content = '';
  for (let i = startLine + 1; i < nextLine; i++) {
    const lineStart = state.bMarks[i] + state.tShift[i];
    const lineEnd = state.eMarks[i];
    content += state.src.slice(lineStart, lineEnd) + '\n';
  }

  const lines = content.split('\n');
  const tabs = [];
  let currentTab = null;
  let currentContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const tabMatch = line.match(/^==\s*tab\s+(?:"([^"]+)"|(\S+))$/);
    
    if (tabMatch) {
      if (currentTab) {
        currentTab.content = currentContent.join('\n').trim();
        tabs.push(currentTab);
      }
      const title = tabMatch[1] || tabMatch[2];
      currentTab = { title: title, content: '' };
      currentContent = [];
    } else if (currentTab) {
      if (lines[i].trim() && !lines[i].trim().startsWith('==')) {
        currentContent.push(lines[i]);
      }
    }
  }
  if (currentTab) {
    currentTab.content = currentContent.join('\n').trim();
    tabs.push(currentTab);
  }

  const openToken = state.push('tabs_open', 'div', 1);
  openToken.attrs = [['class', 'docmd-tabs']];
  
  const navToken = state.push('tabs_nav_open', 'div', 1);
  navToken.attrs = [['class', 'docmd-tabs-nav']];
  tabs.forEach((tab, index) => {
    const navItemToken = state.push('tabs_nav_item', 'div', 0);
    navItemToken.attrs = [['class', `docmd-tabs-nav-item ${index === 0 ? 'active' : ''}`]];
    navItemToken.content = tab.title;
  });
  state.push('tabs_nav_close', 'div', -1);
  
  const contentToken = state.push('tabs_content_open', 'div', 1);
  contentToken.attrs = [['class', 'docmd-tabs-content']];
  tabs.forEach((tab, index) => {
    const paneToken = state.push('tab_pane_open', 'div', 1);
    paneToken.attrs = [['class', `docmd-tab-pane ${index === 0 ? 'active' : ''}`]];
    
    if (tab.content.trim()) {
        // Use recursion here if possible, or create basic instance to prevent circular dep issues in this modular file
        // Since we are inside rules.js, we rely on state.md being available or fallback to simple render
        const renderedContent = state.md.render(tab.content.trim(), state.env);
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

// --- 5. Standalone Closing Rule ---
const standaloneClosingRule = (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();
  
  if (lineContent === ':::') {
    if (silent) return true;
    state.line = startLine + 1;
    return true;
  }
  return false;
};

module.exports = {
  advancedContainerRule,
  changelogTimelineRule,
  stepsContainerRule,
  enhancedTabsRule,
  standaloneClosingRule
};