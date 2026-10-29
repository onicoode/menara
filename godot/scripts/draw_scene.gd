extends "res://scripts/draw_tower.gd"
## Gambar bagian 3: urutan render (langit, kota, tanah, tower, glow, efek). Port dari render() di vc.js.
## Dibagi 3 lapisan kanvas: world (normal) -> glow (additif) -> top (normal), semuanya di dalam node kamera.

var cloud_t = -1.0
var pd = 0.0          # darkness frame ini
var pwarm = 0.0
var pbx = 0.0
var pby = 0.0

func gsc() -> float:
	return vh - D.BOT

func slow_e() -> float:
	var sl = s.get("slow")
	if sl == null:
		return 0.0
	var u: float = sl.t / sl.T
	return sstep(u / .15) * (1 - sstep((u - .6) / .4))

func sstep(x: float) -> float:
	x = clampf(x, 0.0, 1.0)
	return x * x * (3 - 2 * x)

## dipanggil sekali per frame sebelum menggambar: hitung nilai bersama
func frame_prep() -> void:
	pd = D.darkness(s.t)
	pwarm = 1 - absf(2 * pd - 1)
	var night: bool = s.t >= D.DAY
	var q: float = (s.t - D.DAY) / D.NIGHT if night else s.t / D.DAY
	pbx = 18 + (W - 36) * q
	pby = gsc() - 30 - sin(PI * q) * (gsc() - 90)
	sun.x = CX if night else pbx
	sun.e = 0.0 if night else sin(PI * q)
	sun.a = 0.0 if night else (1 - pd) * minf(1.0, sun.e * 4 + .2)

func draw_sky() -> void:
	var d = pd
	var top = D.mixc(D.mixc("#8d7d78", "#06070f", d), "#6a3a4a", pwarm * .5)
	var bot = D.mixc(D.mixc("#e0a86c", "#1d2038", d), "#e26a3a", pwarm * .8)
	var g = gsc()
	var pts = PackedVector2Array([Vector2(-60, 0), Vector2(420, 0), Vector2(420, g), Vector2(-60, g)])
	ci.draw_polygon(pts, PackedColorArray([top, top, bot, bot]))
	ci.draw_rect(Rect2(-60, g, 480, vh - g + 80), bot)
	if d > .3:
		for st in stars:
			if st.y > g - 30:
				continue
			var tw: float = .15 + .85 * absf(sin(s.anim * st.sp + st.p))
			var x = int(st.x)
			var y = int(st.y)
			var a = minf(1.0, (d - .25) * 1.6) * tw
			var c = cc(st.col)
			c.a = a
			if st.big:
				ci.draw_rect(Rect2(x, y, 1.4, 1.4), c)
				if tw > .8:
					ci.draw_rect(Rect2(x - 2, y + .3, 5.3, .7), c)
					ci.draw_rect(Rect2(x + .3, y - 2, .7, 5.3), c)
			else:
				ci.draw_rect(Rect2(x, y, .7, .7), c)
	var night: bool = s.t >= D.DAY
	var sc = cc("#dfe5f5") if night else D.mixc("#f3d9a0", "#e8905a", pwarm)
	ci.draw_rect(Rect2(int(pbx - 5), int(pby - 6), 10, 12), sc)
	ci.draw_rect(Rect2(int(pbx - 6), int(pby - 5), 12, 10), sc)
	# awan
	var dtc = minf(.1, maxf(0.0, s.anim - (cloud_t if cloud_t >= 0 else s.anim)))
	cloud_t = s.anim
	var ccol = D.mixc(D.mixc("#f6e3c8", "#343a63", d), "#f2a272", pwarm * .5)
	var cshd = D.mixc(D.mixc("#d9b08e", "#1e2240", d), "#c97a5a", pwarm * .4)
	for cd in clouds:
		cd.x += cd.sp * (1 + 2.2 * d) * dtc
		if cd.x > 410:
			cd.x = -50
		var al = (d if cd.k else 1.0) * (.5 + .25 * d)
		if al < .02 or cd.y > g - 60:
			continue
		var c1 = Color(cshd.r, cshd.g, cshd.b, al)
		var c2 = Color(ccol.r, ccol.g, ccol.b, al)
		for b in CLOUD:
			ci.draw_rect(Rect2(round(cd.x + b[0] * cd.s), round(cd.y + (b[1] + b[3] - 2) * cd.s), ceil(b[2] * cd.s), ceil(2 * cd.s)), c1)
			ci.draw_rect(Rect2(round(cd.x + b[0] * cd.s), round(cd.y + b[1] * cd.s), ceil(b[2] * cd.s), ceil((b[3] - 1) * cd.s)), c2)

func draw_ground() -> void:
	var d = pd
	var dq = round(d * 20) / 20
	layer(far_city, .55, D.mixc("#7a695e", "#10101c", dq), D.mixc("#5f5149", "#0a0a14", dq), 3.2, "far")
	layer(mid_city, .8, D.mixc("#5c4d45", "#0c0c16", dq), D.mixc("#463a34", "#07070f", dq), 1.9, "mid")
	var gy = GW - round(cam_y)
	if gy < vh:
		ci.draw_rect(Rect2(-60, gy, 480, minf(vh - gy + 1, UG0)), D.mixc("#403b3a", "#15141b", d))
		if gy + UG0 < vh:
			ci.draw_texture_rect(underground_tex(), Rect2(0, gy + UG0, 360, D.BOT - UG0), false)
		ci.draw_rect(Rect2(-60, gy, 480, 2), D.mixc("#6a625c", "#1f1e28", d))
		var yl = D.mixc("#b58f2a", "#3a3014", d)
		var x = 4
		while x < 360:
			ci.draw_rect(Rect2(x, gy + 12, 12, 1), yl)
			x += 28
		var cr = D.mixc("#2c2827", "#0d0c12", d)
		for xx in 360:
			if xx % 37 == 5:
				ci.draw_rect(Rect2(xx, gy + 4 + (xx % 7) * 4, 4, 1), cr)
			if xx % 53 == 9:
				ci.draw_rect(Rect2(xx, gy + 6 + (xx % 5) * 5, 1, 3), cr)

func draw_shadows() -> void:
	var m = s.m
	var cr = s.crane
	g_shadow(CX, 24, 30)
	g_shadow(D.CRMX, 8, GW - cr.y + D.CRROPE)
	g_shadow(D.CLMX, 8, GW - s.crane2.y + D.CRROPE)
	for t in s.towers:
		if t.lv > 0:
			g_shadow(t.x, D.TWW[t.lv], D.TWH[t.lv] + 6, t.y if t.pl else GW)
	for x in D.PILES:
		g_shadow(x, 14, 6)
	for b in s.bots:
		if b.y >= GW - 1:
			g_shadow(b.x, 7, 11)
	if m.st:
		g_shadow(m.x, 8, 20, m.y if m.st == "p" else GW)

## lapisan 1: dunia (normal)
func render_world(node: CanvasItem) -> void:
	ci = node
	ga = 1.0
	draw_sky()
	draw_ground()
	draw_shadows()
	for x in D.PILES:
		draw_pile(x)
	draw_core_barrel()
	draw_crane()
	draw_towers()
	for b in s.bots:
		draw_bot(b)
	for dr in s.drones:
		draw_drone(dr)
	ci.draw_rect(Rect2(-60, -60, 480, vh + 120), Color(6 / 255.0, 10 / 255.0, 38 / 255.0, .5 * pd))
	for bp in s.bps:
		draw_tower_bp(bp)
	draw_slots()
	draw_flame()
	for dr in s.drops:
		var y: float = dr.y - (round(sin(s.anim * 4 + dr.ph) * 1 + 1) if dr.rest else 0.0)
		R(dr.x - 2, y - 4, 4, 4, "#a9bccf"); R(dr.x - 1, y - 3, 2, 2, "#2a2e3a")
		if fmod(s.anim * 1.2 + dr.ph, 2.0) < .14:
			R(dr.x + 1, y - 6, 1, 3, "#fff"); R(dr.x, y - 5, 3, 1, "#fff")
	draw_mech(s.m)
	var ho = null
	if card_hold != null and not card_hold.done:
		for o in ctx_options():
			if o.key == card_hold.key:
				ho = o
	if ho != null:
		var pos = opt_pos(ho)
		bar(pos[0], pos[1], 30, clampf(card_hold.t / D.HT[ho.kind], 0.0, 1.0), "#ffd36b")

## lapisan 2: cahaya (additif)
func render_glow(node: CanvasItem) -> void:
	ci = node
	ga = 1.0
	if not Prof.settings.light:
		return
	var m = s.m
	var d = pd
	var nk = .35 + .65 * d
	light_at(CX, GW - 16, 78, rgbs("90,209,230"), (.2 + .32 * d) * (1.8 if s.coreHit > 0 else 1.0))
	light_at(CX, GW + UG0 + 54, 56, rgbs("90,209,230"), (.1 + .12 * d) * (.75 + .25 * sin(s.anim * 3)))
	if m.thr:
		light_at(m.x - m.dir * 7, m.y - 1, 28, rgbs("255,170,80"), .55 * nk + .15)
	if m.zt > 0:
		light_at(m.x + m.dir * 10, m.y - 11, 14, cc(MAINC[s.mlv]), .5)
	for w in s.saws:
		light_at(w.x, w.y, 10, rgbs("255,230,160"), .3 * nk)
	for q in s.slash:
		if q.t >= 0:
			var k: float = q.t / q.l
			var an: float = q.a + q.sd * (-1.45 + 2.9 * minf(1.0, k * 1.6))
			light_at(q.x + cos(an) * q.r, q.y + sin(an) * q.r, 34, rgbs("170,235,255"), .85 * (1 - k))
	for b in s.buddies:
		light_at(b.x, b.y, 10, rgbs("200,150,255"), .35 * nk)
	for t in s.towers:
		if not t.lv or t.fl <= 0:
			continue
		var my: float = t.y - D.TWH[t.lv] - 3
		var L: float = D.TWL[t.lv] + 2
		var ax: float = t.x + cos(t.ang) * L
		var ay: float = my + sin(t.ang) * L
		if t.ty == "f":
			light_at(ax + cos(t.ang) * 20, ay + sin(t.ang) * 20, 48, rgbs("255,140,60"), .45 * nk + .1)
		else:
			light_at(ax, ay, 16, rgbs("255,225,150"), .5 * nk + .1)
	for b in s.bolts:
		light_at(b.x2, b.y2, 15, cc(b.c), .45 * nk + .1)
	for p in s.missiles:
		light_at(p.x, p.y, 10 if p.small else 16, rgbs("255,170,80"), .45 * nk + .1)
	for t in s.towers:
		if t.ty == "laser" and t.beam and t.tgt != null:
			light_at(t.tgt.x, t.tgt.y, 14 + t.beam * 4, rgbs("255,80,110"), .4 * nk + .15)
	for t in s.towers:
		if t.ty == "decoy" and t.lv and t.hp > 0 and int(s.anim * 3) % 2:
			light_at(t.x, t.y - D.TWH[t.lv] - 20, 22, rgbs("255,170,70"), .5 * nk)
	for dr in s.drones:
		light_at(dr.x, dr.y, 26 if dr.boss else 12, rgbs("255,70,50"), .28 * d)
	for f in s.fx:
		if f.has("light"):
			light_at(f.x, f.y, f.r, f.rgb if f.rgb is Color else rgbs(str(f.rgb)), f.a * (f.l / f.L))
	if int(s.anim * 2) % 2:
		for n in [1, 2]:
			var P = plat(n)
			light_at(P.px - P.w / 2 + 1, P.y - 2, 10, rgbs("255,80,60"), .35 * pd)
			light_at(P.px + P.w / 2 - 1, P.y - 2, 10, rgbs("255,80,60"), .35 * pd)
	# halation
	var night: bool = s.t >= D.DAY
	var low = 0.0 if night else maxf(0.0, 1 - sun.e * 2.4) * (1 - d)
	var halo = minf(1.0, maxf(pwarm * .95, low * .8))
	if halo > .03:
		var hx = pbx
		var hy = pby
		if night:
			hx = 18.0 if s.t > D.CYC - D.DUSK * 1.5 else W - 18
			hy = gsc() - 30
		ci.draw_texture_rect(light_tex, Rect2(hx - 260, hy - 260 - 0, 520, 520), false, Color(1.0, .6, .3, halo * .55))
		ci.draw_rect(Rect2(-60, -60, 480, vh + 120), Color(1.0, .59, .35, .05 * halo))

func comic_text(f: Dictionary) -> void:
	var t: float = 1 - f.l / (f.L if f.L else 1.0)
	var sc: float = .4 + t / .1 * .9 if t < .1 else (1.3 - (t - .1) / .1 * .2 if t < .2 else 1.1 + sin(t * 12) * .015)
	var al: float = f.l / .25 if f.l < .25 else 1.0
	var pos = Vector2(f.x, f.y - cam_y)
	ci.draw_set_transform(pos, -.08, Vector2(sc, sc))
	var fs = 14
	var txt = "CRITICAL HIT!!"
	var wd = font.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	var p = Vector2(-wd / 2, 0)
	for k in range(1, 4):
		ci.draw_string(font, p + Vector2(0, k), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#a3130f", al))
	ci.draw_string_outline(font, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 4, Color("#14161e", al))
	ci.draw_string(font, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#ffe23a", al))
	ci.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## lapisan 3: sebagian besar efek di atas cahaya (normal)
func render_top(node: CanvasItem) -> void:
	ci = node
	ga = 1.0
	var fl = int(s.anim * 10) % 2
	for b in s.bots:
		R(b.x + b.dir * 1, b.y - 8, 1, 1, "#5ad1e6")
	for dr in s.drones:
		var y: float = dr.y + round(sin(dr.ph * 3))
		draw_drone_eyes(dr, y, fl)
		if dr.slow:
			var k = int(s.anim * 4 + dr.ph) % 3
			R(dr.x - dr.w / 2 - 2 + k, y - 4, 1, 1, "#e0c8ff"); R(dr.x + dr.w / 2 + 1 - k, y + 2, 1, 1, "#e0c8ff"); R(dr.x - 1 + k, y - 6, 1, 1, "#c9a8ff")
		if dr.chase and not dr.boss:
			R(dr.x, y - 9, 1, 4, "#ff4a3a"); R(dr.x, y - 4, 1, 1, "#ff4a3a")
		elif dr.chase:
			R(dr.x, y - 12, 2, 6, "#ff4a3a"); R(dr.x, y - 5, 2, 2, "#ff4a3a")
		if dr.atk and int(s.anim * 14) % 2:
			R(dr.x - 1, y + 3, 2, 2, "#ff6a4a")
	for b in s.bolts:
		var thick = 4.0 if (b.th or str(b.c.to_html(false)) in ["8ff0ff", "7dff9a", "ff7ae6"]) else 0.0
		line(b.x1, b.y1, b.x2, b.y2, b.c, thick)
		if b.th:
			line(b.x1 + 1, b.y1, b.x2 + 1, b.y2, b.c, 3); line(b.x1, b.y1 + 1, b.x2, b.y2 + 1, b.c, 3)
		line(b.x1, b.y1, b.x2, b.y2, "#ffffff", 0)
	for f in s.fx:
		if f.has("light"):
			continue
		if f.has("plus"):
			var k: float = f.l / f.L
			var X = round(f.x)
			var Y = round(f.y)
			ga = qa(minf(1.0, k * 1.6))
			R(X - 1, Y - 2, 3, 5, "#0d2a14"); R(X - 2, Y - 1, 5, 3, "#0d2a14"); R(X, Y - 1, 1, 3, f.c); R(X - 1, Y, 3, 1, f.c)
			ga = 1.0
			continue
		if f.has("text") and f.get("comic", 0):
			comic_text(f)
			continue
		if f.has("text"):
			var a = qa(minf(1.0, f.l * 2.5))
			var fs = 9
			var wd = font.get_string_size(f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			var p = Vector2(round(f.x) - wd / 2, round(f.y - cam_y))
			ci.draw_string(font, p + Vector2(1, 1), f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#14161e", a))
			var c = cc(f.c)
			ci.draw_string(font, p, f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(c.r, c.g, c.b, a))
			continue
		if f.has("ring"):
			var k = 1 - f.l / f.L
			var r = f.r0 + (f.r1 - f.r0) * (1 - (1 - k) * (1 - k))
			ga = qa(f.l / f.L)
			px_circle(f.x, f.y, round(r), f.c); px_circle(f.x, f.y, round(r) + 1, f.c)
			ga = 1.0
			continue
		ga = minf(1.0, f.l * 4)
		R(f.x, f.y, f.get("s", 2), f.get("s", 2), f.c)
	ga = 1.0
	draw_combat()
	draw_shots()
	draw_player_ranges()
	for w in s.waves:
		var k: float = w.r / blast.r
		ga = qa(1 - k * .8)
		px_circle(w.x, w.y, round(w.r), "#8ff0ff"); px_circle(w.x, w.y, round(w.r) + 1, "#e6fbff"); px_circle(w.x, w.y, round(w.r * .82), "#5ad1e6", 4, 3, s.anim * 20)
		ga = 1.0

## panah untuk drone di atas layar (di luar transformasi kamera)
func render_arrows(node: CanvasItem) -> void:
	for dr in s.drones:
		if dr.y - cam_y >= 2:
			continue
		var px = round(dr.x)
		if px < 3 or px > W - 4:
			continue
		var ay = 74 + round(sin(s.anim * 6) * 1.5)
		var c = Color("#ff4a3a")
		node.draw_rect(Rect2(px - 2, ay, 5, 1), c); node.draw_rect(Rect2(px - 1, ay + 1, 3, 1), c); node.draw_rect(Rect2(px, ay + 2, 1, 1), c)
