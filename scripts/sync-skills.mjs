import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { includeSkillPath, skillFingerprint } from "./skill-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const home = homedir();
const candidates = new Map();
const excludedSkills = new Set([
  "banner-design",
  "slides",
  "brand",
  "design",
  "ponytail-gain",
  "ponytail-help",
]);
const sources = [
  [".opencode/skills", "OpenCode personal skills"],
  [".config/opencode/skills", "OpenCode config skills"],
  [".codex/plugins/cache/ponytail/ponytail/5.3.2/skills", "Ponytail plugin 5.3.2"],
  [".codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills", "Superpowers plugin 7.0.1"],
];
for (const [relative, source] of sources) {
  const directory = join(home, relative);
  if (!existsSync(directory)) continue;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excludedSkills.has(entry.name)) continue;
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
const manifestPath = join(root, ".agents/skills-manifest.json");
// Keep installed records when their optional source is absent on another computer.
const manifest = new Map(
  existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8")).skills
        .filter((skill) => !excludedSkills.has(skill.name))
        .map((skill) => [skill.name, skill])
    : [],
);
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
  manifest.set(name, { name, source: source.source, origin: source.origin, path: `.agents/skills/${name}`, ...fingerprint });
}
const skills = [...manifest.values()].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(manifestPath, JSON.stringify({ version: 1, skills }, null, 2) + "\n");
console.log(`Tersedia ${skills.length} skill project; jalankan skills:verify untuk memeriksa seluruh salinan.`);
