extends Control
## Kartu menu bangun di dock. Tahan untuk memproses (hold-to-build).
signal pressed_card(card)
signal released_card(card)
var o: Dictionary = {}
var held := false
var prog := 0.0
var shake_t := 0.0
var show_key := ""
var appear := 0.0
var _down := false

func _init() -> void:
	custom_minimum_size = Vector2(60, 54)
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

func set_opt(opt: Dictionary) -> void:
	o = opt
	queue_redraw()

func _gui_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if e.pressed:
			_down = true
			pressed_card.emit(self)
		elif _down:
			_down = false
			released_card.emit(self)
		accept_event()

func _notification(what: int) -> void:
	if what == NOTIFICATION_MOUSE_EXIT and _down:
		pass

func shake() -> void:
	shake_t = .3

func _process(dt: float) -> void:
	if shake_t > 0:
		shake_t = maxf(0.0, shake_t - dt)
		queue_redraw()
	if appear < 1.0:
		appear = minf(1.0, appear + dt / .14)
		queue_redraw()

func _draw() -> void:
	if o.is_empty():
		return
	var st: String = o.get("state", "ok")
	var off = Vector2.ZERO
	if shake_t > 0:
		off.x = sin(shake_t * 60) * 4 * (shake_t / .3)
	off.y = (1.0 - clampf(appear, 0.0, 1.0)) * 20.0 + (2.0 if held else 0.0)
	draw_set_transform(off, 0, Vector2.ONE)
	var bg = Color(27 / 255.0, 33 / 255.0, 64 / 255.0, .86)
	var bd = Color("#343e66")
	if st == "ok":
		bd = Color("#c99a32")
	if held:
		bd = Color("#ffe28f")
	draw_rect(Rect2(0, 0, size.x, size.y), bg)
	draw_rect(Rect2(0, 0, size.x, 2), bd); draw_rect(Rect2(0, size.y - 3, size.x, 3), Color("#0f1328"))
	draw_rect(Rect2(0, 0, 2, size.y), bd); draw_rect(Rect2(size.x - 2, 0, 2, size.y), bd)
	var dim = 1.0
	if st == "poor" or st == "max":
		dim = .6 if st == "poor" else .75
	var ic = Ic.tex(o.get("icon", "gear"))
	draw_texture_rect(ic, Rect2(size.x / 2 - 14, 4, 28, 28), false, Color(dim, dim, dim, 1))
	if o.has("corner"):
		draw_texture_rect(Ic.tex(o.corner), Rect2(3, 3, 13, 13), false)
	var f = UK.font_b
	var nm: String = o.get("nm", "")
	if nm != "":
		var nw = f.get_string_size(nm, HORIZONTAL_ALIGNMENT_LEFT, size.x - 4, 10)
		draw_string(f, Vector2((size.x - minf(nw.x, size.x - 4)) / 2, 41), nm, HORIZONTAL_ALIGNMENT_LEFT, size.x - 4, 10, Color("#dfe6f5"))
	var cy = size.y - 9
	if o.has("cost"):
		var txt = str(o.cost)
		var tw = f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
		var x0 = (size.x - (14 + tw)) / 2
		draw_texture_rect(Ic.tex("gear"), Rect2(x0, cy - 10, 12, 12), false)
		draw_string(f, Vector2(x0 + 15, cy), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("#ff8a7a") if st == "poor" else Color("#c9d6e6"))
	elif o.has("gain"):
		var txt2 = "+" + str(o.gain)
		var tw2 = f.get_string_size(txt2, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
		var x1 = (size.x - (14 + tw2)) / 2
		draw_texture_rect(Ic.tex("gear"), Rect2(x1, cy - 10, 12, 12), false)
		draw_string(f, Vector2(x1 + 15, cy), txt2, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("#7dff9a"))
	var bdg: String = str(o.get("badge", ""))
	if bdg != "":
		var plain: bool = bdg == "+" or o.get("badgePlain", 0)
		var txt3 = bdg if plain else "▲" + bdg
		var w3 = f.get_string_size(txt3, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x
		draw_string(f, Vector2(size.x - w3 - 4, 13), txt3, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, UK.GOLD)
	if show_key != "":
		draw_string(f, Vector2(4, 11), show_key, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, UK.MUTED)
	if st == "locked" or st == "busy":
		draw_rect(Rect2(2, 2, size.x - 4, size.y - 5), Color(7 / 255.0, 8 / 255.0, 15 / 255.0, .62))
		var c = Vector2(size.x / 2, size.y / 2 - 2)
		if st == "locked":
			draw_texture_rect(Ic.tex("lock"), Rect2(c.x - 12, c.y - 12, 24, 24), false)
		else:
			draw_set_transform(off + c, floorf(Time.get_ticks_msec() / 125.0) * PI / 4, Vector2.ONE)
			draw_texture_rect(Ic.tex("cog"), Rect2(-12, -12, 24, 24), false)
			draw_set_transform(off, 0, Vector2.ONE)
	if prog > 0:
		draw_rect(Rect2(6, size.y - 7, size.x - 12, 4), Color("#0a0d18"))
		var w = (size.x - 12) * clampf(prog, 0.0, 1.0)
		var x = 0.0
		while x < w:
			draw_rect(Rect2(6 + x, size.y - 7, minf(3.0, w - x), 4), Color("#ffe28f"))
			x += 4
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
