/**
 * docmd-main.js
 * Main client-side script for docmd UI interactions.
 * Handles:
 * 1. Light/Dark theme toggling and persistence.
 * 2. Sidebar expand/collapse functionality and persistence.
 * 3. Tabs container interaction.
 */

// --- 1. Theme Toggle Logic ---
function initializeThemeToggle() {
  const themeToggleButton = document.getElementById('theme-toggle-button');

  // Function to apply the theme to the body and save preference
  const applyTheme = (theme, isInitial = false) => {
    document.body.setAttribute('data-theme', theme);
    if (!isInitial) {
      localStorage.setItem('docmd-theme', theme);
    }
  };

  // Set the initial theme on page load
  const storedTheme = localStorage.getItem('docmd-theme');
  const initialTheme = storedTheme || document.body.getAttribute('data-theme') || 'light';
  applyTheme(initialTheme, true);

  // Add click listener to the toggle button
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme.includes('dark') 
        ? currentTheme.replace('dark', 'light') 
        : currentTheme.replace('light', 'dark');
      applyTheme(newTheme);
    });
  }
}

// --- 2. Sidebar Collapse Logic ---
function initializeSidebarToggle() {
  const toggleButton = document.getElementById('sidebar-toggle-button');
  const body = document.body;

  // Only run if the sidebar is configured to be collapsible
  if (!body.classList.contains('sidebar-collapsible') || !toggleButton) {
    return;
  }

  // Set initial state from localStorage or config default
  const defaultConfigCollapsed = body.dataset.defaultCollapsed === 'true';
  let isCollapsed = localStorage.getItem('docmd-sidebar-collapsed');
  
  if (isCollapsed === null) {
    isCollapsed = defaultConfigCollapsed;
  } else {
    isCollapsed = isCollapsed === 'true';
  }

  if (isCollapsed) {
    body.classList.add('sidebar-collapsed');
  }

  // Add click listener to the toggle button
  toggleButton.addEventListener('click', () => {
    body.classList.toggle('sidebar-collapsed');
    const currentlyCollapsed = body.classList.contains('sidebar-collapsed');
    localStorage.setItem('docmd-sidebar-collapsed', currentlyCollapsed);
  });
}

// --- 3. Tabs Container Logic ---
function initializeTabs() {
  document.querySelectorAll('.docmd-tabs').forEach(tabsContainer => {
    const navItems = tabsContainer.querySelectorAll('.docmd-tabs-nav-item');
    const tabPanes = tabsContainer.querySelectorAll('.docmd-tab-pane');

    navItems.forEach((navItem, index) => {
      navItem.addEventListener('click', () => {
        navItems.forEach(item => item.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        navItem.classList.add('active');
        if(tabPanes[index]) {
            tabPanes[index].classList.add('active');
        }
      });
    });
  });
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle();
  initializeSidebarToggle();
  initializeTabs();
});