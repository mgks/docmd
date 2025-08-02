// Source file from the docmd project — https://github.com/mgks/docmd

/* 
 * Main client-side script for docmd UI interactions
 */

// --- Theme Toggle Logic ---
function setupThemeToggleListener() {
  const themeToggleButton = document.getElementById('theme-toggle-button');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('docmd-theme', theme);
    
    // Switch highlight.js theme
    const highlightThemeLink = document.getElementById('highlight-theme');
    if (highlightThemeLink) {
      const newHref = highlightThemeLink.getAttribute('data-base-href') + `docmd-highlight-${theme}.css`;
      highlightThemeLink.setAttribute('href', newHref);
    }
  }

  // Add click listener to the toggle button
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }
}

// --- Sidebar Collapse Logic ---
function initializeSidebarToggle() {
  const toggleButton = document.getElementById('sidebar-toggle-button');
  const body = document.body;

  if (!body.classList.contains('sidebar-collapsible') || !toggleButton) {
    return;
  }

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

  toggleButton.addEventListener('click', () => {
    body.classList.toggle('sidebar-collapsed');
    const currentlyCollapsed = body.classList.contains('sidebar-collapsed');
    localStorage.setItem('docmd-sidebar-collapsed', currentlyCollapsed);
  });
}

// --- Tabs Container Logic ---
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

// --- Copy Code Button Logic ---
function initializeCopyCodeButtons() {
  if (document.body.dataset.copyCodeEnabled !== 'true') {
    return;
  }

  const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
  const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  document.querySelectorAll('pre').forEach(preElement => {
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    // Create a wrapper div around the pre element
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'block';
    
    // Insert the wrapper before the pre element
    preElement.parentNode.insertBefore(wrapper, preElement);
    
    // Move the pre element into the wrapper
    wrapper.appendChild(preElement);
    
    // Remove the relative positioning from pre since wrapper handles it
    preElement.style.position = 'static';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-button';
    copyButton.innerHTML = copyIconSvg;
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
    wrapper.appendChild(copyButton);

    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(codeElement.innerText).then(() => {
        copyButton.innerHTML = checkIconSvg;
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.innerHTML = copyIconSvg;
          copyButton.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        copyButton.innerText = 'Error';
      });
    });
  });
}

// --- Theme Sync Function ---
function syncBodyTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme && document.body) {
    document.body.setAttribute('data-theme', currentTheme);
  }
  
  // Also ensure highlight CSS matches the current theme
  const highlightThemeLink = document.getElementById('highlight-theme');
  if (highlightThemeLink && currentTheme) {
    const baseHref = highlightThemeLink.getAttribute('data-base-href');
    if (baseHref) {
      const newHref = baseHref + `docmd-highlight-${currentTheme}.css`;
      highlightThemeLink.setAttribute('href', newHref);
    }
  }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
  syncBodyTheme(); // Sync body theme with html theme
  setupThemeToggleListener();
  initializeSidebarToggle();
  initializeTabs();
  initializeCopyCodeButtons();
});