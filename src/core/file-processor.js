// src/core/file-processor.js
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const hljs = require('highlight.js');
const container = require('markdown-it-container');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (e) {
        console.error(`Error highlighting language ${lang}:`, e);
      }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

// Add anchors to headings for TOC linking
md.use((md) => {
  // Original renderer
  const defaultRender = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    // Get the heading level (h1, h2, etc.)
    const level = token.tag.substring(1);
    
    // Find the heading text from the next inline token
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline') {
      const headingText = contentToken.content;
      
      // Generate an ID from the heading text
      // Simple slugify: lowercase, replace spaces and special chars with dashes
      const id = headingText
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add the id attribute
      if (id) {
        token.attrSet('id', id);
      }
    }
    
    // Call the original renderer
    return defaultRender(tokens, idx, options, env, self);
  };
});

// Custom Containers
md.use(container, 'callout', {
  validate: function(params) {
    // Allows optional title for callout: ::: callout type [Optional Title Text]
    return params.trim().match(/^callout\s+(info|warning|tip|danger|success)(\s+.*)?$/);
  },
  render: function (tokens, idx) {
    const token = tokens[idx];
    const match = token.info.trim().match(/^callout\s+(info|warning|tip|danger|success)(\s+(.*))?$/);

    if (token.nesting === 1) {
      const type = match[1];
      const title = match[3] ? md.renderInline(match[3]) : ''; // Render title as markdown
      let titleHtml = '';
      if (title) {
        titleHtml = `<div class="callout-title">${title}</div>`;
      }
      return `<div class="docmd-container callout callout-${type}">\n${titleHtml}<div class="callout-content">\n`;
    } else {
      return '</div></div>\n';
    }
  }
});

md.use(container, 'card', {
  validate: function(params) {
    // Allows optional title for card: ::: card [Optional Title Text]
    return params.trim().match(/^card(\s+.*)?$/);
  },
  render: function (tokens, idx) {
    const token = tokens[idx];
    const titleText = token.info.trim().substring('card'.length).trim();

    if (token.nesting === 1) {
      let titleHtml = '';
      if (titleText) {
        titleHtml = `<div class="card-title">${md.renderInline(titleText)}</div>\n`;
      }
      return `<div class="docmd-container card">\n${titleHtml}<div class="card-content">\n`;
    } else {
      return '</div></div>\n';
    }
  }
});

// Steps container: Uses CSS counters for H4 or P > STRONG elements within it.
// Markdown syntax:
// ::: steps
// > 1. **First Step Title:**
// > Content for step 1
//
// > 2. **Second Step Title:**
// > More content
// :::
md.use(container, 'steps', {
  render: function (tokens, idx) {
    if (tokens[idx].nesting === 1) {
      // style="counter-reset: step-counter;" is added for CSS counters
      return '<div class="docmd-container steps" style="counter-reset: step-counter;">\n';
    } else {
      return '</div>\n';
    }
  }
});

// Post-process step markers for blockquote-based steps
function processStepsContent(html) {
  // Clean up any malformed containers
  html = html.replace(/<blockquote>\s*<p>::: /g, '<p>');
  
  // Find all steps containers and process their blockquotes as steps
  return html.replace(
    /<div class="docmd-container steps"[^>]*>([\s\S]*?)<\/div>/g,
    function(match, stepsContent) {
      // Process blockquotes within steps container
      const processedContent = stepsContent
        // Handle numbered steps - improved pattern to better capture the number and title
        .replace(
          /<blockquote>\s*<[^>]*>\s*(\d+|[*])(?:\.)?(?:\s*)(?:<strong>)?([^<]*)(?:<\/strong>)?(?::)?(?:\s*)([\s\S]*?)(?=<\/blockquote>)/g,
          function(blockquote, stepNumber, stepTitle, stepContent) {
            // Ensure there's always content in the step title
            const title = stepTitle.trim() || `Step ${stepNumber}`;
            
            // Preserve paragraph breaks in the content
            const formattedContent = stepContent
              .replace(/<p>([\s\S]*?)<\/p>/g, '</div><p>$1</p><div class="step-content">') // Convert paragraphs
              .replace(/<pre([\s\S]*?)<\/pre>/g, '</div><pre$1</pre><div class="step-content">'); // Preserve code blocks
            
            return `<div class="step"><h4>${stepNumber}. <strong>${title}</strong></h4><div class="step-content">${formattedContent}</div></div>`;
          }
        )
        // Handle unnumbered steps - like "**Title:**"
        .replace(
          /<blockquote>\s*<p><strong>([^<:]*?):<\/strong>([\s\S]*?)(?=<\/blockquote>)/g,
          function(blockquote, stepTitle, stepContent) {
            // Preserve paragraph breaks in the content
            const formattedContent = stepContent
              .replace(/<p>([\s\S]*?)<\/p>/g, '</div><p>$1</p><div class="step-content">') // Convert paragraphs
              .replace(/<pre([\s\S]*?)<\/pre>/g, '</div><pre$1</pre><div class="step-content">'); // Preserve code blocks
            
            return `<div class="step"><h4><strong>${stepTitle}</strong></h4><div class="step-content">${formattedContent}</div></div>`;
          }
        )
        // Handle any remaining blockquotes as generic steps
        .replace(
          /<blockquote>([\s\S]*?)<\/blockquote>/g,
          function(blockquote, content) {
            return `<div class="step">${content}</div>`;
          }
        );
      
      // Fix any empty step-content divs or doubled divs
      let fixedContent = processedContent
        .replace(/<div class="step-content"><\/div><div class="step-content">/g, '<div class="step-content">')
        .replace(/<div class="step-content"><\/div>/g, '');
      
      return `<div class="docmd-container steps" style="counter-reset: step-counter;">${fixedContent}</div>`;
    }
  );
}

// Pre-process step markers in Markdown content
// to ensure they'll be processed correctly by the markdown renderer
function preprocessStepMarkers(content) {
  // Find content between ::: steps and ::: markers
  return content.replace(
    /:::\s*steps\s*\n([\s\S]*?):::/g,
    function(match, stepsContent) {
      // Replace the step markers with a format that will survive markdown parsing
      const processedSteps = stepsContent.replace(
        /^::\s*((?:\d+|\*)?\.?\s*)(.*)$/gm,
        function(stepMatch, stepNumber, stepContent) {
          // Format it as a heading that we can target later
          return `### STEP_MARKER ${stepNumber}${stepContent}`;
        }
      );
      
      return `::: steps\n${processedSteps}:::`;
    }
  );
}

// Post-process step markers back to the expected format
function postprocessStepMarkers(html) {
  return html.replace(
    /<h3>STEP_MARKER\s*((?:\d+|\*)?\.?\s*)(.*?)<\/h3>/g,
    function(match, stepNumber, stepContent) {
      return `<h4>${stepNumber}${stepContent}</h4>`;
    }
  );
}

// Escape container syntax in code blocks
function escapeContainerSyntax(content) {
  // Find all fenced code blocks and escape container markers within them
  return content.replace(
    /```(.*?)\n([\s\S]*?)```/g,
    function(match, language, codeContent) {
      // Don't modify code blocks that already contain escaped markers
      if (codeContent.includes("\\:::") || codeContent.includes("\\::")) {
        return match;
      }
      
      // Escape ::: and :: markers within code blocks, but use a special marker
      // that won't render a backslash in the final output
      const escapedContent = codeContent
        .replace(/:::/g, "___DOCMD_CONTAINER_ESCAPED___:::")
        .replace(/^::/gm, "___DOCMD_CONTAINER_ESCAPED___::");
        
      return "```" + language + "\n" + escapedContent + "```";
    }
  );
}

// Fix container syntax issues in Markdown content
function normalizeContainerSyntax(content) {
  // 1. Ensure container opening markers are at the beginning of lines, not inline
  let fixed = content.replace(/([^\n])(:::)/g, '$1\n$2');
  
  // 2. Ensure container closing markers are at the beginning of lines and have proper newlines
  fixed = fixed.replace(/(:::)([^\n])/g, '$1\n$2');
  
  // 3. Fix extra spaces after container marker
  fixed = fixed.replace(/:::\s+(\w+)/g, '::: $1');
  
  // 4. Fix container markers that have newlines within them
  fixed = fixed.replace(/:::\n(\w+)/g, '::: $1');
  
  // 5. Fix missing spaces between ::: and container type
  fixed = fixed.replace(/:::(\w+)/g, '::: $1');
  
  return fixed;
}

/**
 * Decodes HTML entities in a string
 * @param {string} html - The HTML string to decode
 * @returns {string} - Decoded string
 */
function decodeHtmlEntities(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Extracts headings from HTML content for table of contents generation
 * @param {string} htmlContent - The rendered HTML content
 * @returns {Array} - Array of heading objects with id, level, and text
 */
function extractHeadingsFromHtml(htmlContent) {
  const headings = [];
  
  // Regular expression to find heading tags (h1-h6) with their content and id attributes
  const headingRegex = /<h([1-6])[^>]*?id="([^"]*)"[^>]*?>([\s\S]*?)<\/h\1>/g;
  
  let match;
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // Remove any HTML tags inside the heading text
    const textWithTags = match[3].replace(/<\/?[^>]+(>|$)/g, '');
    // Decode any HTML entities in the text
    const text = decodeHtmlEntities(textWithTags);
    
    headings.push({ id, level, text });
  }
  
  return headings;
}

async function processMarkdownFile(filePath) {
  const rawContent = await fs.readFile(filePath, 'utf8');
  let frontmatter, markdownContent;

  try {
    const parsed = matter(rawContent);
    frontmatter = parsed.data;
    markdownContent = parsed.content;
  } catch (e) {
    if (e.name === 'YAMLException') {
      // Provide more specific error for YAML parsing issues
      const errorMessage = `Error parsing YAML frontmatter in ${filePath}: ${e.reason || e.message}${e.mark ? ` at line ${e.mark.line + 1}, column ${e.mark.column + 1}` : ''}. Please check the syntax.`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage); // Propagate error to stop build/dev
    }
    // For other errors from gray-matter or unknown errors
    console.error(`❌ Error processing frontmatter in ${filePath}: ${e.message}`);
    throw e;
  }

  if (!frontmatter.title) {
    console.warn(`⚠️ Warning: Markdown file ${filePath} is missing a 'title' in its frontmatter. Using filename as fallback.`);
    // Fallback title, or you could make it an error
    // frontmatter.title = path.basename(filePath, path.extname(filePath));
  }

  // Check if this is a documentation example showing how to use containers
  const isContainerDocumentation = markdownContent.includes('containerName [optionalTitleOrType]') || 
                                  markdownContent.includes('## Callouts') || 
                                  markdownContent.includes('## Cards') || 
                                  markdownContent.includes('## Steps');

  // Special handling for container documentation - escape container syntax in code blocks
  if (isContainerDocumentation) {
    markdownContent = escapeContainerSyntax(markdownContent);
  }
  
  // Normalize container syntax
  const normalizedContent = normalizeContainerSyntax(markdownContent);
  
  // Render to HTML
  let htmlContent = md.render(normalizedContent);
  
  // Apply steps formatting
  htmlContent = processStepsContent(htmlContent);

  // Fix any specific issues
  // 1. Fix the issue with "These custom containers" paragraph in custom-containers.md
  htmlContent = htmlContent.replace(
    /<p>You should see "Application started successfully!" in your console.\s*<\/p>\s*<p>::: These custom containers/,
    '<p>You should see "Application started successfully!" in your console.</p></div><p>These custom containers'
  );
  
  // 2. Fix any remaining ::: markers at the start of paragraphs
  htmlContent = htmlContent.replace(/<p>:::\s+(.*?)<\/p>/g, '<p>$1</p>');
  
  // 3. Fix any broken Asterisk steps
  htmlContent = htmlContent.replace(
    /<div class="step"><h4>\*\. <strong><\/strong><\/h4>(.+?)<\/strong>/,
    '<div class="step"><h4>*. <strong>$1</strong>'
  );

  // 4. Replace our special escape marker with nothing (to fix backslash issue in rendered HTML)
  htmlContent = htmlContent.replace(/___DOCMD_CONTAINER_ESCAPED___/g, '');

  // Extract headings for table of contents
  const headings = extractHeadingsFromHtml(htmlContent);

  return {
    frontmatter: {
      title: "Untitled Page", // Default if not provided and no fallback
      ...frontmatter
    },
    htmlContent,
    headings, // Add headings to the returned object
  };
}

module.exports = { processMarkdownFile, mdInstance: md, extractHeadingsFromHtml }; // Export mdInstance if needed by plugins for consistency