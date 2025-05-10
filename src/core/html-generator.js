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
        faviconLinkHtml = `  <link rel="icon" href="${relativePathToRoot}${faviconPath}">\n`;
    }

    // 2. Theme CSS (built-in handling for theme.name)
    if (config.theme && config.theme.name && config.theme.name !== 'default') {
        // Assumes theme CSS files are like 'theme-yourthemename.css' in assets/css
        const themeCssPath = `assets/css/theme-${config.theme.name}.css`;
        // Check if theme file exists before linking (optional, good practice)
        // For now, assume it will exist if specified.
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

    // Future: Loop through a more generic plugin array if you evolve the system
    // for (const plugin of config.activePlugins) { /* plugin.runHook('meta', ...) */ }

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
        content, pageTitle, siteTitle, navigationHtml,
        relativePathToRoot, config, frontmatter, outputPath,
        prevPage, nextPage, currentPagePath, headings
    } = templateData;

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

    const layoutTemplatePath = path.join(__dirname, '..', 'templates', 'layout.ejs');
    if (!await fs.pathExists(layoutTemplatePath)) {
        throw new Error(`Layout template not found: ${layoutTemplatePath}`);
    }
    const layoutTemplate = await fs.readFile(layoutTemplatePath, 'utf8');

    // Determine if this is an active page for TOC display
    // The currentPagePath exists and has content
    const isActivePage = currentPagePath && content && content.trim().length > 0;

    const ejsData = {
        content,
        pageTitle: frontmatter.title || pageTitle || 'Untitled', // Ensure pageTitle is robust
        description: frontmatter.description, // Used by layout if no SEO plugin overrides
        siteTitle,
        navigationHtml,
        defaultMode: config.theme?.defaultMode || 'light',
        relativePathToRoot,
        logo: config.logo,
        theme: config.theme,
        customCssFiles: config.theme?.customCss || [],
        customJsFiles: config.customJs || [],
        footer: config.footer,
        footerHtml,
        renderIcon,
        prevPage,
        nextPage,
        currentPagePath, // Pass the current page path for active state detection
        headings: headings || [], // Pass headings for TOC, default to empty array if not provided
        isActivePage, // Flag to determine if TOC should be shown
        ...pluginOutputs, // Spread all plugin generated HTML strings
    };

    try {
        return ejs.render(layoutTemplate, ejsData);
    } catch (e) {
        console.error(`❌ Error rendering EJS template for ${outputPath}: ${e.message}`);
        console.error("EJS Data:", JSON.stringify(ejsData, null, 2).substring(0, 1000) + "..."); // Log partial data
        throw e; // Re-throw to stop build
    }
}

async function generateNavigationHtml(navItems, currentPagePath, relativePathToRoot, config) {
    const navTemplatePath = path.join(__dirname, '..', 'templates', 'navigation.ejs');
    if (!await fs.pathExists(navTemplatePath)) {
        throw new Error(`Navigation template not found: ${navTemplatePath}`);
    }
    const navTemplate = await fs.readFile(navTemplatePath, 'utf8');

    // Make renderIcon available to the EJS template
    const ejsHelpers = { renderIcon };

    return ejs.render(navTemplate, {
        navItems,
        currentPagePath,
        relativePathToRoot,
        config, // Pass full config if needed by nav (e.g. for base path)
        ...ejsHelpers
    });
}

module.exports = { generateHtmlPage, generateNavigationHtml };