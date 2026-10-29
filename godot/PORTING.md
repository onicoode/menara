# Pemindahan ke Godot 4.4: status

Acuan perilaku: game HTML5 di `proyek-gradle/game-src/` (v1.23). Tetap di repo sebagai acuan.

| Tahap | Status |
|---|---|
| 1. Kerangka + data keseimbangan | selesai |
| 2. Data lengkap (karakter, upgrade, musuh, profil) | selesai, dicocokkan dengan `data/balance.json` (selftest) |
| 3. Inti pertempuran + gambar dunia | selesai; malam 1/2 dibandingkan dengan versi JS pada skenario sama (hasil setara) |
| 4. Senjata pemain, efek, tower | selesai |
| 5. UI (HUD, dock, menu, profil, bengkel, katalog tower, hasil, jeda/lanjut) | selesai |
| 6. Menu Dev | selesai (logika `dev.gd` + panel `devpanel.gd`) |
| 7. Audio, preset ekspor, CI, privasi | selesai (build AAB di CI belum dijalankan) |

## Belum setara dengan versi HTML5
- Demo hidup senjata di bengkel (`vdemo.js`) dan simulasi hidup tower di katalog (`vtower.js`): diganti pratinjau statis + tabel angka. Kotak "paling efektif melawan" di katalog tower belum ada.
- Latar bengkel bergaya workshop (`workshopBg`): memakai panel polos.
- Belum diuji di HP asli maupun di editor Godot dengan layar sungguhan; yang diuji: tes headless dan render perangkat lunak (xvfb + llvmpipe).
- Perbedaan kecil visual mungkin ada (font teks, anti-aliasing garis).
