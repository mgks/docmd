const { processMarkdownContent, createMarkdownItInstance } = require('../core/file-processor');
const { renderHtmlPage } = require('../core/html-generator');
const templates = require('./templates'); 

function compile(markdown, config = {}, options = {}) {
    // Default config values for the browser
    const defaults = {
        siteTitle: 'Live Preview',
        theme: { defaultMode: 'light', name: 'default' },
        ...config
    };

    const md = createMarkdownItInstance(defaults);
    const result = processMarkdownContent(markdown, md, defaults, 'memory');

    if (!result) return '<p>Error parsing markdown</p>';

    const { frontmatter, htmlContent, headings } = result;

    const pageData = {
        content: htmlContent,
        frontmatter,
        headings,
        siteTitle: defaults.siteTitle,
        pageTitle: frontmatter.title || 'Untitled',
        description: frontmatter.description || '',
        defaultMode: defaults.theme.defaultMode,
        editUrl: null,
        editLinkText: '',
        navigationHtml: '', // Navigation is usually empty in a single-page preview
        relativePathToRoot: options.relativePathToRoot || './', // Important for finding CSS in dist/assets
        outputPath: 'index.html',
        currentPagePath: '/index',
        prevPage: null, nextPage: null,
        config: defaults,
        // Empty hooks
        metaTagsHtml: '', faviconLinkHtml: '', themeCssLinkHtml: '',
        pluginStylesHtml: '', pluginHeadScriptsHtml: '', pluginBodyScriptsHtml: '',
        themeInitScript: '', 
        logo: defaults.logo, sidebarConfig: { collapsible: false }, theme: defaults.theme,
        customCssFiles: [], customJsFiles: [],
        sponsor: { enabled: false }, footer: '', footerHtml: '',
        renderIcon: () => '', // Icons disabled in live preview to save weight
        isActivePage: true
    };

    let templateName = frontmatter.noStyle === true ? 'no-style.ejs' : 'layout.ejs';
    const templateContent = templates[templateName];

    if (!templateContent) return `Template ${templateName} not found`;

    const ejsOptions = {
        includer: (originalPath) => {
            let name = originalPath.endsWith('.ejs') ? originalPath : originalPath + '.ejs';
            if (templates[name]) return { template: templates[name] };
            return null;
        }
    };

    return renderHtmlPage(templateContent, pageData, templateName, ejsOptions);
}

module.exports = { compile };