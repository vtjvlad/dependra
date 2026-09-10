/**
 * Backup sessions under .dependra/backup/<sessionId>/.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

/**
 * @returns {string}
 */
function newSessionId() {
  const t = new Date().toISOString().replace(/[:.]/g, "-");
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}_${r}`;
}

/**
 * @param {string} projectRoot
 * @returns {{ sessionId: string, dir: string, createdAt: string }}
 */
export function createBackupSession(projectRoot) {
  const sessionId = newSessionId();
  const createdAt = new Date().toISOString();
  const preferred = join(projectRoot, ".dependra", "backup", sessionId);
  let dir = preferred;
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    dir = join(tmpdir(), "dependra-backup", sessionId);
    mkdirSync(dir, { recursive: true });
  }
  return { sessionId, dir, createdAt };
}

/**
 * @param {{ sessionId: string, dir: string, createdAt: string }} session
 * @param {string} projectRoot
 * @param {import('./types.js').Change[]} changes
 * @param {object} [meta]
 */
export function writeSessionManifest(session, projectRoot, changes, meta = {}) {
  const files = [];
  for (const c of changes) {
    if (c.kind === "update" || c.kind === "delete" || c.kind === "rename") {
      if (c.path && existsSync(c.path)) {
        const rel = relative(projectRoot, c.path).replace(/\\/g, "/");
        const dest = join(session.dir, "files", rel);
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(c.path, dest);
        files.push({ path: c.path, rel, kind: c.kind, changeId: c.id });
      }
    } else if (c.kind === "create") {
      files.push({ path: c.path, rel: null, kind: "create", changeId: c.id });
    } else if (c.kind === "exec") {
      files.push({
        path: c.path,
        rel: null,
        kind: "exec",
        changeId: c.id,
        details: c.details ?? null,
      });
    }
  }
  const manifest = {
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    projectRoot,
    files,
    meta,
  };
  writeFileSync(
    join(session.dir, "session.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(dirname(session.dir), "LAST"),
    `${session.sessionId}\n`,
    "utf8",
  );
  return manifest;
}

/**
 * @param {string} projectRoot
 * @returns {string}
 */
export function backupRoot(projectRoot) {
  return join(projectRoot, ".dependra", "backup");
}

/**
 * @param {string} projectRoot
 * @param {string|null} [sessionId]
 * @returns {{ sessionId: string, dir: string, manifest: object }|null}
 */
export function loadBackupSession(projectRoot, sessionId = null) {
  const root = backupRoot(projectRoot);
  let id = sessionId;
  if (!id) {
    const lastPath = join(root, "LAST");
    if (!existsSync(lastPath)) {
      const tmpLast = join(tmpdir(), "dependra-backup", "LAST");
      if (existsSync(tmpLast)) {
        id = readFileSync(tmpLast, "utf8").trim();
        const dir = join(tmpdir(), "dependra-backup", id);
        const manPath = join(dir, "session.json");
        if (!existsSync(manPath)) return null;
        return {
          sessionId: id,
          dir,
          manifest: JSON.parse(readFileSync(manPath, "utf8")),
        };
      }
      return null;
    }
    id = readFileSync(lastPath, "utf8").trim();
  }
  let dir = join(root, id);
  let manPath = join(dir, "session.json");
  if (!existsSync(manPath)) {
    dir = join(tmpdir(), "dependra-backup", id);
    manPath = join(dir, "session.json");
  }
  if (!existsSync(manPath)) return null;
  return {
    sessionId: id,
    dir,
    manifest: JSON.parse(readFileSync(manPath, "utf8")),
  };
}

/**
 * @param {string} projectRoot
 * @returns {string[]}
 */
export function listBackupSessions(projectRoot) {
  const root = backupRoot(projectRoot);
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((n) => n !== "LAST" && existsSync(join(root, n, "session.json")));
}
