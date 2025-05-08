const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra'); // For reading template files

async function generateHtmlPage(templateData) {
  // templateData should include:
  // - content (HTML content from Markdown)
  // - pageTitle (from frontmatter)
  // - description (from frontmatter, optional)
  // - siteTitle (from config)
  // - navigationHtml (pre-rendered navigation HTML)
  // - defaultTheme (from config)
  // - relativePathToRoot (calculated based on output path depth)

  const layoutTemplatePath = path.join(__dirname, '..', 'templates', 'layout.ejs');
  const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');
  return ejs.render(layoutTemplate, templateData);
}

async function generateNavigationHtml(navItems, currentPagePath, relativePathToRoot) {
    const navTemplatePath = path.join(__dirname, '..', 'templates', 'navigation.ejs');
    const navTemplate = await fs.readFile(navTemplatePath, 'utf8');
    return ejs.render(navTemplate, { navItems, currentPagePath, relativePathToRoot });
}


module.exports = { generateHtmlPage, generateNavigationHtml };