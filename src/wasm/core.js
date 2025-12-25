const { processMarkdownContent, createMarkdownItInstance } = require('../core/file-processor');
const { renderHtmlPage } = require('../core/html-generator');
const templates = require('./templates');

/**
 * Compile markdown to HTML without file system access.
 * @param {string} markdown - The raw markdown content.
 * @param {object} config - The docmd configuration object.
 * @param {object} options - Options { currentPath: string }
 */
function compile(markdown, config, options = {}) {
    const md = createMarkdownItInstance(config);
    const result = processMarkdownContent(markdown, md, config, options.currentPath || 'memory');

    if (!result) {
        throw new Error('Failed to process markdown');
    }

    const { frontmatter, htmlContent, headings } = result;

    // Prepare data for template
    // Note: We mocking some fields that depend on file system scan (like navigation)
    // unless passed in options.
    
    const pageData = {
        content: htmlContent,
        frontmatter,
        headings,
        // Defaults for missing data in pure compile mode
        siteTitle: config.siteTitle || 'Docmd Site',
        pageTitle: frontmatter.title,
        description: frontmatter.description,
        defaultMode: config.theme?.defaultMode || 'light',
        editUrl: null, // Mocked for now
        editLinkText: 'Edit this page',
        navigationHtml: options.navigationHtml || '', 
        relativePathToRoot: options.relativePathToRoot || './',
        outputPath: options.outputPath || 'index.html',
        currentPagePath: options.currentPath || '/index',
        prevPage: options.prevPage || null,
        nextPage: options.nextPage || null,
        config: config,
        // Mock plugin outputs for now as they might use FS
        metaTagsHtml: '',
        faviconLinkHtml: '',
        themeCssLinkHtml: '',
        pluginStylesHtml: '',
        pluginHeadScriptsHtml: '',
        pluginBodyScriptsHtml: '',
        themeInitScript: '', // This is usually read from file, we might need to inline it too
        logo: config.logo,
        sidebarConfig: config.sidebar || {},
        theme: config.theme || {},
        customCssFiles: [],
        customJsFiles: [],
        sponsor: config.sponsor,
        footer: config.footer,
        footerHtml: '', // TODO: Render footer markdown
        renderIcon: (name) => `<!-- icon: ${name} -->`, // Simple mock
        isActivePage: true
    };

    // Select template
    let templateName = 'layout.ejs';
    if (frontmatter.noStyle === true) {
        templateName = 'no-style.ejs';
    }

    const templateContent = templates[templateName];
    if (!templateContent) {
        throw new Error(`Template ${templateName} not found in bundled templates.`);
    }

    const ejsOptions = {
        includer: (originalPath, parsedPath) => {
            console.log('Includer called for:', originalPath);
            // originalPath is like 'toc'
            // We need to match it to a key in templates object (e.g., 'toc.ejs')
            let potentialName = originalPath;
            if (!potentialName.endsWith('.ejs')) {
                potentialName += '.ejs';
            }
            // Check for direct match or path match
            // The templates object keys are like 'toc.ejs', 'layout.ejs'
            // If includes use paths like '../partials/foo', we might need normalization.
            // But standard docmd templates seem flat or we'll flat them in build.
            
            // In build-wasm.js, we only included root templates. 'toc.ejs' is in root of templates dir.
            // If there are partials in subdirs, we need to handle that.
            // Checking file listing: templates/toc.ejs exists.
            
            if (templates[potentialName]) {
                return { template: templates[potentialName] };
            }
            return null;
        }
    };

    return renderHtmlPage(templateContent, pageData, templateName, ejsOptions);
}

module.exports = { compile, templates };
