// Source file from the docmd project — https://github.com/mgks/docmd

const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra');
const { createMarkdownItInstance } = require('./file-processor');
const { generateSeoMetaTags } = require('../plugins/seo');
const { generateAnalyticsScripts } = require('../plugins/analytics');
const { renderIcon } = require('./icon-renderer');

// Create a markdown instance for inline rendering
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

    // Favicon (built-in handling)
    if (config.favicon) {
        const faviconPath = config.favicon.startsWith('/') ? config.favicon.substring(1) : config.favicon;
        faviconLinkHtml = `<link rel="shortcut icon" href="${relativePathToRoot}${faviconPath}" type="image/x-icon">\n`;
    }

    // Theme CSS (built-in handling for theme.name)
    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        const themeCssPath = `assets/css/docmd-theme-${config.theme.name}.css`;
        themeCssLinkHtml = `  <link rel="stylesheet" href="${relativePathToRoot}${themeCssPath}">\n`;
    }

    // SEO Plugin (if configured)
    if (config.plugins?.seo) {
        metaTagsHtml += generateSeoMetaTags(config, pageData, relativePathToRoot);
    }

    // Analytics Plugin (if configured)
    if (config.plugins?.analytics) {
        const analyticsScripts = generateAnalyticsScripts(config, pageData);
        pluginHeadScriptsHtml += analyticsScripts.headScriptsHtml;
        pluginBodyScriptsHtml += analyticsScripts.bodyScriptsHtml;
    }

    return {
        metaTagsHtml,
        faviconLinkHtml,
        themeCssLinkHtml,
        pluginStylesHtml,
        pluginHeadScriptsHtml,
        pluginBodyScriptsHtml,
    };
}

async function generateHtmlPage(templateData) {
    const {
        content, siteTitle, navigationHtml,
        relativePathToRoot, config, frontmatter, outputPath,
        prevPage, nextPage, currentPagePath, headings
    } = templateData;

    const pageTitle = frontmatter.title;

    // Process plugins to get their HTML contributions
    const pluginOutputs = await processPluginHooks(
        config,
        { frontmatter, outputPath },
        relativePathToRoot
    );

    let footerHtml = '';
    if (config.footer) {
        // Initialize mdInstance if not already done
        if (!mdInstance) {
            mdInstance = createMarkdownItInstance(config);
        }
        footerHtml = mdInstance.renderInline(config.footer);
    }

    let templateName = 'layout.ejs';
    if (frontmatter.noStyle === true) {
        templateName = 'no-style.ejs';
    }

    const layoutTemplatePath = path.join(__dirname, '..', 'templates', templateName);
    if (!await fs.pathExists(layoutTemplatePath)) {
        throw new Error(`Template not found: ${layoutTemplatePath}`);
    }
    const isActivePage = currentPagePath && content && content.trim().length > 0;

    // Calculate Edit Link
    let editUrl = null;
    let editLinkText = 'Edit this page';
    
    if (config.editLink && config.editLink.enabled && config.editLink.baseUrl) {
        // Normalize URL (remove trailing slash)
        const baseUrl = config.editLink.baseUrl.replace(/\/$/, '');

        // Get the source file path relative to srcDir
        let relativeSourcePath = outputPath
            .replace(/\/index\.html$/, '.md') // folder/index.html -> folder.md
            .replace(/\\/g, '/'); // fix windows slashes

        // Special case: The root index.html comes from index.md
        if (relativeSourcePath === 'index.html') relativeSourcePath = 'index.md';

        // Let's assume a standard 1:1 mapping for v0.2.x        
        editUrl = `${baseUrl}/${relativeSourcePath}`;
        editLinkText = config.editLink.text || editLinkText;
    }

    const ejsData = {
        content,
        pageTitle,
        themeInitScript,
        description: frontmatter.description,
        siteTitle,
        navigationHtml,
        editUrl,
        editLinkText,
        defaultMode: config.theme?.defaultMode || 'light',
        relativePathToRoot,
        logo: config.logo,
        sidebarConfig: { 
            collapsible: config.sidebar?.collapsible ?? false,
            defaultCollapsed: config.sidebar?.defaultCollapsed ?? false,
        },
        theme: config.theme,
        customCssFiles: config.theme?.customCss || [],
        customJsFiles: config.customJs || [],
        sponsor: config.sponsor,
        footer: config.footer,
        footerHtml,
        renderIcon,
        prevPage,
        nextPage,
        currentPagePath,
        headings: frontmatter.toc !== false ? (headings || []) : [],
        isActivePage,
        frontmatter,
        config: config,
        ...pluginOutputs,
    };

    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');
    
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
        console.error("EJS Data snippet:", JSON.stringify(ejsData, null, 2).substring(0, 500));
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

    return ejs.render(navTemplate, {
        navItems,
        currentPagePath,
        relativePathToRoot,
        config,
        ...ejsHelpers
    }, {
        filename: navTemplatePath
    });
}

module.exports = { generateHtmlPage, generateNavigationHtml, renderHtmlPage };