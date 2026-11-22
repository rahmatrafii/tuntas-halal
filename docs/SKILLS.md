# Skill lokal project

29 skill tersedia: 14 skill personal yang dipertahankan dan 15 skill Superpowers 7.0.1. Pada 21 November 2026, enam skill dikeluarkan sesuai instruksi pengguna. File pendukung (script, data, referensi, dan asset yang ada di direktori sumber) ikut disalin; bukan hanya `SKILL.md`. Tidak ada symlink ke folder pengguna. Skill sistem/plugin lain yang tidak terkait tidak disalin.

## Daftar

| Kelompok                              | Skill                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| UI/UX dan frontend                    | `ui-ux-pro-max`, `frontend-design`, `design-taste-frontend`, `anti-slop-design`, `ui-styling`, `micro-interactions`   |
| Sistem desain                        | `design-system` |
| Coding/review                         | `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `codebase-design` |
| Panduan web dan gaya respons opsional | `modern-web-guidance`, `caveman`                                                                                      |
| Superpowers: perencanaan dan eksekusi | `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents` |
| Superpowers: pengujian dan review | `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review` |
| Superpowers: Git dan sistem skill | `using-git-worktrees`, `finishing-a-development-branch`, `using-superpowers`, `writing-skills`, `diagnosing-superpowers` |

Ponytail diambil dari plugin lokal versi 5.3.2 (lebih lengkap daripada tiga skill OpenCode yang duplikat). UI UX Pro Max berasal dari `~/.opencode/skills/ui-ux-pro-max`. Asal setiap salinan dan hash seluruh isi ada di [manifest](../.agents/skills-manifest.json).

## Skill yang dikeluarkan dari project

`banner-design`, `slides`, `brand`, `design`, `ponytail-gain`, dan `ponytail-help` dikeluarkan dari `.agents/skills` dan manifest. Keenam nama dikecualikan dalam `scripts/sync-skills.mjs` agar tidak disalin kembali saat sync. Instalasi personal tetap disimpan. Salinan project diarsipkan ke `~/.codex/skill-archives/sihalal/2026-11-21-excluded-skills` dan dapat dipulihkan bila diperlukan.

## Superpowers

Plugin `superpowers@openai-curated-remote` versi 7.0.1 terpasang dan diaktifkan untuk pengguna Windows ini melalui `codex plugin add superpowers@openai-curated-remote --json`. Lokasi paket: `~/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1`. Pemeriksaan instalasi: `codex plugin list --json`.

Skill project dipasang menggunakan Skill Installer dari [obra/superpowers v7.0.1](https://github.com/obra/superpowers/tree/v7.0.1), commit `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`, lalu dilengkapi metadata `agents/openai.yaml` dari paket marketplace. Seluruh 15 direktori project identik dengan direktori skill paket terpasang. [Lisensi MIT](../.agents/licenses/superpowers-MIT.txt) disertakan.

Skill lokal tersedia pada giliran berikutnya; mulai chat baru bila daftar skill belum diperbarui. Contoh prompt:

```text
Gunakan systematic-debugging untuk mencari penyebab draf hilang setelah reload.
Baca AGENTS.md dan PRD dahulu. Pertahankan frontend dengan data dummy.
```

Untuk memilih file secara eksplisit, rujuk `.agents/skills/systematic-debugging/SKILL.md`. Pilih skill yang sesuai dengan pekerjaan; pemasangan seluruh paket tidak berarti menjalankan seluruh alurnya untuk setiap perubahan. Instruksi pengguna, batas frontend dummy, dan kebutuhan PRD tetap berlaku. Pemasangan ini tidak menjalankan skill pengembangan, membuat worktree, commit, atau deployment.

## Pemakaian lintas sesi

Pemilihan skill otomatis diwajibkan oleh [AGENTS.md](../AGENTS.md) untuk setiap pekerjaan coding/development pada repository ini. Pengguna cukup menyampaikan hasil yang diinginkan; tidak perlu menulis `Gunakan skill ...`. Agent membaca skill yang relevan sebelum bekerja, menyebutkan pilihan dan tujuannya singkat, serta menilai ulang saat tahap berubah. Contoh prompt eksplisit di dokumen ini tetap boleh dipakai untuk mengarahkan workflow tertentu.

Pilih seperlunya: debugging untuk bug, brainstorming/perencanaan untuk fitur baru, pengujian untuk implementasi, panduan frontend untuk UI, dan verifikasi sebelum klaim selesai. Jangan menjalankan seluruh paket untuk setiap tugas. Aturan ini berlaku pada project ini dan agent yang membaca instruksinya; tidak memasang pengaturan global bagi semua project atau aplikasi AI lain.

Skill repository berada di `.agents/skills/<nama>/SKILL.md`. Agent yang mendukung discovery direktori ini dapat memuatnya pada sesi berikutnya. Untuk tool lain, rujuk file secara eksplisit dari prompt/AGENTS.md; penyalinan ini tidak memasang plugin atau hook ke aplikasi tersebut.

```text
Baca .agents/skills/ponytail/SKILL.md dan ikuti untuk task ini.
Untuk UI, baca .agents/skills/ui-ux-pro-max/SKILL.md.
```

Contoh pencarian UI UX Pro Max dari root project (Python 3 tersedia di laptop ini):

```powershell
$env:PYTHONUTF8="1"
python .agents/skills/ui-ux-pro-max/scripts/search.py "task queue mobile" --domain ux
```

Ikuti petunjuk skill menggunakan **path project**, walau contoh aslinya memakai path home. Jangan jalankan script skill sebelum memahami dependensi dan tujuannya. Pilih skill berdasarkan task; gunakan `caveman` dan panduan animasi ketika diperlukan. Utamakan PRD/aturan pengguna bila panduannya bertentangan.

## Verifikasi dan sinkronisasi

```powershell
npm run skills:verify
npm run skills:sync
```

`verify` menghitung ulang SHA-256 seluruh file dan jumlah file tiap skill, tidak bergantung pada folder sumber laptop. `sync` membaca lokasi instalasi lokal yang terdokumentasi dalam script, termasuk Superpowers 7.0.1, menambah skill yang belum ada, dan tidak menimpa salinan yang berbeda. Catatan manifest tetap dipertahankan jika sumber opsional tidak tersedia. Jika sumber atau salinan berubah, tinjau diff lalu perbarui salinan/manifest dengan sengaja. Tidak perlu menjalankan sync setelah clone; salinan sudah disertakan di repository.

Jangan mengubah isi skill hanya untuk memenuhi lint aplikasi. `.agents` dikecualikan dari lint/typecheck aplikasi. Pertahankan attribution/license yang sudah ada; dokumentasi sumber tetap milik pembuatnya.
