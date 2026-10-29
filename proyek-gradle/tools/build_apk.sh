#!/usr/bin/env bash
# Rebuild + sign the APK WITHOUT the Android SDK (the way the first build was made).
# Needs: Java 17+, internet once to fetch the two tools below.
# Usage:  KS_PASS=yourpassword ./tools/build_apk.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p tools/bin build
[ -f tools/bin/apktool.jar ] || curl -L -o tools/bin/apktool.jar https://github.com/iBotPeaches/Apktool/releases/download/v2.10.0/apktool_2.10.0.jar
[ -f tools/bin/signer.jar ]  || curl -L -o tools/bin/signer.jar  https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
# game files -> apktool project
rm -rf tools/apktool-src/assets && cp -r app/src/main/assets tools/apktool-src/assets
java -jar tools/bin/apktool.jar b tools/apktool-src -o build/unsigned.apk
java -jar tools/bin/signer.jar -a build/unsigned.apk \
  --ks "${KS_FILE:-menara-rongsok-release.jks}" --ksAlias menararongsok \
  --ksPass "$KS_PASS" --ksKeyPass "$KS_PASS" -o build/signed
echo "APK: build/signed/unsigned-aligned-signed.apk"
