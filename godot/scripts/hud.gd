extends Control
## HUD saat bermain: chip status, jam, tombol pancing/jeda, dock kartu bangun dan tombol aura kejut.
signal pause_pressed

var g                       # node game
var c_coins: Label
var c_day: Label
var c_phase: TextureRect
var b_core: Control
var b_mech: Control
var b_bat: Control
var chip_res: Control
var res_ic: TextureRect
var b_res: Control
var btn_lure: Button
var lure_n: Label
var btn_pause: Button
var btn_blast: Button
var blast_c: Label
var dock: Control
var grid: GridContainer
var clock: Control
var cards: Array = []
var menu_sig := ""
var key_sig := ""
var prev_coins := -1
var prev_core := -1.0
var core_hit_t := 0.0
var coin_t := 0.0
var coin_dir := 0
var mech_hit_t := 0.0
var prev_mech := -1.0
var dock_air := false
var chips = {}

func setup(game) -> void:
	g = game
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# jam
	clock = Control.new()
	clock.set_anchors_preset(Control.PRESET_TOP_WIDE)
	clock.custom_minimum_size = Vector2(0, 4)
	clock.size = Vector2(360, 4)
	clock.mouse_filter = Control.MOUSE_FILTER_IGNORE
	clock.draw.connect(_draw_clock)
	add_child(clock)
	# baris 1
	var r1 = UK.hbox(6)
	r1.position = Vector2(8, 10)
	add_child(r1)
	var ch = _chip("gear")
	c_coins = UK.lbl("0", 13)
	ch.get_child(0).add_child(c_coins)
	r1.add_child(ch)
	chips.coins = ch
	var cd = _chip("drone")
	c_day = UK.lbl("1", 13)
	cd.get_child(0).add_child(c_day)
	r1.add_child(cd)
	var cp = _chip("sun")
	c_phase = cp.get_child(0).get_child(0)
	r1.add_child(cp)
	var cc = _chip("core")
	b_core = load("res://scripts/pixbar.gd").new()
	cc.get_child(0).add_child(b_core)
	r1.add_child(cc)
	chips.core = cc
	# baris 2
	var r2 = UK.hbox(6)
	r2.position = Vector2(8, 42)
	add_child(r2)
	var cm = _chip("heart")
	b_mech = load("res://scripts/pixbar.gd").new()
	b_mech.col = Color("#9dffb0"); b_mech.col2 = Color("#3fbf62")
	cm.get_child(0).add_child(b_mech)
	r2.add_child(cm)
	chips.mech = cm
	var cb = _chip("battery")
	b_bat = load("res://scripts/pixbar.gd").new()
	b_bat.col = Color("#ffe28f"); b_bat.col2 = Color("#d09a2a")
	cb.get_child(0).add_child(b_bat)
	r2.add_child(cb)
	chip_res = _chip("research")
	res_ic = chip_res.get_child(0).get_child(0)
	b_res = load("res://scripts/pixbar.gd").new()
	b_res.col = Color("#e0b8ff"); b_res.col2 = Color("#8a4ad0")
	chip_res.get_child(0).add_child(b_res)
	chip_res.visible = false
	r2.add_child(chip_res)
	# tombol pause (kanan atas)
	btn_pause = UK.btn("menu", "", "n", Vector2(32, 30))
	btn_pause.position = Vector2(360 - 8 - 32, 8)
	btn_pause.pressed.connect(func(): pause_pressed.emit())
	add_child(btn_pause)
	# tombol pancing
	btn_lure = UK.btn("lure", "", "gold", Vector2(52, 52), 32)
	btn_lure.position = Vector2(360 - 8 - 52, 50)
	btn_lure.pressed.connect(func(): g.lure())
	lure_n = UK.lbl("4", 12, Color("#fff2b0"), HORIZONTAL_ALIGNMENT_CENTER)
	lure_n.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	lure_n.position.y = -14
	btn_lure.add_child(lure_n)
	add_child(btn_lure)
	# dock
	dock = Control.new()
	dock.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(dock)
	dock.draw.connect(_draw_dock)
	grid = GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 3)
	grid.add_theme_constant_override("v_separation", 3)
	grid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dock.add_child(grid)
	btn_blast = UK.btn("blast", "", "n", Vector2(60, 60), 30)
	btn_blast.add_theme_stylebox_override("normal", UK.sb(Color(23 / 255.0, 50 / 255.0, 70 / 255.0, .94), Color("#4a7a96")))
	blast_c = UK.lbl("75%", 12, UK.GOLD, HORIZONTAL_ALIGNMENT_CENTER)
	blast_c.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	blast_c.position.y = -17
	btn_blast.add_child(blast_c)
	btn_blast.button_down.connect(func(): g.do_blast())
	dock.add_child(btn_blast)
	layout()
	get_viewport().size_changed.connect(layout)

func _chip(icon: String) -> PanelContainer:
	var p = PanelContainer.new()
	p.add_theme_stylebox_override("panel", UK.sb(Color("#161b2e"), Color("#2e3658"), 2, 3, 2))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h = UK.hbox(5)
	h.add_child(UK.ico(icon, 18))
	p.add_child(h)
	return p

func dock_h() -> float:
	return D.BOT - 12

func layout() -> void:
	var vh = get_viewport_rect().size.y
	var dh = dock_h()
	dock.position = Vector2(0, vh - dh)
	dock.size = Vector2(360, dh)
	grid.position = Vector2(5, 5)
	grid.size = Vector2(286, dh - 10)
	btn_blast.position = Vector2(360 - 5 - 60, dh - 5 - 60)
	var cw = (286.0 - 9) / 4
	var chh = (dh - 10 - 3) / 2
	for c in cards:
		c.custom_minimum_size = Vector2(cw, chh)

func _draw_clock() -> void:
	clock.draw_rect(Rect2(0, 0, 360 * .5556, 4), Color("#e0a24a"))
	clock.draw_rect(Rect2(360 * .5556, 0, 360 * .4444, 4), Color("#3a4580"))
	if not g.s.is_empty():
		var x = 360.0 * g.s.t / D.CYC
		clock.draw_rect(Rect2(x - 3, -2, 5, 8), Color.BLACK)
		clock.draw_rect(Rect2(x - 2, -1, 3, 6), Color.WHITE)

func _draw_dock() -> void:
	if dock_air:
		return
	dock.draw_rect(Rect2(0, 0, 360, 3), Color(7 / 255.0, 8 / 255.0, 15 / 255.0, .45))
	dock.draw_rect(Rect2(0, 3, 360, dock.size.y - 3), Color(7 / 255.0, 8 / 255.0, 15 / 255.0, .16))
	var x = 0
	while x < 360:
		dock.draw_rect(Rect2(x, 0, 6, 2), Color("#2e3658"))
		x += 10

func _process(dt: float) -> void:
	if g == null or g.s.is_empty():
		return
	var s = g.s
	var playing: bool = g.running and not g.paused and not s.over
	visible = g.running
	if not visible:
		return
	var rc = s.res.cur
	chip_res.visible = rc != null
	if rc != null:
		b_res.v = rc.t / D.RES[rc.key].time
		res_ic.texture = Ic.tex(rc.key)
		b_res.queue_redraw()
	var air: bool = not s.m.st
	if air != dock_air:
		dock_air = air
		dock.queue_redraw()
	btn_lure.disabled = not g.can_lure()
	btn_blast.disabled = not g.can_blast()
	blast_c.text = str(int(round(g.blast.cost * 100))) + "%"
	lure_n.text = str(D.LUREMAX - int(s.get("lures", 0)))
	if s.coins != prev_coins:
		c_coins.text = str(s.coins)
		prev_coins = s.coins
	c_day.text = "%d/%s" % [mini(s.day, s.run.len) if s.run.len else s.day, str(s.run.len) if s.run.len else "-"]
	c_phase.texture = Ic.tex("moon" if s.t >= D.DAY else "sun")
	b_core.v = maxf(0.0, s.hp) / s.maxHp
	b_mech.v = s.m.hp / D.MECH.hp
	b_bat.v = s.m.bat / D.MECH.bat
	b_bat.blink = b_bat.v < .25
	b_core.queue_redraw(); b_mech.queue_redraw(); b_bat.queue_redraw()
	# kedip chip saat core / mekanik terkena
	if prev_core >= 0 and s.hp < prev_core - 0.01:
		core_hit_t = .36
	prev_core = s.hp
	if prev_mech >= 0 and s.m.hp < prev_mech - .4:
		mech_hit_t = .36
	prev_mech = s.m.hp
	core_hit_t = maxf(0.0, core_hit_t - dt)
	mech_hit_t = maxf(0.0, mech_hit_t - dt)
	_tint(chips.core, core_hit_t > 0)
	_tint(chips.mech, mech_hit_t > 0)
	clock.queue_redraw()
	menu_sync(g.ctx_options() if playing else [])

func _tint(chip: PanelContainer, on: bool) -> void:
	chip.add_theme_stylebox_override("panel", UK.sb(Color("#8a2a22") if on else Color("#161b2e"), Color("#2e3658"), 2, 3, 2))

func is_touch() -> bool:
	return DisplayServer.is_touchscreen_available()

func menu_sync(opts: Array) -> void:
	var sig := ""
	var ksig := ""
	for o in opts:
		sig += "%s/%s/%s/%s/%s/%s|" % [o.key, o.get("icon", ""), o.get("badge", ""), o.get("cost", ""), o.get("gain", ""), o.get("nm", "")]
		ksig += o.key + "|"
	if sig != menu_sig:
		var fresh = ksig != key_sig
		key_sig = ksig
		menu_sig = sig
		for c in cards:
			c.queue_free()
		cards.clear()
		var n = mini(opts.size(), 8)
		for i in n:
			var c = load("res://scripts/card.gd").new()
			c.appear = 0.0 if fresh else 1.0
			if fresh:
				c.appear = -i * 0.18
			c.show_key = "" if is_touch() else str(i + 1)
			c.pressed_card.connect(_card_down)
			c.released_card.connect(_card_up)
			grid.add_child(c)
			cards.append(c)
		layout()
		if fresh and opts.size() > 0:
			var sfxn = g.get_node_or_null("/root/Audio")
			if sfxn:
				sfxn.sfx("slot")
	for i in cards.size():
		if i >= opts.size():
			continue
		var o = opts[i]
		var c = cards[i]
		var held: bool = g.card_hold != null and g.card_hold.key == o.key and not g.card_hold.done
		c.held = held
		var pr = 0.0
		if held:
			pr = clampf(g.card_hold.t / D.HT[o.kind], 0.0, 1.0) if D.HT.has(o.kind) else 1.0
		elif o.has("prog"):
			pr = o.prog
		c.prog = pr
		c.set_opt(o)

func _card_down(c) -> void:
	var cur = null
	for o in g.ctx_options():
		if o.key == c.o.key:
			cur = o
	if g.begin_hold(cur, "ui"):
		pass
	elif cur != null and (cur.state == "poor" or cur.state == "locked"):
		c.shake()

func _card_up(c) -> void:
	g.release_hold("ui")

## area yang dipakai UI (agar sentuhan tidak dianggap gerakan karakter)
func over_ui(p: Vector2) -> bool:
	if not visible:
		return false
	for b in [btn_lure, btn_pause, btn_blast]:
		if b.is_visible_in_tree() and b.get_global_rect().has_point(p):
			return true
	for c in cards:
		if c.get_global_rect().has_point(p):
			return true
	return false
