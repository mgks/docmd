// It runs immediately, before the page is rendered.
(function() {
    try {
      const storedTheme = localStorage.getItem('docmd-theme');
      if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
      }
    } catch (e) {
      console.error('Error applying theme from localStorage', e);
    }
})();