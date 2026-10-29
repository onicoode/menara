# Rencana pemindahan ke Godot 4.4

Acuan perilaku: game HTML5 di `proyek-gradle/game-src/` (v1.23). Tetap di repo sampai versi Godot setara.

Tahap:
1. [selesai] Kerangka proyek + `data/balance.json` (dump tower, senjata, malam, run) + autoload `Balance`.
2. Data lengkap: karakter, upgrade (UPG), musuh (WAVE/spawn), riset, kurva HPX, profil/simpan.
3. Inti pertempuran: dunia 2D, base, platform/crane, drone musuh, tower, proyektil, kritis.
4. Senjata pemain (utama + pasif), robot pekerja, pancingan, efek (api, setrum, slow-mo).
5. UI: bengkel, pilih run, HUD, kartu tower, hasil.
6. Menu Dev (setara vdev.js, DEV config di Resource).
7. Audio, ekspor Android AAB + GitHub Actions + Web (GitHub Pages) untuk uji di HP.

Uji lokal tanpa editor: `godot --headless --path godot --quit-after 3`.
