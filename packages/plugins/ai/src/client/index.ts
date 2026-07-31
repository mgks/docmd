/**
 * Client-side script for @docmd/plugin-ai
 * Modern AI Assistant for docmd documentation framework.
 */

import './styles.css';

interface AIConfig {
  greeting?: string;
  placeholder?: string;
  position?: 'bottom-center' | 'bottom-right' | 'bottom-left';
  suggestions?: string[];
  provider?: string;
  model?: string;
  endpoint?: string;
  projectId?: string;
  cloud?: {
    siteId?: string;
    projectId?: string;
  };
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  citations?: Array<{ title: string; url: string }>;
  timestamp: number;
}

const STORAGE_KEY = 'docmd_ai_history_v1';
const MAX_HISTORY = 10;

class DocmdAIAssistant {
  private config: AIConfig;
  private rootElement: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private modalElement: HTMLElement | null = null;
  private triggerElement: HTMLElement | null = null;
  private messageListElement: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private sendButtonElement: HTMLButtonElement | null = null;
  private isOpen = false;
  private isThinking = false;
  private messages: Message[] = [];
  private ws: WebSocket | null = null;
  private pendingCalls = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private callIdCounter = 0;

  constructor() {
    const rawConfig = (window as any).__docmd_ai_config || {};
    this.config = {
      greeting: rawConfig.greeting || 'How can I help with these docs today?',
      placeholder: rawConfig.placeholder || 'Ask AI a question...',
      position: rawConfig.position || 'bottom-center',
      suggestions: rawConfig.suggestions || [
        'How do I get started?',
        'Show configuration options',
        'Explain key concepts'
      ],
      provider: rawConfig.provider || 'AI',
      model: rawConfig.model || '',
      endpoint: rawConfig.endpoint || '',
      projectId: rawConfig.projectId || rawConfig.cloud?.projectId || rawConfig.cloud?.siteId || '',
      cloud: rawConfig.cloud || {}
    };

    this.loadHistory();
    this.initWebSocket();
    this.initDOM();
  }

  private loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.messages = parsed.slice(-MAX_HISTORY);
        }
      }
    } catch {
      this.messages = [];
    }
  }

  private saveHistory() {
    try {
      const sliced = this.messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
    } catch {
      // Ignore storage errors
    }
  }

  private clearHistoryStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private initWebSocket() {
    // Only connect WebSocket if no explicit remote HTTP endpoint was specified
    if (this.config.endpoint) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.ws = ws;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'response' && data.id && this.pendingCalls.has(data.id)) {
            const { resolve, reject } = this.pendingCalls.get(data.id)!;
            this.pendingCalls.delete(data.id);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.result);
            }
          }
        } catch {
          // Ignore non-JSON or unrelated WS messages
        }
      };

      ws.onclose = () => {
        this.ws = null;
      };
    } catch {
      this.ws = null;
    }
  }

  private callAction(actionName: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const id = `ai_${++this.callIdCounter}_${Date.now()}`;
        this.pendingCalls.set(id, { resolve, reject });
        this.ws.send(JSON.stringify({
          type: 'call',
          id,
          action: actionName,
          payload
        }));
      } else {
        const targetUrl = this.config.endpoint || '/_docmd/api/ai/chat';
        fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Docmd-Plugin': '@docmd/plugin-ai'
          },
          body: JSON.stringify(payload)
        })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: res.statusText }));
              throw new Error(err.message || 'Server request failed');
            }
            return res.json();
          })
          .then(resolve)
          .catch(reject);
      }
    });
  }

  private initDOM() {
    let root = document.getElementById('docmd-ai-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'docmd-ai-root';
      document.body.appendChild(root);
    }
    this.rootElement = root;

    let posClass = '';
    if (this.config.position === 'bottom-right') posClass = 'position-right';
    else if (this.config.position === 'bottom-left') posClass = 'position-left';

    const sparkIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;

    this.rootElement.innerHTML = `
      <!-- Backdrop Overlay -->
      <div class="docmd-ai-overlay-backdrop"></div>

      <!-- Floating Pill Bar Trigger -->
      <div class="docmd-ai-trigger-pill ${posClass}" role="button" tabindex="0" aria-label="Ask AI Assistant">
        <span class="docmd-ai-spark-icon">${sparkIconSvg}</span>
        <span class="docmd-ai-pill-text">${this.escapeHTML(this.config.placeholder || 'Ask AI a question...')}</span>
        <kbd class="docmd-ai-shortcut-kbd">⌘K</kbd>
      </div>

      <!-- AI Overlay Modal Window (Floating Bottom-Center) -->
      <div class="docmd-ai-modal ${posClass}">
        <!-- Ambient Faded AI Halo Glow -->
        <div class="docmd-ai-halo-bg"></div>

        <!-- Header -->
        <div class="docmd-ai-header">
          <div class="docmd-ai-title-wrap">
            <h3 class="docmd-ai-header-title">
              <span class="docmd-ai-spark-icon">${sparkIconSvg}</span>
              Ask AI Assistant
            </h3>
          </div>
          <div class="docmd-ai-header-actions">
            <button class="docmd-ai-btn-icon docmd-ai-clear" title="Clear Conversation">
              <svg viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"/></svg>
            </button>
            <button class="docmd-ai-btn-icon docmd-ai-close" title="Close (Esc)">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <!-- Body / Message List -->
        <div class="docmd-ai-body"></div>

        <!-- Footer / Input Form -->
        <div class="docmd-ai-footer">
          <form class="docmd-ai-form" onsubmit="return false;">
            <input type="text" class="docmd-ai-input" placeholder="${this.escapeHTML(this.config.placeholder || '')}" autocomplete="off"/>
            <button type="submit" class="docmd-ai-send-btn" aria-label="Send query">
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </div>
      </div>
    `;

    // Elements
    this.backdropElement = this.rootElement.querySelector('.docmd-ai-overlay-backdrop');
    this.triggerElement = this.rootElement.querySelector('.docmd-ai-trigger-pill');
    this.modalElement = this.rootElement.querySelector('.docmd-ai-modal');
    this.messageListElement = this.rootElement.querySelector('.docmd-ai-body');
    this.inputElement = this.rootElement.querySelector('.docmd-ai-input');
    this.sendButtonElement = this.rootElement.querySelector('.docmd-ai-send-btn');

    // Render initial messages / history
    this.renderInitialMessages();

    // Event listeners
    this.triggerElement?.addEventListener('click', () => this.toggleModal());
    this.backdropElement?.addEventListener('click', () => this.closeModal());
    this.rootElement.querySelector('.docmd-ai-close')?.addEventListener('click', () => this.closeModal());
    this.rootElement.querySelector('.docmd-ai-clear')?.addEventListener('click', () => this.clearChat());

    const form = this.rootElement.querySelector('.docmd-ai-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUserSend();
    });

    // Suggestion pills click
    this.messageListElement?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('docmd-ai-pill')) {
        const text = target.textContent || '';
        if (text && this.inputElement) {
          this.inputElement.value = text;
          this.handleUserSend();
        }
      }
    });

    // Global keyboard listener (Cmd+K, Ctrl+K, Esc)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggleModal();
      } else if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.closeModal();
      }
    });
  }

  private renderInitialMessages() {
    if (!this.messageListElement) return;

    const sparkIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;

    let html = `
      <div class="docmd-ai-message assistant">
        <div class="docmd-ai-avatar-spark">${sparkIconSvg}</div>
        <div class="docmd-ai-bubble">
          ${this.escapeHTML(this.config.greeting || '')}
        </div>
      </div>
    `;

    if (this.messages.length > 0) {
      this.messages.forEach(msg => {
        const citationsHtml = msg.citations && msg.citations.length > 0
          ? `<div class="docmd-ai-citations">
              <div class="docmd-ai-citations-title">Sources</div>
              ${msg.citations.map(c => `<a class="docmd-ai-citation-link" href="${this.escapeHTML(c.url)}">📄 ${this.escapeHTML(c.title)}</a>`).join('')}
            </div>`
          : '';

        const formatted = msg.sender === 'assistant' ? this.formatMarkdown(msg.text) : this.escapeHTML(msg.text);

        if (msg.sender === 'assistant') {
          html += `
            <div class="docmd-ai-message assistant">
              <div class="docmd-ai-avatar-spark">${sparkIconSvg}</div>
              <div class="docmd-ai-bubble">
                ${formatted}
                ${citationsHtml}
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="docmd-ai-message user">
              <div class="docmd-ai-bubble">
                ${formatted}
              </div>
            </div>
          `;
        }
      });
    } else if (this.config.suggestions && this.config.suggestions.length > 0) {
      html += `
        <div class="docmd-ai-suggestions">
          ${this.config.suggestions.map(s => `<button class="docmd-ai-pill">${this.escapeHTML(s)}</button>`).join('')}
        </div>
      `;
    }

    this.messageListElement.innerHTML = html;
    this.messageListElement.scrollTop = this.messageListElement.scrollHeight;
  }

  private toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  private openModal() {
    this.isOpen = true;
    this.backdropElement?.classList.add('open');
    this.modalElement?.classList.add('open');
    setTimeout(() => this.inputElement?.focus(), 120);
  }

  private closeModal() {
    this.isOpen = false;
    this.backdropElement?.classList.remove('open');
    this.modalElement?.classList.remove('open');
  }

  private clearChat() {
    this.messages = [];
    this.clearHistoryStorage();
    this.renderInitialMessages();
  }

  private async handleUserSend() {
    if (!this.inputElement || this.isThinking) return;
    const userText = this.inputElement.value.trim();
    if (!userText) return;

    this.inputElement.value = '';
    this.appendMessage('user', userText);
    this.messages.push({ sender: 'user', text: userText, timestamp: Date.now() });
    this.saveHistory();

    this.showTypingIndicator();
    this.isThinking = true;
    if (this.sendButtonElement) this.sendButtonElement.disabled = true;

    try {
      const targetId = this.config.projectId || this.config.cloud?.projectId || this.config.cloud?.siteId || '';
      const response = await this.callAction('ai:chat', {
        projectId: targetId,
        siteId: targetId,
        message: userText,
        history: this.messages.slice(-6),
        pageUrl: window.location.pathname,
        pageTitle: document.title
      });

      this.hideTypingIndicator();

      const assistantText = response?.text || 'Sorry, I could not generate a response.';
      const citations = response?.citations || [];

      this.appendMessage('assistant', assistantText, citations);
      this.messages.push({ sender: 'assistant', text: assistantText, citations, timestamp: Date.now() });
      this.saveHistory();
    } catch (err: any) {
      this.hideTypingIndicator();
      const errMsg = err?.message || 'Error communicating with AI service.';
      this.appendMessage('assistant', `⚠️ **Error**: ${errMsg}`);
    } finally {
      this.isThinking = false;
      if (this.sendButtonElement) this.sendButtonElement.disabled = false;
    }
  }

  private appendMessage(sender: 'user' | 'assistant', text: string, citations?: Array<{ title: string; url: string }>) {
    if (!this.messageListElement) return;

    if (sender === 'user') {
      const suggestionsEl = this.messageListElement.querySelector('.docmd-ai-suggestions');
      if (suggestionsEl) suggestionsEl.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `docmd-ai-message ${sender}`;

    let citationsHtml = '';
    if (citations && citations.length > 0) {
      citationsHtml = `
        <div class="docmd-ai-citations">
          <div class="docmd-ai-citations-title">Sources</div>
          ${citations.map(c => `<a class="docmd-ai-citation-link" href="${this.escapeHTML(c.url)}">📄 ${this.escapeHTML(c.title)}</a>`).join('')}
        </div>
      `;
    }

    const formattedText = sender === 'assistant' ? this.formatMarkdown(text) : this.escapeHTML(text);
    const sparkIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;

    if (sender === 'assistant') {
      messageDiv.innerHTML = `
        <div class="docmd-ai-avatar-spark">${sparkIconSvg}</div>
        <div class="docmd-ai-bubble">
          ${formattedText}
          ${citationsHtml}
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="docmd-ai-bubble">
          ${formattedText}
        </div>
      `;
    }

    this.messageListElement.appendChild(messageDiv);
    this.messageListElement.scrollTop = this.messageListElement.scrollHeight;
  }

  private showTypingIndicator() {
    if (!this.messageListElement) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'docmd-ai-message assistant docmd-ai-typing-wrap';
    const sparkIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`;
    typingDiv.innerHTML = `
      <div class="docmd-ai-avatar-spark">${sparkIconSvg}</div>
      <div class="docmd-ai-bubble docmd-ai-typing">
        <div class="docmd-ai-typing-dot"></div>
        <div class="docmd-ai-typing-dot"></div>
        <div class="docmd-ai-typing-dot"></div>
      </div>
    `;
    this.messageListElement.appendChild(typingDiv);
    this.messageListElement.scrollTop = this.messageListElement.scrollHeight;
  }

  private hideTypingIndicator() {
    const typingEl = this.messageListElement?.querySelector('.docmd-ai-typing-wrap');
    if (typingEl) typingEl.remove();
  }

  private formatMarkdown(text: string): string {
    let html = this.escapeHTML(text);

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, (_match, p1) => `<pre><code>${p1.trim()}</code></pre>`);
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--docmd-ai-primary)">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Auto-instantiate on DOM load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DocmdAIAssistant());
  } else {
    new DocmdAIAssistant();
  }
}
