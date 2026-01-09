// Source file from the docmd project — https://github.com/docmd-io/docmd

const customOrderedListOpenRenderer = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  let isInSteps = false;
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
    return start ? `<ol class="steps-list" start="${start}">` : '<ol class="steps-list">';
  }
  const start = token.attrGet('start');
  return start ? `<ol start="${start}">` : '<ol>';
};

const customListItemOpenRenderer = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  let isInStepsList = false;
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'ordered_list_open' && tokens[i].markup && tokens[i].level < token.level) {
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
  return '<li>';
};

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

// Table Wrapper for horizontal scrolling
const tableOpenRenderer = (tokens, idx, options, env, self) => '<div class="table-wrapper">' + self.renderToken(tokens, idx, options);
const tableCloseRenderer = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options) + '</div>';

// Tabs Renderers
const tabsOpenRenderer = (tokens, idx) => `<div class="${tokens[idx].attrs.map(attr => attr[1]).join(' ')}">`;
const tabsNavOpenRenderer = () => '<div class="docmd-tabs-nav">';
const tabsNavCloseRenderer = () => '</div>';
const tabsNavItemRenderer = (tokens, idx) => `<div class="${tokens[idx].attrs[0][1]}">${tokens[idx].content}</div>`;
const tabsContentOpenRenderer = () => '<div class="docmd-tabs-content">';
const tabsContentCloseRenderer = () => '</div>';
const tabPaneOpenRenderer = (tokens, idx) => `<div class="${tokens[idx].attrs[0][1]}">`;
const tabPaneCloseRenderer = () => '</div>';
const tabsCloseRenderer = () => '</div>';

module.exports = {
  customOrderedListOpenRenderer,
  customListItemOpenRenderer,
  customImageRenderer,
  tableOpenRenderer,
  tableCloseRenderer,
  tabsOpenRenderer,
  tabsNavOpenRenderer,
  tabsNavCloseRenderer,
  tabsNavItemRenderer,
  tabsContentOpenRenderer,
  tabsContentCloseRenderer,
  tabPaneOpenRenderer,
  tabPaneCloseRenderer,
  tabsCloseRenderer
};