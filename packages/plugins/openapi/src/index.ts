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

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { safePath, asUserPath } from '@docmd/utils';
import type { PluginDescriptor } from '@docmd/api';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const plugin: PluginDescriptor = {
  name: 'openapi',
  version: '0.8.11',
  capabilities: ['markdown', 'assets']
};

// ---------------------------------------------------------------------------
// Types (minimal OpenAPI 3.x subset)
// ---------------------------------------------------------------------------

interface OASchema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, OASchema>;
  items?: OASchema;
  enum?: (string | number)[];
  required?: string[];
  $ref?: string;
  example?: unknown;
  default?: unknown;
  nullable?: boolean;
  oneOf?: OASchema[];
  anyOf?: OASchema[];
  allOf?: OASchema[];
}

interface OAParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: OASchema;
  example?: unknown;
}

interface OAMediaType {
  schema?: OASchema;
  example?: unknown;
}

interface OARequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, OAMediaType>;
}

interface OAResponse {
  description?: string;
  content?: Record<string, OAMediaType>;
}

interface OAOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OAParameter[];
  requestBody?: OARequestBody;
  responses?: Record<string, OAResponse>;
  deprecated?: boolean;
}

interface OAPathItem {
  get?: OAOperation;
  post?: OAOperation;
  put?: OAOperation;
  patch?: OAOperation;
  delete?: OAOperation;
  head?: OAOperation;
  options?: OAOperation;
}

interface OASpec {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, OAPathItem>;
  components?: { schemas?: Record<string, OASchema> };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

const METHOD_COLORS: Record<string, string> = {
  get: '#10b981',
  post: '#3b82f6',
  put: '#f59e0b',
  patch: '#8b5cf6',
  delete: '#ef4444',
  head: '#6b7280',
  options: '#6b7280'
};

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function describe(str: string | undefined, options: any): string {
  if (!str) return '';
  return options?.allowRawHtml ? str : esc(str);
}

/** Resolve a $ref like #/components/schemas/Foo against the spec */
function resolveRef(ref: string, spec: OASpec): OASchema | null {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let node: any = spec;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return null;
    node = node[part];
  }
  return node as OASchema | null;
}

function resolveSchema(schema: OASchema | undefined, spec: OASpec, depth = 0): OASchema {
  if (!schema) return {};
  if (schema.$ref) return resolveRef(schema.$ref, spec) || schema;
  return schema;
}

/** Render a schema as a compact type string */
function typeLabel(schema: OASchema | undefined, spec: OASpec): string {
  if (!schema) return 'any';
  const resolved = resolveSchema(schema, spec);
  if (resolved.$ref) return resolved.$ref.split('/').pop() || 'object';
  if (resolved.type === 'array') return `array[${typeLabel(resolved.items, spec)}]`;
  if (resolved.oneOf) return resolved.oneOf.map(s => typeLabel(s, spec)).join(' | ');
  if (resolved.anyOf) return resolved.anyOf.map(s => typeLabel(s, spec)).join(' | ');
  if (resolved.enum) return resolved.enum.map(v => `"${v}"`).join(' | ');
  return [resolved.type, resolved.format].filter(Boolean).join(':') || 'any';
}

/** Render schema properties as an HTML table */
function renderSchemaTable(schema: OASchema | undefined, spec: OASpec, options: any): string {
  if (!schema) return '';
  const resolved = resolveSchema(schema, spec);
  const props = resolved.properties;
  if (!props || Object.keys(props).length === 0) return '';

  const required = new Set(resolved.required || []);
  const rows = Object.entries(props).map(([name, prop]) => {
    const r = resolveSchema(prop, spec);
    return `<tr>
      <td><code>${esc(name)}</code>${required.has(name) ? ' <span class="oa-required">*</span>' : ''}</td>
      <td><span class="oa-type">${esc(typeLabel(prop, spec))}</span></td>
      <td>${describe(r.description, options)}</td>
      <td>${r.default !== undefined ? `<code>${esc(String(r.default))}</code>` : ''}</td>
    </tr>`;
  }).join('');

  return `<table class="oa-schema-table">
  <thead><tr><th>Field</th><th>Type</th><th>Description</th><th>Default</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

/** Render a single operation */
function renderOperation(method: string, path_: string, op: OAOperation, spec: OASpec, options: any): string {
  const color = METHOD_COLORS[method] || '#6b7280';
  const deprecated = op.deprecated ? '<span class="oa-deprecated">DEPRECATED</span>' : '';
  const summaryOnly = options?.summaryOnly === true;

  // Parameters
  let paramsHtml = '';
  if (!summaryOnly && op.parameters && op.parameters.length > 0) {
    const rows = op.parameters.map(p => {
      const r = resolveSchema(p.schema, spec);
      return `<tr>
        <td><code>${esc(p.name)}</code>${p.required ? ' <span class="oa-required">*</span>' : ''}</td>
        <td><span class="oa-param-in">${esc(p.in)}</span></td>
        <td><span class="oa-type">${esc(typeLabel(p.schema, spec))}</span></td>
        <td>${describe(p.description, options)}</td>
      </tr>`;
    }).join('');
    paramsHtml = `<h5>Parameters</h5>
<table class="oa-schema-table">
  <thead><tr><th>Name</th><th>In</th><th>Type</th><th>Description</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  // Request body
  let requestHtml = '';
  if (op.requestBody?.content) {
    const entries = Object.entries(op.requestBody.content);
    requestHtml = `<h5>Request Body${op.requestBody.required ? ' <span class="oa-required">*</span>' : ''}</h5>`;
    for (const [contentType, media] of entries) {
      requestHtml += `<p class="oa-content-type"><code>${esc(contentType)}</code></p>`;
      requestHtml += renderSchemaTable(media.schema, spec, options);
    }
  }

  // Responses
  let responsesHtml = '';
  if (!summaryOnly && op.responses) {
    const statusCodes = Object.entries(op.responses);
    const rows = statusCodes.map(([code, resp]) => {
      const cls = code.startsWith('2') ? 'oa-status-ok' : code.startsWith('4') ? 'oa-status-err' : 'oa-status-other';
      let schemaInfo = '';
      if (resp.content) {
        const firstMedia = Object.values(resp.content)[0];
        if (firstMedia?.schema) schemaInfo = `<br><span class="oa-type">${esc(typeLabel(firstMedia.schema, spec))}</span>`;
      }
      return `<tr>
        <td><span class="oa-status-badge ${cls}">${esc(code)}</span></td>
        <td>${describe(resp.description, options)}${schemaInfo}</td>
      </tr>`;
    }).join('');
    responsesHtml = `<h5>Responses</h5>
<table class="oa-schema-table">
  <thead><tr><th>Status</th><th>Description</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  const id = `oa-${method}-${path_.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  return `<div class="oa-operation" id="${esc(id)}">
  <div class="oa-operation-header">
    <span class="oa-method" style="background:${color}">${method.toUpperCase()}</span>
    <code class="oa-path">${esc(path_)}</code>
    ${deprecated}
  </div>
  ${op.summary ? `<p class="oa-summary">${esc(op.summary)}</p>` : ''}
  ${op.description ? `<p class="oa-description">${describe(op.description, options)}</p>` : ''}
  ${paramsHtml}
  ${requestHtml}
  ${responsesHtml}
</div>`;
}

/** Parse OpenAPI spec from a file path (JSON or YAML). specPath is validated
 *  upstream by safePath() in renderSpec(); this function assumes it is safe. */
function parseSpec(specPath: string): OASpec {
  // eslint-disable-next-line docmd/no-unsafe-fs-read -- specPath is validated by safePath() in renderSpec()
  const raw = fs.readFileSync(specPath, 'utf8');
  // JSON detection
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(raw);
  }
  // Minimal YAML parser for OpenAPI specs (handles the common subset)
  // We avoid a full YAML dep by using JSON if possible, otherwise note the limitation
  try {
    // Try to require js-yaml if available (won't throw at import time since it's optional)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('js-yaml');
    return yaml.load(raw) as OASpec;
  } catch {
    throw new Error(`OpenAPI plugin: YAML spec at "${specPath}" requires js-yaml to be installed.\nRun: npm install js-yaml`);
  }
}

/** Render full spec as HTML */
function renderSpec(specPath: string, rootDir: string, options: any): string {
  // Phase 1.A: CWE-22 fix (S-2, N-S2). Use safePath() to enforce boundary.
  // Absolute paths and ../ traversal are rejected by safePath() (throws).
  let absPath: string;
  try {
    absPath = safePath(rootDir, asUserPath(specPath));
  } catch (_e: any) {
    return `<div class="oa-error">OpenAPI spec path escapes project root: <code>${esc(specPath)}</code></div>`;
  }

  if (!fs.existsSync(absPath)) {
    return `<div class="oa-error">OpenAPI spec not found: <code>${esc(specPath)}</code></div>`;
  }

  let spec: OASpec;
  try {
    spec = parseSpec(absPath);
  } catch (e: any) {
    return `<div class="oa-error">Failed to parse OpenAPI spec: ${esc(String(e.message))}</div>`;
  }

  const info = spec.info || {};
  let html = `<div class="oa-spec">`;

  if (options?.info !== false && info.title) {
    const downloadLink = options?.download ? `<a href="${esc(specPath)}" class="oa-download-link" title="Download OpenAPI Spec" target="_blank">JSON / YAML</a>` : '';
    html += `<div class="oa-spec-header">
      <h2 class="oa-spec-title">${esc(info.title)}</h2>
      <div class="oa-spec-meta">
        ${info.version ? `<span class="oa-spec-version">v${esc(info.version)}</span>` : ''}
        ${downloadLink}
      </div>
    </div>`;
  }
  if (info.description) {
    html += `<p class="oa-spec-description">${describe(info.description, options)}</p>`;
  }

  if (spec.paths) {
    for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const op = pathItem[method];
        if (op) {
          html += renderOperation(method, pathStr, op, spec, options);
        }
      }
    }
  }

  html += '</div>';
  return html;
}

// ---------------------------------------------------------------------------
// Plugin hooks
// ---------------------------------------------------------------------------

/**
 * Extend markdown-it to handle ```openapi fences.
 * Usage in markdown:
 *
 * ```openapi
 * ./path/to/spec.json
 * ```
 */
export function markdownSetup(md: any, options: any): void {
  const srcDir: string = options?.config?.src
    ? path.resolve(process.cwd(), options.config.src)
    : process.cwd();

  const originalFence = md.renderer.rules.fence || ((tokens: any[], idx: number, opts: any, _env: any, self: any) => self.renderToken(tokens, idx, opts));

  md.renderer.rules.fence = (tokens: any[], idx: number, opts: any, env: any, self: any) => {
    const token = tokens[idx];
    const info = (token.info || '').trim();

    if (info !== 'openapi') {
      return originalFence(tokens, idx, opts, env, self);
    }

    const specPath = token.content.trim();
    const pluginOptions = options?.config?.plugins?.openapi || {};
    return renderSpec(specPath, srcDir, pluginOptions);
  };
}

/**
 * Provide OpenAPI CSS asset.
 */
export function getAssets(_options?: any): any[] {
  const distCssPath = path.resolve(__dirname, '..', 'dist', 'openapi.css');
  const srcCssPath = path.resolve(__dirname, '..', 'src', 'openapi.css');
  const cssPath = fs.existsSync(distCssPath) ? distCssPath : srcCssPath;

  // Only inject if our bundled CSS exists
  if (!fs.existsSync(cssPath)) return [];

  return [{
    src: cssPath,
    dest: 'assets/css/docmd-openapi.css',
    type: 'css',
    location: 'head'
  }];
}
