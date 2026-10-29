.class public Lcom/menararongsok/game/AppBridge;
.super Ljava/lang/Object;
.source "AppBridge.java"

# Exposed to the page as window.MRApp (see MainActivity / AppBridge.java)

.field private final a:Landroid/app/Activity;

.method public constructor <init>(Landroid/app/Activity;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/menararongsok/game/AppBridge;->a:Landroid/app/Activity;
    return-void
.end method

.method public quit()V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/menararongsok/game/AppBridge;->a:Landroid/app/Activity;
    invoke-virtual {v0}, Landroid/app/Activity;->finishAndRemoveTask()V
    return-void
.end method
