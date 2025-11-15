// Source file from the docmd project — https://github.com/mgks/docmd

/**
 * Flattens the navigation tree and finds the previous and next pages relative to the current page.
 * @param {Array} navItems - The navigation array from config.
 * @param {string} currentPagePath - The normalized path of the current page.
 * @returns {{prevPage: object|null, nextPage: object|null}}
 */
function findPageNeighbors(navItems, currentPagePath) {
  const flatNavigation = [];

  // Recursive function to flatten the navigation tree
  function extractNavigationItems(items) {
    if (!items || !Array.isArray(items)) return;
    
    for (const item of items) {
      if (item.external || !item.path || item.path === '#') {
        // If it's a category with no path but has children, recurse into them
        if (item.children && Array.isArray(item.children)) {
          extractNavigationItems(item.children);
        }
        continue; // Skip external links and parent items without a direct path
      }

      let normalizedItemPath = item.path;

      // Ensure it starts with a slash
      if (!normalizedItemPath.startsWith('/')) {
        normalizedItemPath = '/' + normalizedItemPath;
      }

      // Ensure it ends with a slash (unless it's the root path)
      if (normalizedItemPath.length > 1 && !normalizedItemPath.endsWith('/')) {
        normalizedItemPath += '/';
      }

      flatNavigation.push({
        title: item.title,
        path: normalizedItemPath,
      });

      if (item.children && Array.isArray(item.children)) {
        extractNavigationItems(item.children);
      }
    }
  }

  extractNavigationItems(navItems);

  const currentPageIndex = flatNavigation.findIndex(item => item.path === currentPagePath);

  if (currentPageIndex === -1) {
    return { prevPage: null, nextPage: null };
  }

  const prevPage = currentPageIndex > 0 ? flatNavigation[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < flatNavigation.length - 1 ? flatNavigation[currentPageIndex + 1] : null;

  return { prevPage, nextPage };
}

module.exports = { findPageNeighbors };