import os,shutil,re
from PIL import Image,ImageDraw
SP='/tmp/claude-0/-home-claude/cf56ac7e-fe2d-5c96-9095-94908f53bb43/scratchpad/'
A=SP+'apk/'
PKG='com.menararongsok.game'
# ---------- 1. offline index.html ----------
vh=open(SP+'u3/vh.html').read()
game=open(SP+'u3/ugame.js').read().rstrip()
vh=re.sub(r'<link rel="preconnect"[^>]*>\n','',vh)
vh=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n','',vh)
i=vh.index('<main')
head,body=vh[:i],vh[i:]
fontcss="""<style>
@font-face{font-family:'Pixelify Sans';font-weight:500;src:url(fonts/pixelify-sans-latin-500-normal.woff2) format('woff2')}
@font-face{font-family:'Pixelify Sans';font-weight:700;src:url(fonts/pixelify-sans-latin-700-normal.woff2) format('woff2')}
[hidden]{display:none!important}
html,body{margin:0;background:#0d0f19}
</style>
"""
html=('<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
 +fontcss+head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')+'</head>\n<body>\n'+body+game+'\n</script>\n</body>\n</html>\n')
assert html.count('<script>')==1
web=A+'web/';os.makedirs(web+'fonts',exist_ok=True)
open(web+'index.html','w').write(html)
for w in ('500','700'):shutil.copy(A+'fontpkg/package/files/pixelify-sans-latin-%s-normal.woff2'%w,web+'fonts/')
shutil.copy(A+'fontpkg/package/LICENSE',web+'fonts/OFL-LICENSE.txt')
# ---------- 2. launcher icons (pixel-art energy core) ----------
G=['................',
   '..BBBBBBBBBBBB..',
   '..BGGGGGGGGGGB..',
   '..BPPPPPPPPPPB..',
   '...PDDDDDDDDP...',
   '...PDCCCCCCDP...',
   '...PDCWWWWCDP...',
   '...PDCWWWWCDP...',
   '...PDCWWWWCDP...',
   '...PDCCCCCCDP...',
   '...PDDDDDDDDP...',
   '..BPPPPPPPPPPB..',
   '.BBBBBBBBBBBBBB.',
   '.BMMMMMMMMMMMMB.',
   '................',
   '................']
pal={'B':(74,79,88),'G':(201,162,42),'P':(61,64,72),'D':(20,48,74),'C':(90,209,230),'W':(230,251,255),'M':(106,112,124)}
def icon(sz,round_=False):
    im=Image.new('RGBA',(16,16),(13,15,25,255))
    for y,r in enumerate(G):
        for x,ch in enumerate(r):
            if ch in pal:im.putpixel((x,y),pal[ch]+(255,))
    im=im.resize((sz,sz),Image.NEAREST)
    if round_:
        m=Image.new('L',(sz,sz),0);ImageDraw.Draw(m).ellipse((0,0,sz-1,sz-1),fill=255);im.putalpha(m)
    return im
SIZES={'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
def write_res(resdir):
    for k,v in SIZES.items():
        d=resdir+'mipmap-%s/'%k;os.makedirs(d,exist_ok=True)
        icon(v).save(d+'ic_launcher.png');icon(v,True).save(d+'ic_launcher_round.png')
    os.makedirs(resdir+'values',exist_ok=True)
    open(resdir+'values/strings.xml','w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">Menara Rongsok</string>\n</resources>\n')
    icon(512).save(A+'icon-512.png')
MANIFEST='''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"%s>
    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.Black.NoTitleBar.Fullscreen">
        <activity
            android:name="%s.MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout|keyboard|keyboardHidden|navigation|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''
# ---------- 3. apktool project (what is actually built here) ----------
ap=A+'apktool-src/'
shutil.rmtree(ap,ignore_errors=True);os.makedirs(ap)
open(ap+'AndroidManifest.xml','w').write(MANIFEST%(' package="%s"'%PKG,PKG))
write_res(ap+'res/')
shutil.copytree(web,ap+'assets/')
open(ap+'apktool.yml','w').write('''!!brut.androlib.meta.MetaInfo
apkFileName: menara-rongsok.apk
compressionType: false
doNotCompress:
- resources.arsc
- png
- woff2
isFrameworkApk: false
packageInfo:
  forcedPackageId: '127'
  renameManifestPackage: null
sdkInfo:
  minSdkVersion: '21'
  targetSdkVersion: '34'
sharedLibrary: false
sparseResources: false
usesFramework:
  ids:
  - 1
  tag: null
version: 2.10.0
versionInfo:
  versionCode: '1'
  versionName: '1.0'
''')
sm=ap+'smali/com/menararongsok/game/';os.makedirs(sm)
C='Lcom/menararongsok/game/MainActivity;'
open(sm+'MainActivity.smali','w').write(f'''.class public {C}
.super Landroid/app/Activity;
.source "MainActivity.java"

# Hand-written Dalvik assembly equivalent to app/src/main/java/com/menararongsok/game/MainActivity.java

.field private web:Landroid/webkit/WebView;

.method public constructor <init>()V
    .locals 0
    invoke-direct {{p0}}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method private hideBars()V
    .locals 2
    invoke-virtual {{p0}}, {C}->getWindow()Landroid/view/Window;
    move-result-object v0
    invoke-virtual {{v0}}, Landroid/view/Window;->getDecorView()Landroid/view/View;
    move-result-object v0
    const/16 v1, 0x1706
    invoke-virtual {{v0, v1}}, Landroid/view/View;->setSystemUiVisibility(I)V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 4
    invoke-super {{p0, p1}}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    invoke-virtual {{p0}}, {C}->getWindow()Landroid/view/Window;
    move-result-object v0
    const/16 v1, 0x80
    invoke-virtual {{v0, v1}}, Landroid/view/Window;->addFlags(I)V
    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {{v0, p0}}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, {C}->web:Landroid/webkit/WebView;
    invoke-virtual {{v0}}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v1
    const/4 v2, 0x1
    invoke-virtual {{v1, v2}}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {{v1, v2}}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    const/4 v3, 0x0
    invoke-virtual {{v1, v3}}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V
    const/4 v3, 0x2
    invoke-virtual {{v0, v3}}, Landroid/webkit/WebView;->setOverScrollMode(I)V
    const/high16 v2, -0x1000000
    invoke-virtual {{v0, v2}}, Landroid/webkit/WebView;->setBackgroundColor(I)V
    const-string v2, "file:///android_asset/index.html"
    invoke-virtual {{v0, v2}}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    invoke-virtual {{p0, v0}}, {C}->setContentView(Landroid/view/View;)V
    invoke-direct {{p0}}, {C}->hideBars()V
    return-void
.end method

.method public onWindowFocusChanged(Z)V
    .locals 0
    invoke-super {{p0, p1}}, Landroid/app/Activity;->onWindowFocusChanged(Z)V
    if-eqz p1, :cond_0
    invoke-direct {{p0}}, {C}->hideBars()V
    :cond_0
    return-void
.end method

.method protected onPause()V
    .locals 1
    invoke-super {{p0}}, Landroid/app/Activity;->onPause()V
    iget-object v0, p0, {C}->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    invoke-virtual {{v0}}, Landroid/webkit/WebView;->onPause()V
    :cond_0
    return-void
.end method

.method protected onResume()V
    .locals 1
    invoke-super {{p0}}, Landroid/app/Activity;->onResume()V
    iget-object v0, p0, {C}->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    invoke-virtual {{v0}}, Landroid/webkit/WebView;->onResume()V
    :cond_0
    return-void
.end method

.method public onBackPressed()V
    .locals 1
    const/4 v0, 0x1
    invoke-virtual {{p0, v0}}, {C}->moveTaskToBack(Z)Z
    return-void
.end method
''')
# ---------- 4. Android Studio / Gradle source project (for future development) ----------
st=A+'source/MenaraRongsok/'
shutil.rmtree(A+'source',ignore_errors=True);os.makedirs(st)
main=st+'app/src/main/'
os.makedirs(main+'java/com/menararongsok/game')
open(main+'AndroidManifest.xml','w').write((MANIFEST%('',PKG)).replace('android:name="%s.MainActivity"'%PKG,'android:name=".MainActivity"'))
write_res(main+'res/')
shutil.copytree(web,main+'assets/')
open(main+'java/com/menararongsok/game/MainActivity.java','w').write('''package com.menararongsok.game;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * The whole game is the HTML/JS page in app/src/main/assets/index.html.
 * This activity is only a full-screen WebView (Chrome engine) that shows that page offline.
 */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          // the game is JavaScript
        s.setDomStorageEnabled(true);          // localStorage: best score, sound on/off
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setBackgroundColor(0xFF000000);
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
        hideBars();
    }

    /** Immersive full screen: hide status and navigation bars. */
    @SuppressWarnings("deprecation")
    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
              | View.SYSTEM_UI_FLAG_FULLSCREEN
              | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
              | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
              | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
              | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @Override protected void onPause()  { super.onPause();  if (web != null) web.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }

    /** Back button sends the game to the background (it pauses itself) instead of quitting. */
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { moveTaskToBack(true); }
}
''')
open(st+'settings.gradle','w').write('''pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "MenaraRongsok"
include ':app'
''')
open(st+'build.gradle','w').write('''plugins {
    id 'com.android.application' version '8.5.2' apply false
}
''')
open(st+'gradle.properties','w').write('org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=false\n')
open(st+'app/build.gradle','w').write('''plugins {
    id 'com.android.application'
}

// Release signing reads keystore.properties (kept OUT of version control).
def ksFile = rootProject.file('keystore.properties')
def ks = new Properties()
if (ksFile.exists()) ks.load(new FileInputStream(ksFile))

android {
    namespace 'com.menararongsok.game'
    compileSdk 34

    defaultConfig {
        applicationId 'com.menararongsok.game'
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName '1.0'
    }

    signingConfigs {
        release {
            if (ksFile.exists()) {
                storeFile rootProject.file(ks['storeFile'])
                storePassword ks['storePassword']
                keyAlias ks['keyAlias']
                keyPassword ks['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
''')
open(st+'keystore.properties.example','w').write('storeFile=menara-rongsok-release.jks\nstorePassword=ISI_PASSWORD\nkeyAlias=menararongsok\nkeyPassword=ISI_PASSWORD\n')
open(st+'.gitignore','w').write('.gradle/\nbuild/\napp/build/\nlocal.properties\n.idea/\n*.iml\nkeystore.properties\n*.jks\n*.keystore\n')
print('project written',len(html))
