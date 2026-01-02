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

async function processPluginHooks(config, pageData, relativePathToRoot) {
    let metaTagsHtml = '';
    let faviconLinkHtml = '';
    let themeCssLinkHtml = '';
    let pluginStylesHtml = '';
    let pluginHeadScriptsHtml = '';
    let pluginBodyScriptsHtml = '';

    if (config.favicon) {
        const faviconPath = config.favicon.startsWith('/') ? config.favicon.substring(1) : config.favicon;
        faviconLinkHtml = `<link rel="shortcut icon" href="${relativePathToRoot}${faviconPath}" type="image/x-icon">\n`;
    }
    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        const themeCssPath = `assets/css/docmd-theme-${config.theme.name}.css`;
        themeCssLinkHtml = `  <link rel="stylesheet" href="${relativePathToRoot}${themeCssPath}">\n`;
    }
    if (config.plugins?.seo) {
        metaTagsHtml += generateSeoMetaTags(config, pageData, relativePathToRoot);
    }
    if (config.plugins?.analytics) {
        const analyticsScripts = generateAnalyticsScripts(config, pageData);
        pluginHeadScriptsHtml += analyticsScripts.headScriptsHtml;
        pluginBodyScriptsHtml += analyticsScripts.bodyScriptsHtml;
    }
    return { metaTagsHtml, faviconLinkHtml, themeCssLinkHtml, pluginStylesHtml, pluginHeadScriptsHtml, pluginBodyScriptsHtml };
}

// Main function used by CLI
async function generateHtmlPage(templateData) {
    const { content, siteTitle, navigationHtml, relativePathToRoot, config, frontmatter, outputPath, prevPage, nextPage, currentPagePath, headings } = templateData;
    const pageTitle = frontmatter.title;

    const pluginOutputs = await processPluginHooks(config, { frontmatter, outputPath }, relativePathToRoot);

    let footerHtml = '';
    if (config.footer) {
        if (!mdInstance) mdInstance = createMarkdownItInstance(config);
        footerHtml = mdInstance.renderInline(config.footer);
    }

    let templateName = 'layout.ejs';
    if (frontmatter.noStyle === true) {
        templateName = 'no-style.ejs';
    }

    // Node.js specific: Read file from disk
    const layoutTemplatePath = path.join(__dirname, '..', 'templates', templateName);
    if (!await fs.pathExists(layoutTemplatePath)) {
        throw new Error(`Template not found: ${layoutTemplatePath}`);
    }
    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');

    const isActivePage = currentPagePath && content && content.trim().length > 0;
    
    // Edit Link Logic (Simplified for brevity, keep your original logic here)
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
    };

    // Call the pure render function
    return renderHtmlPage(layoutTemplate, ejsData, layoutTemplatePath);
}

// PURE FUNCTION: Renders string -> string (Used by WASM)
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

async function generateNavigationHtml(navItems, currentPagePath, relativePathToRoot, config) {
    const navTemplatePath = path.join(__dirname, '..', 'templates', 'navigation.ejs');
    if (!await fs.pathExists(navTemplatePath)) {
        throw new Error(`Navigation template not found: ${navTemplatePath}`);
    }
    const navTemplate = await fs.readFile(navTemplatePath, 'utf8');
    const ejsHelpers = { renderIcon };
    return ejs.render(navTemplate, { navItems, currentPagePath, relativePathToRoot, config, ...ejsHelpers }, { filename: navTemplatePath });
}

module.exports = { generateHtmlPage, generateNavigationHtml, renderHtmlPage };