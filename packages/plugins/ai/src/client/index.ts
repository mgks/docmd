/**
 * Client-side entry for @docmd/plugin-ai
 * docmd AI Assistant — Floating bottom prompt bar & floating sidebar drawer.
 * Features clean modern styling, adaptive light/dark theme, documentation RAG grounding, and Cmd+I shortcut.
 */

import { DocmdAssistantEngine } from 'docmd-assistant';

export class DocmdAIAssistantUI {
  private engine: any;
  private container: HTMLElement | null = null;
  private isDrawerOpened = false;
  private projectId: string;
  private isUnconfigured: boolean;

  constructor() {
    const cfg = (window as any).__docmd_ai_config || (window as any).__DOCMD_AI_CONFIG__ || {};
    this.projectId = cfg.projectId || cfg.siteId || cfg.cloud?.projectId || cfg.cloud?.siteId || 'default';
    this.isUnconfigured = (!cfg.projectId || cfg.projectId === 'default') && !cfg.apiKey && !cfg.baseURL;

    const initialSystemPrompt = this.buildSystemPrompt();

    this.engine = new DocmdAssistantEngine({
      projectId: this.projectId,
      endpoint: cfg.endpoint || (this.projectId ? 'https://api.docmd.io/v1/ai/chat' : undefined),
      provider: cfg.provider,
      model: cfg.model,
      systemPrompt: initialSystemPrompt,
      reasoning: cfg.reasoning ?? false
    });

    this.engine.registerTool({
      name: 'search_documentation',
      description: 'Search documentation pages across all projects in this workspace using keyword full-text matching and semantic vector search.',
      execute: async ({ query, project }: { query: string; project?: string }) => {
        return await this.searchAllWorkspaceIndexes(query, project);
      }
    });

    if (typeof document !== 'undefined') {
      this.mount();
    }
  }



  private renderSuggestionsHtml(): string {
    const cfg = (window as any).__docmd_ai_config || {};
    const rawSuggestions = cfg.suggestions;

    let items: Array<{ label: string; prompt: string }> = [
      { label: 'How do I get started?', prompt: 'How do I get started with docmd?' },
      { label: 'Key Features', prompt: 'What are the main features of docmd?' },
      { label: 'AI Plugin Setup', prompt: 'How do I configure the AI assistant plugin?' }
    ];

    if (Array.isArray(rawSuggestions) && rawSuggestions.length > 0) {
      items = rawSuggestions.map((item: any) => {
        if (typeof item === 'string') {
          return { label: item, prompt: item };
        }
        return {
          label: item.label || item.prompt || item.title || 'Question',
          prompt: item.prompt || item.label || item.title || item
        };
      });
    }

    const buttons = items
      .map(item => `<button class="docmd-ai-pill-btn" data-prompt="${this.escapeHtml(item.prompt)}">${this.escapeHtml(item.label)}</button>`)
      .join('');

    return `<div class="docmd-ai-suggestions-row">${buttons}</div>`;
  }

  private mount(): void {
    if (document.getElementById('docmd-ai-plugin-root')) return;

    const cfg = (window as any).__docmd_ai_config || {};
    const i18n = (window as any).__DOCMD_AI_I18N__ || {};

    const pos = cfg.position || 'bottom-center';
    const placeholder = cfg.placeholder || i18n['ai.inputPlaceholder'] || 'Ask AI Assistant...';
    const greeting = cfg.greeting || i18n['ai.greeting'] || 'Hello! Ask me anything about this documentation.';
    const chatTitle = i18n['ai.chatTitle'] || 'AI Assistant';
    const clearTitle = i18n['ai.clearChat'] || 'Clear History';
    const closeTitle = i18n['ai.close'] || 'Close AI Assistant';

    this.container = document.createElement('div');
    this.container.id = 'docmd-ai-plugin-root';
    this.container.className = `pos-${pos}`;
    this.container.innerHTML = `
      <!-- Floating Bottom Prompt Bar -->
      <div class="docmd-ai-bar-wrap" id="docmd-ai-bar-wrap">
        <form class="docmd-ai-prompt-bar" id="docmd-ai-bar-form">
          <span class="docmd-ai-sparkle-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </span>
          <input type="text" class="docmd-ai-bar-input" id="docmd-ai-bar-input" placeholder="${placeholder}" autocomplete="off" />
          <span class="docmd-ai-shortcut-badge">⌘I</span>
          <button type="submit" class="docmd-ai-submit-btn" title="Send (Enter)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
          </button>
        </form>
      </div>

      <!-- Floating Sidebar Drawer -->
      <div class="docmd-ai-drawer" id="docmd-ai-drawer">
        <div class="docmd-ai-drawer-header">
          <div class="docmd-ai-header-left">
            <span class="docmd-ai-status-dot"></span>
            <span class="docmd-ai-title-text">${chatTitle}</span>
            <!--<span class="docmd-ai-badge-tag">docmd</span>-->
          </div>
          <div class="docmd-ai-header-right">
            <button class="docmd-ai-icon-action" id="docmd-ai-clear-btn" title="${clearTitle}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="docmd-ai-icon-action" id="docmd-ai-close-btn" title="${closeTitle}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="docmd-ai-messages-list" id="docmd-ai-messages">
          <div class="docmd-ai-chat-bubble assistant">
            ${greeting}
            ${this.renderSuggestionsHtml()}
          </div>
        </div>

        <div class="docmd-ai-drawer-footer">
          <form class="docmd-ai-drawer-form" id="docmd-ai-drawer-form">
            <input type="text" class="docmd-ai-drawer-input" id="docmd-ai-drawer-input" placeholder="${placeholder}" autocomplete="off" />
            <button type="submit" class="docmd-ai-drawer-send-btn" title="Send (Enter)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
            </button>
          </form>
          <div class="docmd-ai-footer-branding">
            <a href="https://docmd.io/assistant/" target="_blank" rel="noopener" class="docmd-ai-footer-link">${i18n['ai.poweredBy'] || 'Powered by docmd assistant'}</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }



  private bindEvents(): void {
    const barWrap = document.getElementById('docmd-ai-bar-wrap');
    const barForm = document.getElementById('docmd-ai-bar-form');
    const barInput = document.getElementById('docmd-ai-bar-input') as HTMLInputElement;

    const drawer = document.getElementById('docmd-ai-drawer');
    const closeBtn = document.getElementById('docmd-ai-close-btn');
    const clearBtn = document.getElementById('docmd-ai-clear-btn');
    const drawerForm = document.getElementById('docmd-ai-drawer-form');
    const drawerInput = document.getElementById('docmd-ai-drawer-input') as HTMLInputElement;

    barForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = barInput.value.trim();
      if (!query) return;
      barInput.value = '';
      this.openDrawer();
      this.submitQuery(query);
    });

    closeBtn?.addEventListener('click', () => this.closeDrawer());
    clearBtn?.addEventListener('click', () => this.clearChat());

    drawerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = drawerInput.value.trim();
      if (!query) return;
      drawerInput.value = '';
      this.submitQuery(query);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (this.isDrawerOpened) {
          this.closeDrawer();
        } else {
          this.openDrawer();
          drawerInput?.focus();
        }
      } else if (e.key === 'Escape' && this.isDrawerOpened) {
        this.closeDrawer();
      }
    });

    const msgsContainer = document.getElementById('docmd-ai-messages');
    msgsContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('docmd-ai-pill-btn')) {
        const prompt = target.getAttribute('data-prompt');
        if (prompt) {
          this.openDrawer();
          this.submitQuery(prompt);
        }
      }
    });
  }

  private openDrawer(): void {
    this.isDrawerOpened = true;
    const barWrap = document.getElementById('docmd-ai-bar-wrap');
    const drawer = document.getElementById('docmd-ai-drawer');
    barWrap?.classList.add('hidden');
    drawer?.classList.add('open');
  }

  private closeDrawer(): void {
    this.isDrawerOpened = false;
    const barWrap = document.getElementById('docmd-ai-bar-wrap');
    const drawer = document.getElementById('docmd-ai-drawer');
    drawer?.classList.remove('open');
    barWrap?.classList.remove('hidden');
  }

  private buildSystemPrompt(): string {
    const cfg = (window as any).__docmd_ai_config || {};
    const currentUrl = typeof location !== 'undefined' ? location.href : '';
    const siteTitle = cfg.siteTitle || (typeof document !== 'undefined' ? document.title : 'Documentation');
    const isWorkspace = !!(cfg.isWorkspace && Array.isArray(cfg.workspaceProjects) && cfg.workspaceProjects.length > 0);
    const getSiteBaseUrl = (): string => {
      const cfg = (window as any).__docmd_ai_config || {};
      let base = cfg.siteBase || '/';
      if (typeof location !== 'undefined') {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal && base !== '/' && !location.pathname.startsWith(base)) {
          base = '/';
        }
        return new URL(base.startsWith('/') ? base : '/' + base, location.origin).href;
      }
      return base;
    };
    const siteBaseUrl = getSiteBaseUrl();

    let workspaceContext = '';
    if (isWorkspace) {
      const projectsList = cfg.workspaceProjects.map((p: any, idx: number) => {
        const pName = p.name || p.prefix;
        const pPrefix = p.prefix || '/';
        const pAbsUrl = typeof location !== 'undefined' ? new URL(pPrefix.replace(/^\//, ''), siteBaseUrl).href : pPrefix;
        return `  ${idx + 1}. Project "${pName}" (Prefix: "${pPrefix}", URL: ${pAbsUrl})`;
      }).join('\n');

      workspaceContext = `
WORKSPACE ARCHITECTURE & PROJECT CONTEXT:
- Site Title: "${siteTitle}"
- Site Base URL: ${siteBaseUrl}
- Current Active Page URL: ${currentUrl}
- Multi-Project Workspace Setup: Active (${cfg.workspaceProjects.length} Projects)
- Available Workspace Projects:
${projectsList}

CRITICAL RULES FOR MULTI-PROJECT SEARCH & HYPERLINKS:
1. WORKSPACE AWARENESS: You have full awareness of all workspace projects listed above. Use the \`search_documentation\` tool to query documentation across any or all workspace projects.
2. ACCURATE HYPERLINKS: ALWAYS ground page hyperlinks strictly in real search results or valid project base URLs. Every page hyperlink MUST be an absolute URL stemming from the Site Base URL (e.g. "${siteBaseUrl}rust/" or "${siteBaseUrl}#section"). NEVER invent, hallucinate, or construct relative subpaths like "/mermaid/default-ui-showcase".
3. KEYWORD vs SEMANTIC SEARCH: The documentation search tool queries both Keyword (MiniSearch) and Semantic Vector search indexes across all projects. Rely on search results for ground truth.`;
    } else {
      workspaceContext = `
SITE & PAGE CONTEXT:
- Site Title: "${siteTitle}"
- Site Base URL: ${siteBaseUrl}
- Current Page URL: ${currentUrl}

CRITICAL HYPERLINK RULES:
Ground all page hyperlinks strictly in real search results. All absolute URLs must stem from "${siteBaseUrl}". Never invent relative subpaths.`;
    }

    const basePrompt = cfg.systemPrompt || 'You are docmd assistant — an expert, precise documentation assistant strictly dedicated to answering technical questions about this documentation site.';
    return `${basePrompt}\n\n${workspaceContext}`;
  }

  private async searchAllWorkspaceIndexes(query: string, projectFilter?: string): Promise<any[]> {
    const hits: Array<{ project: string; title: string; url: string; snippet: string; searchType: 'keyword' | 'semantic' }> = [];
    const cfg = (window as any).__docmd_ai_config || {};
    const getSiteBaseUrl = (): string => {
      const cfg = (window as any).__docmd_ai_config || {};
      let base = cfg.siteBase || '/';
      if (typeof location !== 'undefined') {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal && base !== '/' && !location.pathname.startsWith(base)) {
          base = '/';
        }
        return new URL(base.startsWith('/') ? base : '/' + base, location.origin).href;
      }
      return base;
    };
    const siteBaseUrl = getSiteBaseUrl();

    // 1. Local Active Search Index (via window.docmdSearch)
    try {
      if ((window as any).docmdSearch && typeof (window as any).docmdSearch.search === 'function') {
        const localHits = await (window as any).docmdSearch.search(query);
        if (Array.isArray(localHits)) {
          for (const item of localHits.slice(0, 5)) {
            const rawId = item.id || item.url || '';
            const cleanId = rawId.startsWith('/') ? rawId.slice(1) : rawId;
            const fullUrl = rawId.startsWith('http') ? rawId : new URL(cleanId, siteBaseUrl).href;
            hits.push({
              project: 'Current Project',
              title: item.title || cleanId,
              url: fullUrl,
              snippet: item.snippet || item.text || '',
              searchType: 'keyword'
            });
          }
        }
      }
    } catch { /* ignore */ }

    // 2. Fetch sibling workspace project search indexes
    if (cfg.isWorkspace && Array.isArray(cfg.workspaceProjects)) {
      for (const p of cfg.workspaceProjects) {
        if (projectFilter && p.prefix !== projectFilter && p.name !== projectFilter) continue;
        
        try {
          const pPrefix = p.prefix || '/';
          const pBaseUrl = new URL(pPrefix.replace(/^\//, ''), siteBaseUrl).href;
          const searchIndexPath = `${pBaseUrl}_docmd-search/search-index.json`;
          
          const res = await fetch(searchIndexPath);
          if (res.ok) {
            const indexData = await res.json();
            const docs = indexData.storedFields ? Object.values(indexData.storedFields) : (Array.isArray(indexData) ? indexData : []);
            const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

            const scored = docs.map((doc: any) => {
              const titleStr = String(doc.title || doc.id || '').toLowerCase();
              const textStr = String(doc.text || '').toLowerCase();
              let score = 0;
              for (const term of terms) {
                if (titleStr.includes(term)) score += 5;
                if (textStr.includes(term)) score += 1;
              }
              return { doc, score };
            }).filter((h: any) => h.score > 0).sort((a: any, b: any) => b.score - a.score);

            for (const hit of scored.slice(0, 3)) {
              const doc = hit.doc;
              const rawId = doc.id || '';
              const cleanId = rawId.startsWith('/') ? rawId.slice(1) : rawId;
              const fullUrl = rawId.startsWith('http') ? rawId : new URL(cleanId, pBaseUrl).href;
              
              if (!hits.some(existing => existing.url === fullUrl)) {
                hits.push({
                  project: p.name || p.prefix,
                  title: doc.title || rawId,
                  url: fullUrl,
                  snippet: (doc.text || '').slice(0, 150) + '...',
                  searchType: 'keyword'
                });
              }
            }
          }
        } catch { /* ignore fetch errors for sibling indexes */ }
      }
    }

    return hits;
  }

  private async fetchLocalSearchContext(query: string): Promise<string> {
    try {
      const hits = await this.searchAllWorkspaceIndexes(query);
      if (Array.isArray(hits) && hits.length > 0) {
        const formattedHits = hits.slice(0, 5).map((hit: any) => {
          return `- [${hit.project}] ${hit.title} (${hit.searchType}): ${hit.url}\n  Snippet: ${hit.snippet}`;
        }).join('\n');
        return `\n\n[Documentation Search Context (Multi-Project Workspace)]:\n${formattedHits}`;
      }
    } catch { /* silent */ }
    return '';
  }

  private renderUnconfiguredNotice(data?: any): void {
    const title = data?.title || 'Connect Your AI Assistant';
    const message = data?.message || 'Add your free AI relay or BYOK API key on docmd Cloud to enable the assistant for your visitors.';
    const configUrl = data?.configUrl || 'https://cloud.docmd.io';
    const features = Array.isArray(data?.features) ? data.features : [
      '**Free AI relay** — bring your own API key for OpenAI, Anthropic, Gemini, DeepSeek, or Ollama.',
      '**Query analytics** — see what your visitors are asking in real time.',
      '**Setup takes under a minute** — just add your `projectId` to `docmd.config.json`.'
    ];

    const featureItemsHtml = features
      .map((f: string) => `<li>${this.formatMarkdown(f)}</li>`)
      .join('');

    const msgs = document.getElementById('docmd-ai-messages');
    const div = document.createElement('div');
    div.className = 'docmd-ai-chat-bubble assistant';
    div.innerHTML = `
      <div class="docmd-ai-unconfigured-card">
        <div class="docmd-ai-unconfigured-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
          ${this.escapeHtml(title)}
        </div>
        <p>${this.escapeHtml(message)}</p>
        <ul class="docmd-ai-unconfigured-list">
          ${featureItemsHtml}
        </ul>
        <a href="${this.escapeHtml(configUrl)}" target="_blank" rel="noopener" class="docmd-ai-unconfigured-btn">
          Connect on docmd Cloud →
        </a>
      </div>
    `;
    if (msgs) {
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  private async submitQuery(text: string): Promise<void> {
    this.appendMsg('user', text, true);
    const typing = this.appendMsg('assistant', 'Working...', false);

    try {
      const docContext = await this.fetchLocalSearchContext(text);
      const queryWithContext = docContext ? `${text}${docContext}` : text;

      const res = await this.engine.sendMessage(queryWithContext);

      if (res && res.unconfigured) {
        typing.remove();
        this.renderUnconfiguredNotice(res.unconfiguredData || res);
        return;
      }

      typing.innerHTML = this.formatMarkdown(res.message || 'No response generated.');
    } catch (err: any) {
      typing.remove();
      this.renderUnconfiguredNotice({
        title: 'Domain Not Authorized',
        message: err.message || 'Origin is not authorized for the selected docmd Cloud project.',
        features: [
          '**Free AI relay** — bring your own API key for OpenAI, Anthropic, Gemini, DeepSeek, or Ollama.',
          '**Query analytics** — see what your visitors are asking in real time.',
          '**Setup takes under a minute** — just add your `projectId` to `docmd.config.json`.'
        ]
      });
    }
  }

  private clearChat(): void {
    this.engine.clearHistory();
    const msgs = document.getElementById('docmd-ai-messages');
    if (msgs) {
      msgs.innerHTML = `
        <div class="docmd-ai-chat-bubble assistant">
          Conversation cleared. How else can I help you?
          ${this.renderSuggestionsHtml()}
        </div>
      `;
    }
  }

  private appendMsg(sender: 'user' | 'assistant', text: string, save = true): HTMLElement {
    const msgs = document.getElementById('docmd-ai-messages');
    const div = document.createElement('div');
    div.className = `docmd-ai-chat-bubble ${sender}`;
    div.innerHTML = sender === 'assistant' ? this.formatMarkdown(text) : this.escapeHtml(text);
    if (msgs) {
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }
    return div;
  }

  private escapeHtml(raw: string): string {
    return (raw || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private formatMarkdown(raw: string): string {
    if (!raw) return '';
    let text = this.escapeHtml(raw);

    const cfg = (window as any).__docmd_ai_config || {};
    const getSiteBaseUrl = (): string => {
      const cfg = (window as any).__docmd_ai_config || {};
      let base = cfg.siteBase || '/';
      if (typeof location !== 'undefined') {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal && base !== '/' && !location.pathname.startsWith(base)) {
          base = '/';
        }
        return new URL(base.startsWith('/') ? base : '/' + base, location.origin).href;
      }
      return base;
    };
    const siteBaseUrl = getSiteBaseUrl();

    const resolveCanonicalUrl = (href: string): string => {
      if (!href) return '#';
      let targetUrl = href.trim();
      const subpathBase = (cfg.siteBase || '').replace(/^\/|\/$/g, '');
      const isLocal = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

      if (isLocal && subpathBase && !location.pathname.startsWith('/' + subpathBase)) {
        targetUrl = targetUrl.replace(new RegExp(`/${subpathBase}(/|$)`, 'g'), '/');
      }

      if (/^(?:https?:|mailto:|tel:)/i.test(targetUrl)) return targetUrl;
      if (targetUrl.startsWith('#')) return `${siteBaseUrl}${targetUrl}`;
      try {
        const cleanHref = targetUrl.startsWith('/') ? targetUrl.slice(1) : targetUrl;
        return new URL(cleanHref, siteBaseUrl).href;
      } catch {
        return targetUrl;
      }
    };

    // Code blocks with syntax highlighting
    const codeBlocks: string[] = [];
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const languageStr = lang ? `<span class="code-lang">${lang}</span>` : '';
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre>${languageStr}<code>${code.trim()}</code></pre>`);
      return placeholder;
    });

    // Headings (# h1, ## h2, ### h3, #### h4)
    text = text.replace(/^#### (.*$)/gim, '<h5>$1</h5>');
    text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^# (.*$)/gim, '<h3>$1</h3>');

    // Unordered lists
    text = text.replace(/(?:^\s*[-*]\s+.*(?:\r?\n|$))+/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .map(line => `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    text = text.replace(/(?:^\s*\d+\.\s+.*(?:\r?\n|$))+/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .map(line => `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    // Blockquotes
    text = text.replace(/(?:^\s*&gt;\s+.*(?:\r?\n|$))+/gm, (match) => {
      const content = match.replace(/^\s*&gt;\s+/gm, '').trim();
      return `<blockquote>${content}</blockquote>`;
    });

    // Markdown Tables (| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |)
    text = text.replace(/(?:^\s*\|.*\|\s*(?:\r?\n|$))+/gm, (match) => {
      const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return match;

      let html = '<div class="docmd-ai-table-wrap"><table>';
      let inBody = false;

      lines.forEach((line, idx) => {
        if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) return;
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (cells.length === 0) return;

        if (idx === 0) {
          html += '<thead><tr>';
          cells.forEach(c => { html += `<th>${c}</th>`; });
          html += '</tr></thead>';
        } else {
          if (!inBody) {
            html += '<tbody>';
            inBody = true;
          }
          html += '<tr>';
          cells.forEach(c => { html += `<td>${c}</td>`; });
          html += '</tr>';
        }
      });

      if (inBody) html += '</tbody>';
      html += '</table></div>';
      return html;
    });

    // Inline formatting
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, link) => {
      const finalUrl = resolveCanonicalUrl(link.trim());
      return `<a href="${finalUrl}" target="_blank" rel="noopener">${label}</a>`;
    });

    // Split into blocks by double linebreaks for clean paragraph flow
    const blocks = text.split(/\n{2,}/);
    let html = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(?:h3|h4|h5|ul|ol|pre|blockquote|div|table)/i.test(trimmed)) {
        return trimmed.replace(/\n/g, ' ');
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    // Restore code blocks
    let finalHtml = html;
    codeBlocks.forEach((cb, i) => {
      finalHtml = finalHtml.replace(`__CODE_BLOCK_${i}__`, cb);
    });

    // Sanitize local dev server subpath URLs (e.g. convert /beta-test/rust to /rust on localhost)
    const isLocal = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const subpathBase = (cfg.siteBase || '').replace(/^\/|\/$/g, '');
    if (isLocal && subpathBase && !location.pathname.startsWith('/' + subpathBase)) {
      finalHtml = finalHtml.replace(new RegExp(`(https?://[^/\\s]+)?/${subpathBase}(/|\\b)`, 'g'), (_m, origin) => {
        return (origin || '') + '/';
      });
    }

    return finalHtml;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DocmdAIAssistantUI());
  } else {
    new DocmdAIAssistantUI();
  }
}