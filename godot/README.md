# Menara Rongsok - versi Godot 4.4

Port penuh game HTML5 (`../proyek-gradle/game-src/`, acuan perilaku v1.23) ke Godot 4.4.1, dibuat agar bisa dirilis ke Play Store sebagai AAB.
Semua gambar digambar lewat kode (tanpa berkas gambar), semua suara disintesis lewat kode (tanpa berkas audio).

## Struktur
| Folder / berkas | Isi |
|---|---|
| `scripts/data.gd` (autoload `D`) | Semua tabel angka (tower, senjata, karakter, upgrade, gelombang). Harus identik dengan `data/balance.json`. |
| `scripts/prof.gd` (`Prof`) | Profil (3 slot), pengaturan, simpanan run, pembelian. |
| `scripts/dev.gd` (`Dev`) | Logika menu Dev/Balancing (Layer 1 per entitas, Layer 2 pengali global). |
| `scripts/icons.gd` (`Ic`), `data/icons.json` | Ikon piksel 16x16 (diekspor dari `mkIcon()` versi JS). |
| `scripts/audio.gd` (`Audio`) | Sintesis SFX + 3 loop musik (menu, siang, malam) saat start, di thread. |
| `scripts/sim_*.gd` | Simulasi: `sim_base` -> `sim_tower` -> `sim_update`. |
| `scripts/draw_*.gd` | Gambar: `draw_base` -> `draw_tower` -> `draw_scene` -> `game` (input, kamera). |
| `scripts/app.gd`, `hud.gd`, `card.gd`, `menus.gd`, `devpanel.gd` | UI dan alur layar. |
| `tests/` | Tes headless (`selftest`, `simtest`, `audiotest`, `playtest`, `inputtest`, `rendertest`). |
| `export_presets.cfg` | Preset Android AAB dan Web. |

## Menjalankan di PC
1. Pasang Godot 4.4.1 (standar, bukan .NET), buka folder `godot/` sebagai proyek, tekan F5.
2. Tombol: panah/A/D jalan, Atas/W/Spasi jetpack, E aura kejut, 1-4 kartu bangun (tahan), ` atau F2 menu Dev, Esc kembali.
3. Mouse meniru sentuhan (geser kiri/kanan untuk jalan, geser ke atas untuk terbang).

## Tes tanpa editor
```
godot --headless --path godot --import
godot --headless --path godot res://tests/selftest.tscn   # "SELFTEST OK"
godot --headless --path godot res://tests/simtest.tscn
godot --headless --path godot res://tests/audiotest.tscn
# dengan gambar (butuh xvfb): xvfb-run -a godot --path godot --rendering-driver opengl3 res://tests/rendertest.tscn
```

## Build
Lihat `.github/workflows/godot.yml`:
- **Web / GitHub Pages**: tiap push ke `main` yang menyentuh `godot/` -> tes -> ekspor Web -> publish. Buka di HP untuk uji cepat (aktifkan Pages: Settings -> Pages -> Source: GitHub Actions).
- **AAB bertanda tangan**: jalankan workflow manual (`Run workflow`, centang `build_aab`). Butuh secrets: `ANDROID_KEYSTORE_BASE64` (keystore upload dalam base64), `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`. Keystore TIDAK pernah dimasukkan ke repo.

## Play Store
- Gunakan Play App Signing; pakai keystore lama (`menara-rongsok-release.jks`) sebagai **kunci upload**.
- `package/unique_name` = `com.menararongsok.game` (sama dengan APK HTML5). Naikkan `version/code` di `export_presets.cfg` tiap rilis.
- Kebijakan privasi: `docs/privacy.html` (ikut terbit di GitHub Pages; tempel URL-nya di Play Console).
- Wajib isi: ikon 512 (`assets/icon-512.png`), feature graphic 1024x500, tangkapan layar, rating konten, formulir Data Safety (tidak ada data dikumpulkan).
