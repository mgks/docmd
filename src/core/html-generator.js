// src/core/html-generator.js
const ejs = require('ejs');
const path = require('path');
const fs = require('fs-extra');
const { mdInstance } = require('./file-processor'); // Import mdInstance for footer
const { generateSeoMetaTags } = require('../plugins/seo');
const { generateAnalyticsScripts } = require('../plugins/analytics');
const { renderIcon } = require('./icon-renderer'); // Import icon renderer

async function processPluginHooks(config, pageData, relativePathToRoot) {
    let metaTagsHtml = '';
    let faviconLinkHtml = '';
    let themeCssLinkHtml = ''; // For theme.name CSS file
    let pluginStylesHtml = ''; // For plugin-specific CSS
    let pluginHeadScriptsHtml = '';
    let pluginBodyScriptsHtml = '';

    // 1. Favicon (built-in handling)
    if (config.favicon) {
        const faviconPath = config.favicon.startsWith('/') ? config.favicon.substring(1) : config.favicon;
        faviconLinkHtml = `<link rel="shortcut icon" href="${relativePathToRoot}${faviconPath}" type="image/x-icon">\n`;
    }

    // 2. Theme CSS (built-in handling for theme.name)
    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        const themeCssPath = `assets/css/docmd-theme-${config.theme.name}.css`;
        themeCssLinkHtml = `  <link rel="stylesheet" href="${relativePathToRoot}${themeCssPath}">\n`;
    }

    // 3. SEO Plugin (if configured)
    if (config.plugins?.seo) {
        metaTagsHtml += generateSeoMetaTags(config, pageData, relativePathToRoot);
    }

    // 4. Analytics Plugin (if configured)
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

    const pageTitle = frontmatter.title; // Get title from frontmatter (already processed in file-processor)

    // Process plugins to get their HTML contributions
    const pluginOutputs = await processPluginHooks(
        config,
        { frontmatter, outputPath }, // pageData object
        relativePathToRoot
    );

    let footerHtml = '';
    if (config.footer) {
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
    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');

    const isActivePage = currentPagePath && content && content.trim().length > 0;

    const ejsData = {
        content,
        pageTitle, // Pass the potentially undefined title
        description: frontmatter.description,
        siteTitle,
        navigationHtml,
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
        headings: headings || [],
        isActivePage,
        frontmatter,
        ...pluginOutputs,
    };

    try {
        return ejs.render(layoutTemplate, ejsData, {
            filename: layoutTemplatePath
        });
    } catch (e) {
        console.error(`❌ Error rendering EJS template for ${outputPath}: ${e.message}`);
        console.error("EJS Data:", JSON.stringify(ejsData, null, 2).substring(0, 1000) + "...");
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

module.exports = { generateHtmlPage, generateNavigationHtml };