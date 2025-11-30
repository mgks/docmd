// Source file from the docmd project — https://github.com/mgks/docmd

/*
 * Mermaid diagram integration with theme support
 */

(function () {
  'use strict';

  // Configuration for mermaid based on current theme
  function getMermaidConfig(theme) {
    const isDark = theme === 'dark';

    return {
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      },
      sequence: {
        useMaxWidth: true
      },
      gantt: {
        useMaxWidth: true
      }
    };
  }

  // Initialize mermaid when DOM is ready
  function initializeMermaid() {
    if (typeof mermaid === 'undefined') {
      console.warn('Mermaid library not loaded');
      return;
    }

    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const config = getMermaidConfig(currentTheme);

    mermaid.initialize(config);

    // Render all mermaid diagrams
    renderMermaidDiagrams();
  }

  // Store for diagram codes
  const diagramStore = new Map();

  // Render all mermaid diagrams on the page
  function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') {
      return;
    }

    const mermaidElements = document.querySelectorAll('pre.mermaid');

    mermaidElements.forEach((element, index) => {
      // Skip if already rendered
      if (element.getAttribute('data-processed') === 'true') {
        return;
      }

      try {
        // Get the diagram code
        const code = element.textContent;

        // Create a unique ID for this diagram
        const id = `mermaid-diagram-${index}-${Date.now()}`;

        // Store the original code for re-rendering
        diagramStore.set(id, code);

        // Create a container div
        const container = document.createElement('div');
        container.className = 'mermaid-container';
        container.setAttribute('data-mermaid-id', id);
        container.setAttribute('data-processed', 'true');

        // Replace the pre element with the container
        element.parentNode.replaceChild(container, element);

        // Render the diagram
        renderSingleDiagram(container, id, code);
      } catch (error) {
        console.error('Mermaid processing error:', error);
      }
    });
  }

  // Render a single diagram
  function renderSingleDiagram(container, id, code) {
    if (typeof mermaid === 'undefined') {
      return;
    }

    // Process the code to handle theme overrides
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const processedCode = processThemeInCode(code, currentTheme);

    // Render the diagram
    mermaid.render(id, processedCode).then(result => {
      container.innerHTML = result.svg;
    }).catch(error => {
      console.error('Mermaid rendering error:', error);
      container.innerHTML = `<pre class="mermaid-error">Error rendering diagram: ${error.message}</pre>`;
    });
  }

  // Process mermaid code to inject or override theme
  function processThemeInCode(code, theme) {
    const isDark = theme === 'dark';
    const targetTheme = isDark ? 'dark' : 'default';

    // Check if code has %%{init: config - match the entire init block including nested objects
    const initRegex = /%%\{init:\s*\{.*?\}\s*\}%%/s;
    const match = code.match(initRegex);

    if (match) {
      // Code has init config, replace only the theme property
      const initBlock = match[0];
      let updatedBlock = initBlock;

      // Try to replace theme property
      if (initBlock.includes("'theme'")) {
        updatedBlock = initBlock.replace(/'theme'\s*:\s*'[^']*'/, `'theme':'${targetTheme}'`);
      } else if (initBlock.includes('"theme"')) {
        updatedBlock = initBlock.replace(/"theme"\s*:\s*"[^"]*"/, `"theme":"${targetTheme}"`);
      } else {
        // Add theme to the config - insert after the first {
        updatedBlock = initBlock.replace(/%%\{init:\s*\{/, `%%{init: {'theme':'${targetTheme}',`);
      }

      return code.replace(initRegex, updatedBlock);
    }

    // No init config, code will use global mermaid config
    return code;
  }

  // Re-render mermaid diagrams when theme changes
  function handleThemeChange() {
    if (typeof mermaid === 'undefined') {
      return;
    }

    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const config = getMermaidConfig(currentTheme);

    // Re-initialize mermaid with new theme
    mermaid.initialize(config);

    // Find all rendered diagrams and re-render them
    const containers = document.querySelectorAll('.mermaid-container[data-processed="true"]');

    containers.forEach((container) => {
      const mermaidId = container.getAttribute('data-mermaid-id');
      const code = diagramStore.get(mermaidId);

      if (code) {
        // Create a new unique ID for re-rendering
        const newId = `${mermaidId}-${Date.now()}`;

        // Clear the container and re-render
        container.innerHTML = '';
        renderSingleDiagram(container, newId, code);
      }
    });
  }

  // Setup theme change observer
  function setupThemeObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initializeMermaid();
      setupThemeObserver();
    });
  } else {
    initializeMermaid();
    setupThemeObserver();
  }

  // Handle tab switches - render mermaid in newly visible tabs
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('docmd-tabs-nav-item')) {
      // Wait a bit for tab content to be visible
      setTimeout(renderMermaidDiagrams, 100);
    }
  });

})();