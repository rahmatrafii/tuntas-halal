# Skill lokal project

20 skill disalin dari instalasi personal yang ditemukan di laptop. File pendukung (script, data, referensi, dan asset yang ada di direktori sumber) ikut disalin; bukan hanya `SKILL.md`. Tidak ada symlink ke folder pengguna. Skill sistem/plugin lain yang tidak terkait tidak disalin.

## Daftar

| Kelompok                              | Skill                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| UI/UX dan frontend                    | `ui-ux-pro-max`, `frontend-design`, `design-taste-frontend`, `anti-slop-design`, `ui-styling`, `micro-interactions`   |
| Sistem desain dan materi              | `design`, `design-system`, `brand`, `banner-design`, `slides`                                                         |
| Coding/review                         | `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `codebase-design` |
| Panduan web dan gaya respons opsional | `modern-web-guidance`, `caveman`                                                                                      |

Ponytail diambil dari plugin lokal versi 5.3.2 (lebih lengkap daripada tiga skill OpenCode yang duplikat). UI UX Pro Max berasal dari `~/.opencode/skills/ui-ux-pro-max`. Asal setiap salinan dan hash seluruh isi ada di [manifest](../.agents/skills-manifest.json).

## Pemakaian lintas sesi

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

Ikuti petunjuk skill menggunakan **path project**, walau contoh aslinya memakai path home. Jangan jalankan script skill sebelum memahami dependensi dan tujuannya. Skill tersedia bukan berarti semuanya harus diterapkan; `caveman`, presentasi, branding, dan animasi tidak aktif otomatis. Pilih berdasarkan task dan utamakan PRD/aturan pengguna bila panduannya bertentangan.

## Verifikasi dan sinkronisasi

```powershell
npm run skills:verify
npm run skills:sync
```

`verify` menghitung ulang SHA-256 seluruh file dan jumlah file tiap skill, tidak bergantung pada folder sumber laptop. `sync` membaca lokasi instalasi lokal yang terdokumentasi dalam script, menambah skill yang belum ada, dan tidak menimpa salinan yang berbeda. Jika sumber atau salinan berubah, tinjau diff lalu perbarui salinan/manifest dengan sengaja. Tidak perlu menjalankan sync setelah clone; salinan sudah disertakan di repository.

Jangan mengubah isi skill hanya untuk memenuhi lint aplikasi. `.agents` dikecualikan dari lint/typecheck aplikasi. Pertahankan attribution/license yang sudah ada; dokumentasi sumber tetap milik pembuatnya.
