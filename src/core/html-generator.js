// Source file from the docmd project — https://github.com/mgks/docmd

const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra');
const { createMarkdownItInstance } = require('./file-processor');
const { generateSeoMetaTags } = require('../plugins/seo');
const { generateAnalyticsScripts } = require('../plugins/analytics');
const { renderIcon } = require('./icon-renderer');

let mdInstance = null;
let themeInitScript = '';

(async () => {
    if (typeof __dirname !== 'undefined') {
        const themeInitPath = path.join(__dirname, '..', 'templates', 'partials', 'theme-init.js');
        if (await fs.pathExists(themeInitPath)) {
            const scriptContent = await fs.readFile(themeInitPath, 'utf8');
            themeInitScript = `<script>${scriptContent}</script>`;
        }
    }
})();

// Helper to handle link rewriting based on build mode
function fixHtmlLinks(htmlContent, relativePathToRoot, isOfflineMode) {
    if (!htmlContent) return '';
    const root = relativePathToRoot || './';

    // Regex matches hrefs starting with /, ./, or ../
    return htmlContent.replace(/href="((?:\/|\.\/|\.\.\/)[^"]*)"/g, (match, href) => {
        let finalPath = href;

        // 1. Convert Absolute to Relative
        if (href.startsWith('/')) {
            finalPath = root + href.substring(1);
        }
        
        // 2. Logic based on Mode
        if (isOfflineMode) {
            // Offline Mode: Force index.html for directories
            const cleanPath = finalPath.split('#')[0].split('?')[0];
            // If it has no extension (like .html, .css, .png), treat as directory
            if (!path.extname(cleanPath)) {
                if (finalPath.includes('#')) {
                    // Handle anchors: ./foo/#bar -> ./foo/index.html#bar
                    const parts = finalPath.split('#');
                    const prefix = parts[0].endsWith('/') ? parts[0] : parts[0] + '/';
                    finalPath = prefix + 'index.html#' + parts[1];
                } else {
                    if (finalPath.endsWith('/')) {
                        finalPath += 'index.html';
                    } else {
                        finalPath += '/index.html';
                    }
                }
            }
        } else {
            // Online/Dev Mode: Strip index.html for clean URLs
            if (finalPath.endsWith('/index.html')) {
                finalPath = finalPath.substring(0, finalPath.length - 10);
            }
        }
        
        return `href="${finalPath}"`;
    });
}

async function processPluginHooks(config, pageData, relativePathToRoot) {
    let metaTagsHtml = '';
    let faviconLinkHtml = '';
    let themeCssLinkHtml = '';
    let pluginStylesHtml = '';
    let pluginHeadScriptsHtml = '';
    let pluginBodyScriptsHtml = '';

    const safeRoot = relativePathToRoot || './';

    // Favicon
    if (config.favicon) {
        const cleanFaviconPath = config.favicon.startsWith('/') ? config.favicon.substring(1) : config.favicon;
        const finalFaviconHref = `${safeRoot}${cleanFaviconPath}`;
        
        faviconLinkHtml = `  <link rel="icon" href="${finalFaviconHref}" type="image/x-icon" sizes="any">\n`;
        faviconLinkHtml += `  <link rel="shortcut icon" href="${finalFaviconHref}" type="image/x-icon">\n`;
    }

    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        const themeCssPath = `assets/css/docmd-theme-${config.theme.name}.css`;
        themeCssLinkHtml = `  <link rel="stylesheet" href="${safeRoot}${themeCssPath}">\n`;
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

async function generateHtmlPage(templateData, isOfflineMode = false) {
    let { content, siteTitle, navigationHtml, relativePathToRoot, config, frontmatter, outputPath, prevPage, nextPage, currentPagePath, headings } = templateData;
    const pageTitle = frontmatter.title;

    if (!relativePathToRoot) relativePathToRoot = './';

    // Fix Content Links based on mode
    content = fixHtmlLinks(content, relativePathToRoot, isOfflineMode);

    const pluginOutputs = await processPluginHooks(config, { frontmatter, outputPath }, relativePathToRoot);

    let footerHtml = '';
    if (config.footer) {
        if (!mdInstance) mdInstance = createMarkdownItInstance(config);
        footerHtml = mdInstance.renderInline(config.footer);
        // Fix Footer Links based on mode
        footerHtml = fixHtmlLinks(footerHtml, relativePathToRoot, isOfflineMode);
    }

    let templateName = 'layout.ejs';
    if (frontmatter.noStyle === true) {
        templateName = 'no-style.ejs';
    }

    const layoutTemplatePath = path.join(__dirname, '..', 'templates', templateName);
    if (!await fs.pathExists(layoutTemplatePath)) {
        throw new Error(`Template not found: ${layoutTemplatePath}`);
    }
    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');

    const isActivePage = currentPagePath && content && content.trim().length > 0;

    let editUrl = null;
    let editLinkText = 'Edit this page';
    if (config.editLink && config.editLink.enabled && config.editLink.baseUrl) {
         editUrl = `${config.editLink.baseUrl.replace(/\/$/, '')}/${outputPath.replace(/\/index\.html$/, '.md').replace(/\\/g, '/')}`;
         if (outputPath.endsWith('index.html') && outputPath !== 'index.html') editUrl = editUrl.replace('.md', '/index.md'); 
         if (outputPath === 'index.html') editUrl = `${config.editLink.baseUrl.replace(/\/$/, '')}/index.md`;
         editLinkText = config.editLink.text || editLinkText;
    }

    const ejsData = {
        content, pageTitle, themeInitScript, description: frontmatter.description, siteTitle, navigationHtml,
        editUrl, editLinkText, defaultMode: config.theme?.defaultMode || 'light', relativePathToRoot,
        logo: config.logo, sidebarConfig: config.sidebar || {}, theme: config.theme,
        customCssFiles: config.theme?.customCss || [], customJsFiles: config.customJs || [],
        sponsor: config.sponsor, footer: config.footer, footerHtml, renderIcon,
        prevPage, nextPage, currentPagePath, headings: frontmatter.toc !== false ? (headings || []) : [],
        isActivePage, frontmatter, config, ...pluginOutputs,
        isOfflineMode 
    };

    return renderHtmlPage(layoutTemplate, ejsData, layoutTemplatePath);
}

function renderHtmlPage(templateContent, ejsData, filename = 'template.ejs', options = {}) {
    try {
        return ejs.render(templateContent, ejsData, {
            filename: filename,
            ...options
        });
    } catch (e) {
        console.error(`❌ Error rendering EJS template: ${e.message}`);
        throw e;
    }
}

// FIX: Added isOfflineMode parameter
async function generateNavigationHtml(navItems, currentPagePath, relativePathToRoot, config, isOfflineMode = false) {
    const navTemplatePath = path.join(__dirname, '..', 'templates', 'navigation.ejs');
    if (!await fs.pathExists(navTemplatePath)) {
        throw new Error(`Navigation template not found: ${navTemplatePath}`);
    }
    const navTemplate = await fs.readFile(navTemplatePath, 'utf8');
    const ejsHelpers = { renderIcon };
    
    const safeRoot = relativePathToRoot || './';

    return ejs.render(navTemplate, { 
        navItems, 
        currentPagePath, 
        relativePathToRoot: safeRoot, 
        config, 
        isOfflineMode, // <--- Passing the variable here
        ...ejsHelpers 
    }, { filename: navTemplatePath });
}

module.exports = { generateHtmlPage, generateNavigationHtml, renderHtmlPage };