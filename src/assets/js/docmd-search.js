// Source file from the docmd project — https://github.com/mgks/docmd

/* 
 * Client-side search functionality for docmd
 */

(function() {
    let miniSearch = null;
    let isIndexLoaded = false;
    let selectedIndex = -1; // Track keyboard selection
    
    const searchModal = document.getElementById('docmd-search-modal');
    const searchInput = document.getElementById('docmd-search-input');
    const searchResults = document.getElementById('docmd-search-results');

    const ROOT_PATH = window.DOCMD_ROOT || './';

    if (!searchModal) return;

    const emptyStateHtml = '<div class="search-initial">Type to start searching...</div>';

    // 1. Open/Close Logic
    function openSearch() {
        searchModal.style.display = 'flex';
        searchInput.focus();
        
        if (!searchInput.value.trim()) {
            searchResults.innerHTML = emptyStateHtml;
            selectedIndex = -1;
        }
        
        if (!isIndexLoaded) loadIndex();
    }

    function closeSearch() {
        searchModal.style.display = 'none';
        selectedIndex = -1; // Reset selection
    }

    // 2. Keyboard Navigation & Shortcuts
    document.addEventListener('keydown', (e) => {
        // Open: Cmd+K / Ctrl+K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (searchModal.style.display === 'flex') {
                closeSearch();
            } else {
                openSearch();
            }
        }
        
        // Context: Only handle these if search is open
        if (searchModal.style.display === 'flex') {
            const items = searchResults.querySelectorAll('.search-result-item');
            
            if (e.key === 'Escape') {
                e.preventDefault();
                closeSearch();
            }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length === 0) return;
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection(items);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length === 0) return;
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection(items);
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                } else if (items.length > 0) {
                    // If nothing selected but results exist, click the first one on Enter
                    items[0].click();
                }
            }
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Click handlers
    document.querySelectorAll('.docmd-search-trigger').forEach(btn => {
        btn.addEventListener('click', openSearch);
    });

    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) closeSearch();
    });

    // 3. Index Loading Logic
    async function loadIndex() {
        try {

            const indexUrl = `${ROOT_PATH}search-index.json`;
            const response = await fetch(indexUrl);
            if (!response.ok) throw new Error(response.status);

            const jsonString = await response.text();
            
            miniSearch = MiniSearch.loadJSON(jsonString, {
                fields: ['title', 'headings', 'text'],
                storeFields: ['title', 'id', 'text'],
                searchOptions: {
                    fuzzy: 0.2,
                    prefix: true,
                    boost: { title: 2, headings: 1.5 }
                }
            });
            
            isIndexLoaded = true;
            // console.log('Search index loaded');
            
            if (searchInput.value.trim()) {
                searchInput.dispatchEvent(new Event('input'));
            }

        } catch (e) {
            console.error('Failed to load search index', e);
            searchResults.innerHTML = '<div class="search-error">Failed to load search index.</div>';
        }
    }

    // Helper: Snippets (Same as before)
    function getSnippet(text, query) {
        if (!text) return '';
        const terms = query.split(/\s+/).filter(t => t.length > 2);
        const lowerText = text.toLowerCase();
        let bestIndex = -1;
        
        for (const term of terms) {
            const idx = lowerText.indexOf(term.toLowerCase());
            if (idx >= 0) { bestIndex = idx; break; }
        }
        
        const contextSize = 60;
        let start = 0;
        let end = 120;
        
        if (bestIndex >= 0) {
            start = Math.max(0, bestIndex - contextSize);
            end = Math.min(text.length, bestIndex + contextSize);
        }
        
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        const safeTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        if (safeTerms) {
            const highlightRegex = new RegExp(`(${safeTerms})`, 'gi');
            snippet = snippet.replace(highlightRegex, '<mark>$1</mark>');
        }
        return snippet;
    }

    // 4. Search Execution
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        selectedIndex = -1; // Reset selection on new input
        
        if (!query) {
            searchResults.innerHTML = emptyStateHtml;
            return;
        }
        
        if (!isIndexLoaded) return;

        const results = miniSearch.search(query);
        renderResults(results, query);
    });

    function renderResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found.</div>';
            return;
        }

        const html = results.slice(0, 10).map((result, index) => {
            const snippet = getSnippet(result.text, query);

            const linkHref = `${ROOT_PATH}${result.id}`;

            // Add data-index for mouse interaction tracking if needed
            return `
                <a href="${linkHref}" class="search-result-item" data-index="${index}" onclick="window.closeDocmdSearch()">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-preview">${snippet}</div>
                </a>
            `;
        }).join('');

        searchResults.innerHTML = html;
        
        // Optional: Allow mouse hover to update selectedIndex
        searchResults.querySelectorAll('.search-result-item').forEach((item, idx) => {
            item.addEventListener('mouseenter', () => {
                selectedIndex = idx;
                updateSelection(searchResults.querySelectorAll('.search-result-item'));
            });
        });
    }
    
    window.closeDocmdSearch = closeSearch;
})();