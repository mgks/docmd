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
 * Action dispatcher for live-edit WebSocket message handling.
 *
 * Routes incoming `call` messages to plugin action handlers and `event`
 * messages to plugin event handlers.  Each call gets a fresh context with
 * file I/O helpers and source editing tools.  Tracks modifications so the
 * caller knows whether a browser reload is needed.
 */

import path from 'path';
import fs from 'fs';
import { createSourceTools } from './source-tools.js';
import type {
  ActionContext,
  ActionHandler,
  EventHandler,
  DispatchResult,
} from '../types.js';

/**
 * Resolve a relative path against the project root, rejecting any path
 * that would escape the root directory.
 */
export function safePath(root: string, relativePath: string): string {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return resolved;
}

interface DispatcherHooks {
  actions: Record<string, ActionHandler>;
  events: Record<string, EventHandler>;
}

interface DispatcherOptions {
  projectRoot: string;
  config: any;
  broadcast: (event: string, data: any) => void;
}

/**
 * Create an action dispatcher bound to the given hooks and project context.
 *
 * @param hooks     - `{ actions: {name: handler}, events: {name: handler} }`
 * @param options   - Project root, config, and broadcast function
 * @returns `{ handleCall, handleEvent }`
 */
export function createActionDispatcher(hooks: DispatcherHooks, options: DispatcherOptions) {
  const { projectRoot, config, broadcast } = options;

  return {
    /**
     * Dispatch a call-style action.  Returns `{ result, reload }`.
     */
    async handleCall(action: string, payload: any): Promise<DispatchResult> {
      const handler = hooks.actions[action];
      if (!handler) throw new Error(`Unknown action: ${action}`);

      const sourceTools = createSourceTools({ projectRoot });
      let modified = false;

      const ctx: ActionContext = {
        projectRoot,
        config,
        broadcast,
        source: sourceTools,
        async readFile(relativePath: string): Promise<string> {
          const resolved = safePath(projectRoot, relativePath);
          return fs.promises.readFile(resolved, 'utf8');
        },
        async writeFile(relativePath: string, content: string): Promise<void> {
          const resolved = safePath(projectRoot, relativePath);
          await fs.promises.writeFile(resolved, content);
          modified = true;
        },
        async readFileLines(relativePath: string): Promise<string[]> {
          const content = await ctx.readFile(relativePath);
          return content.split('\n');
        },
      };

      const result = await handler(payload, ctx);
      return { result, reload: modified || sourceTools._modified };
    },

    /**
     * Dispatch a fire-and-forget event.  Unknown events are silently ignored.
     */
    handleEvent(name: string, data: any): void {
      const handler = hooks.events[name];
      if (!handler) return;
      const ctx = { projectRoot, config, broadcast } as ActionContext;
      try {
        handler(data, ctx);
      } catch (e: any) {
        console.error(`Event handler error [${name}]:`, e.message);
      }
    },
  };
}
