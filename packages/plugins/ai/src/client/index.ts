/**
 * Client-side entry for @docmd/plugin-ai
 * docmd AI Assistant — Floating bottom prompt bar & floating sidebar.
 * Features automatic light/dark theme adaptability, local RAG documentation grounding, and Ctrl+I/Cmd+I shortcut.
 */

import { DocmdAssistantEngine } from 'docmd-assistant';

export class DocmdAIAssistantUI {
  private engine: any;
  private container: HTMLElement | null = null;
  private isDrawerOpened = false;
  private projectId: string;

  constructor() {
    const cfg = (window as any).__docmd_ai_config || (window as any).__DOCMD_AI_CONFIG__ || {};
    this.projectId = cfg.projectId || cfg.siteId || cfg.cloud?.projectId || cfg.cloud?.siteId || 'default';

    // Load persisted history from sessionStorage if available
    const savedHistory = this.loadSavedHistory();

    this.engine = new DocmdAssistantEngine({
      projectId: this.projectId,
      endpoint: cfg.endpoint || 'https://api.docmd.io/v1/ai/chat',
      provider: cfg.provider,
      model: cfg.model,
      systemPrompt: cfg.systemPrompt,
      history: savedHistory,
      thinking: cfg.thinking === true
    });

    // Detect active site version and locale dynamically for search filters
    const detectContext = () => {
      const locale = (window as any).__DOCMD_LOCALE__ || document.documentElement.lang || 'en';
      const versionMatch = location.pathname.match(/\/v(\d+)\//);
      const version = (window as any).__DOCMD_VERSION__ || (versionMatch ? `v${versionMatch[1]}` : '');
      return { locale, version };
    };

    // Register docmd search Tool if docmd-search is active on window
    this.engine.registerTool({
      name: 'search_documentation',
      description: 'Search documentation content via docmd-search index with active locale and version filters',
      execute: async ({ query, version, locale }: { query: string; version?: string; locale?: string }) => {
        if ((window as any).docmdSearch && typeof (window as any).docmdSearch.search === 'function') {
          const ctx = detectContext();
          const targetVersion = version || ctx.version;
          const targetLocale = locale || ctx.locale;
          return await (window as any).docmdSearch.search(query, {
            version: targetVersion,
            locale: targetLocale
          });
        }
        return [];
      }
    });

    if (typeof document !== 'undefined') {
      this.mount();
    }
  }

  private loadSavedHistory(): any[] {
    try {
      const raw = sessionStorage.getItem(`docmd_ai_history_${this.projectId}`);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  }

  private saveHistory(): void {
    try {
      const history = this.engine.getHistory();
      sessionStorage.setItem(`docmd_ai_history_${this.projectId}`, JSON.stringify(history));
    } catch { /* ignore */ }
  }

  private mount(): void {
    if (document.getElementById('docmd-ai-plugin-root')) return;

    const cfg = (window as any).__docmd_ai_config || {};
    const pos = cfg.position || 'bottom-center';
    const placeholder = cfg.placeholder || 'Ask AI Assistant...';
    const greeting = cfg.greeting || 'Hello! Ask me anything about this documentation.';

    this.container = document.createElement('div');
    this.container.id = 'docmd-ai-plugin-root';
    this.container.className = `pos-${pos}`;
    this.container.innerHTML = `
      <style>
        #docmd-ai-plugin-root {
          font-family: var(--docmd-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          /* Adaptive Theme Tokens: Dynamic fallbacks matching light & dark modes */
          --ai-bg: var(--docmd-bg-card, var(--docmd-bg, #0f172a));
          --ai-header-bg: var(--docmd-bg-header, var(--docmd-bg-secondary, #1e293b));
          --ai-border: var(--docmd-border, rgba(255, 255, 255, 0.14));
          --ai-text: var(--docmd-text, #f8fafc);
          --ai-text-muted: var(--docmd-text-muted, #94a3b8);
          --ai-primary: var(--docmd-primary, #06b6d4);
          --ai-bubble-user: var(--docmd-primary, #06b6d4);
          --ai-bubble-assistant: var(--docmd-bg-bubble, var(--docmd-bg-secondary, #1e293b));
          --ai-input-bg: var(--docmd-bg-input, var(--docmd-bg-secondary, #1e293b));
          --ai-shadow: 0 20px 45px -6px rgba(0, 0, 0, 0.4), 0 0 25px rgba(6, 182, 212, 0.15);
        }

        /* Light Theme Overrides */
        html[data-theme="light"] #docmd-ai-plugin-root,
        body.light #docmd-ai-plugin-root {
          --ai-bg: var(--docmd-bg-card, #ffffff);
          --ai-header-bg: var(--docmd-bg-header, #f1f5f9);
          --ai-border: var(--docmd-border, rgba(0, 0, 0, 0.12));
          --ai-text: var(--docmd-text, #0f172a);
          --ai-text-muted: var(--docmd-text-muted, #64748b);
          --ai-bubble-assistant: var(--docmd-bg-bubble, #f1f5f9);
          --ai-input-bg: var(--docmd-bg-input, #f8fafc);
          --ai-shadow: 0 20px 45px -6px rgba(0, 0, 0, 0.15), 0 0 25px rgba(6, 182, 212, 0.15);
        }

        /* Dark Theme Explicit Overrides */
        html[data-theme="dark"] #docmd-ai-plugin-root,
        body.dark #docmd-ai-plugin-root {
          --ai-bg: var(--docmd-bg-card, #0f172a);
          --ai-header-bg: var(--docmd-bg-header, #1e293b);
          --ai-border: var(--docmd-border, rgba(255, 255, 255, 0.14));
          --ai-text: var(--docmd-text, #f8fafc);
          --ai-text-muted: var(--docmd-text-muted, #94a3b8);
          --ai-bubble-assistant: var(--docmd-bg-bubble, #1e293b);
          --ai-input-bg: var(--docmd-bg-input, #1e293b);
        }

        /* --- Floating Bottom Prompt Bar --- */
        .docmd-ai-bar-wrap {
          position: fixed;
          bottom: 24px;
          z-index: 9998;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #docmd-ai-plugin-root.pos-bottom-center .docmd-ai-bar-wrap {
          left: 50%;
          transform: translateX(-50%);
        }
        #docmd-ai-plugin-root.pos-bottom-right .docmd-ai-bar-wrap {
          right: 24px;
        }
        #docmd-ai-plugin-root.pos-bottom-left .docmd-ai-bar-wrap {
          left: 24px;
        }

        .docmd-ai-bar-wrap.hidden {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.92) translateY(16px);
        }

        .docmd-ai-prompt-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 360px;
          max-width: calc(100vw - 32px);
          padding: 8px 10px 8px 16px;
          background: var(--ai-bg);
          border: 1px solid var(--ai-border);
          border-radius: 9999px;
          box-shadow: var(--ai-shadow);
          backdrop-filter: blur(16px);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .docmd-ai-prompt-bar:hover,
        .docmd-ai-prompt-bar:focus-within {
          width: 440px;
          border-color: var(--ai-primary);
          box-shadow: 0 20px 45px -6px rgba(0, 0, 0, 0.25), 0 0 25px rgba(6, 182, 212, 0.3);
        }

        .docmd-ai-sparkle-icon {
          color: var(--ai-primary);
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .docmd-ai-bar-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--ai-text);
          font-size: 13.5px;
          font-weight: 500;
        }
        .docmd-ai-bar-input::placeholder {
          color: var(--ai-text-muted);
        }

        .docmd-ai-shortcut-badge {
          background: rgba(125, 125, 125, 0.15);
          border: 1px solid var(--ai-border);
          color: var(--ai-text-muted);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .docmd-ai-submit-btn {
          background: var(--ai-primary);
          border: none;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s, background 0.2s;
        }
        .docmd-ai-submit-btn:hover {
          transform: scale(1.08);
          opacity: 0.9;
        }

        /* --- Floating Non-blocking Sidebar Drawer --- */
        .docmd-ai-drawer {
          position: fixed;
          top: 16px;
          right: 16px;
          bottom: 16px;
          width: 440px;
          max-width: calc(100vw - 32px);
          height: calc(100vh - 32px);
          background: var(--ai-bg);
          border: 1px solid var(--ai-border);
          border-radius: 20px;
          box-shadow: var(--ai-shadow);
          backdrop-filter: blur(20px);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform: translateX(calc(100% + 24px));
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .docmd-ai-drawer.open {
          transform: translateX(0);
        }

        .docmd-ai-drawer-header {
          padding: 16px 20px;
          background: var(--ai-header-bg);
          border-bottom: 1px solid var(--ai-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .docmd-ai-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .docmd-ai-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }
        .docmd-ai-title-text {
          font-weight: 700;
          font-size: 14.5px;
          letter-spacing: -0.01em;
          color: var(--ai-text);
        }
        .docmd-ai-badge-tag {
          background: rgba(6, 182, 212, 0.15);
          color: var(--ai-primary);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .docmd-ai-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .docmd-ai-icon-action {
          background: transparent;
          border: none;
          color: var(--ai-text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, background 0.2s;
        }
        .docmd-ai-icon-action:hover {
          color: var(--ai-text);
          background: rgba(125, 125, 125, 0.15);
        }

        .docmd-ai-messages-list {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }

        .docmd-ai-suggestions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .docmd-ai-pill-btn {
          background: var(--ai-input-bg);
          border: 1px solid var(--ai-border);
          color: var(--ai-text-muted);
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .docmd-ai-pill-btn:hover {
          background: rgba(6, 182, 212, 0.18);
          border-color: rgba(6, 182, 212, 0.4);
          color: var(--ai-primary);
        }

        .docmd-ai-chat-bubble {
          max-width: 92%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.6;
          word-break: break-word;
        }
        .docmd-ai-chat-bubble.user {
          align-self: flex-end;
          background: var(--ai-bubble-user);
          color: #ffffff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
        }
        .docmd-ai-chat-bubble.assistant {
          align-self: flex-start;
          background: var(--ai-bubble-assistant);
          color: var(--ai-text);
          border: 1px solid var(--ai-border);
          border-bottom-left-radius: 4px;
        }

        /* --- Code block & Markdown styling --- */
        .docmd-ai-chat-bubble pre {
          background: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin: 10px 0;
          overflow-x: auto;
          position: relative;
        }
        .docmd-ai-chat-bubble code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12.5px;
          background: rgba(125, 125, 125, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .docmd-ai-chat-bubble pre code {
          background: transparent !important;
          padding: 0;
          color: #f8fafc !important;
        }
        .docmd-ai-chat-bubble ul, .docmd-ai-chat-bubble ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        .docmd-ai-chat-bubble li {
          margin-bottom: 4px;
        }
        .docmd-ai-chat-bubble a {
          color: var(--ai-primary);
          text-decoration: underline;
        }

        .docmd-ai-drawer-footer {
          padding: 16px;
          background: var(--ai-bg);
          border-top: 1px solid var(--ai-border);
        }
        .docmd-ai-drawer-form {
          display: flex;
          gap: 10px;
        }
        .docmd-ai-drawer-input {
          flex: 1;
          background: var(--ai-input-bg);
          border: 1px solid var(--ai-border);
          border-radius: 12px;
          padding: 10px 14px;
          color: var(--ai-text);
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s;
        }
        .docmd-ai-drawer-input:focus {
          border-color: var(--ai-primary);
        }
        .docmd-ai-drawer-send-btn {
          background: var(--ai-primary);
          border: none;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .docmd-ai-drawer-send-btn:hover {
          opacity: 0.9;
        }
      </style>

      <!-- Floating Bottom Prompt Bar -->
      <div class="docmd-ai-bar-wrap" id="docmd-ai-bar-wrap">
        <form class="docmd-ai-prompt-bar" id="docmd-ai-bar-form">
          <span class="docmd-ai-sparkle-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </span>
          <input type="text" class="docmd-ai-bar-input" id="docmd-ai-bar-input" placeholder="${placeholder}" autocomplete="off" />
          <span class="docmd-ai-shortcut-badge">⌘I</span>
          <button type="submit" class="docmd-ai-submit-btn" title="Ask AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>

      <!-- Floating Sidebar Drawer -->
      <div class="docmd-ai-drawer" id="docmd-ai-drawer">
        <div class="docmd-ai-drawer-header">
          <div class="docmd-ai-header-left">
            <span class="docmd-ai-status-dot"></span>
            <span class="docmd-ai-title-text">AI Assistant</span>
            <span class="docmd-ai-badge-tag">docmd</span>
          </div>
          <div class="docmd-ai-header-right">
            <button class="docmd-ai-icon-action" id="docmd-ai-clear-btn" title="Clear History">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="docmd-ai-icon-action" id="docmd-ai-close-btn" title="Close AI Assistant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="docmd-ai-messages-list" id="docmd-ai-messages">
          <div class="docmd-ai-chat-bubble assistant">
            ${greeting}
            <div class="docmd-ai-suggestions-row">
              <button class="docmd-ai-pill-btn" data-prompt="How do I get started with docmd?">How do I get started?</button>
              <button class="docmd-ai-pill-btn" data-prompt="What are the main features of docmd?">Key Features</button>
              <button class="docmd-ai-pill-btn" data-prompt="How do I configure the AI assistant plugin?">AI Plugin Setup</button>
            </div>
          </div>
        </div>

        <div class="docmd-ai-drawer-footer">
          <form class="docmd-ai-drawer-form" id="docmd-ai-drawer-form">
            <input type="text" class="docmd-ai-drawer-input" id="docmd-ai-drawer-input" placeholder="${placeholder}" autocomplete="off" />
            <button type="submit" class="docmd-ai-drawer-send-btn">Send</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.restoreRenderedHistory();
    this.bindEvents();
  }

  private restoreRenderedHistory(): void {
    const saved = this.engine.getHistory();
    if (!saved || saved.length === 0) return;

    const msgs = document.getElementById('docmd-ai-messages');
    if (!msgs) return;

    for (const msg of saved) {
      const sender = (msg.sender || msg.role) === 'user' ? 'user' : 'assistant';
      const text = msg.content || msg.text || '';
      if (text) {
        this.appendMsg(sender, text, false);
      }
    }
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

    // Keyboard shortcut (Cmd+I / Ctrl+I) toggle (Distinct from Cmd+K search!)
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

    // Suggestion pills click delegation
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

  private async fetchLocalSearchContext(query: string): Promise<string> {
    try {
      if ((window as any).docmdSearch && typeof (window as any).docmdSearch.search === 'function') {
        const searchHits = await (window as any).docmdSearch.search(query);
        if (Array.isArray(searchHits) && searchHits.length > 0) {
          const topHits = searchHits.slice(0, 3).map((hit: any) => {
            return `- ${hit.title || hit.id}: ${hit.snippet || hit.text || ''}`;
          }).join('\n');
          return `\n\n[Documentation Search Context]:\n${topHits}`;
        }
      }
    } catch { /* silent */ }
    return '';
  }

  private async submitQuery(text: string): Promise<void> {
    this.appendMsg('user', text, true);
    const typing = this.appendMsg('assistant', 'Searching & thinking...', false);

    try {
      const docContext = await this.fetchLocalSearchContext(text);
      const queryWithContext = docContext ? `${text}${docContext}` : text;

      const res = await this.engine.sendMessage(queryWithContext);
      typing.innerHTML = this.formatMarkdown(res.message || 'No response generated.');
      this.saveHistory();
    } catch (err: any) {
      typing.textContent = `Error: ${err.message || 'Request failed'}`;
    }
  }

  private clearChat(): void {
    this.engine.clearHistory();
    sessionStorage.removeItem(`docmd_ai_history_${this.projectId}`);
    const msgs = document.getElementById('docmd-ai-messages');
    if (msgs) {
      msgs.innerHTML = `
        <div class="docmd-ai-chat-bubble assistant">
          Conversation history cleared. How else can I help you?
          <div class="docmd-ai-suggestions-row">
            <button class="docmd-ai-pill-btn" data-prompt="How do I get started with docmd?">How do I get started?</button>
            <button class="docmd-ai-pill-btn" data-prompt="What are the main features of docmd?">Key Features</button>
            <button class="docmd-ai-pill-btn" data-prompt="How do I configure the AI assistant plugin?">AI Plugin Setup</button>
          </div>
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
    if (save) {
      this.saveHistory();
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
    let parsed = this.escapeHtml(raw);

    // Code blocks with syntax highlighting container
    parsed = parsed.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const languageStr = lang ? `<span class="code-lang">${lang}</span>` : '';
      return `<pre>${languageStr}<code>${code.trim()}</code></pre>`;
    });

    // Inline code
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold & Italic
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headings
    parsed = parsed.replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px 0;font-size:14px;">$1</h4>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h3 style="margin:10px 0 4px 0;font-size:15px;">$1</h3>');

    // Lists
    parsed = parsed.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Line breaks
    parsed = parsed.replace(/\n\n/g, '<br/><br/>');
    parsed = parsed.replace(/\n/g, '<br/>');

    return parsed;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DocmdAIAssistantUI());
  } else {
    new DocmdAIAssistantUI();
  }
}