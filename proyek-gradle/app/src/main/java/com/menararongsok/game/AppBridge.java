package com.menararongsok.game;

import android.app.Activity;
import android.webkit.JavascriptInterface;

/** Small bridge the page can call as window.MRApp (used by the Quit button). */
public class AppBridge {
    private final Activity a;
    public AppBridge(Activity a) { this.a = a; }

    @JavascriptInterface
    public void quit() { a.finishAndRemoveTask(); }
}
