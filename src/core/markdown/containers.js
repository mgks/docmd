// Source file from the docmd project — https://github.com/docmd-io/docmd

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
    selfClosing: true,
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const parts = tokens[idx].info.split(' ');
        const text = parts[0];
        const url = parts[1];
        const color = parts[2];
        const colorStyle = color && color.startsWith('color:') ? ` style="background-color: ${color.split(':')[1]}"` : '';
        
        let finalUrl = url;
        let targetAttr = '';
        if (url && url.startsWith('external:')) {
          finalUrl = url.substring(9);
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
        return '<div class="docmd-container steps steps-reset steps-numbering">';
      }
      return '</div>';
    }
  },
  collapsible: {
    name: 'collapsible',
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const info = tokens[idx].info.trim();
        let isOpen = false;
        let displayTitle = info;

        if (info.startsWith('open ')) {
          isOpen = true;
          displayTitle = info.substring(5);
        }
        if (!displayTitle) displayTitle = 'Click to expand';

        return `<details class="docmd-container collapsible" ${isOpen ? 'open' : ''}>
          <summary class="collapsible-summary">
            <span class="collapsible-title">${displayTitle}</span>
            <span class="collapsible-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </summary>
          <div class="collapsible-content">`;
      }
      return '</div></details>\n';
    }
  },
  changelog: {
    name: 'changelog',
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        return '<div class="docmd-container changelog-timeline">';
      }
      return '</div>';
    }
  }
};

module.exports = { containers };