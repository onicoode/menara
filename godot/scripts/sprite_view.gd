extends Control
## Menggambar sprite karakter (grid piksel) dengan skala; dipakai di menu/bengkel/profil.
var g
var ch: Dictionary = {}
var lvl := 1
var lit_anim := false
var own := true
var sc := 3.0
var t := 0.0
var bob := false

func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

func _process(dt: float) -> void:
	if lit_anim or bob:
		t += dt
		queue_redraw()

func _draw() -> void:
	if g == null or ch.is_empty():
		return
	var o = {"air": false, "thr": false, "step": false, "lvl": maxi(1, lvl), "lit": lit_anim and own and int(t * 2) % 3 == 0, "weap": ch.weap, "sawOut": false, "t": t}
	var base = Vector2(size.x / 2, size.y - 4)
	var bobv = int(t * 1.6) % 2 if bob else 0
	var me = self
	var P = func(ox, oy, w, h, c):
		var col = g.cc(c) if own else Color("#14172a")
		var yy = oy + (bobv if oy <= -6 else 0)
		me.draw_rect(Rect2(base.x + ox * me.sc, base.y + yy * me.sc, w * me.sc, h * me.sc), col)
	g.draw_char_sprite(P, ch, o)
