/**
 * Tests for threads container rules - markdown-it rendering of ::: threads blocks
 *
 * Run: node packages/plugins/threads/tests/containers.test.js
 *
 * @copyright Copyright (c) 2026 Saulo Vallory
 * @license MIT
 */

import MarkdownIt from 'markdown-it';
import { setup as setupContainers } from '../dist/plugin/containers.js';

let passed = 0;
let total = 0;

function assert(condition, msg) {
  total++;
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  passed++;
  console.log(`  PASS: ${msg}`);
}

function assertContains(html, substring, msg) {
  assert(html.includes(substring), `${msg}\n    expected to contain: ${substring}\n    actual: ${html.slice(0, 500)}`);
}

function assertNotContains(html, substring, msg) {
  assert(!html.includes(substring), `${msg}\n    expected NOT to contain: ${substring}\n    actual: ${html.slice(0, 500)}`);
}

function createMd() {
  const md = MarkdownIt({ html: true });
  setupContainers(md);
  return md;
}

// ─── Test 1: Full threads block renders with correct structure ───

console.log('\nTest 1: Full threads block renders correct HTML structure');

const md1 = createMd();
const fullInput = `::: threads
  ::: thread t-abc123
    ::: comment "alice" "2026-03-07"
      This is the first comment
    :::
  :::
:::
`;

const html1 = md1.render(fullInput);

assertContains(html1, 'class="threads-sidebar"', 'threads wrapper has correct class');
assertContains(html1, 'class="threads-thread"', 'thread has correct class');
assertContains(html1, 'data-thread-id="t-abc123"', 'thread has data-thread-id');
assertContains(html1, 'class="threads-comment"', 'comment has correct class');
assertContains(html1, 'data-author="alice"', 'comment has data-author');
assertContains(html1, 'data-date="2026-03-07"', 'comment has data-date');
assertContains(html1, 'class="threads-comment__meta"', 'comment meta renders');
assertContains(html1, 'class="threads-comment__body"', 'comment body wrapper renders');
assertContains(html1, 'This is the first comment', 'comment body content renders');

// ─── Test 2: Thread ID attribute is present ───

console.log('\nTest 2: Thread id attribute');

const md2 = createMd();
const idInput = `::: threads
  ::: thread t-xyz789
    ::: comment "bob" "2026-01-01"
      Test
    :::
  :::
:::
`;

const html2 = md2.render(idInput);
assertContains(html2, 'data-thread-id="t-xyz789"', 'thread id attribute is present and correct');

// ─── Test 3: Resolved thread has resolved class ───

console.log('\nTest 3: Resolved thread has resolved class');

const md3 = createMd();
const resolvedInput = `::: threads
  ::: thread t-res001 resolved "charlie" "2026-03-08"
    ::: comment "charlie" "2026-03-08"
      Fixed the typo
    :::
  :::
:::
`;

const html3 = md3.render(resolvedInput);
assertContains(html3, 'threads-thread--resolved', 'resolved thread has resolved class');
assertContains(html3, 'data-thread-id="t-res001"', 'resolved thread has id attribute');

// ─── Test 4: Comment has data-author and data-date ───

console.log('\nTest 4: Comment data attributes');

const md4 = createMd();
const commentInput = `::: threads
  ::: thread t-c001
    ::: comment "dave" "2026-05-15"
      Comment with attributes
    :::
  :::
:::
`;

const html4 = md4.render(commentInput);
assertContains(html4, 'data-author="dave"', 'comment has data-author');
assertContains(html4, 'data-date="2026-05-15"', 'comment has data-date');

// ─── Test 5: Comment meta header renders author and date ───

console.log('\nTest 5: Comment meta header');

const md5 = createMd();
const metaInput = `::: threads
  ::: thread t-m001
    ::: comment "eve" "2026-06-20"
      Testing meta
    :::
  :::
:::
`;

const html5 = md5.render(metaInput);
assertContains(html5, '<strong>eve</strong>', 'meta includes author in strong tag');
assertContains(html5, '2026-06-20', 'meta includes date');

// ─── Test 6: Reactions container renders ───

console.log('\nTest 6: Reactions container');

const md6 = createMd();
const reactionsInput = `::: threads
  ::: thread t-r001
    ::: comment "frank" "2026-07-01"
      Comment with reactions

      ::: reactions
        - 👍 alice, bob
        - 🎉 charlie
      :::
    :::
  :::
:::
`;

const html6 = md6.render(reactionsInput);
assertContains(html6, 'class="threads-reactions"', 'reactions container has correct class');

// ─── Test 7: Multiple threads render ───

console.log('\nTest 7: Multiple threads');

const md7 = createMd();
const multiInput = `::: threads
  ::: thread t-first
    ::: comment "alice" "2026-01-01"
      First thread
    :::
  :::

  ::: thread t-second
    ::: comment "bob" "2026-01-02"
      Second thread
    :::
  :::
:::
`;

const html7 = md7.render(multiInput);
assertContains(html7, 'data-thread-id="t-first"', 'first thread renders');
assertContains(html7, 'data-thread-id="t-second"', 'second thread renders');

// ─── Test 8: Unresolved thread does NOT have resolved class ───

console.log('\nTest 8: Unresolved thread lacks resolved class');

const md8 = createMd();
const unresolvedInput = `::: threads
  ::: thread t-unres
    ::: comment "alice" "2026-01-01"
      Not resolved
    :::
  :::
:::
`;

const html8 = md8.render(unresolvedInput);
assertContains(html8, 'data-thread-id="t-unres"', 'unresolved thread renders');
assertNotContains(html8, 'threads-thread--resolved', 'unresolved thread does not have resolved class');

// ─── Test 9: Edited comment has edited data attribute ───

console.log('\nTest 9: Edited comment');

const md9 = createMd();
const editedInput = `::: threads
  ::: thread t-ed01
    ::: comment "alice" "2026-01-01" edited "2026-01-02"
      Edited comment
    :::
  :::
:::
`;

const html9 = md9.render(editedInput);
assertContains(html9, 'data-edited="2026-01-02"', 'edited comment has data-edited attribute');

// ─── Test 10: Comment body is rendered as markdown ───

console.log('\nTest 10: Comment body rendered as markdown');

const md10 = createMd();
const markdownBodyInput = `::: threads
  ::: thread t-md01
    ::: comment "alice" "2026-01-01"
      This has **bold** and *italic* text
    :::
  :::
:::
`;

const html10 = md10.render(markdownBodyInput);
assertContains(html10, '<strong>bold</strong>', 'bold markdown renders in comment body');
assertContains(html10, '<em>italic</em>', 'italic markdown renders in comment body');

// ─── Test 11: Comment body escapes raw HTML while preserving markdown ───

console.log('\nTest 11: Comment body escapes raw HTML');

const md11 = createMd();
const rawHtmlInput = `::: threads
  ::: thread t-html01
    ::: comment "alice" "2026-01-01"
      <span data-test="raw">raw html</span>
      This still has **bold** text
    :::
  :::
:::
`;

const html11 = md11.render(rawHtmlInput);
assert(!html11.includes('<span data-test="raw">raw html</span>'), 'raw HTML is not emitted as an element');
assert(html11.includes('&lt;span') || html11.includes('&amp;lt;span'), 'raw HTML tag marker is escaped');
assertContains(html11, '<strong>bold</strong>', 'markdown still renders in escaped comment body');

// ─── Test 12: Empty threads block ───

console.log('\nTest 12: Empty threads block');

const md12 = createMd();
const emptyInput = `::: threads
:::
`;

const html12 = md12.render(emptyInput);
assertContains(html12, 'class="threads-sidebar"', 'empty threads wrapper still renders');

// ─── Test 13: Comment with ID (new serialized format) ───

console.log('\nTest 13: Comment with ID in info string');

const md13 = createMd();
const commentWithIdInput = `::: threads
  ::: thread t-id01
    ::: comment c-abc12345 "alice" "2026-03-07"
      Comment with persistent ID
    :::
  :::
:::
`;

const html13 = md13.render(commentWithIdInput);
assertContains(html13, 'data-comment-id="c-abc12345"', 'comment has data-comment-id from new format');
assertContains(html13, 'data-author="alice"', 'comment has correct author from new format');
assertContains(html13, 'data-date="2026-03-07"', 'comment has correct date from new format');

// ─── Test 14: Comment with ID and edited (new serialized format) ───

console.log('\nTest 14: Comment with ID and edited');

const md14 = createMd();
const commentWithIdEditedInput = `::: threads
  ::: thread t-id02
    ::: comment c-def67890 "bob" "2026-03-07" edited "2026-03-08"
      Edited comment with ID
    :::
  :::
:::
`;

const html14 = md14.render(commentWithIdEditedInput);
assertContains(html14, 'data-comment-id="c-def67890"', 'edited comment has data-comment-id');
assertContains(html14, 'data-author="bob"', 'edited comment has correct author');
assertContains(html14, 'data-edited="2026-03-08"', 'edited comment has data-edited');

// ─── Done ───

console.log(`\n✓ All ${passed}/${total} containers tests passed.\n`);
