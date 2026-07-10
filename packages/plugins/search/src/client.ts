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

import * as SemanticSearch from './semantic-client.js';

export {};

declare global {
    interface Window {
        DOCMD_SITE_ROOT?: string;
        DOCMD_ROOT?: string;
        lastFocusedElement?: HTMLElement | null;
        closeDocmdSearch?: () => void;
    }
}
declare const MiniSearch: any;

(function () {
    let miniSearch: any = null;
    let isSemanticMode = false;  // Track if semantic search is active
    let isIndexLoaded = false;
    let selectedIndex = -1;
    const activeVersionFilters = new Set<string>();
    let globalAllVersions: string[] = [];
    const globalVersionColors: Record<string, {bg: string, fg: string}> = {};

    function initSearch() {
        const searchModal = document.getElementById('docmd-search-modal') as HTMLElement;
        const searchInput = document.getElementById('docmd-search-input') as HTMLInputElement;
        const searchResults = document.getElementById('docmd-search-results') as HTMLElement;

        if (!searchModal || !searchInput || !searchResults) return;

        // showFilters: hide version filter bar when explicitly set to false
        const showFilters = searchModal.dataset.showFilters !== 'false';

        // Read translated strings from data attributes (injected server-side per locale)
        const strings = {
            initial: searchModal.dataset.searchInitial || 'Type to start searching...',
            noResults: searchModal.dataset.searchNoResults || 'No results found.',
            error: searchModal.dataset.searchError || 'Failed to load search index.'
        };

        // Use Site Root if available (for versioning), fallback to Context Root
        const rawRoot = window.DOCMD_SITE_ROOT || window.DOCMD_ROOT || './';
        let ROOT_PATH = new URL(rawRoot, window.location.href).href;
        if (!ROOT_PATH.endsWith('/')) ROOT_PATH += '/';

        // Determine the locale-specific search index path.
        // The index lives alongside the locale's HTML files:
        //   default locale: /search-index.json
        //   non-default:    /hi/search-index.json
        // Since ROOT_PATH already resolves to the correct locale root
        // (e.g. https://docs.example.com/ or https://docs.example.com/hi/),
        // we can simply append search-index.json to it.
        // However, we need to detect our locale prefix from the current URL
        // and build the fetch path relative to the site base.
        const siteBase = (window.DOCMD_SITE_ROOT || window.DOCMD_ROOT || '/').replace(/\/$/, '') + '/';
        const currentPath = window.location.pathname;
        
        // Extract locale prefix from current URL path
        // If URL is /hi/content/steps and base is /, locale prefix is "hi/"
        const pathAfterBase = currentPath.startsWith(siteBase) 
            ? currentPath.slice(siteBase.length) 
            : currentPath.replace(/^\//, '');
        const firstSegment = pathAfterBase.split('/')[0];
        
        // Check if the first segment looks like a locale (2-3 letter code)
        // by checking the meta tag that the engine injects
        const hreflangLinks = document.querySelectorAll('link[hreflang]');
        const knownLocales = new Set<string>();
        hreflangLinks.forEach(link => {
            const lang = link.getAttribute('hreflang');
            if (lang && lang !== 'x-default') knownLocales.add(lang);
        });
        
        const localePrefix = knownLocales.has(firstSegment) ? firstSegment + '/' : '';
        const baseUrl = new URL(siteBase, window.location.href).href;
        const searchIndexUrl = baseUrl + localePrefix + 'search-index.json';

        function escapeHtml(str: any): string {
            const s = typeof str === 'string' ? str : String(str || '');
            return s.replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            })[m] as string);
        }

        function getSnippet(text: string | undefined, query: string): string {
            if (!text) return '';
            const terms = query.split(/\s+/).filter(t => t.length > 2);
            let bestIndex = -1;
            for (const term of terms) {
                const idx = text.toLowerCase().indexOf(term.toLowerCase());
                if (idx >= 0) { bestIndex = idx; break; }
            }
            const start = Math.max(0, bestIndex - 60);
            const end = Math.min(text.length, bestIndex + 60);
            let snippet = text.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < text.length) snippet += '...';

            snippet = escapeHtml(snippet);

            // Then apply highlighting marks (escape terms to match escaped snippet)
            const safeTerms = terms.map(t => escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            if (safeTerms) {
                snippet = snippet.replace(new RegExp(`(${safeTerms})`, 'gi'), '<mark>$1</mark>');
            }
            return snippet;
        }

        // 1. Open/Close Logic
        function openSearch() {
            searchModal.style.display = 'flex';
            window.lastFocusedElement = document.activeElement as HTMLElement | null;
            setTimeout(() => searchInput.focus(), 50);

            if (!searchInput.value.trim()) {
                const sanitized = `<div class="search-initial">${escapeHtml(strings.initial)}</div>`;
                searchResults.innerHTML = sanitized;
                selectedIndex = -1;
            }
            if (!isIndexLoaded) loadIndex();
        }

        function closeSearch() {
            searchModal.style.display = 'none';
            if (window.lastFocusedElement) window.lastFocusedElement.focus();
            selectedIndex = -1;
        }

        // --- Event Delegation for Triggers (Survives SPA) ---
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('.docmd-search-trigger')) {
                e.preventDefault();
                openSearch();
            }
            if (target === searchModal || target?.closest('.docmd-search-close')) {
                closeSearch();
            }
        });

        // 2. Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchModal.style.display === 'flex' ? closeSearch() : openSearch();
            }

            if (searchModal.style.display === 'flex') {
                const items = searchResults.querySelectorAll('.search-result-item') as NodeListOf<HTMLElement>;
                if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { selectedIndex = (selectedIndex + 1) % items.length; updateSelection(items); } }
                else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { selectedIndex = (selectedIndex - 1 + items.length) % items.length; updateSelection(items); } }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && items[selectedIndex]) items[selectedIndex].click();
                    else if (items.length > 0) items[0].click();
                }
            }
        });

        function updateSelection(items: NodeListOf<HTMLElement>) {
            items.forEach((item, idx) => {
                item.classList.toggle('selected', idx === selectedIndex);
                if (idx === selectedIndex) item.scrollIntoView({ block: 'nearest' });
            });
        }

        // 3. Index Loading - fetches locale-specific index
        async function loadIndex() {
            // Auto-detect semantic search at runtime. We check BOTH:
            //   - The build-time hint (data-semantic="true") — set when the
            //     build pipeline knew semantic was available at render time.
            //   - A runtime probe (HEAD request to manifest.json) — catches
            //     the first-build case where deps were installed in onPostBuild
            //     (after generateScripts already rendered the page without
            //     data-semantic). The probe is a single network round-trip
            //     that only runs once per page load, so there's no perf cost.
            const hasBuildHint = searchModal.dataset.semantic === 'true';
            let useSemantic = hasBuildHint;

            if (!useSemantic) {
                try {
                    const probe = await fetch(`${siteBase}.docmd-search/manifest.json`, { method: 'HEAD' });
                    if (probe.ok) useSemantic = true;
                } catch { /* no index → keyword */ }
            }

            try {
                if (useSemantic) {
                    // ── Semantic search path ──────────────────────────────────
                    const ctx: SemanticSearch.SemanticSearchContext = {
                        siteBase,
                        ROOT_PATH,
                        searchResults,
                        strings,
                        activeVersionFilters,
                        globalAllVersions,
                        globalVersionColors,
                        selectedIndex,
                        updateSelection,
                        showConfidence: searchModal.dataset.showConfidence === 'true'
                    };

                    await SemanticSearch.loadSemanticIndex(ctx);
                    
                    // Render version filters if versions were loaded and filters are enabled
                    if (globalAllVersions.length > 0 && showFilters) {
                        renderGlobalFilters();
                    }

                    isSemanticMode = true;
                    isIndexLoaded = true;
                    if (searchInput.value.trim()) searchInput.dispatchEvent(new Event('input'));
                    return;
                }

                // ── Keyword search path (default) ─────────────────────────────
                const response = await fetch(searchIndexUrl);
                if (response.headers.get("content-type")?.includes("text/html")) throw new Error("Invalid content type");
                if (!response.ok) throw new Error(String(response.status));

                const jsonString = await response.text();
                const indexData = JSON.parse(jsonString);
                
                // Extract all versions globally from the raw MiniSearch index data
                const docs = indexData.storedFields || {};
                globalAllVersions = [...new Set(Object.values(docs).map((d: any) => d.version).filter(Boolean))] as string[];
                globalAllVersions.sort();

                const huePresets = [210, 150, 30, 330, 270, 60, 180, 0];
                globalAllVersions.forEach((v, i) => {
                    const hue = huePresets[i % huePresets.length];
                    globalVersionColors[v] = { bg: `hsl(${hue}, 55%, 92%)`, fg: `hsl(${hue}, 60%, 35%)` };
                });

                const CJK_AND_SPACELESS_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\u0e00-\u0e7f\u0e80-\u0eff\u1780-\u17ff\u1000-\u109f\u0f00-\u0fff]/g;
                miniSearch = MiniSearch.loadJSON(jsonString, {
                    fields: ['title', 'headings', 'text'],
                    storeFields: ['title', 'id', 'text', 'version'],
                    tokenize: (text: string) => {
                        const spaced = text.replace(CJK_AND_SPACELESS_REGEX, ' $& ');
                        const defaultTokenize = MiniSearch.getDefault ? MiniSearch.getDefault('tokenize') : null;
                        return defaultTokenize ? defaultTokenize(spaced) : spaced.toLowerCase().split(/[^a-zA-Z0-9_'\u00C0-\u017F\u00d0\u00f0\u00df\u00f8\u00e6\u0153\u03ac-\u03ce\u0400-\u04ff]+/u).filter(Boolean);
                    },
                    searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 2, headings: 1.5 } }
                });
                
                console.log('[docmd-search] Index loaded. Versions found:', globalAllVersions.length);
                if (globalAllVersions.length > 0 && showFilters) {
                    renderGlobalFilters();
                }
                isIndexLoaded = true;
                if (searchInput.value.trim()) searchInput.dispatchEvent(new Event('input'));
            } catch {
                const sanitized = `<div class="search-error">${escapeHtml(strings.error)}</div>`;
                searchResults.innerHTML = sanitized;
            }
        }

        function renderGlobalFilters() {
            if (globalAllVersions.length === 0 || !showFilters) return;
            let filterContainer = document.getElementById('docmd-global-search-filters');
            if (!filterContainer) {
                filterContainer = document.createElement('div');
                filterContainer.id = 'docmd-global-search-filters';
                filterContainer.style.cssText = 'padding: 12px 20px 8px 20px; border-bottom: 1px solid var(--docmd-border); display: flex; flex-wrap: wrap; gap: 8px;';
                searchResults.parentNode?.insertBefore(filterContainer, searchResults);
            }

            const sanitized = globalAllVersions.map(v => {
                const vc = globalVersionColors[v];
                const isActive = activeVersionFilters.has(v);
                const icon = isActive 
                    ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>` 
                    : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
                return `<span class="search-filter-tag ${isActive ? 'active' : ''}" data-version="${escapeHtml(v)}" style="background:${vc.bg};color:${vc.fg};cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:12px;font-size:11px;border: 1px solid ${isActive ? vc.fg : 'transparent'}; opacity: ${activeVersionFilters.size > 0 && !isActive ? '0.6' : '1'}; transition: all 0.2s;">
                    ${icon} ${escapeHtml(v)}
                </span>`;
            }).join('');
            filterContainer.innerHTML = sanitized;

            filterContainer.querySelectorAll('.search-filter-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const v = (tag as HTMLElement).dataset.version!;
                    if (activeVersionFilters.has(v)) activeVersionFilters.delete(v);
                    else activeVersionFilters.add(v);
                    renderGlobalFilters();
                    if (searchInput.value.trim()) searchInput.dispatchEvent(new Event('input'));
                });
            });
        }

        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.trim();
            selectedIndex = -1;
            if (!query) { 
                const sanitized = `<div class="search-initial">${escapeHtml(strings.initial)}</div>`;
                searchResults.innerHTML = sanitized; 
                return; 
            }
            if (!isIndexLoaded) return;

            // ── Semantic mode ────────────────────────────────────────────────
            if (isSemanticMode) {
                const ctx: SemanticSearch.SemanticSearchContext = {
                    siteBase,
                    ROOT_PATH,
                    searchResults,
                    strings,
                    activeVersionFilters,
                    globalAllVersions,
                    globalVersionColors,
                    selectedIndex,
                    updateSelection,
                    showConfidence: searchModal.dataset.showConfidence === 'true'
                };
                SemanticSearch.performSemanticSearch(query, ctx);
                return;
            }

            // ── Keyword mode (MiniSearch) ────────────────────────────────────
            let results = miniSearch.search(query);
            
            if (activeVersionFilters.size > 0) {
                results = results.filter((r: any) => activeVersionFilters.has(r.version));
            }

            if (results.length === 0) {
                const sanitized = `<div class="search-no-results">${activeVersionFilters.size > 0 ? 'No results match the selected filters.' : escapeHtml(strings.noResults)}</div>`;
                searchResults.innerHTML = sanitized;
                return;
            }

            const sanitized = results.slice(0, 10).map((result: any, index: number) => {
                const snippet = getSnippet(result.text, query);
                // Strip leading slash to avoid double-slash when concatenating with ROOT_PATH
                const cleanId = result.id.startsWith('/') ? result.id.slice(1) : result.id;
                // Sanitize: collapse any accidental double slashes (except after protocol)
                const linkHref = `${ROOT_PATH}${cleanId}`.replace(/([^:])\/\/+/g, '$1/');
                const vc = result.version ? globalVersionColors[result.version] : null;
                const versionBadge = result.version
                    ? `<div class="search-result-meta"><span class="search-result-version" style="background:${vc!.bg};color:${vc!.fg}">${escapeHtml(result.version)}</span></div>`
                    : '';
                return `
                    <a href="${linkHref}" class="search-result-item" data-index="${index}">
                        <div class="search-result-title">${escapeHtml(result.title)}${versionBadge}</div>
                        <div class="search-result-preview">${snippet}</div>
                    </a>`;
            }).join('');
            searchResults.innerHTML = sanitized;

            searchResults.querySelectorAll('.search-result-item').forEach((item, idx) => {
                item.addEventListener('mouseenter', () => { selectedIndex = idx; updateSelection(searchResults.querySelectorAll('.search-result-item') as NodeListOf<HTMLElement>); });
            });
        });

        // Close search when clicking a link (Important for SPA!)
        searchResults.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.search-result-item')) closeSearch();
        });

        window.closeDocmdSearch = closeSearch;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();