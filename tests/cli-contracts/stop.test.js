/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * M-11 — `docmd stop` sends SIGTERM first and waits for graceful
 * shutdown before escalating to SIGKILL.
 *
 * Before the fix, `docmd stop` either killed the dev server
 * immediately (SIGKILL on first failure) or relied on SIGTERM
 * landing without checking whether the dev server had time to run
 * its cleanup handlers. After the fix, the dev server installs a
 * graceful-shutdown handler on SIGTERM (same as SIGINT) and `docmd
 * stop` polls for process exit before escalating.
 *
 * Run: `node tests/runner.js --only=stop`
 * --------------------------------------------------------------------
 */

import {
  setup,
  writeFile,
  runTestFile
} from '../shared.js';
import { spawn, execSync } from 'node:child_process';
import { waitForExit } from '../../packages/core/dist/commands/stop.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    failures.push(message);
    console.log(`    ❌ ${message}`);
  } else {
    passed++;
    console.log(`    ✅ ${message}`);
  }
}

export const test = runTestFile({
  name: 'Stop sends SIGTERM and waits for graceful exit (M-11)',
  emoji: '🛑',
  run: async () => {

    // waitForExit returns true when the target process exits within
    // the grace window. We spawn `sleep 30`, send SIGTERM after a
    // short delay, and assert waitForExit returns true within 1s.
    {
      const child = spawn('sleep', ['30'], { stdio: 'pipe' });
      setTimeout(() => {
        try { process.kill(child.pid, 'SIGTERM'); } catch { /* ignore */ }
      }, 50);
      const exited = await waitForExit(child.pid, 2000);
      assert(exited, 'M-11: waitForExit returns true after SIGTERM kills a sleep child');
      try { process.kill(child.pid, 'SIGKILL'); } catch { /* ignore */ }
    }

    // waitForExit returns false when the target process is still
    // alive at the timeout. Spawn `sleep 30`, do NOT signal it,
    // assert waitForExit returns false within 300ms.
    // (Use a short timeout to keep the test fast.)
    {
      const child = spawn('sleep', ['30'], { stdio: 'pipe' });
      const exited = await waitForExit(child.pid, 300);
      assert(exited === false, 'M-11: waitForExit returns false when process is still alive at timeout');
      try { process.kill(child.pid, 'SIGKILL'); } catch { /* ignore */ }
    }

    // waitForExit returns true immediately for a pid that does not
    // exist (ESRCH). No process spawned.
    {
      // Pick a pid that's very unlikely to exist. Use a large number.
      const fakePid = 999999;
      const exited = await waitForExit(fakePid, 1000);
      assert(exited, 'M-11: waitForExit returns true for a non-existent pid (ESRCH)');
    }
  }
});

export const results = {
  get passed() { return passed; },
  get failed() { return failed; },
  get failures() { return [...failures]; }
};