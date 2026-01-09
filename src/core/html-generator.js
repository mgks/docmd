// Source file from the docmd project — https://github.com/docmd-io/docmd

const ejs = require('ejs');
const path = require('path');
const fs = require('../core/fs-utils');
const { createMarkdownItInstance } = require('./file-processor');
const { generateSeoMetaTags } = require('../plugins/seo');
const { generateAnalyticsScripts } = require('../plugins/analytics');
const { renderIcon } = require('./icon-renderer');
const { formatHtml } = require('./html-formatter');

let mdInstance = null;
let themeInitScript = '';

// Load the theme initialization script into memory once to avoid repeated disk I/O
(async () => {
    try {
        const themeInitPath = path.join(__dirname, '..', 'templates', 'partials', 'theme-init.js');
        if (await fs.exists(themeInitPath)) {
            const scriptContent = await fs.readFile(themeInitPath, 'utf8');
            themeInitScript = `<script>\n${scriptContent}\n</script>`;
        }
    } catch (e) { /* ignore */ }
})();

// Removes excessive whitespace and blank lines from the generated HTML
function cleanupHtml(html) {
    if (!html) return '';
    return html
        .replace(/^[ \t]+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Rewrites links based on build mode (Offline/File protocol vs Web Server)
function fixHtmlLinks(htmlContent, relativePathToRoot, isOfflineMode) {
    if (!htmlContent) return '';
    const root = relativePathToRoot || './';

    return htmlContent.replace(/href="((?:\/|\.\/|\.\.\/)[^"]*)"/g, (match, href) => {
        let finalPath = href;
        
        // Convert absolute project paths to relative
        if (href.startsWith('/')) {
            finalPath = root + href.substring(1);
        }
        
        // Handle offline mode (force index.html for directories)
        if (isOfflineMode) {
            const cleanPath = finalPath.split('#')[0].split('?')[0];
            if (!path.extname(cleanPath)) {
                if (finalPath.includes('#')) {
                    const parts = finalPath.split('#');
                    const prefix = parts[0].endsWith('/') ? parts[0] : parts[0] + '/';
                    finalPath = prefix + 'index.html#' + parts[1];
                } else {
                    finalPath += (finalPath.endsWith('/') ? '' : '/') + 'index.html';
                }
            }
        } else {
            // Web mode (strip index.html for clean URLs)
            if (finalPath.endsWith('/index.html')) {
                finalPath = finalPath.substring(0, finalPath.length - 10);
            }
        }
        return `href="${finalPath}"`;
    });
}

// aggregates HTML snippets from various plugins (SEO, Analytics, etc.)
async function processPluginHooks(config, pageData, relativePathToRoot) {
    let metaTagsHtml = '';
    let faviconLinkHtml = '';
    let themeCssLinkHtml = '';
    let pluginStylesHtml = '';
    let pluginHeadScriptsHtml = '';
    let pluginBodyScriptsHtml = '';

    const safeRoot = relativePathToRoot || './';
    const indent = '    '; // 4 spaces for cleaner output

    if (config.favicon) {
        const cleanFaviconPath = config.favicon.startsWith('/') ? config.favicon.substring(1) : config.favicon;
        const finalFaviconHref = `${safeRoot}${cleanFaviconPath}`;
        faviconLinkHtml = `${indent}<link rel="icon" href="${finalFaviconHref}" type="image/x-icon" sizes="any">\n${indent}<link rel="shortcut icon" href="${finalFaviconHref}" type="image/x-icon">`;
    }

    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        const themeCssPath = `assets/css/docmd-theme-${config.theme.name}.css`;
        themeCssLinkHtml = `${indent}<link rel="stylesheet" href="${safeRoot}${themeCssPath}">`;
    }

    if (config.plugins?.seo) {
        metaTagsHtml += generateSeoMetaTags(config, pageData, safeRoot);
    }

    if (config.plugins?.analytics) {
        const analyticsScripts = generateAnalyticsScripts(config, pageData);
        pluginHeadScriptsHtml += analyticsScripts.headScriptsHtml;
        pluginBodyScriptsHtml += analyticsScripts.bodyScriptsHtml;
    }

    return { metaTagsHtml, faviconLinkHtml, themeCssLinkHtml, pluginStylesHtml, pluginHeadScriptsHtml, pluginBodyScriptsHtml };
}

// Main function to assemble the page data and render the EJS template
async function generateHtmlPage(templateData, isOfflineMode = false) {
    let { content, frontmatter, outputPath, headings, config } = templateData;
    const { currentPagePath, prevPage, nextPage, relativePathToRoot, navigationHtml, siteTitle } = templateData;
    const pageTitle = frontmatter.title;

    if (!relativePathToRoot) templateData.relativePathToRoot = './';

    // Process content links and generate plugin assets
    content = fixHtmlLinks(content, templateData.relativePathToRoot, isOfflineMode);
    const pluginOutputs = await processPluginHooks(config, { frontmatter, outputPath }, templateData.relativePathToRoot);

    // Process footer markdown if present
    let footerHtml = '';
    if (config.footer) {
        if (!mdInstance) mdInstance = createMarkdownItInstance(config);
        footerHtml = mdInstance.renderInline(config.footer);
        footerHtml = fixHtmlLinks(footerHtml, templateData.relativePathToRoot, isOfflineMode);
    }

    // Determine which template to use
    let templateName = frontmatter.noStyle === true ? 'no-style.ejs' : 'layout.ejs';
    const layoutTemplatePath = path.join(__dirname, '..', 'templates', templateName);
    if (!await fs.exists(layoutTemplatePath)) throw new Error(`Template not found: ${layoutTemplatePath}`);
    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');

    const isActivePage = currentPagePath && content && content.trim().length > 0;

    // Build the "Edit this page" link
    let editUrl = null;
    let editLinkText = 'Edit this page';
    if (config.editLink && config.editLink.enabled && config.editLink.baseUrl) {
         editUrl = `${config.editLink.baseUrl.replace(/\/$/, '')}/${outputPath.replace(/\/index\.html$/, '.md')}`;
         if (outputPath.endsWith('index.html') && outputPath !== 'index.html') editUrl = editUrl.replace('.md', '/index.md'); 
         if (outputPath === 'index.html') editUrl = `${config.editLink.baseUrl.replace(/\/$/, '')}/index.md`;
         editLinkText = config.editLink.text || editLinkText;
    }

    // Prepare complete data object for EJS
    const ejsData = {
        ...templateData,
        description: frontmatter.description || '', // Fix for reference error
        footerHtml, editUrl, editLinkText, isActivePage,
        defaultMode: config.theme?.defaultMode || 'light',
        logo: config.logo, sidebarConfig: config.sidebar || {}, theme: config.theme,
        customCssFiles: config.theme?.customCss || [], customJsFiles: config.customJs || [],
        sponsor: config.sponsor, footer: config.footer, renderIcon, themeInitScript,
        headings: frontmatter.toc !== false ? (headings || []) : [],
        ...pluginOutputs,
        isOfflineMode 
    };

    // Render and format
    const rawHtml = renderHtmlPage(layoutTemplate, ejsData, layoutTemplatePath);
    const pkgVersion = require('../../package.json').version;
    const brandingComment = `<!-- Generated by docmd (v${pkgVersion}) - https://docmd.io -->\n`;
    
    // Apply smart formatting to the final HTML string
    return brandingComment + formatHtml(rawHtml);
}

function renderHtmlPage(templateContent, ejsData, filename = 'template.ejs', options = {}) {
    try {
        return ejs.render(templateContent, ejsData, { filename: filename, ...options });
    } catch (e) {
        console.error(`❌ Error rendering EJS template: ${e.message}`);
        throw e;
    }
}

// Generate the sidebar navigation HTML separately
async function generateNavigationHtml(navItems, currentPagePath, relativePathToRoot, config, isOfflineMode = false) {
    const navTemplatePath = path.join(__dirname, '..', 'templates', 'navigation.ejs');
    if (!await fs.exists(navTemplatePath)) throw new Error(`Navigation template not found: ${navTemplatePath}`);
    const navTemplate = await fs.readFile(navTemplatePath, 'utf8');
    const safeRoot = relativePathToRoot || './';

    // We render raw here; the main page formatter will clean this up later
    return ejs.render(navTemplate, { 
        navItems, currentPagePath, relativePathToRoot: safeRoot, config, isOfflineMode, renderIcon 
    }, { filename: navTemplatePath });
}

module.exports = { generateHtmlPage, generateNavigationHtml, renderHtmlPage };