// src/assets/js/theme-toggle.js
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('docmd-theme', theme);
  }
  
  function getPreferredTheme() {
    const storedTheme = localStorage.getItem('docmd-theme');
    if (storedTheme) {
      return storedTheme;
    }
    // Fallback to system preference if no stored theme
    // return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // For now, just use the config's default theme which will be set on body by server.
    // This script will be primarily for user-initiated toggles once the button exists.
    return document.body.getAttribute('data-theme') || 'light';
  }
  
  // Apply theme on load
  // The initial theme is set by the server-side template via config.theme.defaultTheme
  // This script is more for when a toggle button is introduced.
  // For now, it ensures localStorage is respected if set.
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  
  // Example: If you add a toggle button later:
  // const themeToggleButton = document.getElementById('theme-toggle');
  // if (themeToggleButton) {
  //   themeToggleButton.addEventListener('click', () => {
  //     let newTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  //     applyTheme(newTheme);
  //   });
  // }