extends "res://scripts/sim_base.gd"
## Simulasi bagian 2: tower khusus, senjata pasif/utama, proyektil. Port dari vt.js / vm.js.

# ---------- tower Gun / Api / Gatling / Sniper ----------
func tower_basic(t: Dictionary, dt: float) -> void:
	var Y: Dictionary = D.TY[t.ty]
	var mx: float = t.x
	var my: float = t.y - D.TWH[t.lv] - 3
	var tg = null
	var bd: float = Y.rng[t.lv]
	for d in s.drones:
		if d.hp <= 0:
			continue
		var dd = hyp(d.x - mx, d.y - my)
		if dd < bd and dd >= Y.get("min", 0.0):
			bd = dd
			tg = d
	if tg == null:
		return
	t.ang = atan2(tg.y - my, tg.x - mx)
	if t.ty == "f":
		var ca = cos(t.ang)
		var sn = sin(t.ang)
		var L: float = D.TWL[t.lv] + 1
		var R0: float = Y.rng[t.lv]
		t.fl = .1
		var fcols = D.flame_cols(t.lv)
		for k in 2:
			var sp = R0 / .3 * rnd(.55, 1)
			var pj = rnd(-16, 16)
			fxp(mx + ca * L, my + sn * L, ca * sp - sn * pj, sn * sp + ca * pj, -25, .3, fcols[int(randf() * 3)], 3 if t.lv >= 8 else 2)
		if t.cd <= 0:
			t.cd = Y.cd[t.lv]
			sfx("burn")
			for d in s.drones:
				if d.hp <= 0:
					continue
				var dx: float = d.x - mx
				var dy: float = d.y - my
				var dd = hyp(dx, dy)
				if dd > R0 + d.w / 2:
					continue
				var da = absf(atan2(dy, dx) - t.ang)
				if da > PI:
					da = 2 * PI - da
				if dd < 14 or da <= Y.cone:
					hit_drone(d, Y.dmg[t.lv] * (1 - D.ACC.fall * range_k(dd, R0)), "#ff9a3a")
					ignite(d, 3 + t.lv * .35, Y.dmg[t.lv] * 3)
	elif t.cd <= 0:
		t.cd = Y.cd[t.lv]
		t.fl = .05
		var sn_t: bool = t.ty == "sniper"
		var gt: bool = t.ty == "gatling"
		var pl = D.proj_look(t.ty, t.lv)
		sfx("snipe" if sn_t else "gat" if gt else "mg")
		var cr: bool = Y.has("crit") and randf() < Y.crit[t.lv]
		var L2: float = D.TWL[t.lv] + 1
		shoot(mx + cos(t.ang) * L2, my + sin(t.ang) * L2, tg, {"dmg": Y.dmg[t.lv] * (2 if cr else 1), "acc": Y.acc[t.lv],
			"spark": "#fff3b0" if cr else "#ffcf6a", "k": range_k(bd, Y.rng[t.lv]), "col": "#fff3b0" if cr else pl.col,
			"sp": Y.get("sp", 560.0), "size": pl.size, "trail": pl.trail, "shape": pl.shape})

# ---------- tower lain ----------
func tower_type(t: Dictionary, dt: float) -> void:
	var Y: Dictionary = D.TY[t.ty]
	var lv: int = t.lv
	var mx: float = t.x
	var my: float = t.y - D.TWH[lv] - 3
	match t.ty:
		"mortar":
			if t.cd > 0:
				return
			var tg = nearest_drone(mx, my, Y.rng[lv], func(d): return hyp(d.x - mx, d.y - my) < Y.min)
			if tg == null:
				return
			var dist = hyp(tg.x - mx, tg.y - my)
			var k = range_k(dist, Y.rng[lv])
			var T = .8 + dist / 420.0
			var sc0: float = (1 - Y.acc[lv]) * (60 + k * 40)
			var px: float = tg.x + tg.vx * T * .85 + rnd(-1, 1) * sc0
			var py: float = minf(GW - 6, tg.y + tg.vy * T * .85 + rnd(-1, 1) * sc0 * .6)
			t.ang = atan2(py - my, px - mx)
			t.cd = Y.cd[lv]
			t.fl = .2
			s.shells.append({"x0": mx, "y0": my - 6, "x1": px, "y1": py, "t": 0.0, "T": T, "dmg": Y.dmg[lv] * (1 - D.ACC.fall * k), "spl": Y.spl[lv], "h": 40 + T * 45, "lv": lv})
			sfx("mortar")
			puff(mx, my - 8, 5, "#c9c2b0")
		"rocket":
			if t.cd > 0:
				return
			var tg = null
			var best = -1.0
			for d in s.drones:
				if d.hp <= 0 or d.flee:
					continue
				if hyp(d.x - mx, d.y - my) > Y.rng[lv]:
					continue
				var sc: float = (1e6 if d.boss else 1e4 if d.heavy else 0.0) + d.hp
				if sc > best:
					best = sc
					tg = d
			if tg == null:
				return
			t.ang = atan2(tg.y - my, tg.x - mx)
			t.cd = Y.cd[lv]
			t.fl = .25
			fire_missile(mx, my - 4, -PI / 2 + (randf() - .5) * .7, tg, Y.dmg[lv] * (1.0 if randf() < Y.acc[lv] else .5), 14, false, Y.rng[lv], lv)
			sfx("rocket")
		"tesla":
			if t.cd > 0:
				return
			var tg = nearest_drone(mx, my - 8, Y.rng[lv])
			if tg == null:
				return
			t.cd = Y.cd[lv]
			t.fl = .15
			var k0 = range_k(hyp(tg.x - mx, tg.y - my + 8), Y.rng[lv])
			var tc = D.tier_col("tesla", lv)
			if randf() < D.ACC.miss * pow(k0, 1.6):
				miss_fx(tg)
				bolt(mx, my - 11, tg.x + rnd(-10, 10), tg.y + rnd(-10, 10), tc, "zap", lv >= 5)
				return
			var cur = tg
			var px = mx
			var py = my - 11
			var dmg: float = Y.dmg[lv] * (1 - D.ACC.fall * k0)
			var hit = {}
			var j = 0
			while j < int(Y.jump[lv]) and cur != null:
				hit[cur.uid] = true
				hit_drone(cur, dmg, tc)
				bolt(px, py, cur.x, cur.y, tc, "zap", lv >= 5)
				if randf() < Y.shock[lv]:
					shock_drone(cur, 1.3 + .15 * lv)
				px = cur.x
				py = cur.y
				dmg *= .85
				cur = nearest_drone(px, py, 104, func(d): return hit.has(d.uid))
				j += 1
		"laser":
			var tg = t.tgt
			if tg == null or tg.hp <= 0 or tg.flee or not dalive(tg) or hyp(tg.x - mx, tg.y - my) > Y.rng[lv]:
				tg = nearest_drone(mx, my, Y.rng[lv])
				t.lock = 0.0
				t.tgt = tg
			if tg == null:
				t.beam = 0.0
				return
			t.lock += dt
			t.ang = atan2(tg.y - my, tg.x - mx)
			var mult = 1 + minf(2.0, t.lock / 1.5)
			t.beam = mult
			t.fl = .1
			hurt(tg, Y.dmg[lv] * mult * dt * (1 - D.ACC.fall * range_k(hyp(tg.x - mx, tg.y - my), Y.rng[lv])))
			if randf() < dt * 24:
				fxp(tg.x + rnd(-2, 2), tg.y + rnd(-2, 2), rnd(-30, 30), rnd(-40, 0), 120, .25, "#ffb0c0")
		"emp":
			if t.cd > 0 or nearest_drone(mx, my, Y.rng[lv]) == null:
				return
			t.cd = Y.cd[lv]
			t.fl = .35
			for d in s.drones:
				if d.hp <= 0:
					continue
				if hyp(d.x - mx, d.y - my) <= Y.rng[lv] + d.w / 2:
					d.stun = maxf(d.stun, Y.stun[lv])
					d.atk = ""
					hit_drone(d, Y.dmg[lv] * (1 - D.ACC.fall * range_k(hyp(d.x - mx, d.y - my), Y.rng[lv])), "#9ad8ff")
			ring(mx, my - 8, 4, Y.rng[lv], .5, D.tier_col("emp", lv))
			ring(mx, my - 8, 2, Y.rng[lv] * .6, .4, "#e6fbff")
			light(mx, my - 8, Y.rng[lv], "154,216,255", .7, .35)
			sfx("emp")
		"net":
			if t.cd > 0:
				return
			var tg = nearest_drone(mx, my, Y.rng[lv], func(d): return d.net > 0 or d.stun > 0)
			if tg == null:
				return
			t.cd = Y.cd[lv]
			t.fl = .2
			var dist = hyp(tg.x - mx, tg.y - my)
			var T = dist / 230.0
			var px: float = tg.x + tg.vx * T
			var py: float = tg.y + tg.vy * T
			var a = atan2(py - my, px - mx) + rnd(-1, 1) * (1 - Y.acc[lv]) * .9
			t.ang = a
			s.nets.append({"x": mx, "y": my, "vx": cos(a) * 230.0, "vy": sin(a) * 230.0, "l": 1.2, "hold": Y.hold[lv], "r": 1.0, "lv": lv})
			sfx("net")
		"repair":
			if not s.nightOn:
				return
			t.rt += dt
			if t.rt < Y.cd[lv]:
				return
			t.rt = 0.0
			var did = false
			for o in s.towers:
				if o.i == t.i or not o.lv or not o.sh or o.brk or o.shHp >= D.SH.hp[o.sh]:
					continue
				if hyp(o.x - t.x, o.y - t.y) > Y.rng[lv]:
					continue
				o.shHp = minf(D.SH.hp[o.sh], o.shHp + Y.heal[lv])
				o.shHit = .2
				did = true
				s.beams.append({"x1": t.x, "y1": my - 12, "x2": o.x, "y2": o.y - D.TWH[o.lv] / 2.0 - 3, "l": .4, "c": col("#7dff9a")})
			for o in s.towers:
				if not o.lv or o.i == t.i or o.hp >= tower_max_hp(o) or hyp(o.x - t.x, o.y - t.y) > Y.rng[lv]:
					continue
				o.hp = minf(tower_max_hp(o), o.hp + Y.heal[lv])
				did = true
				s.beams.append({"x1": t.x, "y1": my - 12, "x2": o.x, "y2": o.y - D.TWH[o.lv] / 2.0, "l": .4, "c": col("#7dff9a")})
			if s.hp < s.maxHp:
				s.hp = minf(s.maxHp, s.hp + Y.core[lv])
				did = true
				s.beams.append({"x1": t.x, "y1": my - 12, "x2": CX, "y2": GW - 17, "l": .4, "c": col("#7dff9a")})
			if did:
				ring(t.x, my - 12, 3, 16, .3, "#7dff9a")
				sfx("fuel")
		"magnet":
			if t.cd > 0:
				return
			var R0: float = Y.push[lv]
			var cx = mx
			var cy = my - 4
			var n = 0
			for d in s.drones:
				if d.hp <= 0 or d.flee or d.kb > 0:
					continue
				var dx: float = d.x - cx
				var dy: float = d.y - cy
				var dd = maxf(hyp(dx, dy), .001)
				if dd > R0 + d.w / 2:
					continue
				var p = (190 + 60 * lv) * (.3 if d.boss else .6 if d.heavy else 1.0)
				d.kvx = dx / dd * p
				d.kvy = dy / dd * p - 30
				d.kb = .45
				d.chase = false
				d.atk = ""
				d.hit = .1
				n += 1
			if n == 0:
				t.cd = .4
				return
			t.cd = Y.pcd[lv]
			t.fl = .3
			ring(cx, cy, 3, R0, .45, "#ff7a7a")
			ring(cx, cy, 2, R0 * .6, .35, "#ffd0d0")
			light(cx, cy, R0 * 1.4, "255,110,110", .7, .3)
			for i in 14:
				var a = i / 14.0 * 6.283
				fxp(cx, cy, cos(a) * 90, sin(a) * 90, 0, .3, "#ff7a7a" if i % 2 else "#ffffff", 2)
			sfx("repel")
		_:
			pass

# ---------- senjata pasif pemain ----------
func orbit_pos(i: int, n: int) -> Vector2:
	var m: Dictionary = s.m
	var a: float = s.anim * 3.2 + i * 6.283 / n
	var r: float = D.PWD.orbit.r[s.wp.orbit]
	return Vector2(m.x + cos(a) * r, m.y - 10 + sin(a) * r * .8)

func update_weapons(dt: float) -> void:
	var m: Dictionary = s.m
	var w: Dictionary = s.wp
	var cx: float = m.x
	var cy: float = m.y - 10
	if w.orbit:
		var n: int = int(D.PWD.orbit.n[w.orbit])
		for i in n:
			var p = orbit_pos(i, n)
			for d in s.drones:
				if d.hp <= 0 or d.obT > s.anim:
					continue
				if hyp(d.x - p.x, d.y - p.y) <= d.w / 2 + 6:
					d.obT = s.anim + .4
					hit_drone(d, D.PWD.orbit.dmg[w.orbit] * pmul, "#e6ecff")
					sfx("x_orbit")
	if w.shot:
		m.shT -= dt
		if m.shT <= 0:
			var P: Dictionary = D.PWD.shot
			var tg = nearest_drone(cx, cy, P.rng[w.shot])
			if tg != null:
				m.shT = P.cd[w.shot]
				var base = atan2(tg.y - cy, tg.x - cx)
				var n: int = int(P.n[w.shot])
				for i in n:
					var a = base + (i / float(n - 1) - .5) * .55 + rnd(-.04, .04)
					s.bul.append({"x": cx, "y": cy, "x0": cx, "y0": cy, "reach": P.rng[w.shot], "vx": cos(a) * 330, "vy": sin(a) * 330, "l": P.rng[w.shot] / 330.0, "dmg": P.dmg[w.shot] * pmul, "c": col("#ffe08a")})
				sfx("x_shot")
				light(cx + cos(base) * 8, cy, 18, "255,225,150", .6, .1)
			else:
				m.shT = .2
	if w.mini:
		m.mnT -= dt
		if m.mnT <= 0:
			var P: Dictionary = D.PWD.mini
			var list: Array = []
			for d in s.drones:
				if d.hp > 0 and not d.flee and hyp(d.x - cx, d.y - cy) <= P.rng[w.mini]:
					list.append(d)
			list.sort_custom(func(a, b): return hyp(a.x - cx, a.y - cy) < hyp(b.x - cx, b.y - cy))
			if list.size() > 0:
				m.mnT = P.cd[w.mini]
				var n: int = int(P.n[w.mini])
				for i in n:
					fire_missile(cx, cy - 6, -PI / 2 + (i / float(maxi(1, n - 1)) - .5) * 1.4, list[i % list.size()], P.dmg[w.mini], 8, true, P.rng[w.mini], 0)
				sfx("x_mini")
			else:
				m.mnT = .25
	var ns: Array = []
	for q in s.slash:
		q.t += dt
		if q.t < q.l:
			ns.append(q)
	s.slash = ns
	var nm: Array = []
	for q in s.slashMk:
		q.t += dt
		if q.t < q.l:
			nm.append(q)
	s.slashMk = nm
	if w.katana:
		m.ktT -= dt
		if m.ktT <= 0:
			var P: Dictionary = D.PWD.katana
			var r: float = P.r[w.katana]
			var hits: Array = []
			for d in s.drones:
				if d.hp > 0 and not d.flee and hyp(d.x - cx, d.y - cy) <= r + d.w / 2:
					hits.append(d)
			if hits.size() > 0:
				m.ktT = P.cd[w.katana]
				hits.sort_custom(func(a, b): return hyp(a.x - cx, a.y - cy) < hyp(b.x - cx, b.y - cy))
				var a0 = atan2(hits[0].y - cy, hits[0].x - cx)
				for d in hits:
					hit_drone(d, P.dmg[w.katana] * pmul, "#e6fbff")
					var ha = atan2(d.y - cy, d.x - cx)
					ring(d.x, d.y, 2, 16, .22, "#ffffff")
					for i in 10:
						var sa = ha + rnd(-1.2, 1.2)
						var v = rnd(70, 190)
						fxp(d.x, d.y, cos(sa) * v, sin(sa) * v - 20, 220, rnd(.18, .4), "#ffffff" if i % 3 else "#8ff0ff", 1 if i % 4 else 2)
					for sd in [-.7, .7]:
						s.slashMk.append({"x": d.x, "y": d.y, "dx": cos(ha + sd) * 9, "dy": sin(ha + sd) * 9, "t": 0.0, "l": .22})
					if not d.kb > 0:
						d.kvx = cos(ha) * 160
						d.kvy = sin(ha) * 160 - 30
						d.kb = .18
						d.atk = ""
				var cuts: int = 3 if w.katana >= 4 else 2 if w.katana >= 2 else 1
				for i in cuts:
					s.katSd = -s.katSd
					s.slash.append({"x": cx, "y": cy, "a": a0 + (.5 if i == 1 else -.5 if i == 2 else 0.0), "t": -i * .07, "l": .3, "r": r + 6 + i * 2, "sd": (-1 if i % 2 else 1) * s.katSd})
				s.shake = maxf(s.shake, .1 + .03 * hits.size())
				light(cx, cy, r * 3, "200,240,255", .9, .18)
				sfx("slash")
			else:
				m.ktT = .08
	if w.field:
		var r: float = D.PWD.field.r[w.field]
		for d in s.drones:
			if d.hp <= 0:
				continue
			if hyp(d.x - cx, d.y - cy) <= r + d.w / 2:
				hurt(d, D.PWD.field.dps[w.field] * pmul * dt * (1 - D.ACC.fall * range_k(hyp(d.x - cx, d.y - cy), r)))
				if randf() < dt * 6:
					s.bolts.append({"x1": cx + rnd(-6, 6), "y1": cy + rnd(-6, 6), "x2": d.x, "y2": d.y, "l": .06, "c": col("#9ad8ff"), "th": false})
					sfx("x_field")

# ---------- senjata utama karakter ----------
func update_main_weapon(dt: float) -> void:
	var m: Dictionary = s.m
	var lv: int = s.mlv
	var Wp: Dictionary = D.WEAP[s.weap]
	var cx: float = m.x
	var cy: float = m.y - 10
	m.cdz -= dt
	if m.echo.size() > 0:
		for e in m.echo:
			e.t -= dt
		var fire: Array = []
		var keep: Array = []
		for e in m.echo:
			if e.t <= 0:
				fire.append(e)
			else:
				keep.append(e)
		m.echo = keep
		for e in fire:
			fire_slug(cx + m.dir * 10, cy - 1, e.a, e.L, e.dmg)
			light(cx + m.dir * 10, cy, 22, "200,250,255", .7, .14)
			sfx("x_rail2")
	if s.weap == "buddy":
		update_buddies(dt, Wp, lv)
		return
	if m.cdz > 0:
		return
	match s.weap:
		"weld":
			var tg = nearest_drone(cx, cy, Wp.r[lv])
			if tg == null:
				return
			var colw: String = D.TOOLC[lv]
			m.cdz = Wp.cd[lv]
			m.zt = .12
			if absf(m.vx) < 10:
				m.dir = int(signf(tg.x - cx)) if signf(tg.x - cx) != 0 else m.dir
			var hit = {tg.uid: true}
			shoot(cx + m.dir * 9, cy - 1, tg, {"pl": 1, "dmg": Wp.dmg[lv], "spark": colw, "k": range_k(hyp(tg.x - cx, tg.y - cy), Wp.r[lv]), "col": colw,
				"sp": 420.0, "size": 3.0, "trail": 9, "cb": _weld_cb.bind(tg, hit, int(Wp.chain[lv]), lv, colw, pmul, true)})
			sfx("x_weld")
		"rail":
			var tg = nearest_drone(cx, cy, Wp.r[lv])
			if tg == null:
				m.cdz = .15
				return
			m.cdz = Wp.cd[lv]
			m.zt = .2
			m.dir = int(signf(tg.x - cx)) if signf(tg.x - cx) != 0 else m.dir
			var a = atan2(tg.y - cy, tg.x - cx)
			fire_slug(cx + m.dir * 10, cy - 1, a, Wp.r[lv], Wp.dmg[lv])
			light(cx + m.dir * 10, cy, 30, "200,250,255", .9, .2)
			s.shake = maxf(s.shake, .1)
			sfx("x_rail")
			if lv >= 3:
				m.echo = [{"t": .2, "a": a, "L": Wp.r[lv], "dmg": Wp.dmg[lv] * .6}]
				if lv >= 5:
					m.echo.append({"t": .4, "a": a, "L": Wp.r[lv], "dmg": Wp.dmg[lv] * .4})
		"saw":
			if s.saws.size() > 0:
				return
			var tg = nearest_drone(cx, cy, Wp.r[lv])
			if tg == null:
				m.cdz = .15
				return
			m.cdz = Wp.cd[lv]
			m.dir = int(signf(tg.x - cx)) if signf(tg.x - cx) != 0 else m.dir
			var a = atan2(tg.y - cy, tg.x - cx)
			var n: int = 3 if lv >= 5 else 2 if lv >= 3 else 1
			for i in n:
				var aa = a + ((i - (n - 1) / 2.0) * .3 if n > 1 else 0.0)
				s.saws.append({"x": cx, "y": cy, "a": aa, "d": 0.0, "max": Wp.r[lv], "back": false, "hit": {}, "dmg": Wp.dmg[lv] * pmul, "spin": 0.0})
			sfx("x_saw")
		"nade":
			var tg = nearest_drone(cx, cy, Wp.r[lv])
			if tg == null:
				m.cdz = .15
				return
			m.cdz = Wp.cd[lv]
			m.dir = int(signf(tg.x - cx)) if signf(tg.x - cx) != 0 else m.dir
			var T = .45
			var k = range_k(hyp(tg.x - cx, tg.y - cy), Wp.r[lv])
			var vx: float = (tg.x + tg.vx * T + rnd(-1, 1) * k * 26 - cx) / T
			var vy: float = (tg.y + tg.vy * T + rnd(-1, 1) * k * 18 - cy) / T - .5 * 240 * T
			s.nades.append({"x": cx + m.dir * 8, "y": cy - 2, "vx": vx, "vy": vy, "stuck": null, "ox": 0.0, "oy": 0.0, "t": 0.0, "dmg": Wp.dmg[lv] * pmul, "spl": Wp.spl[lv], "lv": lv})
			sfx("x_throw")

func update_buddies(dt: float, Wp: Dictionary, lv: int) -> void:
	var m: Dictionary = s.m
	var n = 2 if lv >= 5 else 1
	while s.buddies.size() < n:
		s.buddies.append({"x": m.x, "y": m.y - 24, "cd": .5, "ph": randf() * 6, "dir": 1})
	s.buddies.resize(n)
	for i in s.buddies.size():
		var b: Dictionary = s.buddies[i]
		b.ph += dt
		b.cd -= dt
		var hx: float = m.x + (14 if i else -14)
		var hy: float = m.y - 26 + sin(b.ph * 3) * 2
		var tg = nearest_drone(m.x, m.y - 10, Wp.r[lv])
		var gx = hx
		var gy = hy
		if tg != null:
			var a = atan2(b.y - tg.y, b.x - tg.x)
			gx = tg.x + cos(a) * 44
			gy = tg.y + sin(a) * 44
			var lx: float = gx - m.x
			var ly: float = gy - m.y
			var ll = hyp(lx, ly)
			if ll > Wp.r[lv] * .7:
				gx = m.x + lx / ll * Wp.r[lv] * .7
				gy = m.y + ly / ll * Wp.r[lv] * .7
		var ex: float = gx - b.x
		var ey: float = gy - b.y
		var ed = hyp(ex, ey)
		if ed > 1:
			var sp = minf(ed / dt, 150.0)
			b.x += ex / ed * sp * dt
			b.y += ey / ed * sp * dt
		b.dir = (1 if tg.x >= b.x else -1) if tg != null else m.dir
		if tg != null and b.cd <= 0 and hyp(tg.x - b.x, tg.y - b.y) <= 80:
			b.cd = Wp.cd[lv]
			var a = atan2(tg.y - b.y, tg.x - b.x)
			for da in ([-.12, .12] if lv >= 3 else [0.0]):
				s.bul.append({"x": b.x, "y": b.y, "x0": b.x, "y0": b.y, "reach": 112.0, "vx": cos(a + da) * 320, "vy": sin(a + da) * 320, "l": .35,
					"dmg": Wp.dmg[lv] * pmul * (.7 if lv >= 3 else 1.0), "c": col("#e0b8ff")})
			sfx("x_buddy2" if lv >= 3 else "x_buddy")

func update_main_projectiles(dt: float) -> void:
	var m: Dictionary = s.m
	var nr: Array = []
	for r in s.rails:
		r.l -= dt
		if r.l > 0:
			nr.append(r)
	s.rails = nr
	var keep: Array = []
	for w in s.saws:
		w.spin += dt * 30
		if not w.back:
			w.d += 230 * dt
			w.x += cos(w.a) * 230 * dt
			w.y += sin(w.a) * 230 * dt
			if w.d >= w.max:
				w.back = true
				w.hit.clear()
		else:
			var ex: float = m.x - w.x
			var ey: float = m.y - 10 - w.y
			var ed = hyp(ex, ey)
			if ed < 8:
				puff(m.x, m.y - 10, 2, "#d0d6e2")
				continue
			w.x += ex / ed * 270 * dt
			w.y += ey / ed * 270 * dt
		for d in s.drones:
			if d.hp <= 0 or w.hit.has(d.uid):
				continue
			if hyp(d.x - w.x, d.y - w.y) <= d.w / 2 + 5:
				w.hit[d.uid] = true
				if hit_at(d, w.dmg, "#ffd36b", range_k(hyp(d.x - m.x, d.y - m.y + 10), w.max)):
					sfx("clank")
		keep.append(w)
	s.saws = keep
	var kn: Array = []
	for g in s.nades:
		if g.stuck != null:
			if g.stuck is Dictionary and g.stuck.has("uid") and dalive(g.stuck) and g.stuck.hp > 0:
				g.x = g.stuck.x + g.ox
				g.y = g.stuck.y + g.oy
			g.t += dt
			if g.t >= .8:
				explode(g.x, g.y, g.spl, g.dmg, "#9dffb0")
				sfx("x_nade")
				if g.lv >= 3:
					var nb: int = 5 if g.lv >= 5 else 3
					for i in nb:
						var a: float = i / float(nb) * 6.283 + rnd(0, 1)
						var dd: float = g.spl * rnd(.9, 1.5)
						var bx: float = g.x + cos(a) * dd
						var by: float = minf(GW - 3, g.y + sin(a) * dd * .6)
						var sp: float = g.spl
						var dmgv: float = g.dmg
						later(.12 + i * .09, func(): explode(bx, by, sp * .6, dmgv * .45, "#c8ff6a"))
				continue
			kn.append(g)
			continue
		g.vy += 240 * dt
		g.x += g.vx * dt
		g.y += g.vy * dt
		var stuck = false
		for d in s.drones:
			if d.hp <= 0:
				continue
			if hyp(d.x - g.x, d.y - g.y) <= d.w / 2 + 3:
				g.stuck = d
				g.ox = g.x - d.x
				g.oy = g.y - d.y
				sfx("clank")
				stuck = true
				break
		if stuck:
			kn.append(g)
			continue
		if g.y >= GW - 2:
			g.y = GW - 2
			g.stuck = {"x": g.x, "y": g.y, "hp": 1}
			g.ox = 0.0
			g.oy = 0.0
		if g.x > -20 and g.x < W + 20:
			kn.append(g)
	s.nades = kn

# ---------- proyektil ----------
func update_projectiles(dt: float) -> void:
	var ks: Array = []
	for p in s.shells:
		p.t += dt
		if p.t >= p.T:
			explode(p.x1, p.y1, p.spl, p.dmg, "#ffb347", true)
		else:
			ks.append(p)
	s.shells = ks
	var km: Array = []
	for p in s.missiles:
		if p.aim == null and (p.tgt == null or p.tgt.hp <= 0 or not dalive(p.tgt)):
			p.tgt = nearest_drone(p.x, p.y, 220)
		var mx: float = 260.0 if p.small else 200.0
		p.sp = minf(mx, p.sp + 260 * dt)
		var a = atan2(p.vy, p.vx)
		var aim = p.aim if p.aim != null else p.tgt
		if aim != null:
			var da: float = atan2(aim.y - p.y, aim.x - p.x) - a
			while da > PI:
				da -= 6.283
			while da < -PI:
				da += 6.283
			var lim: float = (7.0 if p.small else 4.5) * dt
			a += clampf(da, -lim, lim)
		p.vx = cos(a) * p.sp
		p.vy = sin(a) * p.sp
		p.x += p.vx * dt
		p.y += p.vy * dt
		p.l -= dt
		if randf() < dt * 40:
			fxp(p.x - cos(a) * 3, p.y - sin(a) * 3, rnd(-8, 8), rnd(-8, 8), 0, rnd(.2, .4), "#c9c2b0" if randf() < .5 else "#ffb347")
		if p.aim != null and hyp(p.aim.x - p.x, p.aim.y - p.y) <= 6:
			if not p.small:
				explode(p.x, p.y, p.spl, p.dmg, "#ff9a6a")
			else:
				miss_fx({"x": p.x, "y": p.y, "missT": 0.0})
			continue
		var t = p.tgt
		if t != null and hyp(t.x - p.x, t.y - p.y) <= t.w / 2 + 3:
			if p.small:
				plyr = true
				hit_drone(t, p.dmg, "#ffb347")
				plyr = false
				ignite(t, 2.5, clampf(p.dmg * .25, .8, 5))
				ring(p.x, p.y, 2, 10, .2, "#ffb347")
				sfx("x_minihit")
			else:
				explode(p.x, p.y, p.spl, p.dmg, "#ff9a6a")
			continue
		if p.l <= 0 or p.y >= GW - 2:
			if not p.small:
				explode(p.x, p.y, p.spl, p.dmg * .5, "#ff9a6a")
			continue
		km.append(p)
	s.missiles = km
	var kn: Array = []
	for p in s.nets:
		p.x += p.vx * dt
		p.y += p.vy * dt
		p.l -= dt
		p.r = minf(7.0, p.r + 30 * dt)
		var caught = false
		for d in s.drones:
			if d.hp <= 0 or d.flee:
				continue
			if hyp(d.x - p.x, d.y - p.y) <= d.w / 2 + 5:
				d.net = maxf(d.net, p.hold)
				d.atk = ""
				puff(d.x, d.y, 4, "#d8e0a0")
				sfx("clank")
				caught = true
				break
		if not caught and p.l > 0 and p.y < GW:
			kn.append(p)
	s.nets = kn
	var kb: Array = []
	for p in s.bul:
		p.x += p.vx * dt
		p.y += p.vy * dt
		p.l -= dt
		var gone = false
		for d in s.drones:
			if d.hp <= 0:
				continue
			if hyp(d.x - p.x, d.y - p.y) <= d.w / 2 + 2:
				plyr = true
				if p.reach > 0:
					hit_at(d, p.dmg, p.c, range_k(hyp(p.x - p.x0, p.y - p.y0), p.reach))
				else:
					hit_drone(d, p.dmg, "#ffe08a")
				plyr = false
				gone = true
				break
		if not gone and p.l > 0:
			kb.append(p)
	s.bul = kb
	var kbm: Array = []
	for b in s.beams:
		b.l -= dt
		if b.l > 0:
			kbm.append(b)
	s.beams = kbm
	update_shots(dt)

func update_shots(dt: float) -> void:
	var ksh: Array = []
	for p in s.shots:
		var alive: bool = dalive(p.d) and p.d.hp > 0
		if alive:
			p.lx = p.d.x
			p.ly = p.d.y
		var tx: float = p.lx + (p.ox if p.miss else 0.0)
		var ty: float = p.ly + (p.oy if p.miss else 0.0)
		var ex: float = tx - p.x
		var ey: float = ty - p.y
		var ed = hyp(ex, ey)
		var st: float = p.sp * dt
		p.a = atan2(ey, ex)
		if ed > st:
			p.x += ex / ed * st
			p.y += ey / ed * st
			ksh.append(p)
			continue
		p.x = tx
		p.y = ty
		if not p.miss and alive:
			plyr = p.pl != 0
			hit_drone(p.d, p.dmg, p.spark)
			plyr = false
			if p.cb != null:
				p.cb.call(true)
		else:
			if alive:
				miss_fx(p.d)
			if p.cb != null:
				p.cb.call(false)
	s.shots = ksh
	var ke: Array = []
	for p in s.eshots:
		var ex: float = p.tx - p.x
		var ey: float = p.ty - p.y
		var ed = hyp(ex, ey)
		var st: float = p.sp * dt
		if ed <= st:
			puff(p.tx, p.ty, 1, "#ff9a6a")
			continue
		p.x += ex / ed * st
		p.y += ey / ed * st
		ke.append(p)
	s.eshots = ke
	var ksl: Array = []
	for p in s.slugs:
		var alive = true
		for k in 4:
			p.x += p.vx * dt / 4
			p.y += p.vy * dt / 4
			var tr = hyp(p.x - p.x0, p.y - p.y0)
			if tr > p.reach:
				alive = false
				break
			for d in s.drones:
				if d.hp <= 0 or p.hit.has(d.uid):
					continue
				if hyp(d.x - p.x, d.y - p.y) <= d.w / 2 + 3:
					p.hit[d.uid] = true
					plyr = true
					hit_at(d, p.dmg, "#e6fbff", range_k(tr, p.reach))
					plyr = false
		if alive and p.x > -20 and p.x < W + 20 and p.y > -40 and p.y < GW + 10:
			ksl.append(p)
	s.slugs = ksl

## sambaran las melompat ke drone berikutnya
func _weld_cb(ok: bool, tg: Dictionary, hit: Dictionary, left: int, lv: int, colw: String, pm: float, first: bool) -> void:
	if not ok:
		return
	if first:
		if randf() < .2 + .06 * lv:
			shock_drone(tg, 1 + .2 * lv)
	elif randf() < .2:
		shock_drone(tg, 1.0)
	if left <= 0:
		return
	var t2 = nearest_drone(tg.x, tg.y, 48, func(d): return hit.has(d.uid))
	if t2 == null:
		return
	hit[t2.uid] = true
	shoot(tg.x, tg.y, t2, {"pl": 1, "dmg": D.WEAP[s.weap].dmg[lv] * .75 * pm, "spark": colw, "k": 0.0, "col": colw, "sp": 460.0, "size": 2.0,
		"cb": _weld_cb.bind(t2, hit, left - 1, lv, colw, pm, false)})
