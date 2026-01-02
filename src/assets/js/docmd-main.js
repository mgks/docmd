// Source file from the docmd project — https://github.com/mgks/docmd

/* 
 * Main client-side script for docmd UI interactions
 */

// --- Collapsible Navigation Logic ---
function initializeCollapsibleNav() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  // We NO LONGER set initial state here. 
  // The HTML arrives with style="display: block" and aria-expanded="true" 
  // pre-rendered by the build process. This eliminates the FOUC/Jitter.

  nav.querySelectorAll('li.collapsible').forEach(item => {
    const anchor = item.querySelector('a');
    const submenu = item.querySelector('.submenu');

    if (!anchor || !submenu) return;

    // Only handle CLICK events to toggle state
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      // If it's a placeholder link (#) OR the user clicked the arrow icon
      const isToggleAction = !href || href === '#' || e.target.closest('.collapse-icon');

      if (isToggleAction) {
        e.preventDefault();
        
        // Toggle Logic
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        item.setAttribute('aria-expanded', newState);
        submenu.style.display = newState ? 'block' : 'none';
      }
    });
  });
}

// --- Mobile Menu Logic ---
function initializeMobileMenus() {
  const sidebarBtn = document.querySelector('.sidebar-menu-button');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-expanded');
    });
  }

  const tocBtn = document.querySelector('.toc-menu-button');
  const tocContainer = document.querySelector('.toc-container');
  const tocTitle = document.querySelector('.toc-title');

  const toggleToc = (e) => {
    if (window.getComputedStyle(tocBtn).display === 'none') return;
    e.stopPropagation();
    tocContainer.classList.toggle('mobile-expanded');
  };

  if (tocBtn && tocContainer) {
    tocBtn.addEventListener('click', toggleToc);
    if (tocTitle) tocTitle.addEventListener('click', toggleToc);
  }
}

// --- Sidebar Scroll Preservation (Instant Center) ---
function initializeSidebarScroll() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Wait for the layout to be stable
  requestAnimationFrame(() => {
    // Find the active link
    const activeElement = sidebar.querySelector('a.active');

    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'auto', // INSTANT jump (prevents scrolling animation jitter)
        block: 'center',  // Center it vertically in the sidebar
        inline: 'nearest'
      });
    }
  });
}

// --- Theme Toggle Logic ---
function setupThemeToggleListener() {
  const themeToggleButton = document.getElementById('theme-toggle-button');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('docmd-theme', theme);

    const highlightThemeLink = document.getElementById('highlight-theme');
    if (highlightThemeLink) {
      const newHref = highlightThemeLink.getAttribute('data-base-href') + `docmd-highlight-${theme}.css`;
      highlightThemeLink.setAttribute('href', newHref);
    }
  }

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

  if (!body.classList.contains('sidebar-collapsible') || !toggleButton) return;

  const defaultConfigCollapsed = body.dataset.defaultCollapsed === 'true';
  let isCollapsed = localStorage.getItem('docmd-sidebar-collapsed');

  if (isCollapsed === null) isCollapsed = defaultConfigCollapsed;
  else isCollapsed = isCollapsed === 'true';

  if (isCollapsed) body.classList.add('sidebar-collapsed');

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
        if (tabPanes[index]) tabPanes[index].classList.add('active');
      });
    });
  });
}

// --- Copy Code Button Logic ---
function initializeCopyCodeButtons() {
  if (document.body.dataset.copyCodeEnabled !== 'true') return;

  const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
  const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  document.querySelectorAll('pre').forEach(preElement => {
    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'block';

    preElement.parentNode.insertBefore(wrapper, preElement);
    wrapper.appendChild(preElement);
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
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
  syncBodyTheme();
  setupThemeToggleListener();
  initializeSidebarToggle();
  initializeTabs();
  initializeCopyCodeButtons();
  initializeCollapsibleNav();
  initializeMobileMenus();
  initializeSidebarScroll();
});