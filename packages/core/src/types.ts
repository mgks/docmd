/**
 * --------------------------------------------------------------------
 * docmd : the minimalist, zero-config documentation generator.
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

/**
 * Context provided to plugin action and event handlers.
 *
 * Contains file I/O helpers, source editing tools, and project metadata.
 * All file operations are sandboxed to the project root directory.
 */
export interface ActionContext {
  /** Absolute path to the project root directory. */
  projectRoot: string;
  /** Current docmd site configuration. */
  config: any;
  /** Read a file relative to the project root. */
  readFile(relativePath: string): Promise<string>;
  /** Write a file relative to the project root. Sets the modification flag. */
  writeFile(relativePath: string, content: string): Promise<void>;
  /** Read a file as an array of lines. */
  readFileLines(relativePath: string): Promise<string[]>;
  /** Broadcast an event to all connected browser clients. */
  broadcast(event: string, data: any): void;
  /** Source editing tools for block-level markdown manipulation. */
  source: SourceTools;
}

/**
 * Source editing tools that translate rendered-output references
 * (block IDs, text offsets) back to raw markdown source positions.
 */
export interface SourceTools {
  /** Get block content and inline segments at a given source map reference. */
  getBlockAt(file: string, blockRef: [number, number], options?: { textOffset?: number }): Promise<BlockInfo>;
  /** Locate text within a block and return its source position. */
  findText(file: string, blockRef: [number, number], text: string, textOffset?: number): Promise<TextLocation | null>;
  /** Wrap text within a block with syntax markers (e.g., `==`, `**`). */
  wrapText(file: string, blockRef: [number, number], text: string, textOffset: number, before: string, after: string): Promise<void>;
  /** Insert markdown content after a block. */
  insertAfter(file: string, blockRef: [number, number], content: string): Promise<void>;
  /** Replace an entire block's source lines. */
  replaceBlock(file: string, blockRef: [number, number], content: string): Promise<void>;
  /** Remove a block's source lines. */
  removeBlock(file: string, blockRef: [number, number]): Promise<void>;
}

/** Information about a block in the markdown source. */
export interface BlockInfo {
  id: string | null;
  line: { start: number; end: number };
  raw: string;
  textContent: string;
  segments: InlineSegment[];
  cursor: InlineSegment | null;
  ancestors: any[];
}

/** A contiguous run of text content with optional surrounding syntax. */
export interface InlineSegment {
  text: string;
  rawOffset: number;
  rawLength: number;
  syntax: [string, string] | null;
}

/** Source position of located text within a block. */
export interface TextLocation {
  line: number;
  startCol: number;
  endCol: number;
  rawText: string;
  wrappingSyntax: { before: string | null; after: string | null };
}

/**
 * Handler for a named plugin action (WebSocket RPC).
 * Returns a result that is sent back to the browser client.
 */
export type ActionHandler = (payload: any, ctx: ActionContext) => Promise<any>;

/** Handler for a fire-and-forget plugin event. */
export type EventHandler = (data: any, ctx: ActionContext) => void;

/** Result of dispatching an action call. */
export interface DispatchResult {
  result: any;
  reload: boolean;
}

/**
 * Interface for a docmd plugin module.
 *
 * Plugins can export any combination of build-time hooks and runtime
 * action/event handlers.
 */
export interface PluginModule {
  /** Extend the markdown-it parser instance. */
  markdownSetup?(md: any, options?: any): void;
  /** Inject meta/link tags into the HTML head. */
  generateMetaTags?(config: any, page: any, relativePathToRoot: string): string | Promise<string>;
  /** Inject scripts into head and/or body. */
  generateScripts?(config: any, options?: any): { headScriptsHtml?: string; bodyScriptsHtml?: string };
  /** Define external assets (JS/CSS) to inject. */
  getAssets?(options?: any): any[];
  /** Run logic after all HTML files are generated. */
  onPostBuild?(ctx: any): Promise<void>;
  /** Named action handlers for WebSocket RPC calls from the browser. */
  actions?: Record<string, ActionHandler>;
  /** Named event handlers for fire-and-forget messages from the browser. */
  events?: Record<string, EventHandler>;
}
