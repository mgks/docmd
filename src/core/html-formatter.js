// Source file from the docmd project — https://github.com/docmd-io/docmd

// Tags that don't have a closing tag (void elements)
const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
]);

// Tags where whitespace should be preserved exactly
const PRESERVE_TAGS = new Set(['pre', 'script', 'style', 'textarea']);

function formatHtml(html) {
    if (!html) return '';

    const lines = html.split(/\r?\n/);
    let formatted = [];
    let indentLevel = 0;
    const indentSize = 4; // 4 spaces per level
    
    // State tracking
    let inPreserveBlock = false;
    let preserveTagName = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim(); // Start with a clean slate for this line

        if (!line) continue; // Skip empty lines

        // --- 1. Handle Preserve Blocks (pre/script/style) ---
        if (inPreserveBlock) {
            // Check if this line ends the block
            if (line.toLowerCase().includes(`</${preserveTagName}>`)) {
                inPreserveBlock = false;
            } else {
                // If inside preserve block, add raw line (no trim) from original
                formatted.push(lines[i]); 
                continue;
            }
        }

        // Check if this line STARTS a preserve block
        for (const tag of PRESERVE_TAGS) {
            if (line.toLowerCase().startsWith(`<${tag}`)) {
                inPreserveBlock = true;
                preserveTagName = tag;
                // If it's a one-liner (e.g. <script>...</script>), handle it immediately
                if (line.toLowerCase().includes(`</${tag}>`)) {
                    inPreserveBlock = false;
                }
                break;
            }
        }

        // --- 2. Calculate Indentation ---
        
        // Detect closing tags at the start of the line (e.g. </div> or -->)
        const isClosing = /^<\//.test(line) || /^-->/.test(line);
        
        if (isClosing && indentLevel > 0) {
            indentLevel--;
        }

        // Apply indentation
        const spaces = ' '.repeat(indentLevel * indentSize);
        formatted.push(spaces + line);

        // --- 3. Adjust Indent for Next Line ---
        
        // Detect opening tags
        // Logic: Starts with <, not </, not <!, not void tag, and not self-closing />
        const isOpening = /^<[\w]+/.test(line) 
            && !/^<\//.test(line) 
            && !/\/>$/.test(line); // Ends with />

        if (isOpening) {
            // Extract tag name to check if it's void
            const tagNameMatch = line.match(/^<([\w-]+)/);
            if (tagNameMatch) {
                const tagName = tagNameMatch[1].toLowerCase();
                if (!VOID_TAGS.has(tagName)) {
                    // Check if it's a one-liner: <div>Content</div>
                    // Logic: count opening vs closing tags in this line
                    // Simple heuristic: if line contains </tagName>, it's closed
                    const hasClosingPair = new RegExp(`</${tagName}>`, 'i').test(line);
                    
                    if (!hasClosingPair) {
                        indentLevel++;
                    }
                }
            }
        }
    }

    return formatted.join('\n');
}

module.exports = { formatHtml };