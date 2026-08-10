/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightContainerAttributes(attrStr: string): string {
    let commentHtml = '';
    let mainAttrs = attrStr;

    // Extract trailing # comment
    const commentMatch = attrStr.match(/(\s+#.*)$/);
    if (commentMatch) {
        commentHtml = `<span class="hl-comment">${escapeHtml(commentMatch[1])}</span>`;
        mainAttrs = attrStr.slice(0, attrStr.length - commentMatch[0].length);
    }

    const attrRegex = /([a-zA-Z0-9_-]+:)(?:"([^"]*)"|'([^']*)'|(\S+))?/g;
    let result = '';
    let lastIndex = 0;

    for (const match of mainAttrs.matchAll(attrRegex)) {
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
            result += matchUnattributedText(mainAttrs.slice(lastIndex, matchIndex));
        }
        lastIndex = matchIndex + match[0].length;

        const key = escapeHtml(match[1]);
        const val = match[2] ?? match[3] ?? match[4] ?? '';
        const quoteChar = match[2] !== undefined ? '"' : (match[3] !== undefined ? "'" : '');

        result += `<span class="hl-attr-key">${key}</span>`;
        if (quoteChar) {
            result += `<span class="hl-attr-val">${quoteChar}${escapeHtml(val)}${quoteChar}</span>`;
        } else if (val) {
            result += `<span class="hl-attr-val">${escapeHtml(val)}</span>`;
        }
    }

    if (lastIndex < mainAttrs.length) {
        result += matchUnattributedText(mainAttrs.slice(lastIndex));
    }

    return result + commentHtml;
}

function matchUnattributedText(text: string): string {
    return text.replace(/("[^"]*"|'[^']*'|\b[a-zA-Z0-9_-]+\b)/g, (m) => {
        if (m.startsWith('"') || m.startsWith("'")) {
            return `<span class="hl-string">${escapeHtml(m)}</span>`;
        }
        return `<span class="hl-type-arg">${escapeHtml(m)}</span>`;
    });
}

function highlightInline(text: string): string {
    let escaped = escapeHtml(text);

    // Inline container: ::: tag "Text" style:success ::: /tag
    escaped = escaped.replace(
        /(:::)\s*([a-zA-Z0-9_-]+)(.*?)(:::)\s*\/([a-zA-Z0-9_-]+)/g,
        (_, openColons, openType, content, closeColons, closeType) => {
            const openHtml = `<span class="hl-container">${openColons}</span> <span class="hl-container-type">${openType}</span>`;
            const contentHtml = highlightContainerAttributes(content);
            const closeHtml = `<span class="hl-container">${closeColons}</span> <span class="hl-container-type">/${closeType}</span>`;
            return `${openHtml}${contentHtml}${closeHtml}`;
        }
    );

    // Math: $math$ or $$math$$
    escaped = escaped.replace(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/g, '<span class="hl-math">$1</span>');

    // Inline code: `code`
    escaped = escaped.replace(/(`[^`]+`)/g, '<span class="hl-code">$1</span>');

    // Bold: **text**
    escaped = escaped.replace(/(\*\*[^*]+\*\*)/g, '<span class="hl-bold">$1</span>');

    // Italics: *text*
    escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<span class="hl-italic">*$1*</span>');

    // Links: [text](url)
    escaped = escaped.replace(/(\[[^\]]+\])(\([^)]+\))/g, '<span class="hl-link-text">$1</span><span class="hl-link-url">$2</span>');

    return escaped;
}

export function highlightDocmd(code: string): { value: string; language: string } {
    const lines = code.split(/\r?\n/);
    let inCodeBlock = false;
    let inMathBlock = false;
    let inFrontmatter = false;
    let hasSeenContent = false;

    const highlightedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Frontmatter (--- or +++ at top of document)
        if (inFrontmatter) {
            if (trimmed === '---' || trimmed === '+++') {
                inFrontmatter = false;
                hasSeenContent = true;
                highlightedLines.push(`<span class="hl-frontmatter">${escapeHtml(trimmed)}</span>`);
                continue;
            }
            const fmMatch = line.match(/^([a-zA-Z0-9_-]+:)(.*)$/);
            if (fmMatch) {
                highlightedLines.push(
                    `<span class="hl-fm-key">${escapeHtml(fmMatch[1])}</span><span class="hl-fm-val">${escapeHtml(fmMatch[2])}</span>`
                );
            } else {
                highlightedLines.push(`<span class="hl-frontmatter">${escapeHtml(line)}</span>`);
            }
            continue;
        }

        if (!hasSeenContent) {
            if (trimmed === '---' || trimmed === '+++') {
                inFrontmatter = true;
                highlightedLines.push(`<span class="hl-frontmatter">${escapeHtml(trimmed)}</span>`);
                continue;
            }
            if (trimmed !== '') {
                hasSeenContent = true;
            }
        }

        // 2. Math Blocks ($$)
        if (trimmed === '$$') {
            inMathBlock = !inMathBlock;
            highlightedLines.push(`<span class="hl-math-fence">$$</span>`);
            continue;
        }

        if (inMathBlock) {
            highlightedLines.push(`<span class="hl-math-block">${escapeHtml(line)}</span>`);
            continue;
        }

        // 3. Fenced Code Blocks (```)
        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
            inCodeBlock = !inCodeBlock;
            highlightedLines.push(`<span class="hl-code-fence">${escapeHtml(line)}</span>`);
            continue;
        }

        if (inCodeBlock) {
            highlightedLines.push(`<span class="hl-code-block">${escapeHtml(line)}</span>`);
            continue;
        }

        // 3. Docmd Container Opener/Closer (:::)
        if (trimmed.startsWith(':::')) {
            const containerCloseMatch = line.match(/^(\s*:::)\s*\/([a-zA-Z0-9_-]+)\s*(#.*)?$/);
            if (containerCloseMatch) {
                const colons = `<span class="hl-container">${escapeHtml(containerCloseMatch[1])}</span>`;
                const type = escapeHtml(containerCloseMatch[2]);
                const comment = containerCloseMatch[3] ? `<span class="hl-comment">${escapeHtml(containerCloseMatch[3])}</span>` : '';
                highlightedLines.push(`${colons} <span class="hl-container-type">/${type}</span>${comment}`);
                continue;
            }

            const containerOpenMatch = line.match(/^(\s*:::)\s*([a-zA-Z0-9_-]+)(.*)$/);
            if (containerOpenMatch) {
                const colons = `<span class="hl-container">${escapeHtml(containerOpenMatch[1])}</span>`;
                const type = escapeHtml(containerOpenMatch[2]);
                const rest = containerOpenMatch[3];
                const restHtml = highlightContainerAttributes(rest);
                highlightedLines.push(`${colons} <span class="hl-container-type">${type}</span>${restHtml}`);
                continue;
            }
        }

        // 4. Markdown Headers (# Title)
        const headerMatch = line.match(/^(\s*#{1,6})(\s+.*)$/);
        if (headerMatch) {
            const hashes = escapeHtml(headerMatch[1]);
            const title = highlightInline(headerMatch[2]);
            highlightedLines.push(`<span class="hl-header-hash">${hashes}</span><span class="hl-header-text">${title}</span>`);
            continue;
        }

        // 5. Blockquotes (> Quote)
        const quoteMatch = line.match(/^(\s*>)(.*)$/);
        if (quoteMatch) {
            const quoteChar = escapeHtml(quoteMatch[1]);
            const quoteText = highlightInline(quoteMatch[2]);
            highlightedLines.push(`<span class="hl-quote-marker">${quoteChar}</span><span class="hl-quote-text">${quoteText}</span>`);
            continue;
        }

        // 6. List items (- item, 1. item)
        const listMatch = line.match(/^(\s*(?:\d+\.|\-|\*|\+))\s+(.*)$/);
        if (listMatch) {
            const bullet = escapeHtml(listMatch[1]);
            const text = highlightInline(listMatch[2]);
            highlightedLines.push(`<span class="hl-list-bullet">${bullet}</span> ${text}`);
            continue;
        }

        // 7. General Markdown line
        highlightedLines.push(highlightInline(line));
    }

    return {
        value: highlightedLines.join('\n'),
        language: 'docmd'
    };
}

export default { highlight: highlightDocmd };