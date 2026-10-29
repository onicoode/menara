# Menara Rongsok: catatan untuk melanjutkan di chat baru

Versi terakhir: artefak v53, APK v1.23 (versionCode 24).
Artefak (URL tetap, kirim ke Claude agar di-update di tempat yang sama):
https://claude.ai/artifact/CYGihzegiuamKnbFYoYUnH

## Isi paket
- proyek-gradle/game-src/ : sumber game (va.js vaud.js vb.js vt.js vm.js vc.js vd.js vu.js + vh.html). Urutan gabung: va, vaud, vb, vt, vm, vc, vd, vdemo, vtower, vdev, vu (satu closure IIFE).
- proyek-gradle/tools/make_html.sh : menggabungkan jadi index.html satu file.
- apktool-src/ : proyek APK (smali MainActivity + AppBridge, resource, assets/index.html). Dibangun tanpa Android SDK.
- kunci/ : menara-rongsok-release.jks + keystore-info.txt (RAHASIA, sidik SHA-256 ef7c43f7...df4b0). WAJIB kunci yang sama agar APK baru bisa menimpa yang lama.

## Cara membangun APK baru (Claude yang menjalankan; bisa lewat skill /handoffer-game-apk)
1. Salin game-src terbaru, jalankan tools/make_html.sh, salin hasil app/src/main/assets/index.html ke apktool-src/assets/index.html.
2. Naikkan versionCode/versionName di apktool-src/apktool.yml dan proyek-gradle/app/build.gradle.
3. java -jar apktool.jar b apktool-src -o unsigned.apk  (apktool 2.10.0 dari GitHub releases; aapt2 dari paket npm/maven jika perlu)
4. Tanda tangani dengan uber-apk-signer 1.3.0: --ks kunci/menara-rongsok-release.jks --ksAlias menararongsok --ksPass <password> --ksKeyPass <password> --allowResign
5. Cek: aapt2 dump badging; sidik harus sama.

## Aturan desain dari pemilik (jangan dilanggar)
- Tanpa teks tutorial/info di layar. UI gaya piksel (tanpa gradasi halus/sudut bulat), pencahayaan tetap halus realistis. Pengecualian yang diminta pemilik: teks komik CRITICAL HIT!! memakai halftone.
- Musuh tangguh, game tetap sulit. Respons dalam bahasa Indonesia, ringkas, dengan catatan jujur (APK belum diuji di HP asli).
- Kemajuan permanen disimpan per profil (localStorage mr_prof), pengaturan mr_set, resume mr_run_<indeks profil>.
- Uji dengan Playwright headless memakai build debug yang mengekspos window.__dbg (lihat ybuild.sh di folder kerja lama; cukup tambahkan ekspor sendiri bila perlu).

## Riwayat lama (dipadatkan)
- v36/1.7: robot pekerja jangkauan 280; upgrade 'Jet peredam' (JETF); senjata pasif Katana; terbakar (ignite/d.burn); Tesla menyetrum (shock); pancingan maks 2 bersamaan/4 per hari (S.lq, LUREMAX); antrian riset (S.res.q, RQMAX).
- v37/1.8: aura kejut hemat batre (30% di Lv 5); katana lebih heboh + suara; tower hancur jadi rongsokan (t.ruin) dan diperbaiki seharga 1/3 total; pekerja maks 16; dock 2 baris dengan nama + latar bawah tanah; demo senjata di bengkel (vdemo.js).
- v38/1.9: dock 40% lebih tinggi; bar slot bengkel horizontal drag; tabel statistik; sfx unik tiap senjata (AU.wpg, nama x_*); kritis berdasar ketinggian (critChance, PLY); koin ekstra berdasar jarak dari base; slow-motion + zoom saat kill kritis (S.slow, slowE()).
- v39/1.10: audio ditangguhkan saat minimize (mrBg, MainActivity onPause/onStop/onDestroy); dock snappy; antrian riset bisa dibatalkan; kritis 2x + teks komik; dua crane (kanan platform 1, kiri platform 2); bengkel bergaya workshop + katalog tower (vtower.js).
- v40/1.11: platform kiri punya kontrol sendiri; zoom kritis 1.25x; tower didesain ulang Lv 1-9 (TY dibuat dengan ramp), tipe baru Gatling dan Jitu; riset 'ball'; batas level tower = 3 x level core (towerCap()); core makin canggih per level.
- v41/1.12: crane kiri mandiri (kontrol, platform, upgrade, CR2), area aman bersama CRCLEAR=84 (c2lim), kritis 0-20% menurut ketinggian player (CRIT), kritis tak-bunuh hanya teks, slow-mo 0.5 dtk; tower dibuka di bengkel dengan koin (prof().tw, TY.uc, riset tinggal shield/slow); visual per level (tierCol/projLook/drawTowerStyle); dok maks 2 baris + paginasi paged().
- v42/1.13: preview tower berskala nyata + musuh paling efektif (TWBEST), penanda tower terjangkau (.can), tombol pancing besar kanan atas, sfx kartu kecil, efek regenerate (fx.plus), senjata utama x3.4 dengan keunikan per karakter (gema rail, bom susulan nade, dll).

## Perubahan v43 / APK 1.14 (versionCode 15)
- Plus hijau regenerate dikurangi (tiap .32 dtk) dan dikecilkan (5x5 px).
- Pilih durasi run setelah tombol Main di bengkel: layar #run (showRun di vu.js), RUNS di vm.js: Short 5 malam, Medium 10, Long 15. S.run={len} (0 = tanpa batas untuk save lama). start(len). Selesai (newDay: s.day-1>=len) memanggil onWin(): koin malam + bonus runBonus = coinsFor(n)*f + b (f .25/.6/1.2, b 10/40/100: 25/142/496), layar hasil trofi + chip bonus. Kalah/menyerah: tanpa bonus. HUD hari tampil 'n/len'.
- Kurva kesulitan baru di waveInfo (va.js): jumlah n=2*round(3+.7(d-1)+.07(d-1)^2), hp hpm=3*HPX[malam] (v46: dasar dilipatgandakan, 1.5 jadi 3, kurva tetap) dengan tabel HPX di va.js dari kurva pemilik (v45): (v52, kurva terbaru) x1.0, 10, 18.6, 27.9, 39.1, 53.2, 70.2, 89.7, 111, 133.8, 157.4, 181.3, 205.1, 228.1, x250 di malam 15 (di atas 15 memakai nilai malam 15); jumlah musuh tetap. Aturan pemilik: kesulitan mengikuti data kurva ini; ubah HPX bila kurva berubah, kecepatan .9+.045(d-1), damage dmm .7/.8/.9 di malam 1-3, kawanan tungau sw=2+.5d+.04d^2. Suku cadang awal run 7 (v48; semula 20, reset() di va.js). Malam 1: 6 pengintai + 3 tungau, hp scout 3: dua Gun Lv1 cukup tanpa bantuan player (diuji).

- v49/1.20: robot pekerja menyerang hanya jika player membeli slot bengkel 'Robot tempur' (UPG.bots, UPGK, curUp().bots): Lv N = N robot pertama (index < N, b.fighter, penanda garis merah di drawBot) boleh menempel dan mengelas drone; robot lain tetap bekerja. Biaya 50/110/190/300/450. Upgrade dalam game 'Las robot' (BOTW.dps) tetap menentukan damage las. Lv 0 = tidak ada robot yang menyerang.

## Tugas berikutnya
- Belum ada permintaan tertunda. v41-v42 hanya diuji di browser headless (Playwright), belum di HP asli: cek kontrol crane kiri, harga buka tower di bengkel, keseimbangan kritis, kerapian dok 2 baris di layar kecil.

## Perubahan v53 / APK 1.23 (versionCode 24): Menu Dev / Balancing (vdev.js)
- Buka: tombol ` (Backquote) atau F2, tombol DEV (muncul bila diaktifkan di tab Global, atau 5 ketukan cepat pada judul Pengaturan). Panel overlay bawah, tab Global/Musuh/Tower/Senjata; game dijeda saat panel terbuka (tombol Jeda). Tersimpan di localStorage mr_dev.
- Struktur: DEV={btn,pause,g:{enemy,tower,weapon,rmax},e:{enemy:{id:{maxLv,st:{stat:{min,max,curve,mul}}}},tower:{},weapon:{}}}. Kolom kosong = nilai asli game. Katalog DEVC (stat per entitas), snapshot asli TPRI/WARRS/ORIGT/ORIGW/EBASE.
- Layer 1: nilai Lv = min + (max-min)*bentuk; bentuk = kurva asli (kosong), t^kurva, atau min*faktor^(L-1) dibatasi max. Layer 2: pengali global (slider 0-rmax, rmax bisa diubah) dikalikan setelahnya, kecuali harga tower.
- Hook: devApply() menimpa array TY[id] dan WEAP/PWD; devEnemy(kind,stat,day) di spawnDrone (va.js); devTwHp (towerMaxHp, twHpAt); twMax, twBuildCost, twUpCost (va/vc); upCap (vm buyUp, vu hangar, vdemo). Level maks musuh = malam saat pertumbuhan berhenti; tower maks 9, senjata maks 5.
- Diuji (Playwright, t10): default tidak mengubah nilai, pengali global, override min/max/kurva/faktor/maxLv, UI 390x780, ekspor JSON.
