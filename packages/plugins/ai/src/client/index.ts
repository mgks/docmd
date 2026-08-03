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

    const savedHistory = this.loadSavedHistory();

    this.engine = new DocmdAssistantEngine({
      projectId: this.projectId,
      endpoint: cfg.endpoint || (this.projectId ? 'https://api.docmd.io/v1/ai/chat' : undefined),
      provider: cfg.provider,
      model: cfg.model,
      systemPrompt: cfg.systemPrompt,
      history: savedHistory,
      reasoning: cfg.reasoning ?? false
    });

    const detectContext = () => {
      const locale = (window as any).__DOCMD_LOCALE__ || document.documentElement.lang || 'en';
      const versionMatch = location.pathname.match(/\/v(\d+)\//);
      const version = (window as any).__DOCMD_VERSION__ || (versionMatch ? `v${versionMatch[1]}` : '');
      return { locale, version };
    };

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
            <span class="docmd-ai-badge-tag">docmd</span>
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

    if (this.isUnconfigured) {
      const msgs = document.getElementById('docmd-ai-messages');
      const div = document.createElement('div');
      div.className = 'docmd-ai-chat-bubble assistant';
      div.innerHTML = `
        <div class="docmd-ai-unconfigured-card">
          <div class="docmd-ai-unconfigured-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Configure AI Assistant in docmd Cloud
          </div>
          <p>Your AI Assistant is ready! To enable live AI responses for your visitors, please configure your site in <strong>docmd Cloud</strong>.</p>
          <ul class="docmd-ai-unconfigured-list">
            <li>✨ <strong>100% Free Feature</strong> — Zero subscription costs for AI documentation chat.</li>
            <li>🔑 <strong>Bring Your Own Key (BYOK)</strong> — Use your existing API keys for OpenAI, Anthropic, Gemini, DeepSeek, or Ollama.</li>
            <li>📊 <strong>Analytics & Query Tracking</strong> — Complete access to user query analytics and metrics.</li>
          </ul>
          <a href="https://cloud.docmd.io" target="_blank" rel="noopener" class="docmd-ai-unconfigured-btn">
            Configure Assistant on docmd Cloud →
          </a>
        </div>
      `;
      if (msgs) {
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
      }
      this.saveHistory();
      return;
    }

    const typing = this.appendMsg('assistant', 'Working...', false);

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
    let text = this.escapeHtml(raw);

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

    // Inline formatting
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Split into blocks by double linebreaks for clean paragraph flow
    const blocks = text.split(/\n{2,}/);
    const html = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(?:h3|h4|h5|ul|ol|pre|blockquote)/i.test(trimmed)) {
        return trimmed.replace(/\n/g, ' ');
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    // Restore code blocks
    let finalHtml = html;
    codeBlocks.forEach((cb, i) => {
      finalHtml = finalHtml.replace(`__CODE_BLOCK_${i}__`, cb);
    });

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