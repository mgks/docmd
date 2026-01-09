// Source file from the docmd project — https://github.com/docmd-io/docmd

// Core build function (Node.js environment)
const { buildSite } = require('./commands/build');

// Live Editor bundler
const { build: buildLive } = require('./commands/live');

module.exports = {
  build: buildSite,
  buildLive
};