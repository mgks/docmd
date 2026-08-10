import path from 'node:path';

/**
 * Normalises a file path to use forward slashes.
 */
export function normalisePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Brand applied to strings that originate from user-controlled input
 * (config values, frontmatter, CLI flags, URL params, plugin returns).
 *
 * A value typed as UserPath has NOT been validated against any project
 * boundary. Callers MUST resolve it through safePath(root, ...) before
 * passing the value to any fs.* / fs.promises.* call.
 */
export type UserPath = string & { readonly __docmd_user_path: true };

/**
 * Mark a raw string as UserPath. This is the trust boundary: every value
 * that crosses into a UserPath position must originate from user-controlled
 * data, not from internal constants. Once cast, downstream code knows it
 * must be resolved via safePath() before any fs.* call.
 */
export function asUserPath(value: string): UserPath {
  return value as UserPath;
}

/**
 * Resolve a relative path against the project root, rejecting any path
 * that would escape the root directory. The returned value is a plain
 * absolute path string, safe to pass to fs.* APIs.
 */
export function safePath(root: string, relativePath: string): string {
  const normRoot = path.resolve(root);
  const resolved = path.resolve(normRoot, relativePath);
  const prefix = normRoot.endsWith(path.sep) ? normRoot : normRoot + path.sep;
  if (!resolved.startsWith(prefix) && resolved !== normRoot) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return resolved;
}