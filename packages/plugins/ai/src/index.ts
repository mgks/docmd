/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/plugin-ai
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

import path from 'path';
import fs from 'fs/promises';
import nativeFs from 'fs';
import { fileURLToPath } from 'url';
import type { PluginDescriptor, ActionContext, Asset } from '@docmd/api';
import { scriptLiteral } from '@docmd/utils';
import { DocmdAssistantEngine } from 'docmd-assistant';

export const plugin: PluginDescriptor = {
  name: 'ai',
  version: '0.9.0',
  capabilities: ['init', 'body', 'assets', 'actions', 'translations', 'post-build']
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const i18nDir = path.resolve(__dirname, '..', 'i18n');

/** AI Plugin Configuration Interface */
export interface AIPluginOptions {
  enabled?: boolean;
  assistant?: boolean;
  chat?: boolean;
  captcha?: boolean;
  endpoint?: string;
  projectId?: string;
  siteId?: string;
  cloud?: {
    projectId?: string;
    siteId?: string;
  };
  provider?: string;
  model?: string;
  apiKey?: string;
  systemPrompt?: string;
  greeting?: string;
  placeholder?: string;
  suggestions?: string[];
  position?: 'bottom-center' | 'bottom-right' | 'bottom-left';
  reasoning?: boolean | 'none' | 'low' | 'medium' | 'high';
  contextLimit?: number;
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
}

/** Default system prompt for documentation assistant */
const DEFAULT_SYSTEM_PROMPT = `You are docmd assistant — an expert, precise documentation assistant strictly dedicated to answering technical questions about this documentation site.

CRITICAL CONSTRAINTS & BEHAVIORAL RULES:
1. STRICT SCOPE & BOUNDARIES: Answer ONLY questions related to the software, APIs, tools, installation, configuration, and documentation provided on this site. If a user asks off-topic, general knowledge, or unrelated questions, politely refuse and explain that you are strictly trained to assist with this documentation.
2. AGGRESSIVE SEARCH USAGE: For EVERY technical question or user query, you MUST invoke the \`search_documentation\` tool FIRST to search for exact keywords, code examples, versioning rules, and configuration flags. Never guess parameters or invent APIs.
3. ACCURACY & SOURCE CITATIONS: Ground all responses directly in the retrieved documentation results. Reference relevant page titles or section headers when available.
4. VERSION & LOCALIZATION AWARENESS: Be aware of the active documentation version and locale. Utilize localized search results matching the user's language and active version.
5. TECHNICAL & CONCISE: Provide clear, structured Markdown responses with code blocks where appropriate. Do not engage in casual off-topic banter.`;

/** Resolved configuration cache per build */
let _resolvedOptions: AIPluginOptions = {};

/** Simple in-memory rate limiting store (IP/Session -> timestamps) */
const rateLimitStore = new Map<string, number[]>();

export async function onConfigResolved(config: any): Promise<void> {
  const pluginOptions: AIPluginOptions = (config.plugins && config.plugins.ai) || config.ai || {};
  
  // Support both `assistant` and legacy `chat` config flags
  const isAssistantEnabled = pluginOptions.assistant !== false && pluginOptions.chat !== false && pluginOptions.enabled !== false;
  const targetProjectId = pluginOptions.projectId || pluginOptions.siteId || pluginOptions.cloud?.projectId || pluginOptions.cloud?.siteId;

  // Resolve cloud endpoint if targetProjectId is configured
  let endpoint = pluginOptions.endpoint;
  if (!endpoint && targetProjectId) {
    endpoint = 'https://api.docmd.io/v1/ai/chat';
  }

  // Pass provider and model through directly if configured; docmd-assistant / aiplug handles defaults
  const provider = pluginOptions.provider || process.env.AI_PROVIDER;
  const model = pluginOptions.model || process.env.AI_MODEL;

  _resolvedOptions = {
    enabled: isAssistantEnabled,
    assistant: isAssistantEnabled,
    chat: isAssistantEnabled,
    captcha: pluginOptions.captcha !== false,
    endpoint,
    projectId: targetProjectId,
    siteId: targetProjectId,
    cloud: { siteId: targetProjectId, projectId: targetProjectId, ...(pluginOptions.cloud || {}) },
    provider,
    model,
    apiKey: pluginOptions.apiKey || process.env.AI_API_KEY || (provider ? process.env[`${provider.toUpperCase()}_API_KEY`] : undefined) || process.env.OPENAI_API_KEY,
    systemPrompt: pluginOptions.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    greeting: pluginOptions.greeting,
    placeholder: pluginOptions.placeholder,
    suggestions: pluginOptions.suggestions,
    position: pluginOptions.position || 'bottom-center',
    contextLimit: pluginOptions.contextLimit || 5,
    rateLimit: {
      maxRequests: pluginOptions.rateLimit?.maxRequests || 10,
      windowMs: pluginOptions.rateLimit?.windowMs || 60000
    }
  };

  config._aiConfig = _resolvedOptions;
}

/** Load translation strings */
function loadPluginStrings(localeId: string): Record<string, string> {
  try {
    const localePath = path.join(i18nDir, `${localeId}.json`);
    if (nativeFs.existsSync(localePath)) {
      return JSON.parse(nativeFs.readFileSync(localePath, 'utf8'));
    }
  } catch { /* fallback */ }
  try {
    const enPath = path.join(i18nDir, 'en.json');
    if (nativeFs.existsSync(enPath)) {
      return JSON.parse(nativeFs.readFileSync(enPath, 'utf8'));
    }
  } catch { /* silent */ }
  return {};
}

export function translations(localeId: string): Record<string, string> {
  return loadPluginStrings(localeId || 'en');
}

/** RAG: Retrieve targeted documentation snippets via @docmd/plugin-search index */
async function searchDocumentationRAG(
  projectRoot: string,
  query: string,
  maxResults: number = 5
): Promise<Array<{ title: string; url: string; content: string }>> {
  const results: Array<{ title: string; url: string; content: string }> = [];

  const searchIndexCandidates = [
    path.join(projectRoot, '_site', '_docmd-search', 'search-index.json'),
    path.join(projectRoot, 'site', '_docmd-search', 'search-index.json'),
    path.join(projectRoot, '_docmd-search', 'search-index.json'),
  ];

  let searchIndexFile: string | null = null;
  for (const candidate of searchIndexCandidates) {
    if (nativeFs.existsSync(candidate)) {
      searchIndexFile = candidate;
      break;
    }
  }

  if (searchIndexFile) {
    try {
      const indexRaw = await fs.readFile(searchIndexFile, 'utf8');
      const parsedIndex = JSON.parse(indexRaw);
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

      let docEntries: Array<{ id: string; title?: string; text?: string; headings?: string }> = [];
      if (Array.isArray(parsedIndex)) {
        docEntries = parsedIndex;
      } else if (parsedIndex.documentIds && parsedIndex.documentMap) {
        docEntries = Object.values(parsedIndex.documentMap);
      } else if (parsedIndex.index && parsedIndex.index.documentMap) {
        docEntries = Object.values(parsedIndex.index.documentMap);
      }

      const scoredHits = docEntries.map(doc => {
        const titleStr = String(doc.title || doc.id || '').toLowerCase();
        const textStr = String(doc.text || '').toLowerCase();
        const headingsStr = String(doc.headings || '').toLowerCase();

        let score = 0;
        for (const term of queryTerms) {
          if (titleStr.includes(term)) score += 5;
          if (headingsStr.includes(term)) score += 3;
          if (textStr.includes(term)) score += 1;
        }
        return { doc, score };
      }).filter(h => h.score > 0).sort((a, b) => b.score - a.score);

      const topHits = scoredHits.slice(0, maxResults);
      for (const hit of topHits) {
        const doc = hit.doc;
        const title = doc.title || doc.id;
        const url = doc.id.startsWith('/') ? doc.id : `/${doc.id}`;
        const text = doc.text || '';
        results.push({
          title,
          url,
          content: text.length > 1200 ? text.slice(0, 1200) + '...' : text
        });
      }

      if (results.length > 0) {
        return results;
      }
    } catch {
      /* Fall back to scanning files directly */
    }
  }

  // Fallback: file scanner
  const srcDir = path.join(projectRoot, 'docs');
  if (!nativeFs.existsSync(srcDir)) return results;

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) await walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const contentLower = content.toLowerCase();
          const matches = queryTerms.some(term => contentLower.includes(term));

          if (matches || queryTerms.length === 0) {
            const relPath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
            const urlPath = '/' + relPath.replace(/\.md$/, '.html');
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : relPath;

            results.push({
              title,
              url: urlPath,
              content: content.slice(0, 1200)
            });
          }
        } catch { /* ignore */ }
      }
    }
  }

  await walk(srcDir);
  return results;
}

/** Check rate limiting per client */
function checkRateLimit(clientId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  let timestamps = rateLimitStore.get(clientId) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return false;
  }

  timestamps.push(now);
  rateLimitStore.set(clientId, timestamps);
  return true;
}

/** Named RPC Action Handlers */
export const actions = {
  /**
   * Action `ai:chat`
   * Called by client widget to complete an AI prompt using aiplug.
   */
  async 'ai:chat'(payload: any, ctx: ActionContext) {
    const { message, history = [] } = payload || {};
    if (!message || typeof message !== 'string') {
      throw new Error('Message payload is required');
    }

    const opts = ctx.config._aiConfig || _resolvedOptions;
    if (opts.enabled === false) {
      throw new Error('AI Assistant plugin is disabled in config.');
    }

    // Rate Limiting Protection
    const clientId = (ctx as any).clientIp || 'default_client';
    const maxReq = opts.rateLimit?.maxRequests || 10;
    const windowMs = opts.rateLimit?.windowMs || 60000;
    if (!checkRateLimit(clientId, maxReq, windowMs)) {
      throw new Error(`Rate limit exceeded (${maxReq} requests/min). Please wait a moment before sending another query.`);
    }

    const docsContext = await searchDocumentationRAG(ctx.projectRoot, message, opts.contextLimit || 5);
    const citations: Array<{ title: string; url: string }> = docsContext.map(d => ({ title: d.title, url: d.url }));

    const engine = new DocmdAssistantEngine({
      endpoint: opts.endpoint || 'https://api.docmd.io/v1/ai/chat',
      projectId: opts.projectId || opts.siteId,
      provider: opts.provider,
      model: opts.model,
      systemPrompt: opts.systemPrompt
    });

    const res = await engine.sendMessage(message);
    return {
      text: res.message,
      citations,
      provider: opts.provider,
      model: opts.model
    };
  }
};

/** Script and container generator for page injection */
export function generateScripts(config: any, _options?: any): { headScriptsHtml: string; bodyScriptsHtml: string } {
  const pluginOptions: AIPluginOptions = config._aiConfig || (config.plugins && config.plugins.ai) || config.ai || {};
  if (pluginOptions.enabled === false || pluginOptions.assistant === false || pluginOptions.chat === false) {
    return { headScriptsHtml: '', bodyScriptsHtml: '' };
  }

  const targetProjectId = pluginOptions.projectId || pluginOptions.siteId || pluginOptions.cloud?.projectId || pluginOptions.cloud?.siteId;
  const endpoint = pluginOptions.endpoint || (targetProjectId ? 'https://api.docmd.io/v1/ai/chat' : '');

  const clientConfig: Record<string, any> = {
    endpoint,
    projectId: targetProjectId,
    cloud: { siteId: targetProjectId, projectId: targetProjectId, ...(pluginOptions.cloud || {}) },
    captcha: pluginOptions.captcha !== false,
    position: pluginOptions.position || 'bottom-center',
    greeting: pluginOptions.greeting,
    placeholder: pluginOptions.placeholder,
    suggestions: pluginOptions.suggestions
  };
  if (pluginOptions.provider) clientConfig.provider = pluginOptions.provider;
  if (pluginOptions.model) clientConfig.model = pluginOptions.model;

  return {
    headScriptsHtml: '',
    bodyScriptsHtml: `<div id="docmd-ai-root"></div><script>window.__docmd_ai_config=${scriptLiteral(clientConfig)};</script>`
  };
}

/** External assets to inject into HTML pages */
export function getAssets(_config?: any): Asset[] {
  const distDir = path.resolve(__dirname, '..', 'dist', 'client');
  const jsPath = path.join(distDir, 'index.js');
  const cssPath = path.join(distDir, 'ai.css');

  const assets: Asset[] = [];
  if (nativeFs.existsSync(jsPath)) {
    assets.push({
      src: jsPath,
      dest: 'assets/js/docmd-ai.js',
      type: 'js',
      location: 'body',
      attributes: { type: 'module' }
    });
  }
  if (nativeFs.existsSync(cssPath)) {
    assets.push({
      src: cssPath,
      dest: 'assets/css/docmd-ai.css',
      type: 'css',
      location: 'head'
    });
  }

  return assets;
}

/** Post Build Hook */
export async function onPostBuild({ log }: any): Promise<void> {
  if (log) log('AI Assistant plugin ready for site.');
}