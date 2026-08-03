/**
 * Client-side entry for @docmd/plugin-ai
 * docmd UI wrapper around docmd-assistant headless AI engine.
 */

import { DocmdAssistantEngine } from 'docmd-assistant';

export class DocmdAIAssistantUI {
  private engine: any;
  private container: HTMLElement | null = null;
  private isOpened = false;

  constructor() {
    const cfg = (window as any).__docmd_ai_config || (window as any).__DOCMD_AI_CONFIG__ || {};
    const projectId = cfg.projectId || cfg.siteId || cfg.cloud?.projectId || cfg.cloud?.siteId;

    this.engine = new DocmdAssistantEngine({
      projectId,
      endpoint: cfg.endpoint || 'https://api.docmd.io/v1/ai/chat',
      provider: cfg.provider,
      model: cfg.model,
      systemPrompt: cfg.systemPrompt
    });

    // Register docmd search Tool if docmd-search is active on window
    this.engine.registerTool({
      name: 'search_documentation',
      description: 'Search documentation content via docmd-search index',
      execute: async ({ query }: { query: string }) => {
        if ((window as any).docmdSearch && typeof (window as any).docmdSearch.search === 'function') {
          return await (window as any).docmdSearch.search(query);
        }
        return [];
      }
    });

    if (typeof document !== 'undefined') {
      this.mount();
    }
  }

  private mount(): void {
    if (document.getElementById('docmd-ai-plugin-root')) return;

    this.container = document.createElement('div');
    this.container.id = 'docmd-ai-plugin-root';
    this.container.innerHTML = `
      <style>
        #docmd-ai-plugin-root {
          font-family: var(--docmd-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
        }
        .docmd-ai-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--docmd-primary, #3b82f6);
          color: #ffffff;
          border-radius: 9999px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .docmd-ai-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.4);
        }
        .docmd-ai-box {
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 380px;
          height: 520px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 100px);
          background: var(--docmd-bg-card, #111827);
          border: 1px solid var(--docmd-border, rgba(255,255,255,0.12));
          border-radius: 16px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateY(16px) scale(0.96);
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .docmd-ai-box.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .docmd-ai-header {
          padding: 14px 16px;
          background: var(--docmd-bg-header, #1f2937);
          border-bottom: 1px solid var(--docmd-border, rgba(255,255,255,0.08));
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
        }
        .docmd-ai-close {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 18px;
        }
        .docmd-ai-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .docmd-ai-msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .docmd-ai-msg.user {
          align-self: flex-end;
          background: var(--docmd-primary, #3b82f6);
          color: #ffffff;
        }
        .docmd-ai-msg.assistant {
          align-self: flex-start;
          background: var(--docmd-bg-bubble, #1f2937);
          color: #e5e7eb;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .docmd-ai-input-row {
          padding: 12px;
          background: var(--docmd-bg-card, #111827);
          border-top: 1px solid var(--docmd-border, rgba(255,255,255,0.08));
          display: flex;
          gap: 8px;
        }
        .docmd-ai-input {
          flex: 1;
          background: var(--docmd-bg-input, #1f2937);
          border: 1px solid var(--docmd-border, rgba(255,255,255,0.1));
          border-radius: 8px;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 13.5px;
          outline: none;
        }
        .docmd-ai-send {
          background: var(--docmd-primary, #3b82f6);
          border: none;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>

      <div class="docmd-ai-box" id="docmd-ai-box">
        <div class="docmd-ai-header">
          <span>docmd AI Assistant</span>
          <button class="docmd-ai-close" id="docmd-ai-close-btn">&times;</button>
        </div>
        <div class="docmd-ai-messages" id="docmd-ai-messages">
          <div class="docmd-ai-msg assistant">
            Hello! Ask me anything about this documentation.
          </div>
        </div>
        <form class="docmd-ai-input-row" id="docmd-ai-form">
          <input type="text" class="docmd-ai-input" id="docmd-ai-input" placeholder="Ask a question..." autocomplete="off" />
          <button type="submit" class="docmd-ai-send">Send</button>
        </form>
      </div>

      <button class="docmd-ai-btn" id="docmd-ai-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Ask AI</span>
      </button>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  private bindEvents(): void {
    const btn = document.getElementById('docmd-ai-btn');
    const closeBtn = document.getElementById('docmd-ai-close-btn');
    const form = document.getElementById('docmd-ai-form');
    const input = document.getElementById('docmd-ai-input') as HTMLInputElement;

    btn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.toggle(false));

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      this.appendMsg('user', text);
      const typing = this.appendMsg('assistant', 'Thinking...');

      try {
        const res = await this.engine.sendMessage(text);
        typing.textContent = res.message;
      } catch (err: any) {
        typing.textContent = `Error: ${err.message || 'Request failed'}`;
      }
    });
  }

  private toggle(open?: boolean): void {
    this.isOpened = open !== undefined ? open : !this.isOpened;
    const box = document.getElementById('docmd-ai-box');
    if (box) box.classList.toggle('open', this.isOpened);
  }

  private appendMsg(sender: 'user' | 'assistant', text: string): HTMLElement {
    const msgs = document.getElementById('docmd-ai-messages');
    const div = document.createElement('div');
    div.className = `docmd-ai-msg ${sender}`;
    div.textContent = text;
    if (msgs) {
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }
    return div;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DocmdAIAssistantUI());
  } else {
    new DocmdAIAssistantUI();
  }
}