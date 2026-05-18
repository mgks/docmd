import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Comment } from '../../types';

import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/popover/popover.js';

const EMOJI_PRESETS = ['\u{1F44D}', '\u{1F44E}', '\u{1F602}', '\u{1F389}', '\u{1F914}', '\u{2764}\u{FE0F}', '\u{1F680}', '\u{1F440}'];

@customElement('threads-comment')
export class ThreadsComment extends LitElement {
  override createRenderRoot() { return this; }

  @property({ type: Object }) comment!: Comment;
  @property({ type: String }) currentAuthor: string | null = null;
  @property({ type: Boolean }) editing = false;
  @state() private showEmojiPicker = false;

  private editValue = '';

  private get isOwn(): boolean {
    return this.comment.author === this.currentAuthor;
  }

  private formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  }

  private startEdit(): void {
    this.editValue = this.comment.body;
    this.editing = true;
    this.requestUpdate();
  }

  private cancelEdit(): void {
    this.editing = false;
    this.requestUpdate();
  }

  private saveEdit(): void {
    const textarea = this.querySelector<HTMLElement & { value: string }>('wa-textarea');
    const value = textarea?.value?.trim();
    if (!value) return;
    this.dispatchEvent(new CustomEvent('comment-edit', {
      bubbles: true, composed: true,
      detail: { commentId: this.comment.id, threadId: this.comment.thread_id, body: value },
    }));
    this.editing = false;
    this.requestUpdate();
  }

  private requestDelete(): void {
    this.dispatchEvent(new CustomEvent('comment-delete', {
      bubbles: true, composed: true,
      detail: { commentId: this.comment.id, threadId: this.comment.thread_id },
    }));
  }

  private toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  private addReaction(emoji: string): void {
    this.showEmojiPicker = false;
    this.dispatchEvent(new CustomEvent('comment-reaction', {
      bubbles: true, composed: true,
      detail: { commentId: this.comment.id, threadId: this.comment.thread_id, emoji },
    }));
  }

  private renderBody() {
    if (this.editing) {
      return html`
        <wa-textarea
          value=${this.editValue}
          rows="3"
          size="small"
          @input=${(e: Event) => { this.editValue = (e.target as any).value; }}
        ></wa-textarea>
        <div style="display:flex; gap:8px; margin-top:6px; justify-content:flex-end;">
          <wa-button size="small" appearance="outlined" @click=${this.cancelEdit}>Cancel</wa-button>
          <wa-button size="small" variant="brand" @click=${this.saveEdit}>Save</wa-button>
        </div>
      `;
    }
    return html`<div class="tc-comment__body">${this.renderMarkdown(this.comment.body)}</div>`;
  }

  private renderMarkdown(text: string): ReturnType<typeof html> {
    return html`<div .innerHTML=${this.sanitize(this.simpleMarkdown(text))}></div>`;
  }

  private sanitize(html: string): string {
    return html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/on\w+="[^"]*"/gim, "")
      .replace(/on\w+='[^']*'/gim, "");
  }

  private simpleMarkdown(text: string): string {
    return this.escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  override render() {
    const c = this.comment;
    const reactions = c.reactions || [];

    return html`
      <div class="tc-comment">
        <div class="tc-comment__header">
          <wa-avatar initials="${c.author.charAt(0).toUpperCase()}" label="${c.author}" style="--size: 26px;"></wa-avatar>
          <div class="tc-comment__meta">
            <span class="tc-comment__author">${c.author}</span>
            <span class="tc-comment__time">${this.formatTime(c.date)}${c.edited_at ? ' (edited)' : ''}</span>
          </div>
          ${this.isOwn && !this.editing ? html`
            <div class="tc-comment__menu">
              <wa-button size="small" appearance="plain" title="Edit" @click=${this.startEdit}>
                <wa-icon name="pen-to-square" variant="regular"></wa-icon>
              </wa-button>
              <wa-button size="small" appearance="plain" title="Delete" @click=${this.requestDelete}>
                <wa-icon name="trash-can" variant="regular"></wa-icon>
              </wa-button>
            </div>
          ` : nothing}
        </div>

        ${this.renderBody()}

        <div class="tc-comment__footer">
          ${reactions.length > 0 ? html`
            <div class="tc-reactions">
              ${reactions.map(r => html`
                <button
                  class="tc-reaction ${r.authors.includes(this.currentAuthor ?? '') ? 'tc-reaction--active' : ''}"
                  title="${r.authors.join(', ')}"
                  @click=${() => this.addReaction(r.emoji)}
                >${r.emoji} <span class="tc-reaction__count">${r.authors.length}</span></button>
              `)}
            </div>
          ` : nothing}

          <div class="tc-comment__actions">
            <wa-button
              id="emoji-trigger-${c.id}"
              size="small"
              appearance="plain"
              title="Add reaction"
              @click=${this.toggleEmojiPicker}
            >
              <wa-icon name="face-smile" variant="regular"></wa-icon>
            </wa-button>
            <wa-popover
              placement="bottom-start"
              .anchor=${this.querySelector(`#emoji-trigger-${c.id}`)}
              ?open=${this.showEmojiPicker}
              @wa-hide=${() => { this.showEmojiPicker = false; }}
            >
              <div style="display:flex; gap:2px; padding:4px 6px;">
                ${EMOJI_PRESETS.map(e => html`
                  <button class="tc-emoji-picker__item" @click=${() => this.addReaction(e)}>${e}</button>
                `)}
              </div>
            </wa-popover>
          </div>
        </div>
      </div>
    `;
  }
}
