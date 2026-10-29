extends Control
## Panel Dev / Balancing (UI). Logika ada di autoload Dev (dev.gd). Port dari UI di vdev.js.
var g
var app
var tab := "g"
var sel = {"enemy": "s", "tower": "g", "weapon": "weld"}
var held := false
var sure := false
var body: VBoxContainer
var tabs_box: HBoxContainer
var pause_btn: Button
var dev_btn: Button
var json_edit: TextEdit
var pv_labels: Array = []

func setup(game, a) -> void:
	g = game
	app = a
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var bg = ColorRect.new()
	bg.color = Color(10 / 255.0, 12 / 255.0, 22 / 255.0, .96)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var v = UK.vbox(6)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 8; v.offset_right = -8; v.offset_top = 8; v.offset_bottom = -8
	add_child(v)
	var h = UK.hbox(6)
	var t = UK.lbl("DEV", 16, UK.GOLD)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(t)
	pause_btn = UK.btn("", "Jeda", "dim", Vector2(90, 32))
	pause_btn.pressed.connect(_toggle_pause)
	h.add_child(pause_btn)
	var cb = UK.btn("", "Tutup", "n", Vector2(80, 32))
	cb.pressed.connect(close)
	h.add_child(cb)
	v.add_child(h)
	tabs_box = UK.hbox(4)
	v.add_child(tabs_box)
	var sc = ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	body = UK.vbox(6)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(body)
	visible = false
	# tombol DEV kecil di layar
	dev_btn = UK.btn("", "DEV", "dim", Vector2(46, 24))
	dev_btn.position = Vector2(8, 80)
	dev_btn.pressed.connect(toggle)
	get_parent().add_child.call_deferred(dev_btn)
	dev_btn.visible = Dev.cfg.btn

func sync_btn() -> void:
	dev_btn.visible = Dev.cfg.btn

func open() -> void:
	render()
	visible = true
	if Dev.cfg.pause and g.running and not g.paused and not g.s.over and not g.demo:
		g.paused = true
		held = true

func close() -> void:
	visible = false
	if held:
		held = false
		g.paused = false

func toggle() -> void:
	if visible:
		close()
	else:
		open()

func _toggle_pause() -> void:
	Dev.cfg.pause = not Dev.cfg.pause
	Dev.save_cfg()
	if not Dev.cfg.pause and held:
		held = false
		g.paused = false
	elif Dev.cfg.pause and g.running and not g.paused and not g.s.over and not g.demo:
		g.paused = true
		held = true
	render()

func _fmt(v) -> String:
	if v == null:
		return ""
	var a = absf(v)
	if a >= 100:
		return str(int(round(v)))
	if a >= 10:
		return str(snappedf(v, .1))
	return str(snappedf(v, .001))

func _num_edit(val, ph: String, cb: Callable, w := 70) -> LineEdit:
	var e = LineEdit.new()
	e.text = "" if val == null else str(val)
	e.placeholder_text = ph
	e.custom_minimum_size = Vector2(w, 28)
	e.add_theme_font_size_override("font_size", 12)
	e.text_changed.connect(cb)
	e.virtual_keyboard_type = LineEdit.KEYBOARD_TYPE_NUMBER_DECIMAL
	return e

func _section(t: String) -> void:
	body.add_child(UK.lbl(t, 12, UK.CYAN))

func _preview(c: String, id: String, k: String) -> String:
	var ml = Dev.max_lv(c, id)
	var pts: Array = []
	for L in [1, maxi(1, int(round(ml / 2.0))), ml]:
		if not (L in pts):
			pts.append(L)
	var out: Array = []
	for L in pts:
		out.append("Lv%d %s" % [L, _fmt(Dev.val(c, id, k, L))])
	return " · ".join(out)

func render() -> void:
	pv_labels.clear()
	for c in tabs_box.get_children():
		c.queue_free()
	for tdef in [["g", "Global"], ["enemy", "Musuh"], ["tower", "Tower"], ["weapon", "Senjata"]]:
		var b = UK.btn("", tdef[1], "gold" if tdef[0] == tab else "dim", Vector2(0, 30))
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var key: String = tdef[0]
		b.pressed.connect(func(): tab = key; sure = false; render())
		tabs_box.add_child(b)
	UK.set_btn_text(pause_btn, 0, "Jeda ON" if Dev.cfg.pause else "Jeda OFF")
	for c in body.get_children():
		c.queue_free()
	if tab == "g":
		_render_global()
	else:
		_render_ent(tab)

func _render_global() -> void:
	var G = Dev.cfg.g
	_section("Multiplier global (dikali setelah Layer 1)")
	for row in [["enemy", "Musuh (HP + damage)"], ["tower", "Tower (damage + HP)"], ["weapon", "Senjata (damage)"]]:
		var k: String = row[0]
		var h = UK.hbox(6)
		var l = UK.lbl(row[1], 12)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(l)
		var s = HSlider.new()
		s.min_value = .1
		s.max_value = maxf(G.rmax, G[k])
		s.step = .05
		s.value = G[k]
		s.custom_minimum_size = Vector2(100, 24)
		var e = _num_edit(G[k], "", func(_t): pass, 54)
		s.value_changed.connect(func(v):
			Dev.cfg.g[k] = v
			e.text = str(snappedf(v, .01))
			Dev.apply(); Dev.save_cfg(); _refresh_pv())
		e.text_changed.connect(func(t):
			var v = Dev.num_or_null(t)
			if v == null or v <= 0:
				return
			Dev.cfg.g[k] = v
			s.max_value = maxf(Dev.cfg.g.rmax, v)
			s.set_value_no_signal(v)
			Dev.apply(); Dev.save_cfg(); _refresh_pv())
		h.add_child(s)
		h.add_child(e)
		body.add_child(h)
	var hr = UK.hbox(6)
	var lr = UK.lbl("Batas maks slider", 12)
	lr.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hr.add_child(lr)
	hr.add_child(_num_edit(G.rmax, "", func(t):
		var v = Dev.num_or_null(t)
		if v != null and v > 0:
			Dev.cfg.g.rmax = v
			Dev.save_cfg(), 54))
	body.add_child(hr)
	_section("Simpan / pindahkan konfigurasi")
	json_edit = TextEdit.new()
	json_edit.custom_minimum_size = Vector2(0, 110)
	json_edit.add_theme_font_size_override("font_size", 11)
	body.add_child(json_edit)
	var bt = UK.hbox(6)
	var be = UK.btn("", "Ekspor", "n", Vector2(0, 32))
	be.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	be.pressed.connect(func():
		json_edit.text = JSON.stringify({"g": Dev.cfg.g, "e": Dev.cfg.e})
		DisplayServer.clipboard_set(json_edit.text))
	bt.add_child(be)
	var bi = UK.btn("", "Impor", "n", Vector2(0, 32))
	bi.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bi.pressed.connect(func():
		var j = JSON.parse_string(json_edit.text)
		if j is Dictionary:
			Dev.cfg.e = {"enemy": {}, "tower": {}, "weapon": {}}
			if Dev.clean(j):
				Dev.apply(); Dev.save_cfg(); render()
		else:
			json_edit.text = "JSON tidak valid")
	bt.add_child(bi)
	var br = UK.btn("", "Yakin reset?" if sure else "Reset semua", "red" if sure else "n", Vector2(0, 32))
	br.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	br.pressed.connect(func():
		if not sure:
			sure = true
			render()
			return
		sure = false
		Dev.reset_all()
		render())
	bt.add_child(br)
	body.add_child(bt)
	var bb = UK.btn("", "Tombol DEV: " + ("ON" if Dev.cfg.btn else "OFF"), "gold" if Dev.cfg.btn else "n", Vector2(0, 32))
	bb.pressed.connect(func():
		Dev.cfg.btn = not Dev.cfg.btn
		Dev.save_cfg()
		sync_btn()
		render())
	body.add_child(bb)

func _render_ent(c: String) -> void:
	var ids: Array = Dev.ids(c)
	var id: String = sel[c] if sel[c] in ids else ids[0]
	sel[c] = id
	var e = Dev.ent_cfg(c, id)
	var ml = Dev.max_lv(c, id)
	var h = UK.hbox(6)
	var lbl = UK.lbl({"enemy": "Musuh", "tower": "Tower", "weapon": "Senjata"}[c], 12)
	h.add_child(lbl)
	var ob = OptionButton.new()
	ob.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for i in ids.size():
		ob.add_item(Dev.ent_name(c, ids[i]), i)
		if ids[i] == id:
			ob.select(i)
	ob.item_selected.connect(func(i): sel[c] = ids[i]; render())
	h.add_child(ob)
	body.add_child(h)
	var hm = UK.hbox(6)
	var lm = UK.lbl("Level maksimal (1-%d)" % Dev.HARD[c], 12)
	lm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hm.add_child(lm)
	hm.add_child(_num_edit(null if (e == null or e.maxLv == null) else e.maxLv, str(Dev.LV[c]), func(t):
		var v = Dev.num_or_null(t)
		var en = Dev.ent_make(c, id)
		en.maxLv = null if v == null else clampi(int(round(v)), 1, Dev.HARD[c])
		Dev.apply(); Dev.save_cfg(); _refresh_pv()))
	body.add_child(hm)
	for s in Dev.stats(c, id):
		var q = {}
		if e != null and e.st.has(s.k):
			q = e.st[s.k]
		_section(s.label)
		var gr = GridContainer.new()
		gr.columns = 4
		gr.add_theme_constant_override("h_separation", 4)
		for f in [["min", "Min (Lv 1)", Dev.orig(c, id, s.k, 1)], ["max", "Max (Lv maks)", Dev.orig(c, id, s.k, ml)], ["curve", "Kurva", "asli"], ["mul", "Faktor/level", "-"]]:
			var cell = UK.vbox(1)
			cell.add_child(UK.lbl(f[1], 9, UK.MUTED))
			var key: String = f[0]
			var sk: String = s.k
			var ph = _fmt(f[2]) if f[2] is float or f[2] is int else str(f[2])
			cell.add_child(_num_edit(q.get(key), ph, func(t):
				var v = Dev.num_or_null(t)
				var en = Dev.ent_make(c, id)
				if not en.st.has(sk):
					en.st[sk] = {"min": null, "max": null, "curve": null, "mul": null}
				en.st[sk][key] = v
				Dev.apply(); Dev.save_cfg(); _refresh_pv(), 66))
			gr.add_child(cell)
		body.add_child(gr)
		var pv = UK.lbl(_preview(c, id, s.k), 11, Color("#c9d2e6"))
		pv.set_meta("pv", [c, id, s.k])
		pv_labels.append(pv)
		body.add_child(pv)
	var rb = UK.btn("", "Reset " + Dev.ent_name(c, id), "n", Vector2(0, 32))
	rb.pressed.connect(func():
		Dev.cfg.e[c].erase(id)
		Dev.apply(); Dev.save_cfg(); render())
	body.add_child(rb)

func _refresh_pv() -> void:
	for l in pv_labels:
		if is_instance_valid(l):
			var m = l.get_meta("pv")
			l.text = _preview(m[0], m[1], m[2])
