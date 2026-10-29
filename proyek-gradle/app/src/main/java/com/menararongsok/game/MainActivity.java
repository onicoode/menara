package com.menararongsok.game;

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
        web.addJavascriptInterface(new AppBridge(this), "MRApp");   // window.MRApp.quit() closes the app
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

    @Override protected void onPause()  { super.onPause();  if (web != null) web.loadUrl("javascript:window.mrBg&&mrBg(true)"); }
    @Override protected void onStop()   { super.onStop();   if (web != null) { web.onPause(); web.pauseTimers(); } }
    @Override protected void onDestroy() {
        if (web != null) { web.loadUrl("javascript:window.mrBg&&mrBg(true)"); web.destroy(); }
        super.onDestroy();
        android.os.Process.killProcess(android.os.Process.myPid());   /* quit really stops the game and its sound */
    }
    @Override protected void onResume() { super.onResume(); if (web != null) { web.onResume(); web.resumeTimers(); web.loadUrl("javascript:window.mrBg&&mrBg(false)"); } }

    /** Back button sends the game to the background (it pauses itself) instead of quitting. */
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { moveTaskToBack(true); }
}
