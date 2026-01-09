// Source file from the docmd project — https://github.com/docmd-io/docmd

/*
 * Initialize the theme from localStorage
 */

(function() {
  try {
    // Determine Theme
    var localValue = localStorage.getItem('docmd-theme');
    var configValue = window.DOCMD_DEFAULT_MODE || 'light'; 
    var theme = localValue ? localValue : configValue;
    
    // Set HTML Attribute (for main CSS variables)
    document.documentElement.setAttribute('data-theme', theme);

    // Handle Highlight.js Theme (if present)
    var highlightLink = document.getElementById('highlight-theme');
    if (highlightLink) {
      var baseHref = highlightLink.getAttribute('data-base-href');
      // Check if the current href matches the desired theme
      // If not, swap it immediately before the browser renders code blocks
      if (baseHref && !highlightLink.href.includes('docmd-highlight-' + theme)) {
        highlightLink.href = baseHref + 'docmd-highlight-' + theme + '.css';
      }
    }
  } catch (e) {
    console.error('Theme init failed', e);
  }
})();