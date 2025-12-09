// Source file from the docmd project — https://github.com/mgks/docmd

/* 
 * Main client-side script for docmd UI interactions
 */

// --- Collapsible Navigation Logic ---
function initializeCollapsibleNav() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  let navStates = {};
  try {
    // Use sessionStorage to remember state only for the current session
    navStates = JSON.parse(sessionStorage.getItem('docmd-nav-states')) || {};
  } catch (e) { /* silent fail */ }

  nav.querySelectorAll('li.collapsible').forEach(item => {
    const navId = item.dataset.navId;
    const anchor = item.querySelector('a');
    const submenu = item.querySelector('.submenu');

    if (!navId || !anchor || !submenu) return;

    const isParentActive = item.classList.contains('active-parent');
    // Default to expanded if it's a parent of the active page, otherwise check stored state.
    let isExpanded = isParentActive || (navStates[navId] === true);

    const toggleSubmenu = (expand) => {
      item.setAttribute('aria-expanded', expand);
      submenu.style.display = expand ? 'block' : 'none';
      navStates[navId] = expand;
      sessionStorage.setItem('docmd-nav-states', JSON.stringify(navStates));
    };

    // Set initial state on page load
    toggleSubmenu(isExpanded);

    anchor.addEventListener('click', (e) => {
      const currentExpanded = item.getAttribute('aria-expanded') === 'true';
      const href = anchor.getAttribute('href');
      const isPlaceholder = !href || href === '#' || href === '';

      if (!currentExpanded) {
        toggleSubmenu(true);
      } else if (isPlaceholder || e.target.closest('.collapse-icon')) {
        toggleSubmenu(false);
      }

      if (isPlaceholder || e.target.closest('.collapse-icon')) {
        e.preventDefault();
      }
    });

    /*    anchor.addEventListener('click', (e) => {
          // If the click target is the icon, ALWAYS prevent navigation and toggle.
          if (e.target.closest('.collapse-icon')) {
            e.preventDefault();
            toggleSubmenu(item.getAttribute('aria-expanded') !== 'true');
          } 
          // If the link is just a placeholder, also prevent navigation and toggle.
          else if (anchor.getAttribute('href') === '#') {
            e.preventDefault();
            toggleSubmenu(item.getAttribute('aria-expanded') !== 'true');
          }
          // Otherwise, let the click proceed to navigate to the link.
        });*/
  });
}

// --- Mobile Menu Logic ---
function initializeMobileMenus() {
  // 1. Sidebar Toggle
  const sidebarBtn = document.querySelector('.sidebar-menu-button');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling
      sidebar.classList.toggle('mobile-expanded');
    });
  }

  // 2. TOC Toggle
  const tocBtn = document.querySelector('.toc-menu-button');
  const tocContainer = document.querySelector('.toc-container');
  // Also allow clicking the title text to toggle
  const tocTitle = document.querySelector('.toc-title');

  const toggleToc = (e) => {
    // Only engage on mobile view (check if button is visible)
    if (window.getComputedStyle(tocBtn).display === 'none') return;
    
    e.stopPropagation();
    tocContainer.classList.toggle('mobile-expanded');
  };

  if (tocBtn && tocContainer) {
    tocBtn.addEventListener('click', toggleToc);
    if (tocTitle) {
      tocTitle.addEventListener('click', toggleToc);
    }
  }
}

// --- Sidebar Scroll Preservation ---
function initializeSidebarScroll() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  setTimeout(() => {
    const activeElement = sidebar.querySelector('a.active') || sidebar.querySelector('.active-parent > a');

    if (activeElement) {
      const sidebarRect = sidebar.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      // Check if the element's top or bottom is outside the sidebar's visible area
      const isNotInView = elementRect.top < sidebarRect.top || elementRect.bottom > sidebarRect.bottom;

      if (isNotInView) {
        activeElement.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, 10);
}

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
        if (tabPanes[index]) {
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
  initializeCollapsibleNav();
  initializeMobileMenus();
  initializeSidebarScroll();
});