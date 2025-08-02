// Source file from the docmd project — https://github.com/mgks/docmd

/*
 * Initialize the theme from localStorage
 */

(function() {
    try {
      const storedTheme = localStorage.getItem('docmd-theme');
      if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
        
        // Also update highlight CSS link to match the stored theme
        const highlightThemeLink = document.getElementById('highlight-theme');
        if (highlightThemeLink) {
          const baseHref = highlightThemeLink.getAttribute('data-base-href');
          if (baseHref) {
            const newHref = baseHref + `docmd-highlight-${storedTheme}.css`;
            highlightThemeLink.setAttribute('href', newHref);
          }
        }
      }
    } catch (e) {
      console.error('Error applying theme from localStorage', e);
    }
})();