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

export function defineConfig(config: any): any {
  return config;
}

export { buildSite as build } from './commands/build.js';
export { startDevServer as dev } from './commands/dev.js';
export { buildLive } from './commands/live.js';

// Action dispatcher and source editing tools
export { createActionDispatcher, safePath } from './utils/action-dispatcher.js';
export { createSourceTools } from './utils/source-tools.js';

// Plugin API types
export type {
  ActionContext,
  ActionHandler,
  EventHandler,
  DispatchResult,
  PluginModule,
  SourceTools,
  BlockInfo,
  InlineSegment,
  TextLocation,
} from './types.js';