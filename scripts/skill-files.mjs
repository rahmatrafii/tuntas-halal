import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ignored = new Set([".git", "node_modules", "__pycache__", ".DS_Store"]);

export function includeSkillPath(path) {
  const name = path.split(/[\\/]/).at(-1);
  return !ignored.has(name) && !name.endsWith(".pyc");
}

export function skillFingerprint(root) {
  const files = [];
  function walk(directory, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!includeSkillPath(entry.name)) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(directory, entry.name);
      if (entry.isDirectory()) walk(full, relative);
      else if (entry.isFile()) files.push({ relative, full });
      else throw new Error(`Unsupported skill entry: ${full}`);
    }
  }
  walk(root);
  const hash = createHash("sha256");
  for (const { relative, full } of files.sort((a, b) => a.relative.localeCompare(b.relative, "en"))) {
    hash.update(relative).update("\0").update(readFileSync(full)).update("\0");
  }
  return { fileCount: files.length, sha256: hash.digest("hex") };
}
