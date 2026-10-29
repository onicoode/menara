# Menara Rongsok — proyek Android

Game ini adalah satu halaman HTML/JavaScript (canvas). Aplikasi Android-nya hanya "bingkai":
satu `Activity` berisi WebView layar penuh yang membuka `app/src/main/assets/index.html` secara offline.

## Isi folder

| Path | Isi |
|---|---|
| `app/src/main/assets/index.html` | Game lengkap (yang dijalankan di HP) |
| `app/src/main/assets/fonts/` | Font Pixelify Sans (lisensi OFL) agar jalan tanpa internet |
| `app/src/main/java/com/menararongsok/game/MainActivity.java` | WebView layar penuh, layar tetap menyala, tombol back = ke latar |
| `app/src/main/AndroidManifest.xml` | Nama paket, ikon, mode potret |
| `app/build.gradle`, `build.gradle`, `settings.gradle` | Proyek Gradle untuk Android Studio |
| `keystore.properties.example` | Contoh file kunci untuk build rilis |
| `game-src/` | Sumber game terpecah (vh.html + va/vaud/vb/vc/vd.js) |
| `tools/make_html.sh` | Gabungkan `game-src/` menjadi `assets/index.html` |
| `tools/build_apk.sh` | Build + tanda tangan APK **tanpa Android SDK** (cara build pertama dibuat) |
| `tools/apktool-src/` | Versi smali (bytecode tulisan tangan) dari MainActivity, dipakai `build_apk.sh` |

## Alur pengembangan
1. Ubah game di `game-src/` (atau langsung `assets/index.html`).
2. `./tools/make_html.sh` untuk memperbarui `assets/index.html`.
3. Naikkan `versionCode` (wajib setiap update) dan `versionName` di `app/build.gradle`
   (dan di `tools/apktool-src/apktool.yml` kalau memakai `build_apk.sh`).
4. Build:
   - **Android Studio**: buka folder ini, salin `keystore.properties.example` jadi `keystore.properties`, isi password,
     taruh file `.jks` di folder ini, lalu *Build > Generate Signed Bundle / APK* (atau `./gradlew assembleRelease`;
     buat wrapper dulu dengan `gradle wrapper` jika belum ada). Untuk Google Play pakai **AAB** (`bundleRelease`).
   - **Tanpa SDK**: `KS_PASS=passwordmu ./tools/build_apk.sh`

## Kunci (keystore)
File `menara-rongsok-release.jks` + passwordnya **tidak** ikut di folder ini dan tidak boleh masuk Git.
Simpan di 2 tempat aman. Kalau hilang, kamu tidak bisa lagi merilis update yang bisa dipasang menimpa versi lama.

Catatan: proyek Gradle ini disiapkan tetapi belum pernah di-build di Android Studio (lingkungan pembuatannya tidak
punya Android SDK). APK pertama dibangun lewat `tools/build_apk.sh` dari kode yang sama.
