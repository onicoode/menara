.class public Lcom/menararongsok/game/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"

# Hand-written Dalvik assembly equivalent to app/src/main/java/com/menararongsok/game/MainActivity.java

.field private web:Landroid/webkit/WebView;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method private hideBars()V
    .locals 2
    invoke-virtual {p0}, Lcom/menararongsok/game/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    invoke-virtual {v0}, Landroid/view/Window;->getDecorView()Landroid/view/View;
    move-result-object v0
    const/16 v1, 0x1706
    invoke-virtual {v0, v1}, Landroid/view/View;->setSystemUiVisibility(I)V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 4
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    invoke-virtual {p0}, Lcom/menararongsok/game/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    const/16 v1, 0x80
    invoke-virtual {v0, v1}, Landroid/view/Window;->addFlags(I)V
    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/menararongsok/game/MainActivity;->web:Landroid/webkit/WebView;
    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v1
    const/4 v2, 0x1
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    const/4 v3, 0x0
    invoke-virtual {v1, v3}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V
    const/4 v3, 0x2
    invoke-virtual {v0, v3}, Landroid/webkit/WebView;->setOverScrollMode(I)V
    const/high16 v2, -0x1000000
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setBackgroundColor(I)V
    new-instance v2, Lcom/menararongsok/game/AppBridge;
    invoke-direct {v2, p0}, Lcom/menararongsok/game/AppBridge;-><init>(Landroid/app/Activity;)V
    const-string v3, "MRApp"
    invoke-virtual {v0, v2, v3}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V
    const-string v2, "file:///android_asset/index.html"
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    invoke-virtual {p0, v0}, Lcom/menararongsok/game/MainActivity;->setContentView(Landroid/view/View;)V
    invoke-direct {p0}, Lcom/menararongsok/game/MainActivity;->hideBars()V
    return-void
.end method

.method public onWindowFocusChanged(Z)V
    .locals 0
    invoke-super {p0, p1}, Landroid/app/Activity;->onWindowFocusChanged(Z)V
    if-eqz p1, :cond_0
    invoke-direct {p0}, Lcom/menararongsok/game/MainActivity;->hideBars()V
    :cond_0
    return-void
.end method

.method protected onPause()V
    .locals 2
    invoke-super {p0}, Landroid/app/Activity;->onPause()V
    iget-object v0, p0, Lcom/menararongsok/game/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    const-string v1, "javascript:window.mrBg&&mrBg(true)"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :cond_0
    return-void
.end method

.method protected onStop()V
    .locals 1
    invoke-super {p0}, Landroid/app/Activity;->onStop()V
    iget-object v0, p0, Lcom/menararongsok/game/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    invoke-virtual {v0}, Landroid/webkit/WebView;->onPause()V
    invoke-virtual {v0}, Landroid/webkit/WebView;->pauseTimers()V
    :cond_0
    return-void
.end method

.method protected onResume()V
    .locals 2
    invoke-super {p0}, Landroid/app/Activity;->onResume()V
    iget-object v0, p0, Lcom/menararongsok/game/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    invoke-virtual {v0}, Landroid/webkit/WebView;->onResume()V
    invoke-virtual {v0}, Landroid/webkit/WebView;->resumeTimers()V
    const-string v1, "javascript:window.mrBg&&mrBg(false)"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :cond_0
    return-void
.end method

.method protected onDestroy()V
    .locals 2
    iget-object v0, p0, Lcom/menararongsok/game/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :cond_0
    const-string v1, "javascript:window.mrBg&&mrBg(true)"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V
    invoke-static {}, Landroid/os/Process;->myPid()I
    move-result v0
    invoke-static {v0}, Landroid/os/Process;->killProcess(I)V
    return-void
.end method

.method public onBackPressed()V
    .locals 1
    const/4 v0, 0x1
    invoke-virtual {p0, v0}, Lcom/menararongsok/game/MainActivity;->moveTaskToBack(Z)Z
    return-void
.end method
