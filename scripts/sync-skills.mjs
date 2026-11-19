import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { includeSkillPath, skillFingerprint } from "./skill-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const home = homedir();
const candidates = new Map();
const sources = [
  [".opencode/skills", "OpenCode personal skills"],
  [".config/opencode/skills", "OpenCode config skills"],
  [".codex/plugins/cache/ponytail/ponytail/5.3.2/skills", "Ponytail plugin 5.3.2"],
];
for (const [relative, source] of sources) {
  const directory = join(home, relative);
  if (!existsSync(directory)) continue;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && existsSync(join(path, "SKILL.md"))) {
      candidates.set(entry.name, { path, source, origin: `~/${relative}/${entry.name}` });
    }
  }
}
const modern = join(home, ".codex/skills/modern-web-guidance");
if (existsSync(join(modern, "SKILL.md"))) {
  candidates.set("modern-web-guidance", { path: modern, source: "Codex personal skills", origin: "~/.codex/skills/modern-web-guidance" });
}
for (const required of ["ui-ux-pro-max", "ponytail"]) {
  if (!candidates.has(required)) throw new Error(`Skill lokal tidak ditemukan: ${required}`);
}
const manifest = [];
for (const [name, source] of [...candidates.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const destination = join(root, ".agents/skills", name);
  const fingerprint = skillFingerprint(source.path);
  if (existsSync(destination)) {
    if (skillFingerprint(destination).sha256 !== fingerprint.sha256) {
      throw new Error(`Skill ${name} berbeda. Tinjau perubahan lokal/sumber sebelum memperbarui; tidak ditimpa otomatis.`);
    }
  } else {
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source.path, destination, { recursive: true, dereference: true, filter: includeSkillPath });
  }
  if (skillFingerprint(destination).sha256 !== fingerprint.sha256) throw new Error(`Copy integrity failed: ${name}`);
  manifest.push({ name, source: source.source, origin: source.origin, path: `.agents/skills/${name}`, ...fingerprint });
}
writeFileSync(join(root, ".agents/skills-manifest.json"), JSON.stringify({ version: 1, skills: manifest }, null, 2) + "\n");
console.log(`Tersedia ${manifest.length} skill project; isi salinan diverifikasi dengan SHA-256.`);
