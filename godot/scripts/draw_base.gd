extends "res://scripts/sim_update.gd"
## Gambar bagian 1: alat gambar piksel + lingkungan, robot, drone, mekanik, crane, inti. Port dari vc.js.
## Semua koordinat dunia; kamera hanya bergeser vertikal (cam_y). R() meniru ctx.fillRect berbasis K=1.5.

var ci: CanvasItem            # kanvas yang sedang digambar (utama, glow, atas)
var ga = 1.0                 # "globalAlpha"
var _colc = {}
var light_tex: GradientTexture2D
var stars: Array = []
var clouds: Array = []
var far_city: Array = []
var mid_city: Array = []
var layer_tex = {}
var ug_tex: ImageTexture
var font: Font
const UG0 := 14.0
const CLOUD := [[0, 7, 26, 5], [5, 3, 13, 6], [12, 0, 11, 7], [19, 4, 13, 7], [26, 7, 10, 4]]
const DBODY := {"s": ["#2d3340", "#3a3326", "#26333a", "#33263a"], "h": ["#2d3340", "#3a2e26", "#283a2e"], "b": ["#2d3340", "#2a2840"], "m": ["#3b2c34", "#2c3b34"]}
const MAINC := [null, "#8ff0ff", "#7dff9a", "#c8ff6a", "#ff7ae6", "#ffd36b"]

func init_draw() -> void:
	font = ThemeDB.fallback_font
	for i in 130:
		stars.append({"x": rnd(0, 360), "y": rnd(0, 900), "p": rnd(0, 6), "sp": rnd(1.2, 4.2), "big": randf() < .14, "col": ["#ffffff", "#cfe3ff", "#fff1c9"][int(randf() * 3)]})
	for i in 9:
		clouds.append({"x": rnd(-40, 360), "y": rnd(30, 330), "s": rnd(.8, 1.7), "sp": rnd(2, 6), "k": i >= 5, "seed": i})
	far_city = mk_city(400, 80, 220, 20, 40)
	mid_city = mk_city(400, 50, 140, 20, 38)
	var g = Gradient.new()
	g.offsets = PackedFloat32Array([0.0, .35, 1.0])
	g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, .4), Color(1, 1, 1, 0)])
	light_tex = GradientTexture2D.new()
	light_tex.gradient = g
	light_tex.fill = GradientTexture2D.FILL_RADIAL
	light_tex.fill_from = Vector2(.5, .5)
	light_tex.fill_to = Vector2(1.0, .5)
	light_tex.width = 128
	light_tex.height = 128

func mk_city(span: float, min_h: float, max_h: float, min_w: float, max_w: float) -> Array:
	var a: Array = []
	var x = -8.0
	while x < span:
		var w = rj(rnd(min_w, max_w))
		var h = rj(rnd(min_h, max_h))
		a.append({"x": x, "w": w, "h": h, "st": rnd(.3, .6) if randf() < .5 else 0.0, "seed": int(rnd(0, 99))})
		x += w + rj(rnd(-3, 5))
	return a

# ---------- alat gambar ----------
func cc(c) -> Color:
	if c is Color:
		return c
	if _colc.has(c):
		return _colc[c]
	var o: Color
	if c.begins_with("rgba("):
		var p = c.substr(5, c.length() - 6).split(",")
		o = Color(float(p[0]) / 255.0, float(p[1]) / 255.0, float(p[2]) / 255.0, float(p[3]))
	else:
		o = Color(c)
	_colc[c] = o
	return o

func sn(v: float) -> float:
	return floorf(v * K + .5) / K

func R(x: float, y: float, w: float, h: float, c) -> void:
	var k = cc(c)
	if ga != 1.0:
		k.a *= ga
	var x0 = sn(x)
	var y0 = sn(y - cam_y)
	ci.draw_rect(Rect2(x0, y0, sn(x + w) - x0, sn(y - cam_y + h) - y0), k)

func H(x: float, y: float, w: float, h: float, c: String, lv: float) -> void:
	var k = Color(1, 1, 1, lv / 16.0) if c == "#fff" else Color(0, 0, 0, lv / 16.0)
	k.a *= ga
	ci.draw_rect(Rect2(x, y - cam_y, w, h), k)

func bar(x: float, y: float, w: float, f: float, c) -> void:
	R(x - w / 2 - 1, y - 1, w + 2, 4, "#0d0f1a")
	R(x - w / 2, y, maxf(1.0, rj(w * f)), 2, c)

func line(x1: float, y1: float, x2: float, y2: float, c, j := 0.0) -> void:
	var k = cc(c)
	if ga != 1.0:
		k.a *= ga
	if j > 0:
		var n = maxi(1, int(ceil(hyp(x2 - x1, y2 - y1) / 4.0)))
		var pts = PackedVector2Array()
		var vert = absf(y2 - y1) > absf(x2 - x1)
		for i in n + 1:
			var t = float(i) / n
			var o = (randf() - .5) * j if i > 0 and i < n else 0.0
			pts.append(Vector2(x1 + (x2 - x1) * t + (o if vert else 0.0), y1 + (y2 - y1) * t - cam_y + (0.0 if vert else o)))
		ci.draw_polyline(pts, k, 2.0)
	else:
		ci.draw_line(Vector2(x1, y1 - cam_y), Vector2(x2, y2 - cam_y), k, 2.0)

func qa(a: float) -> float:
	return rj(clampf(a, 0.0, 1.0) * 4) / 4.0

func px_circle(cx: float, cy: float, r: float, c, on := 0.0, off := 0.0, ph := 0.0) -> void:
	if r < 1:
		return
	var k = cc(c)
	if ga != 1.0:
		k.a *= ga
	var ctr = Vector2(cx, cy - cam_y)
	if on > 0 and off > 0:
		var per = on + off
		var n = int(ceil(TAU * r / per))
		var seg = on / r
		var a0 = fmod(ph, per) / r
		for i in n:
			var a = a0 + i * per / r
			ci.draw_arc(ctr, r, a, a + seg, 6, k, 0.8)
	else:
		ci.draw_arc(ctr, r, 0, TAU, maxi(16, int(r * 1.0)), k, 0.8)

func light_at(x: float, y: float, r: float, rgb: Color, a: float) -> void:
	if a <= .01:
		return
	ci.draw_texture_rect(light_tex, Rect2(x - r, y - cam_y - r, r * 2, r * 2), false, Color(rgb.r, rgb.g, rgb.b, minf(1.0, a)))

func rgbs(s2: String) -> Color:
	var p = s2.split(",")
	return Color(float(p[0]) / 255.0, float(p[1]) / 255.0, float(p[2]) / 255.0)

func outline(x: float, y: float, w: float, h: float, c) -> void:
	R(x, y, w, 1, c); R(x, y + h - 1, w, 1, c); R(x, y, 1, h, c); R(x + w - 1, y, 1, h, c)

func mixs(a, b, t: float) -> Color:
	return D.mixc(a, b, t)

# ---------- kota di kejauhan (cache per warna) ----------
func layer(arr: Array, f: float, colr: Color, win: Color, div: float, id: String) -> void:
	var gsc = vh - D.BOT
	var base = rj(gsc + f * (camy_max() - cam_y))
	ci.draw_rect(Rect2(0, base + 4, 360, vh - base), colr)
	var key = colr.to_html() + win.to_html()
	var L = layer_tex.get(id)
	if L == null or L.key != key:
		var mh = 0.0
		for b in arr:
			mh = maxf(mh, b.h + (rj(b.h * b.st * .5) + 6 if b.st > 0 else 0))
		mh += 4
		var sc = K / div
		var img = Image.create_empty(int(ceil(360 * sc)), int(ceil((mh + 8) * sc)), false, Image.FORMAT_RGBA8)
		var fr = func(x: float, y: float, w: float, h: float, col: Color):
			img.fill_rect(Rect2i(int(floor(x * sc)), int(floor(y * sc)), maxi(1, int(ceil(w * sc))), maxi(1, int(ceil(h * sc)))), col)
		for b in arr:
			var x: float = b.x
			var top: float = mh - b.h
			fr.call(x, top, b.w, b.h + 8, colr)
			if b.st > 0:
				var sh = rj(b.h * b.st * .5)
				fr.call(x + 2, top - sh, rj(b.w * .5), sh + 1, colr)
				fr.call(x + 3, top - sh - 5, 1, 5, colr)
			var shade = Color(colr.r * .78, colr.g * .78, colr.b * .78, 1.0)
			fr.call(x + rj(b.w * .62), top, ceil(b.w * .38), b.h + 8, shade)
			var wy: float = top + 4
			while wy < mh - 2:
				var wx: float = x + 3
				while wx < x + b.w - 3:
					if int((wx + wy + b.seed) * 13) % 7 < 3:
						fr.call(wx, wy, 2, 3, win)
					wx += 5
				wy += 7
		L = {"key": key, "tex": ImageTexture.create_from_image(img), "mh": mh, "h": img.get_height()}
		layer_tex[id] = L
	ci.draw_texture_rect(L.tex, Rect2(0, base - L.mh, 360, L.h * div / K), false)

# ---------- bawah tanah ----------
func underground_tex() -> ImageTexture:
	if ug_tex != null:
		return ug_tex
	var Hh: float = D.BOT - UG0
	var img = Image.create_empty(int(round(360 * K)), int(round(Hh * K)), false, Image.FORMAT_RGBA8)
	var P = func(x: float, y: float, w: float, h: float, col):
		var x0 = int(floor(x * K + .5))
		var y0 = int(floor(y * K + .5))
		img.fill_rect(Rect2i(x0, y0, maxi(1, int(floor((x + w) * K + .5)) - x0), maxi(1, int(floor((y + h) * K + .5)) - y0)), cc(col))
	var sd = [777]
	var r = func():
		sd[0] = (sd[0] * 1664525 + 1013904223) & 0xFFFFFFFF
		return float(sd[0]) / 4294967296.0
	var strata = [[0, ["#3b2f25", "#362b22", "#41342a"]], [22, ["#4b3a2b", "#45352a", "#51402f"]], [52, ["#5a4635", "#534131", "#624d3a"]], [86, ["#3d414c", "#373b46", "#454955"]]]
	var cy = 0
	while cy < Hh:
		var cx = 0
		while cx < 360:
			var yy: float = cy + sin(cx * .13) * 3 + sin(cx * .047 + 2) * 4
			var si = 0
			for k in strata.size():
				if yy >= strata[k][0]:
					si = k
			P.call(cx, cy, 6, 6, strata[si][1][int(r.call() * 3)])
			cx += 6
		cy += 6
	for i in 150:
		var x = int(r.call() * 360)
		var y = int(r.call() * Hh)
		var w = 1 + int(r.call() * 3)
		var h = 1 + int(r.call() * 2)
		var q: float = r.call()
		P.call(x, y, w, h, "#76664f" if q < .45 else "#241b14" if r.call() < .6 else "#8a7a62")
	for i in 10:
		var x = int(r.call() * 360)
		var y = int(r.call() * (Hh - 10))
		P.call(x, y, 4 + int(r.call() * 5), 3, "#6a6d78")
		P.call(x + 1, y, 2, 1, "#8e92a0")
	var x = 10
	while x < 360:
		var cx = x
		var Ln = 10 + int(r.call() * 22)
		for y in Ln:
			if r.call() < .25:
				cx += -1 if r.call() < .5 else 1
			P.call(cx, y, 1, 1, "#2b1e14")
			if y > 5 and r.call() < .08:
				P.call(cx + 1, y, 2, 1, "#2b1e14")
		x += 20 + int(r.call() * 16)
	var pipe = func(y: float, h: float, body, hi, shd, gap):
		for xx in 360:
			if gap != null and xx > gap[0] and xx < gap[1]:
				continue
			P.call(xx, y, 1, h, body)
		P.call(0, y, 360, 1, hi)
		P.call(0, y + h - 1, 360, 1, shd)
		var px = 18
		while px < 360:
			P.call(px, y - 2, 4, h + 4, "#7a808c")
			P.call(px, y - 2, 4, 1, "#a0a6b2")
			px += 58
		for i in 9:
			P.call(int(r.call() * 360), y + 1 + int(r.call() * (h - 2)), 2 + int(r.call() * 3), 1, "#8a5a3a")
	pipe.call(30, 7, "#59606c", "#8a909c", "#3a3f4a", [120, 134])
	pipe.call(70, 5, "#8a5a3a", "#b4784a", "#5a3a24", null)
	P.call(120, 26, 14, 15, "#2a2c35"); P.call(121, 27, 12, 13, "#1a1b21")
	for i in 4:
		P.call(122 + i * 3, 28, 1, 11, "#3a3f4a")
	P.call(CX - 2, 0, 4, 46, "#3a3f4a"); P.call(CX - 2, 0, 1, 46, "#59606c"); P.call(CX, 0, 1, 46, "#1d2e3a")
	var yy2 = 4
	while yy2 < 44:
		P.call(CX - 3, yy2, 6, 2, "#6a707c")
		yy2 += 9
	P.call(CX - 17, 46, 34, 18, "#3f4450"); P.call(CX - 17, 46, 34, 2, "#6a707c"); P.call(CX - 17, 62, 34, 2, "#262a33")
	P.call(CX - 13, 50, 12, 9, "#10202a"); P.call(CX - 12, 51, 10, 7, "#1d4a5c"); P.call(CX - 12, 51, 10, 1, "#5ad1e6")
	for i in 3:
		P.call(CX + 3 + i * 4, 51, 3, 3, ["#7dff9a", "#ffd36b", "#5ad1e6"][i])
	P.call(CX + 3, 56, 12, 2, "#262a33")
	P.call(52, 42, 12, 15, "#7a4a3a"); P.call(52, 42, 12, 2, "#9a6a52"); P.call(52, 47, 12, 1, "#4a2a20"); P.call(52, 52, 12, 1, "#4a2a20")
	P.call(46, 56, 8, 3, "#4d525c"); P.call(64, 54, 6, 5, "#6a5a3a")
	P.call(295, 88, 6, 12, "#6a707c"); P.call(292, 91, 12, 6, "#6a707c"); P.call(294, 90, 8, 8, "#59606c"); P.call(296, 92, 4, 4, "#3d414c")
	P.call(148, 96, 18, 10, "#6a4a2a"); P.call(148, 96, 18, 2, "#8a6a3a"); P.call(149, 100, 16, 1, "#4a3018"); P.call(156, 96, 2, 10, "#4a3018")
	var i2 = 0
	while i2 < Hh:
		var a: float = float(i2) / Hh * .5
		for yy in range(int(i2 * K), mini(int((i2 + 4) * K), img.get_height())):
			for xx in img.get_width():
				var px2 = img.get_pixel(xx, yy)
				img.set_pixel(xx, yy, px2.darkened(a))
		i2 += 4
	ug_tex = ImageTexture.create_from_image(img)
	return ug_tex

# ---------- inti energi ----------
func draw_core_barrel() -> void:
	var lv: int = s.coreLv
	var an: float = s.anim
	R(CX - 15, GW - 5, 30, 5, "#4a4f58"); R(CX - 15, GW - 5, 30, 1, "#7d838e")
	R(CX - 11, GW - 9, 22, 4, "#5c616b"); R(CX - 11, GW - 9, 22, 1, "#9aa1ad")
	R(CX - 11, GW - 25, 3, 16, "#3d4048"); R(CX + 8, GW - 25, 3, 16, "#3d4048"); H(CX - 15, GW - 5, 30, 5, "#000", 6); H(CX + 3, GW - 9, 8, 4, "#000", 5)
	R(CX - 12, GW - 27, 24, 3, "#6a707c"); R(CX - 12, GW - 27, 24, 1, "#9aa1ad")
	if lv >= 2:
		R(CX - 20, GW - 13, 5, 9, "#3d4048"); R(CX + 15, GW - 13, 5, 9, "#3d4048"); R(CX - 19, GW - 12, 3, 7, "#c9a22a"); R(CX + 16, GW - 12, 3, 7, "#c9a22a")
		R(CX - 19, GW - 12 + int(an * 4) % 6, 3, 1, "#fff2b0"); R(CX + 16, GW - 12 + int(an * 4 + 3) % 6, 3, 1, "#fff2b0")
		R(CX - 17, GW - 5, 34, 2, "#5c616b"); R(CX - 12, GW - 26, 24, 1, "#8ff0ff"); R(CX - 20, GW - 17, 5, 1, "#8ff0ff"); R(CX + 15, GW - 17, 5, 1, "#8ff0ff")
	if lv >= 3:
		R(CX - 1, GW - 36, 2, 9, "#9aa1ad"); R(CX - 2, GW - 37, 4, 1, "#ff5a4a" if int(an * 3) % 2 else "#7a2a2a")
		var da = int(an * 2) % 4
		R(CX + 4 - da % 2, GW - 33, 5, 1, "#cfd6e2"); R(CX + 5, GW - 34, 3, 1, "#8e99a8"); R(CX + 6, GW - 32, 1, 5, "#6a707c")
		R(CX - 9, GW - 23, 1, 12, "#8ff0ff"); R(CX + 8, GW - 23, 1, 12, "#8ff0ff")
	if lv >= 4:
		R(CX - 13, GW - 28, 26, 1, "#e6c24a"); R(CX - 14, GW - 7, 3, 3, "#e6c24a"); R(CX + 11, GW - 7, 3, 3, "#e6c24a")
		R(CX - 8, GW - 33, 1, 6, "#e6c24a"); R(CX + 7, GW - 33, 1, 6, "#e6c24a"); R(CX - 9, GW - 34, 3, 1, "#fff2b0"); R(CX + 6, GW - 34, 3, 1, "#fff2b0")
		R(CX - 11, GW - 27, 22, 1, "#fff2b0")
		ga = .6
		px_circle(CX, GW - 17, 13 + rj(sin(an * 3)), "#8ff0ff", 3, 3, an * 10)
		ga = 1.0
		for i in 3:
			var a: float = an * 2 + i * 2.094
			R(CX + cos(a) * 13 - 1, GW - 17 + sin(a) * 6 - 1, 3, 3, "#e6fbff")

func draw_flame() -> void:
	var f: float = s.hp / s.maxHp
	var low: bool = f < .3
	var pu = int(s.anim * 6) % 3
	var colr = "#ffffff" if s.coreHit > 0 else (("#ff5a4a" if int(s.anim * 5) % 2 else "#8a3a3a") if low else "#5ad1e6")
	var hi = "#ffb0a0" if low else "#e6fbff"
	var r = 3 + rj(4 * f) + (1 if pu == 0 else 0)
	ga = .35
	R(CX - 8, GW - 24, 16, 15, "#8ff0ff")
	ga = 1.0
	R(CX - r, GW - 17 - r, 2 * r, 2 * r, colr)
	R(CX - rj(r * .55), GW - 17 - rj(r * .55), rj(r * 1.1), rj(r * 1.1), hi)

func draw_bot(b: Dictionary) -> void:
	var x: float = b.x
	var y: float = b.y
	var w: int = 1 if (b.mv and int(s.anim * 10 + b.ph) % 2) else 0
	var fly: bool = y < GW - 1
	R(x - 3, y - 6 - w, 7, 4, "#d8a02a"); R(x - 2, y - 9 - w, 5, 3, "#e8c04a"); R(x, y - 11 - w, 1, 2, "#9aa1ad")
	R(x - 3, y - 2, 2, 2, "#2a2a30"); R(x + 2, y - 2, 2, 2, "#2a2a30"); R(x - 3, y - 5 - w, 7, 1, "#9a6a1a")
	H(x + 1 if sun.x <= x else x - 3, y - 6 - w, 3, 4, "#000", 5)
	if fly:
		R(x - 4, y - 13, 9, 1, "#9aa1ad" if int(s.anim * 30) % 2 else "#59606c"); R(x - 1, y - 12, 3, 1, "#59606c"); R(x - 1, y, 3, 2, "#ffb347" if int(s.anim * 20) % 2 else "#ff7a3d")
	if b.fighter:
		R(x - 3, y - 8 - w, 7, 1, "#ff5a4a")
	if b.carry:
		R(x - 2, y - 14, 4, 3, "#a9bccf")
	if b.st == "dig" and int(s.anim * 8) % 2:
		R(x + b.dir * 5, y - 4, 2, 2, "#fff6c8")
	if ((b.st == "weld" and not b.mv) or b.onsite) and int(s.anim * 12) % 2:
		R(x + b.dir * 5, y - 5, 2, 2, "#8ff0ff")
	if b.attach and int(s.anim * 14) % 2:
		R(x - 2, y - 15, 5, 2, "#fff6c8"); R(x - 1, y - 17, 3, 2, "#8ff0ff")

func drone_face(d: Dictionary) -> int:
	return 1 if ((s.m.x if d.chase else CX + d.ox) >= d.x) else -1

func draw_drone(d: Dictionary) -> void:
	var sk: bool = d.shock > 0
	var x: float = d.x + (rj(rnd(-2, 2)) if sk else 0.0)
	var y: float = d.y + rj(sin(d.ph * 3)) + (rj(rnd(-2, 2)) if sk else 0.0)
	var f = int(d.ph * 14) % 2
	var v: int = d.v
	var cls: String = "b" if d.boss else "h" if d.heavy else "m" if d.swarm else "s"
	var c = "#e6f6ff" if (d.hit > 0 or (sk and int(s.anim * 16) % 3 == 0)) else ("#4a3f72" if d.slow else DBODY[cls][v])
	var rA = "#8e99a8" if f else "#59606c"
	var rB = "#59606c" if f else "#8e99a8"
	var M = "#59606c"
	var T = "#3a4252"
	var fd = drone_face(d)
	var P = func(ox: float, oy: float, w: float, h: float, col):
		R(x + ox if fd > 0 else x - ox - w + 1, y + oy, w, h, col)
	if cls == "m":
		if v == 0:
			R(x - 2, y - 1, 5, 3, c); R(x - 1, y - 2, 3, 1, T); R(x - 3, y - 3, 2, 1, rA); R(x + 1, y - 3, 2, 1, rB)
		else:
			R(x - 2, y - 1, 4, 2, c); R(x - 1, y - 2, 2, 1, T); R(x - 2, y + 1, 1, 1, M); R(x + 1, y + 1, 1, 1, M); R(x - 2, y - 3, 5, 1, rA)
	elif cls == "b":
		if v == 0:
			R(x - 12, y - 4, 25, 9, c); R(x - 10, y - 6, 21, 2, T); R(x - 8, y + 5, 17, 2, M); R(x - 3, y + 7, 7, 2, "#2a2e38")
			for rx in [-16, -8, 8, 15]:
				R(x + rx - 4, y - 9, 8, 1, rA if f else M); R(x + rx, y - 8, 1, 4, M)
			R(x - 13, y - 2, 2, 5, M); R(x + 12, y - 2, 2, 5, M); H(x - 12, y + 1, 25, 4, "#000", 7)
		else:
			R(x - 14, y - 1, 29, 4, c); R(x - 11, y - 3, 23, 2, T); R(x - 16, y, 2, 2, M); R(x + 15, y, 2, 2, M)
			R(x - 5, y - 6, 11, 3, M); R(x - 4, y - 7, 9, 1, "#8e99a8"); R(x - 3, y - 8, 7, 1, "#b9c2cc")
			R(x - 10, y + 3, 21, 2, "#2a2e38"); R(x - 6, y + 5, 13, 1, "#1d2028"); H(x - 14, y + 1, 29, 2, "#000", 6)
			for bx in [-9, -1, 7]:
				R(x + bx, y + 6, 2, 2 + int(d.ph * 6 + bx) % 2, M)
	elif cls == "h":
		if v == 0:
			R(x - 6, y - 2, 13, 5, c); R(x - 5, y - 3, 11, 1, T)
			R(x - 10, y - 5, 8, 1, rA); R(x + 3, y - 5, 8, 1, rB)
			R(x - 8, y - 4, 1, 3, M); R(x + 8, y - 4, 1, 3, M); R(x - 3, y + 3, 7, 1, M); H(x - 6, y + 1, 13, 2, "#000", 7)
		elif v == 1:
			R(x - 6, y - 2, 13, 4, c); R(x - 5, y - 3, 11, 1, T); R(x - 2, y - 4, 5, 1, T)
			R(x - 12, y - 5, 6, 1, rA); R(x + 7, y - 5, 6, 1, rB); R(x - 9, y - 4, 4, 1, M); R(x + 6, y - 4, 4, 1, M); R(x - 9, y - 4, 1, 2, M); R(x + 9, y - 4, 1, 2, M)
			R(x - 6, y + 2, 1, 3, M); R(x - 7, y + 4, 2, 1, "#8e99a8"); R(x + 6, y + 2, 1, 3, M); R(x + 6, y + 4, 2, 1, "#8e99a8")
			R(x - 2, y + 2, 5, 2, "#6b5a3a"); R(x - 2, y + 2, 5, 1, "#8a7a50"); H(x - 6, y, 13, 2, "#000", 6)
		else:
			P.call(-7, -1, 13, 4, c); P.call(-6, -2, 10, 1, T); P.call(4, -2, 3, 2, "#59707c"); P.call(5, -1, 2, 1, "#8fb4c4")
			P.call(-11, 0, 4, 1, M); P.call(-12, -2, 1, 4, "#8e99a8" if f else M)
			R(x - 9, y - 4, 19, 1, rA); R(x, y - 3, 1, 2, M)
			P.call(-1, 3, 3, 2, "#2a2e38"); P.call(2, 4, 3, 1, M); H(x - 7, y + 1, 13, 2, "#000", 6)
	else:
		if v == 0:
			R(x - 4, y - 1, 8, 3, c); R(x - 3, y - 2, 6, 1, T)
			R(x - 7, y - 3, 5, 1, rA); R(x + 2, y - 3, 5, 1, rB)
			R(x - 5, y - 2, 1, 2, M); R(x + 4, y - 2, 1, 2, M); R(x - 1, y + 2, 2, 1, M); H(x - 4, y + 1, 8, 1, "#000", 8)
		elif v == 1:
			P.call(-4, -1, 7, 3, c); P.call(3, -1, 2, 2, T); P.call(-2, -1, 1, 3, "#c9a22a"); P.call(0, -1, 1, 3, "#c9a22a"); P.call(-6, 0, 2, 1, M)
			R(x - 4, y - 4, 9, 1, rA); R(x, y - 3, 1, 2, M); P.call(-2, 2, 1, 1, M); P.call(1, 2, 1, 1, M); H(x - 4, y + 1, 7, 1, "#000", 6)
		elif v == 2:
			R(x - 3, y - 3, 6, 6, c); R(x - 4, y - 2, 8, 4, c); R(x - 2, y - 3, 2, 1, M); R(x - 2, y - 1, 4, 3, "#14161e")
			R(x - 7, y - 1, 3, 1, rA); R(x + 4, y - 1, 3, 1, rB); R(x, y - 5, 1, 2, M); R(x, y - 6, 1, 1, "#ff6a4a"); H(x - 3, y + 2, 6, 1, "#000", 7)
		else:
			P.call(-4, -1, 9, 2, c); P.call(-2, -2, 5, 1, c); P.call(5, -1, 2, 1, T); P.call(-5, -3, 2, 2, M); P.call(-5, 1, 2, 2, M)
			P.call(-6, -1, 1, 2, "#ffb347" if f else "#ff7a3d"); P.call(-7, 0, 1, 1, "#ffd36b" if f else "#ff9a3a"); H(x - 4, y, 9, 1, "#000", 6)
	if not d.swarm and (d.hp < d.max or d.boss):
		bar(x, y - ((13 if v == 1 else 14) if d.boss else 9), 26 if d.boss else 10, d.hp / d.max, "#ff3a3a" if d.boss else "#ff7a3d")

func draw_drone_eyes(dr: Dictionary, y: float, fl: int) -> void:
	var x: float = dr.x
	var v: int = dr.v
	var fd = drone_face(dr)
	var P = func(ox: float, oy: float, w: float, h: float, col):
		R(x + ox if fd > 0 else x - ox - w + 1, y + oy, w, h, col)
	if dr.boss:
		if v == 0:
			R(x - 8, y - 1, 3, 2, "#ff3030" if fl else "#ff8a30"); R(x + 6, y - 1, 3, 2, "#ff8a30" if fl else "#ff3030"); R(x - 2, y + 1, 5, 1, "#ff4040")
		else:
			var i = -12
			while i <= 12:
				R(x + i, y + 1, 2, 1, "#ffd36b" if int((i + 12) / 4.0 + s.anim * 8) % 3 == 0 else "#ff3a3a")
				i += 4
			R(x - 1, y - 6, 3, 2, "#ff3030" if fl else "#ff8a30")
	elif dr.heavy:
		if v == 0:
			R(x - 2, y, 5, 1, "#ff7a2a" if fl else "#ffb347")
		elif v == 1:
			R(x - 4, y - 1, 2, 1, "#ff7a2a" if fl else "#ffb347"); R(x + 3, y - 1, 2, 1, "#ff7a2a" if fl else "#ffb347")
		else:
			P.call(4, -1, 2, 1, "#ff5a3a"); P.call(-6, 1, 1, 1, "#ff3030" if fl else "#661010")
	elif dr.swarm:
		R(x, y, 1, 1, "#ff4a3a")
		if v == 0:
			R(x + 1, y, 1, 1, "#ff9a8a")
	else:
		if v == 0:
			R(x - 1, y, 2, 1, "#ff4040")
		elif v == 1:
			P.call(4, -1, 1, 1, "#ff4040")
		elif v == 2:
			R(x - 1, y, 2, 2, "#ff4040"); R(x - 1, y, 1, 1, "#ffc0b8")
		else:
			P.call(3, -1, 2, 1, "#ff4040")

func draw_mech(m: Dictionary) -> void:
	if m.hurt > 0 and int(s.anim * 20) % 2:
		return
	var d: int = m.dir
	var x: float = m.x
	var y: float = m.y
	var air: bool = m.st == ""
	var step: bool = (not air) and absf(m.vx) > 6 and int(s.anim * 9) % 2 == 1
	var bob = 1 if (not air and absf(m.vx) < 6 and int(s.anim * 1.6) % 2 == 1) else 0
	var P = func(ox: float, oy: float, w: float, h: float, c):
		R(x + ox if d > 0 else x - ox - w, y + oy + (bob if oy <= -6 else 0), w, h, c)
	if not air:
		R(x - 6, y, 12, 2, "rgba(0,0,0,.28)")
	draw_char_sprite(P, D.char_by_id(s.ch), {"air": air, "thr": m.thr, "step": step, "lvl": s.mlv, "lit": m.zt > 0 or m.help, "weap": s.weap, "sawOut": s.saws.size() > 0, "t": s.anim})
	if m.thr or m.bat < D.MECH.bat - .05:
		bar(x, y - 27, 16, m.bat / D.MECH.bat, "#ff5a4a" if m.bat < 2.5 else "#ffd36b")
	if m.hp < D.MECH.hp:
		bar(x, y - 32, 16, m.hp / D.MECH.hp, "#7dff9a")

## sprite karakter (dipakai game dan bengkel). P(ox,oy,w,h,col) menggambar relatif kaki, menghadap kanan.
func draw_char_sprite(P: Callable, c: Dictionary, o: Dictionary) -> void:
	var step: bool = o.step
	var air: bool = o.air
	P.call(-3, -5, 2, (2 if o.thr else 3) if air else 5 - (1 if step else 0), "#3a3f4a")
	P.call(1, -5, 2, (3 if o.thr else 4) if air else 5 - (0 if step else 1), "#3a3f4a")
	P.call(-4, -12, 8, 7, c.suit); P.call(-4, -7, 8, 1, c.suitD); P.call(1, -10, 3, 2, c.suitD); P.call(-4, -12, 2, 7, "rgba(255,255,255,.12)")
	P.call(-8, -13, 3, 8, c.pack); P.call(-8, -13, 3, 1, "#9aa1ad"); P.call(-8, -5, 3, 1, "#2d3038"); P.call(-5, -11, 1, 4, "#4a4f5c")
	if o.thr:
		var fl = int(o.t * 30) % 2
		P.call(-8, -4, 3, 5 + fl * 2, "#ffb347"); P.call(-7, -4, 1, 4 + fl, "#fff6c8")
	P.call(-3, -17, 6, 5, c.skin)
	var acc: String = c.acc
	if acc == "hood":
		P.call(-4, -20, 8, 4, c.helm); P.call(-5, -18, 2, 6, c.helm); P.call(1, -16, 3, 1, c.visor)
	elif acc == "band":
		P.call(-4, -19, 8, 2, "#2a2a30"); P.call(-4, -17, 8, 1, c.helm); P.call(-6, -17, 2, 1, "#a83a3a"); P.call(-7, -16, 2, 1, "#a83a3a"); P.call(1, -16, 3, 2, c.visor)
	elif acc == "mask":
		P.call(-4, -19, 8, 3, c.helm); P.call(-3, -20, 6, 1, c.helm); P.call(0, -15, 4, 3, "#2d3038"); P.call(3, -14, 2, 2, "#59606c"); P.call(1, -17, 3, 1, c.visor)
	elif acc == "goggle":
		P.call(-4, -19, 8, 3, c.helm); P.call(-3, -20, 6, 1, c.helm); P.call(-1, -17, 5, 2, "#2d3038"); P.call(0, -17, 2, 1, c.visor); P.call(3, -17, 1, 1, c.visor); P.call(-2, -22, 1, 3, "#9aa1ad"); P.call(-2, -23, 1, 1, c.visor)
	else:
		P.call(-4, -19, 8, 3, c.helm); P.call(-3, -20, 6, 1, c.helm); P.call(1, -16, 3, 2, c.visor)
	P.call(2, -10, 4, 2, c.skin)
	var lv: int = o.lvl
	var lc = MAINC[lv]
	var lit: bool = o.lit
	match o.weap:
		"weld":
			if lv <= 1:
				P.call(5, -11, 5, 3, "#8e99a8"); P.call(9, -11, 2, 3, lc if lit else "#5a6270")
			elif lv <= 3:
				P.call(5, -12, 7, 4, "#8e99a8"); P.call(5, -12, 7, 1, "#b9c0c8"); P.call(7, -13, 2, 1, "#5a6270"); P.call(12, -11, 2, 3, lc if lit else "#3f5a48"); P.call(7, -9, 3, 1, "#c9a22a")
			else:
				P.call(5, -13, 8, 5, "#a9aeb7"); P.call(5, -13, 8, 1, "#d0d4da"); P.call(6, -8, 6, 1, "#5c616b"); P.call(8, -15, 2, 2, "#c9a22a"); P.call(13, -12, 3, 3, lc if lit else "#7a3a70"); P.call(10, -10, 2, 1, "#c9a22a"); P.call(6, -11, 1, 1, lc if lit else "#7a3a70")
		"rail":
			var e = 2 if lv >= 4 else 0
			P.call(3, -11, 12 + e, 2, "#5a6070"); P.call(3, -12, 6, 1, "#8e99a8"); P.call(6, -13, 3, 1, "#2d3038"); P.call(4, -9, 2, 2, "#3a3f4a")
			P.call(14 + e, -11, 2, 2, "#ffffff" if lit else lc)
			if lv >= 3:
				P.call(9, -10, 4, 1, lc)
		"saw":
			if not o.sawOut:
				P.call(5, -14, 6, 6, "#b9c2cc"); P.call(4, -13, 8, 4, "#b9c2cc"); P.call(7, -12, 2, 2, "#59606c"); P.call(5, -15, 1, 1, "#e6ecff"); P.call(10, -9, 1, 1, "#e6ecff")
				if lv >= 4:
					P.call(11, -15, 2, 2, lc)
			P.call(4, -10, 2, 2, "#59606c")
		"nade":
			P.call(3, -12, 8, 4, "#4a5a3a"); P.call(3, -12, 8, 1, "#6a7a52"); P.call(10, -12, 2, 4, "#2a2e22"); P.call(5, -8, 2, 2, "#3a3f2a")
			P.call(-3, -10, 1, 1, "#7dff9a"); P.call(-1, -10, 1, 1, "#7dff9a")
			if lv >= 3:
				P.call(1, -10, 1, 1, "#7dff9a")
		"buddy":
			P.call(4, -11, 5, 3, "#2d3038"); P.call(5, -11, 1, 1, lc); P.call(7, -11, 1, 1, "#ffffff" if lit else "#c58aff"); P.call(6, -13, 1, 2, "#9aa1ad")

# ---------- mobil, tumpukan, crane ----------
func draw_pile(x: float) -> void:
	R(x - 8, GW - 5, 16, 5, "#4a423c"); R(x - 5, GW - 8, 9, 4, "#5a4f46"); R(x + 2, GW - 10, 4, 3, "#7a5a3a")
	R(x - 3, GW - 7, 2, 2, "#a9bccf"); R(x - 7, GW - 6, 3, 1, "#7a5a3a"); R(x + 5, GW - 4, 3, 2, "#a9bccf")

func deck(px: float, y: float, pw: float) -> void:
	R(px - pw / 2, y, pw, 3, "#a9aeb7"); R(px - pw / 2, y, pw, 1, "#d0d4da"); R(px - pw / 2, y + 3, pw, 5, "#5c616b"); H(px - pw / 2, y + 5, pw, 3, "#000", 7)
	var xx = px - pw / 2 + 3
	while xx < px + pw / 2 - 3:
		R(xx, y + 3, 2, 5, "#3d4048")
		xx += 8
	R(px - pw / 2 - 1, y - 1, 3, 9, "#c9a22a"); R(px + pw / 2 - 2, y - 1, 3, 9, "#c9a22a")
	if int(s.anim * 2) % 2:
		R(px - pw / 2, y - 3, 2, 2, "#ff5a4a"); R(px + pw / 2 - 2, y - 3, 2, 2, "#ff5a4a")

func rig(mx: float, side: int, y: float, px: float, pw: float, box: bool) -> void:
	var top: float = y - D.CRROPE
	var mh: float = GW - top
	var sd = side
	var RM = func(x: float, yy: float, w: float, h: float, c):
		R(x if sd > 0 else 2 * mx - x - w, yy, w, h, c)
	var s1 = rj(mh * .4)
	var s2 = rj(mh * .7)
	R(mx - 4, GW - s1, 8, s1, "#5a5f69"); R(mx - 4, GW - s1, 1, s1, "#7d838e"); R(mx + 3, GW - s1, 1, s1, "#3d4048"); H(mx, GW - s1, 3, s1, "#000", 6)
	R(mx - 3, GW - s2, 6, s2 - s1, "#6a707c"); R(mx - 3, GW - s2, 1, s2 - s1, "#8a909b"); R(mx + 2, GW - s2, 1, s2 - s1, "#454951")
	R(mx - 2, top, 4, mh - s2, "#7d838e"); R(mx - 2, top, 1, mh - s2, "#a3a9b3"); R(mx + 1, top, 1, mh - s2, "#555a64")
	var yy = GW - s1 + 3
	while yy < GW - 6:
		line(mx - 4, yy, mx + 4, yy + 8, "#3d4048")
		yy += 8
	R(mx - 5, GW - s1 - 1, 10, 2, "#c9a22a"); R(mx - 4, GW - s2 - 1, 8, 2, "#c9a22a")
	R(mx - 9, GW - 6, 18, 6, "#4a4f58"); R(mx - 9, GW - 6, 18, 1, "#6d737e")
	if box:
		RM.call(mx - 17, GW - 14, 9, 14, "#c9a22a"); RM.call(mx - 17, GW - 14, 9, 2, "#e6c24a"); RM.call(mx - 15, GW - 10, 5, 3, "#1d2230")
		RM.call(mx - 14, GW - 6, 2, 2, "#7dff9a" if int(s.anim * 2) % 2 else "#2f6a3c")
	var reach = rj(absf(px - mx) + pw / 2 + 8)
	var x0: float = mx + 8 - reach if sd > 0 else mx - 8
	var w0 = reach
	R(x0, top, w0, 3, "#c9a22a"); R(x0, top + 3, w0, 1, "#7a6215")
	var k = 0
	while k < w0 - 8:
		var xx = x0 + k + 2
		line(xx, top + 4, xx + 10, top, "#8a6f1a")
		k += 10
	RM.call(mx + 3, top - 5, 9, 8, "#6a707c"); RM.call(mx - 5, top - 8, 2, 8, "#c9a22a"); RM.call(mx - 5, top - 8, 9, 1, "#c9a22a")
	R(px - 4, top + 3, 8, 3, "#3d4048")
	line(px, top + 6, px - pw / 2 + 6, y - 1, "#2d3038"); line(px, top + 6, px + pw / 2 - 6, y - 1, "#2d3038")
	line(px - 1, top + 6, px - pw / 2 + 5, y - 1, "#2d3038"); line(px + 1, top + 6, px + pw / 2 - 5, y - 1, "#2d3038")

func draw_crane() -> void:
	var cr: Dictionary = s.crane
	var y = rj(cr.y)
	var pw: float = D.CR.w[cr.lv - 1]
	rig(D.CRMX, 1, y, cr.px, pw, true)
	deck(cr.px, y, pw)
	var c2: Dictionary = s.crane2
	var P2 = plat(2)
	var y2 = rj(c2.y)
	rig(D.CLMX, -1, y2, P2.px, P2.w, true)
	deck(P2.px, y2, P2.w)

func g_shadow(x: float, w: float, h: float, y0 := -1.0) -> void:
	if sun.a < .03:
		return
	var fx = clampf((x - sun.x) / 140.0, -1.0, 1.0)
	var dir = 1.0 if fx >= 0 else -1.0
	var L = w * .3 + h * (.25 + (1 - sun.e) * 2.4) * absf(fx)
	var x0 = x - w / 2 if dir > 0 else x + w / 2
	var x1 = x0 + dir * (w + L)
	var Y = (y0 if y0 > 0 else GW) - cam_y
	var a = .42 * sun.a
	var xa = minf(x0, x1)
	var xb = maxf(x0, x1)
	var cl = PackedColorArray([Color(0, 0, 0, a if dir > 0 else 0.0), Color(0, 0, 0, 0.0 if dir > 0 else a), Color(0, 0, 0, 0.0 if dir > 0 else a), Color(0, 0, 0, a if dir > 0 else 0.0)])
	ci.draw_polygon(PackedVector2Array([Vector2(xa, Y), Vector2(xb, Y), Vector2(xb, Y + 4), Vector2(xa, Y + 4)]), cl)
