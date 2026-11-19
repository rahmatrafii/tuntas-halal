import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { skillFingerprint } from "./skill-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, ".agents/skills-manifest.json"), "utf8"));
for (const skill of manifest.skills) {
  const result = skillFingerprint(join(root, skill.path));
  if (result.sha256 !== skill.sha256 || result.fileCount !== skill.fileCount) {
    throw new Error(`Integritas skill berubah: ${skill.name}. Tinjau dan perbarui manifest secara sadar.`);
  }
}
console.log(`${manifest.skills.length} skill lolos verifikasi integritas.`);
