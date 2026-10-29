extends "res://scripts/draw_scene.gd"
## Node utama permainan: membangun lapisan gambar, loop, input sentuh/keyboard, mulai/akhir run.

signal hud_changed
signal run_ended(kind: String, nights: int, earn: int, bonus: int)

var cam: Node2D
var l_world: Node2D
var l_glow: Node2D
var l_top: Node2D
var l_arrows: Node2D
var demo = false
var best_run = 0
var ptrs = {}                    # index -> {ox,oy,m,ref,by,jx,jy,noFly}
var ui_over: Callable = Callable()   # (Vector2) -> bool : apakah posisi ada di atas UI
var ui_blocking: Callable = Callable()
var save_acc = 0.0
const JR := 52.0

func _ready() -> void:
	randomize()
	init_draw()
	cam = Node2D.new()
	cam.name = "Cam"
	add_child(cam)
	l_world = _mk_layer("world")
	l_glow = _mk_layer("glow")
	var mat = CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	l_glow.material = mat
	l_top = _mk_layer("top")
	l_arrows = _mk_layer("arrows", false)
	vh = get_viewport().get_visible_rect().size.y
	get_viewport().size_changed.connect(_on_resize)
	reset()
	apply_view()
	running = false

func _mk_layer(mode: String, in_cam := true) -> Node2D:
	var n = Node2D.new()
	n.set_script(load("res://scripts/layer_node.gd"))
	n.g = self
	n.mode = mode
	n.name = mode
	if in_cam:
		cam.add_child(n)
	else:
		add_child(n)
	return n

func _on_resize() -> void:
	vh = get_viewport().get_visible_rect().size.y

func apply_view() -> void:
	frame_prep()
	var ze = slow_e()
	var zz = 1.0 + .12 * ze
	var pos = Vector2.ZERO
	if ze > 0 and s.get("slow") != null:
		var sl = s.slow
		var Wk = W
		var Hk = vh
		var fx = sl.x
		var fy = sl.y - cam_y
		var tx = clampf(Wk / 2 - fx * zz, Wk * (1 - zz), 0.0) * ze
		var ty = clampf(Hk * .45 - fy * zz, Hk * (1 - zz), 0.0) * ze
		pos = Vector2(tx, ty)
	var shk = minf(3.0, s.shake * 12) if (Prof.settings.shake and s.shake > 0) else 0.0
	if shk > 0:
		pos += Vector2(rnd(-shk, shk), rnd(-shk, shk))
	cam.position = pos
	cam.scale = Vector2(zz, zz)
	for n in [l_world, l_glow, l_top, l_arrows]:
		n.queue_redraw()

func _process(dt: float) -> void:
	dt = minf(.05, dt)
	if s.is_empty():
		return
	if running and not paused and not s.over:
		update(dt * (1 - .5 * slow_e()))
		if s.get("slow") != null:
			s.slow.t += dt
			if s.slow.t >= s.slow.T:
				s.slow = null
		save_acc += dt
		if save_acc > 4.0:
			save_acc = 0.0
			save_run()
	elif demo:
		home_tick(dt)
	else:
		s.anim += dt
		var au = get_node_or_null("/root/Audio")
		if au:
			au.thrust(false)
			au.charge(-1.0)
	apply_view()
	hud_changed.emit()

# ---------- run ----------
func start_run(len: int) -> void:
	demo = false
	reset()
	s.run = {"len": len}
	running = true
	paused = false
	card_hold = null
	Prof.clear_run()

func end_run() -> Array:
	var p = Prof.prof()
	var n: int = s.day - 1
	var earn: int = D.coins_for(n)
	p.coins += earn
	p.runs += 1
	if n > p.best:
		p.best = n
	if n > Prof.best:
		Prof.best = n
	Prof.save_all()
	return [n, earn]

func on_over_event() -> void:
	var r = end_run()
	Prof.clear_run()
	run_ended.emit("mechdown" if s.cause == "mech" else "coreoff", r[0], r[1], 0)

func on_win_event() -> void:
	var r = end_run()
	var b: int = D.run_bonus(s.run.len, r[0])
	Prof.prof().coins += b
	Prof.save_all()
	Prof.clear_run()
	run_ended.emit("trophy", r[0], r[1] + b, b)

func surrender() -> void:
	if s.over:
		return
	s.over = true
	paused = false
	var r = end_run()
	Prof.clear_run()
	run_ended.emit("flag", r[0], r[1], 0)

func can_play_input() -> bool:
	return running and not paused and not s.over and not demo

# ---------- input ----------
func sync_g() -> void:
	gk.l = 0
	gk.r = 0
	jet_in.on = false
	jet_in.x = 0.0
	jet_in.y = 0.0
	for p in ptrs.values():
		if p.m is String:
			if p.m == "L":
				gk.l = 1
			elif p.m == "R":
				gk.r = 1
			elif p.m == "J":
				jet_in.on = true
				jet_in.x = p.jx
				jet_in.y = p.jy

func clear_input() -> void:
	ptrs.clear()
	keys.l = 0; keys.r = 0; keys.thr = 0; keys.dn = 0
	sync_g()
	card_hold = null

func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey:
		_key(e)
		return
	if not can_play_input():
		return
	if e is InputEventScreenTouch:
		if e.pressed:
			if ui_over.is_valid() and ui_over.call(e.position):
				return
			ptrs[e.index] = {"ox": e.position.x, "oy": e.position.y, "m": 0, "ref": 0.0, "by": e.position.y, "jx": 0.0, "jy": 0.0, "noFly": false}
		else:
			ptrs.erase(e.index)
			sync_g()
	elif e is InputEventScreenDrag:
		var p = ptrs.get(e.index)
		if p == null:
			return
		if p.m is String and p.m == "J":
			var dx = e.position.x - p.ox
			var dy = e.position.y - p.oy
			p.jx = 0.0 if absf(dx) < 6 else clampf(dx / JR, -1.0, 1.0)
			p.jy = 0.0 if absf(dy) < 6 else clampf(dy / JR, -1.0, 1.0)
			sync_g()
			return
		p.by = maxf(p.by, e.position.y)
		if p.by - e.position.y > 26 and not p.noFly:
			if can_fly():
				p.m = "J"
				p.ox = e.position.x
				p.oy = e.position.y + 26
				p.jx = 0.0
				p.jy = -26.0 / JR
				sync_g()
				return
			p.noFly = true
		var dx2 = e.position.x - p.ox
		var T = 14.0
		if p.m is int:
			if absf(dx2) > T:
				p.m = "R" if dx2 > 0 else "L"
				p.ref = dx2
		elif p.m == "R":
			p.ref = maxf(p.ref, dx2)
			if dx2 < p.ref - T:
				p.m = "L"
				p.ref = dx2
		elif p.m == "L":
			p.ref = minf(p.ref, dx2)
			if dx2 > p.ref + T:
				p.m = "R"
				p.ref = dx2
		sync_g()

func _key(e: InputEventKey) -> void:
	var k = ""
	match e.physical_keycode:
		KEY_LEFT, KEY_A: k = "l"
		KEY_RIGHT, KEY_D: k = "r"
		KEY_UP, KEY_W, KEY_SPACE: k = "thr"
		KEY_DOWN, KEY_S: k = "dn"
		KEY_1: k = "o0"
		KEY_2: k = "o1"
		KEY_3: k = "o2"
		KEY_4: k = "o3"
		KEY_E: k = "blast"
	if k == "":
		return
	if k.begins_with("o"):
		if e.pressed and not e.echo:
			begin_hold(ctx_options_at(int(k.substr(1))), "kb")
		elif not e.pressed and card_hold != null and card_hold.get("pid") == "kb":
			card_hold = null
		return
	if k == "blast":
		if e.pressed and not e.echo and can_play_input():
			do_blast()
		return
	if e.pressed:
		if k == "thr" and not keys.thr and not can_fly():
			return
		keys[k] = 1
	else:
		keys[k] = 0

func ctx_options_at(i: int):
	var o = ctx_options()
	return o[i] if i < o.size() else null

## mulai menahan kartu; true bila berhasil memulai
func begin_hold(o, pid) -> bool:
	if not can_play_input() or o == null:
		return false
	if (o.kind == "hub" or o.kind == "page") and o.state == "ok":
		complete_hold(o)
		return false
	if o.state == "locked" or o.state == "poor":
		sfx("nope")
		return false
	if o.state != "ok":
		return false
	sfx("click")
	card_hold = {"key": o.key, "t": 0.0, "done": false, "pid": pid}
	return true

func release_hold(pid) -> void:
	if card_hold != null and card_hold.get("pid") == pid:
		card_hold = null

# ---------- layar utama (dunia hidup di belakang judul) ----------
func home_scene() -> void:
	reset()
	demo = true
	running = false
	paused = false
	s.t = D.DAY - 5
	s.m.x = CX + 40
	s.m.dir = -1
	for e in [[1, "g", 3], [4, "tesla", 2], [6, "mortar", 2], [7, "rocket", 2], [3, "f", 2]]:
		var t = s.towers[e[0]]
		t.ty = e[1]
		t.lv = e[2]
		t.hp = tower_max_hp(t)
	for k in 7:
		var d = spawn_drone("h" if k == 6 else "s", 30.0 + k * 48)
		d.y = rnd(120, 380)
		d.demo = k

func home_tick(dt: float) -> void:
	s.anim += dt
	for d in s.drones:
		d.ph += dt
		d.x += sin(s.anim * .4 + d.demo * 1.7) * 22 * dt
		d.y += cos(s.anim * .3 + d.demo) * 8 * dt
		if d.x < 10:
			d.x = W - 10
		if d.x > W - 10:
			d.x = 10.0
	for t in s.towers:
		if t.lv:
			t.ang = -PI / 2 + sin(s.anim * .7 + t.i) * .6

# ---------- simpan / lanjut ----------
const NOSAVE := ["job", "fetch", "claim", "tw", "sh", "dc", "tgt", "aim", "atkD"]
func _strip(v):
	if v is Dictionary:
		var o = {}
		for k in v:
			var x = v[k]
			if k is String and k in NOSAVE and (x is Dictionary or x is Array):
				continue
			o[k] = _strip(x)
		return o
	if v is Array:
		var a = []
		for x in v:
			a.append(_strip(x))
		return a
	return v

func save_run() -> void:
	if not running or s.is_empty() or s.over or demo:
		return
	var f = FileAccess.open(Prof.run_path(), FileAccess.WRITE)
	if f:
		f.store_string(var_to_str({"v": 1, "S": _strip(s)}))

func load_run() -> bool:
	var j = Prof.peek_run()
	if j == null:
		return false
	var p = Prof.prof()
	if j.has("ch") and p.chars.has(j.ch) and p.chars[j.ch].own:
		p.ch = j.ch
		Prof.save_all()
	demo = false
	reset()
	for k in j:
		s[k] = j[k]
	for k in ["missiles", "shells", "nets", "bul", "beams", "shots", "eshots", "slugs", "bolts", "fx", "waves", "rails", "saws", "nades", "slash", "slashMk"]:
		s[k] = []
	s.slow = null
	s.pick = null
	s.over = false
	for b in s.bots:
		b.job = null
		b.fetch = null
		b.atkD = null
		b.onsite = false
		if b.st == "fetch":
			b.st = "rest"
	for t in s.towers:
		t.tgt = null
	dmap = {}
	var mx = 0
	for d in s.drones:
		if d.has("uid"):
			dmap[d.uid] = true
			mx = maxi(mx, d.uid)
	_uid = maxi(_uid, mx + 1)
	if not s.has("run"):
		s.run = {"len": 0}
	card_hold = null
	cam_y = clampf(s.m.y - vh * .62, 0.0, camy_max())
	running = true
	paused = true
	return true
