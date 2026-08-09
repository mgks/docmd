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

import common from './common-containers.js';
export { createDepthTrackingContainer } from './common-containers.js';
import tabs from './tabs.js';
import steps from './steps.js';
import changelog from './changelog.js';
import buttons from './buttons.js';
import basics from './basics.js';
import embed from './embed.js';
import hero from './hero.js';
import tags from './tags.js';
import tooltip from './tooltip.js';

const FEATURES = [basics, buttons, tags, tooltip, embed, common, tabs, steps, changelog, hero];

function registerFeatures(md) {
  FEATURES.forEach(feature => {
    if (feature.setup) feature.setup(md);
  });
}

export { registerFeatures };