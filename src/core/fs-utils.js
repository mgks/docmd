// Source file from the docmd project — https://github.com/docmd-io/docmd

const fs = require('node:fs/promises');
const path = require('node:path');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function remove(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

async function copy(src, dest) {
  await fs.cp(src, dest, { recursive: true });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(file, object, options = {}) {
  const content = JSON.stringify(object, null, options.spaces || 2);
  await fs.writeFile(file, content, 'utf8');
}

module.exports = {
  ...fs,
  ensureDir,
  remove,
  copy,
  pathExists: exists,
  exists,
  writeJson
};