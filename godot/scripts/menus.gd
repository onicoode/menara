extends Control
## Semua layar menu: utama, profil, durasi, pengaturan, keluar, bengkel, katalog tower, overlay jeda/hasil.
signal start_run(len: int)
signal continue_run
signal quit_game
signal resume_game
signal surrender
signal save_exit

var g                       # node game
var scr = {}                # nama -> Control
var cur := ""
var txt = {}
var settings_back: Callable = Callable()
var prof_del := -1
var hg_view := 0
var hg_sel := "main"
var tw_sel := "g"
var tw_lv := 3
var overlay: Control
var ov_box: VBoxContainer
var bg: ColorRect
# referensi widget bengkel
var hg_coins: Label
var hg_prof: Label
var hg_tw_sub: Label
var ch_name: Label
var ch_role: Label
var ch_buy: Button
var ch_sprite
var ch_lock: TextureRect
var ch_sel: TextureRect
var hg_grid: HBoxContainer
var hg_tiles = {}
var hg_desc: PanelContainer
var hg_dn: Label
var hg_dl: Label
var hg_stats: VBoxContainer
var hg_dt: Label
var hg_up: Button
var hg_play: Button
var tw_coins: Label
var tw_grid: HBoxContainer
var tw_tiles = {}
var tw_lvrow: HBoxContainer
var tw_lvb = {}
var tw_name: Label
var tw_lvl: Label
var tw_need: Label
var tw_buy: Button
var tw_stats: VBoxContainer
var tw_desc: Label
var tw_prev: Control
var home_prof_name: Label
var home_prof_coins: Label
var m_cont: Button
var m_new: Button
var home_logo

func setup(game) -> void:
	g = game
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var f = FileAccess.open("res://data/ui_text.json", FileAccess.READ)
	txt = JSON.parse_string(f.get_as_text())
	bg = ColorRect.new()
	bg.color = Color(7 / 255.0, 8 / 255.0, 15 / 255.0, .86)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(bg)
	bg.visible = false
	_build_home()
	_build_profiles()
	_build_run()
	_build_settings()
	_build_bye()
	_build_hangar()
	_build_towers()
	_build_overlay()
	for k in scr:
		scr[k].visible = false

func _screen(name: String) -> Control:
	var c = Control.new()
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(c)
	scr[name] = c
	return c

func btnfx() -> void:
	sfx("click")

func sfx(n: String) -> void:
	var a = get_node_or_null("/root/Audio")
	if a:
		a.sfx(n)

func blocking() -> bool:
	return cur != "" or overlay.visible

func show_screen(name: String) -> void:
	cur = name
	for k in scr:
		scr[k].visible = (k == name)
	bg.visible = name != "" and name != "home"
	if name != "":
		overlay.visible = false

func _title(parent: Control, icon: String, text: String) -> HBoxContainer:
	var h = UK.hbox(8)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	if icon != "":
		h.add_child(UK.ico(icon, 22))
	h.add_child(UK.lbl(text, 20, UK.GOLD))
	parent.add_child(h)
	return h

func _center(parent: Control, w := 300.0) -> VBoxContainer:
	var cc = CenterContainer.new()
	cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	cc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(cc)
	var v = UK.vbox(10)
	v.custom_minimum_size = Vector2(w, 0)
	cc.add_child(v)
	return v

# ---------------- layar utama ----------------
func _build_home() -> void:
	var s = _screen("home")
	var v = _center(s, 260)
	var logo = UK.hbox(10)
	logo.alignment = BoxContainer.ALIGNMENT_CENTER
	home_logo = load("res://scripts/sprite_view.gd").new()
	home_logo.custom_minimum_size = Vector2(64, 70)
	home_logo.sc = 2.0
	home_logo.g = g
	logo.add_child(home_logo)
	var lt = UK.lbl("Menara\nRongsok", 30, UK.GOLD)
	lt.add_theme_color_override("font_outline_color", Color.BLACK)
	lt.add_theme_constant_override("outline_size", 6)
	logo.add_child(lt)
	v.add_child(logo)
	var pc = UK.btn("user", "", "dim", Vector2(0, 30))
	var hh = pc.get_child(0)
	home_prof_name = UK.lbl("", 13)
	home_prof_coins = UK.lbl("", 13)
	hh.add_child(home_prof_name)
	hh.add_child(UK.ico("coin", 18))
	hh.add_child(home_prof_coins)
	pc.pressed.connect(func(): btnfx(); show_profiles())
	v.add_child(pc)
	m_cont = UK.btn("play", "Lanjut", "gold", Vector2(0, 44))
	m_cont.pressed.connect(func(): btnfx(); continue_run.emit())
	v.add_child(m_cont)
	m_new = UK.btn("play", "Main", "gold", Vector2(0, 44))
	m_new.pressed.connect(func(): btnfx(); show_hangar(false))
	v.add_child(m_new)
	var b2 = UK.btn("user", "Profil", "n", Vector2(0, 44))
	b2.pressed.connect(func(): btnfx(); show_profiles())
	v.add_child(b2)
	var b3 = UK.btn("settings", "Pengaturan", "n", Vector2(0, 44))
	b3.pressed.connect(func(): btnfx(); open_settings(show_home))
	v.add_child(b3)
	var b4 = UK.btn("door", "Keluar", "n", Vector2(0, 44))
	b4.pressed.connect(func(): btnfx(); show_screen("bye"))
	v.add_child(b4)

func show_home() -> void:
	g.home_scene()
	show_screen("home")
	var p = Prof.prof()
	home_prof_name.text = p.name
	home_prof_coins.text = str(p.coins)
	var sv = Prof.peek_run()
	m_cont.visible = sv != null
	if sv != null:
		UK.set_btn_text(m_cont, 1, "Lanjut  (malam %d)" % int(sv.get("day", 1)))
	m_new.get_child(0).get_child(1).text = "Main"
	m_new.add_theme_stylebox_override("normal", UK.sb(Color("#5a3e12") if sv == null else Color("#222a46"), Color("#ffc75a") if sv == null else Color("#3c4670")))
	home_logo.ch = Prof.cur_char()
	home_logo.lvl = Prof.cur_up().main
	home_logo.queue_redraw()

# ---------------- profil ----------------
var prof_list: VBoxContainer
func _build_profiles() -> void:
	var s = _screen("prof")
	var v = _center(s, 320)
	_title(v, "user", "Profil")
	prof_list = UK.vbox(8)
	v.add_child(prof_list)
	var b = UK.btn("back", "", "n", Vector2(60, 34))
	b.pressed.connect(func(): btnfx(); show_home())
	v.add_child(b)

func show_profiles() -> void:
	show_screen("prof")
	prof_del = -1
	render_profiles()

func render_profiles() -> void:
	for c in prof_list.get_children():
		c.queue_free()
	for i in Prof.list.size():
		var p = Prof.list[i]
		var row = PanelContainer.new()
		row.add_theme_stylebox_override("panel", UK.sb(Color("#1b2140") if i != Prof.active else Color("#2a3260"), Color("#343e66") if i != Prof.active else Color("#ffc75a")))
		prof_list.add_child(row)
		var h = UK.hbox(8)
		row.add_child(h)
		if p != null:
			var b = Button.new()
			b.flat = true
			b.focus_mode = Control.FOCUS_NONE
			b.custom_minimum_size = Vector2(230, 52)
			var hh = UK.hbox(8)
			hh.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			var sp = load("res://scripts/sprite_view.gd").new()
			sp.g = g
			sp.ch = D.char_by_id(p.ch)
			sp.lvl = p.chars[p.ch].up.main
			sp.sc = 1.6
			sp.custom_minimum_size = Vector2(36, 46)
			hh.add_child(sp)
			var info = UK.vbox(2)
			info.add_child(UK.lbl(p.name, 15))
			var st = UK.hbox(4)
			var owned = 0
			for c in D.CHARS:
				if p.chars[c.id].own:
					owned += 1
			st.add_child(UK.ico("coin", 14)); st.add_child(UK.lbl(str(p.coins), 12))
			st.add_child(UK.ico("trophy", 14)); st.add_child(UK.lbl(str(p.best), 12))
			st.add_child(UK.ico("user", 14)); st.add_child(UK.lbl("%d/%d" % [owned, D.CHARS.size()], 12))
			info.add_child(st)
			hh.add_child(info)
			if i == Prof.active:
				hh.add_child(UK.ico("check", 18))
			b.add_child(hh)
			var idx = i
			b.pressed.connect(func(): btnfx(); Prof.active = idx; Prof.save_all(); prof_del = -1; render_profiles())
			h.add_child(b)
			var del = UK.btn("trash", "Yakin?" if prof_del == i else "", "red" if prof_del == i else "dim", Vector2(44, 40), 18)
			del.pressed.connect(func():
				btnfx()
				if prof_del != idx:
					prof_del = idx
					render_profiles()
					return
				Prof.clear_run(idx)
				Prof.list[idx] = null
				prof_del = -1
				var any = false
				for q in Prof.list:
					if q != null:
						any = true
				if not any:
					Prof.list[0] = Prof.new_profile("Pemain 1")
				if Prof.list[Prof.active] == null:
					for j in Prof.list.size():
						if Prof.list[j] != null:
							Prof.active = j
							break
				Prof.save_all()
				render_profiles())
			h.add_child(del)
		else:
			var nb = UK.btn("plus", "Profil baru", "dim", Vector2(0, 44))
			nb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			var idx2 = i
			nb.pressed.connect(func():
				btnfx()
				for c in h.get_children():
					c.queue_free()
				var le = LineEdit.new()
				le.max_length = 12
				le.text = "Pemain %d" % (idx2 + 1)
				le.custom_minimum_size = Vector2(220, 40)
				le.size_flags_horizontal = Control.SIZE_EXPAND_FILL
				h.add_child(le)
				var ok = UK.btn("check", "", "gold", Vector2(50, 40))
				var make = func():
					var nm = le.text.strip_edges()
					if nm == "":
						nm = "Pemain %d" % (idx2 + 1)
					Prof.list[idx2] = Prof.new_profile(nm)
					Prof.active = idx2
					Prof.save_all()
					btnfx()
					render_profiles()
				ok.pressed.connect(make)
				le.text_submitted.connect(func(_t): make.call())
				h.add_child(ok)
				le.grab_focus()
				le.select_all())
			h.add_child(nb)

# ---------------- durasi ----------------
var run_list: VBoxContainer
func _build_run() -> void:
	var s = _screen("run")
	var v = _center(s, 260)
	_title(v, "moon", "Pilih durasi")
	run_list = UK.vbox(8)
	v.add_child(run_list)
	var b = UK.btn("back", "", "n", Vector2(60, 34))
	b.pressed.connect(func(): btnfx(); show_screen("hg"); hangar_sync())
	v.add_child(b)

func show_run() -> void:
	show_screen("run")
	for c in run_list.get_children():
		c.queue_free()
	for r in D.RUNS:
		var b = UK.btn("moon", "", "n", Vector2(0, 50))
		var h = b.get_child(0)
		var tv = UK.vbox(0)
		tv.add_child(UK.lbl(r.name, 15))
		tv.add_child(UK.lbl("%d malam" % r.len, 11, UK.MUTED))
		h.add_child(tv)
		var sp = Control.new()
		sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(sp)
		h.add_child(UK.lbl("+%d" % D.run_bonus(r.len, r.len), 14, UK.GOLD))
		h.add_child(UK.ico("coin", 16))
		var ln: int = r.len
		b.pressed.connect(func(): btnfx(); start_run.emit(ln))
		run_list.add_child(b)

# ---------------- pengaturan ----------------
var set_list: VBoxContainer
func _build_settings() -> void:
	var s = _screen("sett")
	var v = _center(s, 300)
	_title(v, "settings", "Pengaturan")
	set_list = UK.vbox(8)
	v.add_child(set_list)
	var b = UK.btn("back", "", "n", Vector2(60, 34))
	b.pressed.connect(func():
		btnfx()
		var f = settings_back
		settings_back = Callable()
		show_screen("")
		if f.is_valid():
			f.call())
	v.add_child(b)

func open_settings(back: Callable) -> void:
	settings_back = back
	show_screen("sett")
	for c in set_list.get_children():
		c.queue_free()
	var vr = PanelContainer.new()
	vr.add_theme_stylebox_override("panel", UK.sb(Color("#1b2140"), Color("#343e66")))
	var vh = UK.hbox(8)
	vh.add_child(UK.ico("sound", 20))
	vh.add_child(UK.lbl("Volume", 14))
	var segs = UK.hbox(3)
	segs.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	segs.alignment = BoxContainer.ALIGNMENT_END
	var sbs: Array = []
	for i in range(1, 11):
		var sb = Button.new()
		sb.focus_mode = Control.FOCUS_NONE
		sb.custom_minimum_size = Vector2(12, 24)
		sb.add_theme_stylebox_override("normal", UK.sb(Color("#2e3658"), Color("#2e3658"), 0, 0, 0))
		sb.add_theme_stylebox_override("pressed", UK.sb(Color("#ffc75a"), Color("#ffc75a"), 0, 0, 0))
		sb.add_theme_stylebox_override("hover", UK.sb(Color("#3e4878"), Color("#3e4878"), 0, 0, 0))
		sbs.append(sb)
		var n = i
		sb.pressed.connect(func():
			Prof.settings.vol = 0 if (Prof.settings.vol == n and n == 1) else n
			Prof.save_all()
			_apply_audio()
			sfx("click")
			for j in sbs.size():
				sbs[j].add_theme_stylebox_override("normal", UK.sb(Color("#ffc75a") if j < Prof.settings.vol else Color("#2e3658"), Color("#2e3658"), 0, 0, 0)))
		segs.add_child(sb)
	for j in sbs.size():
		sbs[j].add_theme_stylebox_override("normal", UK.sb(Color("#ffc75a") if j < Prof.settings.vol else Color("#2e3658"), Color("#2e3658"), 0, 0, 0))
	vh.add_child(segs)
	vr.add_child(vh)
	set_list.add_child(vr)
	for it in [["music", "music", "Musik"], ["sfx", "sound", "Efek suara"], ["shake", "shake", "Getar layar"], ["light", "sun", "Efek cahaya"]]:
		var key: String = it[0]
		var b = UK.btn(it[1], it[2], "dim", Vector2(0, 40))
		var h = b.get_child(0)
		h.alignment = BoxContainer.ALIGNMENT_BEGIN
		var sp = Control.new()
		sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(sp)
		var sw = UK.lbl("ON" if Prof.settings[key] else "OFF", 14, Color("#7dff9a") if Prof.settings[key] else Color("#ff8a7a"))
		h.add_child(sw)
		b.pressed.connect(func():
			Prof.settings[key] = 0 if Prof.settings[key] else 1
			Prof.save_all()
			_apply_audio()
			sw.text = "ON" if Prof.settings[key] else "OFF"
			sw.add_theme_color_override("font_color", Color("#7dff9a") if Prof.settings[key] else Color("#ff8a7a"))
			sfx("click"))
		set_list.add_child(b)
	_dev_tap_hook(v_title_node())

func v_title_node() -> Control:
	return scr.sett.get_child(0).get_child(0)

var _dev_taps := 0
var _dev_last := 0
func _dev_tap_hook(t: Control) -> void:
	t.mouse_filter = Control.MOUSE_FILTER_STOP
	if t.gui_input.is_connected(_title_input):
		return
	t.gui_input.connect(_title_input)

func _title_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed:
		var now = Time.get_ticks_msec()
		_dev_taps = _dev_taps + 1 if now - _dev_last < 700 else 1
		_dev_last = now
		if _dev_taps >= 5:
			_dev_taps = 0
			Dev.cfg.btn = not Dev.cfg.btn
			Dev.save_cfg()
			var d = get_tree().root.find_child("DevPanel", true, false)
			if d:
				d.sync_btn()
			sfx("power")

func _apply_audio() -> void:
	var a = get_node_or_null("/root/Audio")
	if a:
		a.apply_settings()

# ---------------- keluar ----------------
func _build_bye() -> void:
	var s = _screen("bye")
	var v = _center(s, 260)
	var ic = UK.ico("moon", 48)
	ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(ic)
	_title(v, "", "Sampai jumpa")
	var b = UK.btn("play", "", "n", Vector2(80, 40))
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.pressed.connect(func(): btnfx(); show_home())
	v.add_child(b)
	var q = UK.btn("door", "Tutup game", "red", Vector2(0, 40))
	q.pressed.connect(func(): quit_game.emit())
	v.add_child(q)

# ---------------- bengkel ----------------
func _scroll_screen(name: String) -> VBoxContainer:
	var s = _screen(name)
	var sc = ScrollContainer.new()
	sc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sc.mouse_filter = Control.MOUSE_FILTER_PASS
	s.add_child(sc)
	var m = MarginContainer.new()
	m.add_theme_constant_override("margin_left", 10)
	m.add_theme_constant_override("margin_right", 10)
	m.add_theme_constant_override("margin_top", 10)
	m.add_theme_constant_override("margin_bottom", 16)
	m.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	m.custom_minimum_size = Vector2(360, 0)
	sc.add_child(m)
	var v = UK.vbox(8)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	m.add_child(v)
	return v

func _coin_chip() -> Array:
	var p = PanelContainer.new()
	p.add_theme_stylebox_override("panel", UK.sb(Color("#161b2e"), Color("#2e3658"), 2, 3, 3))
	var h = UK.hbox(6)
	h.add_child(UK.ico("coin", 20))
	var l = UK.lbl("0", 16, UK.GOLD)
	h.add_child(l)
	p.add_child(h)
	return [p, l]

func _build_hangar() -> void:
	var v = _scroll_screen("hg")
	var top = UK.hbox(8)
	var hb = UK.btn("home", "", "n", Vector2(40, 36))
	hb.pressed.connect(func(): btnfx(); show_home())
	top.add_child(hb)
	hg_prof = UK.lbl("", 16)
	hg_prof.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(hg_prof)
	var cc = _coin_chip()
	hg_coins = cc[1]
	top.add_child(cc[0])
	v.add_child(top)
	var twb = UK.btn("tower", "", "dim", Vector2(0, 44))
	var th = twb.get_child(0)
	th.alignment = BoxContainer.ALIGNMENT_BEGIN
	var tv = UK.vbox(0)
	tv.add_child(UK.lbl("TOWER", 14, UK.GOLD))
	hg_tw_sub = UK.lbl("", 11, UK.MUTED)
	tv.add_child(hg_tw_sub)
	th.add_child(tv)
	var spc = Control.new()
	spc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	th.add_child(spc)
	th.add_child(UK.ico("ar_r", 20))
	twb.pressed.connect(func(): btnfx(); show_towers())
	v.add_child(twb)
	# panggung karakter
	var st = UK.hbox(8)
	st.alignment = BoxContainer.ALIGNMENT_CENTER
	var pv = UK.btn("ar_l", "", "n", Vector2(44, 60))
	pv.pressed.connect(func(): step_char(-1))
	st.add_child(pv)
	var box = PanelContainer.new()
	box.add_theme_stylebox_override("panel", UK.sb(Color("#141a2e"), Color("#343e66")))
	var ctl = Control.new()
	ctl.custom_minimum_size = Vector2(130, 130)
	ch_sprite = load("res://scripts/sprite_view.gd").new()
	ch_sprite.g = g
	ch_sprite.sc = 4.0
	ch_sprite.lit_anim = true
	ch_sprite.bob = true
	ch_sprite.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ctl.add_child(ch_sprite)
	ch_lock = UK.ico("lock", 36)
	ch_lock.position = Vector2(47, 47)
	ctl.add_child(ch_lock)
	ch_sel = UK.ico("check", 20)
	ch_sel.position = Vector2(104, 4)
	ctl.add_child(ch_sel)
	box.add_child(ctl)
	st.add_child(box)
	var nx = UK.btn("ar_r", "", "n", Vector2(44, 60))
	nx.pressed.connect(func(): step_char(1))
	st.add_child(nx)
	v.add_child(st)
	ch_name = UK.lbl("", 18, UK.GOLD, HORIZONTAL_ALIGNMENT_CENTER)
	v.add_child(ch_name)
	ch_role = UK.lbl("", 12, UK.MUTED, HORIZONTAL_ALIGNMENT_CENTER)
	v.add_child(ch_role)
	ch_buy = UK.btn("lock", "0", "gold", Vector2(0, 40))
	ch_buy.get_child(0).add_child(UK.ico("coin", 18))
	ch_buy.pressed.connect(func():
		if Prof.buy_char(D.CHARS[hg_view].id):
			sfx("power")
		else:
			sfx("nope")
		hangar_sync())
	v.add_child(ch_buy)
	# slot upgrade (geser horizontal)
	var sc = ScrollContainer.new()
	sc.custom_minimum_size = Vector2(0, 86)
	sc.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	hg_grid = UK.hbox(5)
	hg_grid.mouse_filter = Control.MOUSE_FILTER_PASS
	sc.add_child(hg_grid)
	v.add_child(sc)
	for k in D.UPGK:
		var b = Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(62, 80)
		var key: String = k
		b.pressed.connect(func(): btnfx(); hg_sel = key; hg_desc.visible = true; hangar_sync())
		var bv = UK.vbox(1)
		bv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		bv.alignment = BoxContainer.ALIGNMENT_CENTER
		var ic = UK.ico("gear", 30)
		ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		bv.add_child(ic)
		var pips = Control.new()
		pips.custom_minimum_size = Vector2(0, 6)
		bv.add_child(pips)
		var cl = UK.lbl("", 12, Color("#c9d6e6"), HORIZONTAL_ALIGNMENT_CENTER)
		bv.add_child(cl)
		b.add_child(bv)
		pips.draw.connect(func():
			var lv: int = b.get_meta("lv", 0)
			for i in D.UMAX:
				pips.draw_rect(Rect2(pips.size.x / 2 - (D.UMAX * 7 - 2) / 2.0 + i * 7, 1, 5, 4), Color("#ffd36b") if i < lv else Color("#3a3f4a")))
		hg_tiles[k] = {"b": b, "ic": ic, "pips": pips, "cost": cl}
		hg_grid.add_child(b)
	# deskripsi
	hg_desc = PanelContainer.new()
	hg_desc.add_theme_stylebox_override("panel", UK.sb(Color("#141a2e"), Color("#343e66"), 2, 3, 8))
	var dv = UK.vbox(6)
	var dh = UK.hbox(6)
	hg_dn = UK.lbl("", 15, UK.GOLD)
	hg_dn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dh.add_child(hg_dn)
	hg_dl = UK.lbl("", 13, UK.MUTED)
	dh.add_child(hg_dl)
	dv.add_child(dh)
	hg_stats = UK.vbox(1)
	dv.add_child(hg_stats)
	hg_dt = UK.lbl("", 12, Color("#c9d2e6"))
	hg_dt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hg_dt.custom_minimum_size = Vector2(300, 0)
	dv.add_child(hg_dt)
	hg_up = UK.btn("up", "", "gold", Vector2(0, 40))
	hg_up.get_child(0).add_child(UK.ico("coin", 18))
	hg_up.get_child(0).add_child(UK.lbl("0", 15))
	hg_up.pressed.connect(func():
		if Prof.buy_up(hg_sel):
			sfx("power")
		else:
			sfx("nope")
		hangar_sync())
	dv.add_child(hg_up)
	hg_desc.add_child(dv)
	hg_desc.visible = false
	v.add_child(hg_desc)
	hg_play = UK.btn("play", "", "gold", Vector2(0, 52), 28)
	hg_play.pressed.connect(func():
		if not Prof.prof().chars[D.CHARS[hg_view].id].own:
			return
		btnfx()
		Prof.prof().ch = D.CHARS[hg_view].id
		Prof.save_all()
		show_run())
	v.add_child(hg_play)

func up_info(k: String) -> Dictionary:
	if k == "main":
		var w = txt.weap[D.CHARS[hg_view].weap]
		return w
	return txt.upg[k]

func show_hangar(gain: bool) -> void:
	g.demo = false
	g.running = false
	show_screen("hg")
	var cid = Prof.prof().ch
	hg_view = 0
	for i in D.CHARS.size():
		if D.CHARS[i].id == cid:
			hg_view = i
	hg_sel = "main"
	hg_desc.visible = false
	hangar_sync()

func step_char(dir: int) -> void:
	btnfx()
	hg_view = (hg_view + dir + D.CHARS.size()) % D.CHARS.size()
	var c = D.CHARS[hg_view]
	if Prof.prof().chars[c.id].own:
		Prof.prof().ch = c.id
		Prof.save_all()
	hangar_sync()

func f1(v: float) -> String:
	return UK.fmt(v)

func stat_rows(k: String, lv: int) -> Array:
	var c = D.CHARS[hg_view]
	var L = clampi(lv, 0, D.UMAX)
	if k == "main":
		var W = D.WEAP[c.weap]
		var r = [["Damage", W.dmg[L]], ["Jangkauan", W.r[L]], ["Jeda tembak", W.cd[L], "s"]]
		if W.has("chain"):
			r.append(["Lompatan", W.chain[L]])
		if W.has("spl"):
			r.append(["Area ledak", W.spl[L]])
		var mul = 1.0
		if c.weap == "buddy":
			mul = 2.0 if L >= 5 else 1.0
		elif c.weap == "saw":
			mul = 3.0 if L >= 5 else (2.0 if L >= 3 else 1.0)
		r.append(["DPS", W.dmg[L] / W.cd[L] * mul])
		return r
	var P
	match k:
		"katana":
			P = D.PWD.katana
			return [["Damage", P.dmg[L]], ["Jangkauan", P.r[L]], ["Jeda tebas", P.cd[L], "s"], ["DPS", P.dmg[L] / P.cd[L]]]
		"orbit":
			P = D.PWD.orbit
			return [["Jumlah bilah", P.n[L]], ["Damage", P.dmg[L]], ["Radius putar", P.r[L]]]
		"shot":
			P = D.PWD.shot
			return [["Peluru", P.n[L]], ["Damage/peluru", P.dmg[L]], ["Jangkauan", P.rng[L]], ["Jeda tembak", P.cd[L], "s"], ["DPS", P.n[L] * P.dmg[L] / P.cd[L]]]
		"mini":
			P = D.PWD.mini
			return [["Roket", P.n[L]], ["Damage", P.dmg[L]], ["Jangkauan", P.rng[L]], ["Jeda tembak", P.cd[L], "s"], ["DPS", P.n[L] * P.dmg[L] / P.cd[L]]]
		"field":
			P = D.PWD.field
			return [["Damage/detik", P.dps[L]], ["Radius", P.r[L]]]
		"aura":
			return [["Radius", round(192 * (1 + .15 * L))], ["Dorongan", round(540 * (1 + .15 * L))], ["Damage", 5 * (1 + .15 * L)], ["Biaya batre", round(maxf(.3, .75 - .09 * L) * 100), "%"]]
		"bots":
			return [["Robot menyerang", L], ["Damage las/detik (tiap robot)", D.BOTW.dps[1]]]
		"hp":
			return [["HP maks", 10 + 2 * L]]
		"bat":
			return [["Waktu terbang", 20 + 4 * L, "s"], ["Isi ulang", 1.4 * (20 + 4 * L) / 20.0, "x"]]
		"jet":
			return [["Redam jatuh", round(D.JETF.red[L] * 100), "%"]]
	return []

func fill_stats(box: VBoxContainer, a: Array, b, lv: int, mx: bool, hide_zero := true) -> void:
	for c in box.get_children():
		c.queue_free()
	var hd = _stat_row("", "Lv %d" % lv, "MAKS" if mx else "Lv %d" % (lv + 1), true)
	box.add_child(hd)
	for i in a.size():
		var r = a[i]
		var u = r[2] if r.size() > 2 else ""
		var cur = "-" if (lv < 1 and hide_zero and r[0] != "") else _fv(r[1], u)
		var nx = "" if b == null else _fv(b[i][1], u)
		box.add_child(_stat_row(r[0], cur, nx, false))

func _fv(v, u: String) -> String:
	if v is String:
		return v
	return f1(float(v)) + u

func _stat_row(a: String, b: String, c: String, head: bool) -> HBoxContainer:
	var h = UK.hbox(4)
	var l0 = UK.lbl(a, 12, UK.MUTED)
	l0.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(l0)
	var l1 = UK.lbl(b, 12, UK.GOLD if head else UK.FG, HORIZONTAL_ALIGNMENT_RIGHT)
	l1.custom_minimum_size = Vector2(62, 0)
	h.add_child(l1)
	var l2 = UK.lbl(c, 12, UK.CYAN if not head else UK.GOLD, HORIZONTAL_ALIGNMENT_RIGHT)
	l2.custom_minimum_size = Vector2(62, 0)
	h.add_child(l2)
	return h

func hangar_sync() -> void:
	var p = Prof.prof()
	var c = D.CHARS[hg_view]
	var st = p.chars[c.id]
	var own = bool(st.own)
	var u = st.up
	hg_coins.text = str(p.coins)
	hg_prof.text = p.name
	var n = 0
	var aff = false
	for ty in D.TORDER:
		if Prof.tw_own(ty):
			n += 1
		elif p.coins >= D.TY[ty].uc:
			aff = true
	hg_tw_sub.text = "%d/%d terbuka%s" % [n, D.TORDER.size(), " · ada yang bisa dibuka" if aff else ""]
	ch_name.text = c.name
	ch_role.text = "%s · %s" % [c.role, D.WEAP[c.weap].name]
	ch_sprite.ch = c
	ch_sprite.lvl = u.main
	ch_sprite.own = own
	ch_lock.visible = not own
	ch_sel.visible = own and p.ch == c.id
	ch_buy.visible = not own
	if not own:
		UK.set_btn_text(ch_buy, 1, str(c.cost))
		ch_buy.modulate = Color(1, .6, .6) if p.coins < c.cost else Color.WHITE
	hg_play.disabled = not own
	for k in hg_tiles:
		var t = hg_tiles[k]
		var lv: int = u[k]
		var cap = Dev.up_cap(k, c.id)
		var mx = lv >= cap
		var cost = 0 if mx else Prof.up_cost(k, lv)
		var inf = up_info(k)
		t.ic.texture = Ic.tex(inf.icon)
		t.b.set_meta("lv", lv)
		t.pips.queue_redraw()
		t.cost.text = "" if mx else str(cost)
		t.cost.add_theme_color_override("font_color", Color("#c9d6e6") if (own and p.coins >= cost) else Color("#ff8a7a"))
		var bc = Color("#222a46")
		var bd = Color("#3c4670")
		if k == hg_sel:
			bd = Color("#ffc75a")
		elif own and not mx and p.coins >= cost:
			bd = Color("#c99a32")
		t.b.add_theme_stylebox_override("normal", UK.sb(bc, bd))
		t.b.add_theme_stylebox_override("pressed", UK.sb(bc.darkened(.2), bd))
		t.b.add_theme_stylebox_override("hover", UK.sb(bc.lightened(.06), bd))
		t.b.modulate = Color(.55, .55, .6) if not own else (Color(.8, .8, .8) if mx else Color.WHITE)
	var inf2 = up_info(hg_sel)
	var lv2: int = u[hg_sel]
	var cap2 = Dev.up_cap(hg_sel, c.id)
	var mx2 = lv2 >= cap2
	hg_dn.text = inf2.name
	hg_dl.text = "Lv %d/%d" % [lv2, cap2]
	hg_dt.text = inf2.desc
	fill_stats(hg_stats, stat_rows(hg_sel, lv2), null if mx2 else stat_rows(hg_sel, lv2 + 1), lv2, mx2, hg_sel != "main")
	hg_up.visible = own and not mx2
	if own and not mx2:
		var cst = Prof.up_cost(hg_sel, lv2)
		hg_up.get_child(0).get_child(2).text = str(cst)
		hg_up.modulate = Color(1, .6, .6) if p.coins < cst else Color.WHITE

# ---------------- katalog tower ----------------
func _build_towers() -> void:
	var v = _scroll_screen("tw")
	var top = UK.hbox(8)
	var bb = UK.btn("back", "", "n", Vector2(40, 36))
	bb.pressed.connect(func(): btnfx(); show_screen("hg"); hangar_sync())
	top.add_child(bb)
	var tt = UK.lbl("Tower", 16)
	tt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(tt)
	var cc = _coin_chip()
	tw_coins = cc[1]
	top.add_child(cc[0])
	v.add_child(top)
	var sc = ScrollContainer.new()
	sc.custom_minimum_size = Vector2(0, 92)
	sc.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tw_grid = UK.hbox(5)
	tw_grid.mouse_filter = Control.MOUSE_FILTER_PASS
	sc.add_child(tw_grid)
	v.add_child(sc)
	for ty in D.TORDER:
		var b = Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(66, 84)
		var key: String = ty
		b.pressed.connect(func(): btnfx(); tw_sel = key; tw_sync())
		var bv = UK.vbox(1)
		bv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		bv.alignment = BoxContainer.ALIGNMENT_CENTER
		var ic = UK.ico(tower_icon(ty), 30)
		ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		bv.add_child(ic)
		bv.add_child(UK.lbl(D.TY[ty].name, 11, UK.FG, HORIZONTAL_ALIGNMENT_CENTER))
		var cl = UK.lbl("", 11, Color("#c9d6e6"), HORIZONTAL_ALIGNMENT_CENTER)
		bv.add_child(cl)
		b.add_child(bv)
		tw_tiles[ty] = {"b": b, "ic": ic, "cost": cl}
		tw_grid.add_child(b)
	var box = PanelContainer.new()
	box.add_theme_stylebox_override("panel", UK.sb(Color("#141a2e"), Color("#343e66"), 2, 3, 8))
	var dv = UK.vbox(6)
	var dh = UK.hbox(6)
	tw_name = UK.lbl("", 16, UK.GOLD)
	tw_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dh.add_child(tw_name)
	tw_lvl = UK.lbl("", 13, UK.MUTED)
	dh.add_child(tw_lvl)
	dv.add_child(dh)
	tw_lvrow = UK.hbox(3)
	for i in range(1, D.TW.max + 1):
		var b = Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(28, 28)
		b.text = str(i)
		b.add_theme_font_size_override("font_size", 13)
		var n = i
		b.pressed.connect(func(): btnfx(); tw_lv = n; tw_sync())
		tw_lvb[i] = b
		tw_lvrow.add_child(b)
	dv.add_child(tw_lvrow)
	tw_prev = load("res://scripts/tower_preview.gd").new()
	tw_prev.g = g
	tw_prev.custom_minimum_size = Vector2(300, 150)
	dv.add_child(tw_prev)
	tw_need = UK.lbl("", 12, Color("#ff8a7a"))
	dv.add_child(tw_need)
	tw_buy = UK.btn("lock", "", "gold", Vector2(0, 40))
	tw_buy.get_child(0).add_child(UK.ico("coin", 18))
	tw_buy.get_child(0).add_child(UK.lbl("0", 15))
	tw_buy.pressed.connect(func():
		if Prof.buy_tower(tw_sel):
			sfx("power")
		else:
			sfx("nope")
		tw_sync())
	dv.add_child(tw_buy)
	tw_stats = UK.vbox(1)
	dv.add_child(tw_stats)
	tw_desc = UK.lbl("", 12, Color("#c9d2e6"))
	tw_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tw_desc.custom_minimum_size = Vector2(300, 0)
	dv.add_child(tw_desc)
	box.add_child(dv)
	v.add_child(box)

func tower_icon(ty: String) -> String:
	return "tower" if ty == "g" else ("flame" if ty == "f" else ty)

func show_towers() -> void:
	show_screen("tw")
	tw_sync()

func tw_rows(ty: String, L: int) -> Array:
	var Y = D.TY[ty]
	var r: Array = []
	var pc = func(a): return round(a * 100)
	match ty:
		"g": r = [["Damage", Y.dmg[L]], ["Jeda tembak", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"], ["Peluang kritis (2x)", pc.call(Y.crit[L]), "%"], ["DPS", Y.dmg[L] / Y.cd[L]]]
		"f": r = [["Damage/tick", Y.dmg[L]], ["Jeda tick", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", 100, "%"], ["DPS", Y.dmg[L] / Y.cd[L]], ["Sudut kerucut", round(Y.cone * 2 * 57.3), "°"]]
		"mortar": r = [["Damage", Y.dmg[L]], ["Area ledak", Y.spl[L]], ["Jeda tembak", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"], ["Titik buta", Y.min], ["DPS", Y.dmg[L] / Y.cd[L]]]
		"gatling": r = [["Damage", Y.dmg[L]], ["Jeda tembak", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"], ["DPS (jika kena)", Y.dmg[L] / Y.cd[L]], ["DPS rata-rata", Y.dmg[L] / Y.cd[L] * Y.acc[L]]]
		"sniper": r = [["Damage", Y.dmg[L]], ["Jeda tembak", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"], ["Titik buta", Y.min], ["DPS", Y.dmg[L] / Y.cd[L]]]
		"tesla": r = [["Damage", Y.dmg[L]], ["Lompatan", Y.jump[L]], ["Jeda sambar", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Peluang setrum", pc.call(Y.shock[L]), "%"], ["DPS (1 target)", Y.dmg[L] / Y.cd[L]]]
		"rocket": r = [["Damage", Y.dmg[L]], ["Jeda tembak", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"], ["DPS", Y.dmg[L] / Y.cd[L]]]
		"laser": r = [["Damage/detik", Y.dmg[L]], ["Maks (3x)", Y.dmg[L] * 3], ["Jangkauan", Y.rng[L]]]
		"emp": r = [["Damage", Y.dmg[L]], ["Lumpuh", Y.stun[L], "s"], ["Jeda denyut", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]]]
		"net": r = [["Tahan", Y.hold[L], "s"], ["Jeda lempar", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]], ["Akurasi", pc.call(Y.acc[L]), "%"]]
		"decoy": r = [["HP umpan", Y.hp[L]], ["Jangkauan pancing", Y.rng[L]]]
		"magnet": r = [["Jangkauan", Y.rng[L]], ["Bonus/kill", Y.bonus[L]], ["Dorongan", Y.push[L]], ["Jeda tarik", Y.pcd[L], "s"]]
		"repair": r = [["Pulih shield", Y.heal[L]], ["Pulih core", Y.core[L]], ["Jeda", Y.cd[L], "s"], ["Jangkauan", Y.rng[L]]]
		"solar": r = [["Isi jetpack", pc.call(Y.chg[L]), "%"], ["Suku cadang/fajar", Y.parts[L]]]
	r.append(["HP menara", Y.hp[L] if ty == "decoy" else Dev.tw_hp(ty, L)])
	r.append(["Core dibutuhkan", "Lv %d" % g.core_need(L)])
	return r

func tw_sync() -> void:
	var p = Prof.prof()
	tw_coins.text = str(p.coins)
	for ty in tw_tiles:
		var own = Prof.tw_own(ty)
		var t = tw_tiles[ty]
		t.cost.text = "Terbuka" if own else str(D.TY[ty].uc)
		var bd = Color("#3c4670")
		if ty == tw_sel:
			bd = Color("#ffc75a")
		elif not own and p.coins >= D.TY[ty].uc:
			bd = Color("#c99a32")
		t.b.add_theme_stylebox_override("normal", UK.sb(Color("#222a46"), bd))
		t.b.add_theme_stylebox_override("pressed", UK.sb(Color("#1a2038"), bd))
		t.b.add_theme_stylebox_override("hover", UK.sb(Color("#2a3252"), bd))
		t.b.modulate = Color.WHITE if own else Color(.6, .6, .68)
	for i in tw_lvb:
		var b = tw_lvb[i]
		var bd2 = Color("#ffc75a") if i == tw_lv else Color("#3c4670")
		b.add_theme_stylebox_override("normal", UK.sb(Color("#222a46"), bd2, 2, 2, 2))
		b.add_theme_stylebox_override("hover", UK.sb(Color("#2a3252"), bd2, 2, 2, 2))
		b.add_theme_stylebox_override("pressed", UK.sb(Color("#1a2038"), bd2, 2, 2, 2))
	var own2 = Prof.tw_own(tw_sel)
	tw_buy.visible = not own2
	tw_need.text = "" if own2 else "Terkunci: buka di bengkel dengan koin"
	if not own2:
		tw_buy.get_child(0).get_child(2).text = str(D.TY[tw_sel].uc)
		tw_buy.modulate = Color(1, .6, .6) if p.coins < D.TY[tw_sel].uc else Color.WHITE
	tw_name.text = D.TY[tw_sel].name
	tw_lvl.text = "Lv %d/%d" % [tw_lv, D.TW.max]
	tw_desc.text = txt.twinfo.get(tw_sel, "")
	tw_prev.ty = tw_sel
	tw_prev.lv = tw_lv
	tw_prev.queue_redraw()
	var a = tw_rows(tw_sel, tw_lv)
	var b2 = tw_rows(tw_sel, tw_lv + 1) if tw_lv < D.TW.max else null
	fill_stats(tw_stats, a, b2, tw_lv, tw_lv >= D.TW.max, false)
	var bc = maxi(2, int(round(D.TW.cost[0] * (D.TY[tw_sel].get("cost", 1.0)))))
	tw_stats.add_child(_stat_row("Buka di bengkel", "Gratis" if tw_sel in D.TWFREE else str(D.TY[tw_sel].uc), "", false))
	tw_stats.add_child(_stat_row("Bangun (tower pertama)", str(bc), "", false))
	tw_stats.add_child(_stat_row("Naik ke Lv %d" % mini(D.TW.max, tw_lv + 1), str(D.TW.up[tw_lv]) if tw_lv < D.TW.max else "-", "", false))

# ---------------- overlay jeda / hasil ----------------
func _build_overlay() -> void:
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)
	var dim = ColorRect.new()
	dim.color = Color(7 / 255.0, 8 / 255.0, 15 / 255.0, .78)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.add_child(dim)
	ov_box = _center(overlay, 280)
	overlay.visible = false

func show_ov(nodes: Array, btn_icon: String, fn: Callable, menu := false) -> void:
	for c in ov_box.get_children():
		c.queue_free()
	for n in nodes:
		ov_box.add_child(n)
	var row = UK.hbox(8)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	if menu:
		var bs = UK.btn("settings", "", "n", Vector2(44, 40))
		bs.pressed.connect(func():
			btnfx()
			overlay.visible = false
			open_settings(func(): overlay.visible = true))
		row.add_child(bs)
		var bh = UK.btn("home", "", "n", Vector2(44, 40))
		bh.pressed.connect(func(): btnfx(); overlay.visible = false; save_exit.emit())
		row.add_child(bh)
		var bf = UK.btn("flag", "", "red", Vector2(44, 40))
		bf.pressed.connect(func(): btnfx(); overlay.visible = false; surrender.emit())
		row.add_child(bf)
	var bb = UK.btn(btn_icon, "", "gold", Vector2(80, 44), 26)
	bb.pressed.connect(func(): btnfx(); overlay.visible = false; fn.call())
	row.add_child(bb)
	ov_box.add_child(row)
	overlay.visible = true

func stat_row_chips(pairs: Array) -> HBoxContainer:
	var h = UK.hbox(14)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	for p in pairs:
		var c = PanelContainer.new()
		c.add_theme_stylebox_override("panel", UK.sb(Color("#161b2e"), Color("#2e3658"), 2, 3, 4))
		var hh = UK.hbox(6)
		hh.add_child(UK.ico(p[0], 22))
		var l = UK.lbl(str(p[1]), 20, UK.FG)
		hh.add_child(l)
		c.add_child(hh)
		c.set_meta("lbl", l)
		h.add_child(c)
	return h

func show_pause() -> void:
	var ic = UK.ico("menu", 40)
	ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	show_ov([ic], "play", func(): resume_game.emit(), true)

func show_result(icon: String, nights: int, earn: int, bonus: int) -> void:
	var ic = UK.ico(icon, 48)
	ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var row = stat_row_chips([["coin", "+0"]])
	var nodes = [ic, stat_row_chips([["moon", nights], ["trophy", Prof.prof().best]]), row]
	if bonus > 0:
		nodes.append(stat_row_chips([["check", "+%d" % bonus]]))
	show_ov(nodes, "next", func(): show_hangar(earn > 0))
	var l: Label = row.get_child(0).get_meta("lbl")
	if earn <= 0:
		l.text = "+0"
		return
	var tw = create_tween()
	var T = minf(2.6, 1.0 + earn * .012)
	tw.tween_interval(.65)
	var steps = 40
	for i in range(1, steps + 1):
		var u = float(i) / steps
		var v = int(round(earn * (1 - pow(1 - u, 2))))
		tw.tween_callback(func():
			l.text = "+%d" % v
			if i % 3 == 0:
				var a = get_node_or_null("/root/Audio")
				if a:
					a.sfx("coin"))
		tw.tween_interval(T / steps)
	tw.tween_callback(func():
		l.text = "+%d" % earn
		sfx("jackpot"))
