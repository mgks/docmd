// src/assets/js/theme-toggle.js
function applyTheme(theme, isInitialLoad = false) {
  document.body.setAttribute('data-theme', theme);
  if (!isInitialLoad) {
    localStorage.setItem('docmd-theme', theme);
  }

  // Change highlight.js theme dynamically (if separate themes are loaded)
  const highlightThemeLink = document.getElementById('highlight-theme');
  if (highlightThemeLink) {
    const isDark = theme.includes('dark');
    const isLight = theme.includes('light');
    const currentHref = highlightThemeLink.href;
    
    if (isDark && currentHref.includes('highlight-light.css')) {
      highlightThemeLink.href = currentHref.replace('highlight-light.css', 'highlight-dark.css');
    } else if (isLight && currentHref.includes('highlight-dark.css')) {
      highlightThemeLink.href = currentHref.replace('highlight-dark.css', 'highlight-light.css');
    }
  }
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem('docmd-theme');
  if (storedTheme) {
    return storedTheme;
  }
  // The server sets the initial data-theme based on config.theme.defaultMode.
  // We respect localStorage first, then what the server provided.
  // Optionally, could check prefers-color-scheme if neither is set, but defaultMode covers this.
  return document.body.getAttribute('data-theme') || 'light';
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply initial theme (respecting localStorage over server-rendered if set)
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme, true); // true indicates it's the initial load

  const themeToggleButton = document.getElementById('theme-toggle-button');
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      let currentTheme = document.body.getAttribute('data-theme');
      
      // Handle both regular themes and sky theme variants
      let newTheme;
      if (currentTheme === 'light') {
        newTheme = 'dark';
      } else if (currentTheme === 'dark') {
        newTheme = 'light';
      } else if (currentTheme === 'sky-light') {
        newTheme = 'sky-dark';
      } else if (currentTheme === 'sky-dark') {
        newTheme = 'sky-light';
      }
      
      applyTheme(newTheme); // isInitialLoad is false here, so it saves to localStorage
    });
  }
});