extends Node
## Simulasi inti, bagian 1: state, util, efek, musuh, hit/ledakan. Port dari va.js / vb.js / vt.js.
## Rantai pewarisan: sim_base -> sim_tower -> sim_update -> game (menambah gambar + input).

signal game_over
signal game_won
signal say_msg(text: String)

const W := 360.0
const CX := 180.0
const GW := 794.0
const K := 1.5

var s: Dictionary = {}
var running = false
var paused = false
var cam_y = 0.0
var vh = 700.0
var plyr = false          # true saat senjata pemain memberi damage (bisa kritis)
var pmul = 1.0            # pengali damage senjata pemain di dekat core
var card_hold = null       # kartu menu yang sedang ditahan: {key,t,done}
var blast = {"cost": .75, "r": 192.0, "pow": 540.0, "sp": 48.0, "dmg": 5.0}
var jet_in = {"on": false, "x": 0.0, "y": 0.0}
var keys = {"l": 0, "r": 0, "thr": 0, "dn": 0}
var gk = {"l": 0, "r": 0}
var sun = {"x": 180.0, "e": 1.0, "a": 1.0}
var pending: Array = []    # [{t, fn}] tindakan tertunda (pengganti setTimeout)
var _cc = {}
var _uid = 0
var dmap = {}          # uid -> drone hidup (untuk cek keberadaan tanpa ==/has pada Dictionary)

func nuid() -> int:
	_uid += 1
	return _uid

func dalive(d) -> bool:
	return d != null and dmap.has(d.uid)

func rebuild_dmap() -> void:
	dmap = {}
	for d in s.drones:
		dmap[d.uid] = true


func rnd(a: float, b: float) -> float:
	return randf_range(a, b)

func rj(v: float) -> float:
	return floorf(v + .5)

func hyp(a: float, b: float) -> float:
	return sqrt(a * a + b * b)

func col(c) -> Color:
	if c is Color:
		return c
	if not _cc.has(c):
		_cc[c] = Color(c)
	return _cc[c]

func sfx(n: String) -> void:
	var a = get_node_or_null("/root/Audio")
	if a:
		a.sfx(n)

func say(m: String, _t := 0.0) -> void:
	if m.contains("habis") or m.contains("butuh"):
		sfx("nope")
	say_msg.emit(m)

func cur_up() -> Dictionary:
	return Prof.cur_up()

# ---------- efek ----------
func ring(x: float, y: float, r0: float, r1: float, l: float, c) -> void:
	s.fx.append({"ring": 1, "x": x, "y": y, "r0": r0, "r1": r1, "l": l, "L": l, "c": col(c), "vx": 0.0, "vy": 0.0, "g": 0.0})

func puff(x: float, y: float, n: int, c) -> void:
	var cc = col(c)
	for i in n:
		s.fx.append({"x": x + rnd(-4, 4), "y": y + rnd(-4, 4), "vx": rnd(-30, 30), "vy": rnd(-50, -5), "g": 120.0, "l": rnd(.3, .6), "c": cc})

func fxp(x: float, y: float, vx: float, vy: float, g: float, l: float, c, sz := 1) -> void:
	s.fx.append({"x": x, "y": y, "vx": vx, "vy": vy, "g": g, "l": l, "c": col(c), "s": sz})

func light(x: float, y: float, r: float, rgb: String, a: float, l: float) -> void:
	var p = rgb.split(",")
	s.fx.append({"light": 1, "x": x, "y": y, "r": r, "rgb": Color(float(p[0]) / 255.0, float(p[1]) / 255.0, float(p[2]) / 255.0), "a": a, "l": l, "L": l, "vx": 0.0, "vy": 0.0, "g": 0.0})

func ftext(x: float, y: float, t: String, vy: float, l: float, c, comic := false) -> void:
	s.fx.append({"text": t, "comic": 1 if comic else 0, "x": x, "y": y, "vx": 0.0, "vy": vy, "g": 0.0, "l": l, "L": l, "c": col(c)})

func later(t: float, fn: Callable) -> void:
	pending.append({"t": t, "fn": fn})

# ---------- tower: data bantu ----------
func tower_max_hp(t: Dictionary) -> float:
	if not t.lv:
		return 0.0
	if t.ty == "decoy":
		return D.TY.decoy.hp[t.lv]
	return Dev.tw_hp(t.ty, t.lv)

func tower_cap() -> int:
	return mini(D.TW.max, 3 * s.coreLv)

func core_need(lv: int) -> int:
	return int(ceil(lv / 3.0))

func tower_busy(t: Dictionary) -> bool:
	for b in s.bps:
		if b.slot == t.i:
			return true
	return false

func sh_active(t: Dictionary) -> bool:
	return t.lv >= 1 and t.sh > 0 and not t.brk and not tower_busy(t)

func tower_cost(ty: String) -> int:
	var n = 0
	for t in s.towers:
		if t.lv > 0:
			n += 1
	for b in s.bps:
		if b.kind == "tower":
			n += 1
	var base: float = maxf(2, rj(D.TW.cost[mini(n, D.TW.cost.size() - 1)] * D.TY[ty].get("cost", 1.0)))
	return Dev.tw_build_cost(ty, base)

func ruin_cost(t: Dictionary) -> int:
	return maxi(1, int(rj(t.ruin.spent / 3.0)))

func slot_active(t: Dictionary) -> bool:
	if not t.pl:
		return true
	var cr: Dictionary = s.crane2 if t.pl == 2 else s.crane
	return t.k < D.CR.n[cr.lv - 1]

func plat(n: int) -> Dictionary:
	var c: Dictionary = s.crane2 if n == 2 else s.crane
	return {"px": c.px, "y": c.y, "w": D.CR.w[c.lv - 1]}

# ---------- reset ----------
func mk_bot(x: float) -> Dictionary:
	return {"x": x, "y": GW, "st": "rest", "tx": x, "t": rnd(.5, 2), "carry": 0, "dir": 1, "ph": rnd(0, 6), "mv": 0, "weld": 0.0,
		"job": null, "onsite": false, "fetch": null, "atkD": null, "attach": 0, "fighter": false, "scanT": 0.0, "ao": 0.0, "sT": 0.0}

func mk_tower(i: int, x: float, y: float, pl: int, k: int) -> Dictionary:
	return {"i": i, "x": x, "y": y, "pl": pl, "k": k, "ty": "g", "lv": 0, "cd": 0.0, "ang": -PI / 2, "fl": 0.0, "sh": 0, "shHp": 0.0, "shT": 0.0,
		"shHit": 0.0, "brk": false, "au": 0, "pop": 0.0, "hp": 0.0, "spent": 0, "ruin": null, "beam": 0.0, "tgt": null, "lock": 0.0,
		"hHit": 0.0, "dHit": 0.0, "rt": 0.0}

func apply_meta() -> void:
	var u = cur_up()
	D.MECH.jet = int(u.jet)
	D.MECH.hp = 10.0 + 2 * u.hp
	D.MECH.bat = 20.0 + 4 * u.bat
	D.MECH.charge = 1.4 * D.MECH.bat / 20.0
	blast.cost = maxf(.3, .75 - .09 * u.aura)
	blast.r = rj(192.0 * (1 + .15 * u.aura))
	blast.pow = rj(540.0 * (1 + .15 * u.aura))
	blast.dmg = 5.0 * (1 + .15 * u.aura)

func reset() -> void:
	apply_meta()
	var u = cur_up()
	var tw: Array = []
	for i in D.SLOTX.size():
		tw.append(mk_tower(i, D.SLOTX[i], GW, 0, 0))
	for k in D.CR.off[2].size():
		tw.append(mk_tower(6 + k, CX + D.CR.off[0][mini(k, 1)], GW - D.CR.h[0], 1, k))
	for k in D.CR2.off[2].size():
		tw.append(mk_tower(10 + k, CX + D.CR2.off[0][mini(k, 1)], GW - D.CR.h[0] - D.CRCLEAR, 2, k))
	s = {"run": {"len": 0}, "t": 0.0, "day": 1, "coins": 7, "hp": 40.0, "maxHp": 40.0, "coreLv": 1, "botw": 1,
		"res": {"shield": 0, "slow": 0, "cur": null, "q": []},
		"wp": {"katana": u.katana, "orbit": u.orbit, "shot": u.shot, "mini": u.mini, "field": u.field}, "pg": {},
		"ch": Prof.prof().ch, "weap": Prof.cur_char().weap, "mlv": u.main, "rails": [], "saws": [], "nades": [], "buddies": [],
		"missiles": [], "shells": [], "nets": [], "bul": [], "beams": [], "shots": [], "eshots": [], "slugs": [], "shake": 0.0,
		"pulseT": 0.0, "tool": 1, "anim": 0.0,
		"m": {"x": CX - 34.0, "y": GW, "vx": 0.0, "vy": 0.0, "dir": 1, "st": "g", "pf": 1, "hurt": 0.0, "cdz": 0.0, "zt": 0.0, "help": false,
			"hp": D.MECH.hp, "bat": D.MECH.bat, "thr": false, "lock": false, "peak": GW, "warn": 0.0, "soft": 0, "rg": 0.0, "rp": 0.0,
			"stillT": 0.0, "stillA": 0.0, "shT": 0.0, "mnT": 0.0, "ktT": 0.0, "echo": []},
		"bps": [], "crane": {"lv": 1, "y": GW - D.CR.h[0], "h": D.CR.h[0], "ox": 0.0, "px": CX},
		"crane2": {"lv": 1, "y": GW - D.CR.h[0] - D.CRCLEAR, "h": D.CR.h[0] + D.CRCLEAR, "ox": 0.0, "px": CX},
		"pick": null, "towers": tw, "bots": [mk_bot(CX - 20), mk_bot(CX + 20)], "drones": [], "bolts": [], "fx": [], "drops": [],
		"queue": [], "lq": [], "lid": 0, "wv": null, "spawnT": 0.0, "quota": 0, "nightOn": false, "msg": "", "msgT": 0.0,
		"over": false, "kills": 0, "lures": 0, "waves": [], "slash": [], "slashMk": [], "slow": null, "coreHit": 0.0, "pdm": 1.0,
		"cause": "", "katSd": 1}
	dmap = {}
	cam_y = camy_max()

func camy_max() -> float:
	return maxf(0.0, GW - (vh - D.BOT))

# ---------- musuh ----------
func spawn_drone(kind: String, sx := -999.0) -> Dictionary:
	var w: Dictionary = s.wv if s.wv != null else D.wave_info(s.day)
	var hp: float
	var dmg: float
	var wd: float
	var ht: float
	var sp: float
	var heavy = false
	var boss = false
	var drop = 1
	if kind == "m":
		hp = maxf(1, rj(.3 * w.hpm)); dmg = .45 * w.dmm; wd = 5; ht = 3; sp = rnd(78, 96) * w.spm; drop = 1 if randf() < .35 else 0
	elif kind == "b":
		boss = true; hp = rj(D.WAVE.bossHp * w.hpm); dmg = D.WAVE.bossDmg * w.dmm; wd = 24; ht = 10; sp = 24 * w.spm; drop = 14
	elif kind == "h":
		heavy = true; hp = rj(9 * w.hpm); dmg = 2 * w.dmm; wd = 13; ht = 7; sp = 40 * w.spm; drop = 4
	else:
		hp = maxf(2, rj(2 * w.hpm)); dmg = 1 * w.dmm; wd = 8; ht = 4; sp = rnd(58, 72) * w.spm; drop = 2
	hp = Dev.enemy(kind, "hp", s.day)
	dmg = Dev.enemy(kind, "dmg", s.day)
	var nv: int = D.DVAR.b if boss else D.DVAR.h if heavy else D.DVAR.m if kind == "m" else D.DVAR.s
	var d = {"x": sx if sx > -900 else rnd(20, W - 20), "y": maxf(-24.0, cam_y - 24), "hp": hp, "max": hp, "heavy": heavy, "boss": boss,
		"drop": drop, "w": wd, "h": ht, "sp": sp, "dmg": dmg, "ph": rnd(0, 6), "hit": 0.0, "cd": 0.0, "ox": rnd(-12, 12), "atk": "", "atkY": 0.0,
		"v": int(randf() * nv), "swarm": kind == "m", "burn": 0.0, "bdps": 0.0, "stun": 0.0, "net": 0.0, "shock": 0.0, "kb": 0.0, "kvx": 0.0,
		"kvy": 0.0, "rt": 0.0, "rvx": 0.0, "rvy": 0.0, "flee": false, "chase": false, "dead": false, "critAt": -1.0, "missT": 0.0, "obT": 0.0,
		"lure": 0, "vx": 0.0, "vy": 0.0, "tw": -1, "dc": -1, "sh": -1, "slow": false, "uid": nuid()}
	s.drones.append(d)
	dmap[d.uid] = true
	return d

# ---------- hit / damage ----------
func range_k(dist: float, reach: float) -> float:
	return clampf(dist / maxf(1.0, reach), 0.0, 1.2)

func miss_fx(d: Dictionary) -> void:
	fxp(d.x + rnd(-6, 6), d.y + rnd(-6, 6), rnd(-20, 20), rnd(-30, -10), 0, .25, "#9aa1ad")
	if not (d.missT > s.anim):
		d.missT = s.anim + .35
		ftext(d.x, d.y - 10, "MISS", -26, .75, "#e6ecff")

func hit_at(d: Dictionary, dmg: float, spark, k: float) -> bool:
	if randf() < D.ACC.miss * pow(k, 1.6):
		miss_fx(d)
		return false
	hit_drone(d, dmg * (1 - D.ACC.fall * minf(1.0, k)), spark)
	return true

func crit_alt() -> float:
	return clampf((GW - s.m.y) / (GW - 24), 0.0, 1.0)

func crit_chance() -> float:
	return D.CRIT.max * crit_alt()

func crit_mul() -> float:
	return D.CRIT.mul0 + (D.CRIT.mul1 - D.CRIT.mul0) * crit_alt()

func hit_drone(d: Dictionary, dmg: float, spark = null) -> void:
	var crit = false
	if plyr:
		var cc = crit_chance()
		if cc > 0 and randf() < cc:
			dmg *= crit_mul()
			crit = true
	if crit:
		d.critAt = s.anim
		ftext(clampf(d.x, 95, W - 95), d.y - 34, "CRITICAL HIT!!", -10, 1.0, "#ffe23a", true)
		sfx("crit")
	d.hp -= dmg
	d.hit = .1
	if spark == null:
		puff(d.x, d.y, 2, "#8ff0ff")
	elif randf() < .4:
		puff(d.x, d.y, 1, spark)

func hurt(d: Dictionary, dmg: float) -> void:
	d.hp -= dmg
	d.hit = maxf(d.hit, .05)

func ignite(d: Dictionary, dur: float, dps: float) -> void:
	if d.hp <= 0:
		return
	if not (d.burn > 0):
		d.bdps = 0.0
		sfx("burn")
	d.burn = maxf(d.burn, dur)
	d.bdps = maxf(d.bdps, dps * (.7 if d.boss else 1.0))

func shock_drone(d: Dictionary, dur: float) -> void:
	if d.hp <= 0 or d.flee:
		return
	if not (d.shock > 0):
		sfx("zap")
	d.shock = maxf(d.shock, dur * (.5 if d.boss else .75 if d.heavy else 1.0))
	d.atk = ""
	d.chase = false
	d.rt = 0.0

func nearest_drone(x: float, y: float, r: float, skip := Callable()) -> Variant:
	var tg = null
	var bd = r
	for d in s.drones:
		if d.hp <= 0 or d.flee:
			continue
		if skip.is_valid() and skip.call(d):
			continue
		var dd = hyp(d.x - x, d.y - y)
		if dd < bd:
			bd = dd
			tg = d
	return tg

func explode(x: float, y: float, r: float, dmg: float, c, big := false) -> void:
	if big:
		ring(x, y, 3, r * 1.25, .55, "#fff0b8"); ring(x, y, 2, r * .8, .4, "#ffb347"); ring(x, y, r * .3, r * 1.7, .7, "#ff7a3a")
		light(x, y, r * 3.2, "255,190,100", 1.0, .55)
		light(x, y, r * 1.5, "255,250,220", 1.0, .18)
		var cols = ["#ffd36b", "#ff9a3a", "#ff5a1a", "#fff0b8"]
		for i in 22:
			var a = rnd(0, 6.283)
			var v = rnd(40, 150)
			fxp(x, y, cos(a) * v, sin(a) * v - 40, 260, rnd(.4, .9), cols[i & 3], 2)
		for i in 10:
			fxp(x + rnd(-r * .5, r * .5), y, rnd(-30, 30), -rnd(30, 90), -30, rnd(.7, 1.3), "#6a6f7a" if i % 2 else "#4a4f58", 3)
		for i in 8:
			fxp(x, y, rnd(-110, 110), rnd(-170, -60), 360, rnd(.6, 1.1), "#5a6070" if i % 2 else "#7a6a4a", 2)
		puff(x, y, 14, "#8a8f98"); puff(x, y, 10, "#ffb347")
		s.shake = maxf(s.shake, .28)
	for d in s.drones:
		if d.hp <= 0:
			continue
		var dd = hyp(d.x - x, d.y - y)
		if dd <= r + d.w / 2:
			hit_drone(d, dmg * (1.0 if dd < r * .45 else .6), c)
			ignite(d, 3.5, clampf(dmg * .3, 1, 9))
	ring(x, y, 3, r, .35, c)
	light(x, y, r * 1.8, "255,180,90", .8, .3)
	puff(x, y, 8, "#8a8f98"); puff(x, y, 5, "#ffb347")
	sfx("boom")

func bolt(x1: float, y1: float, x2: float, y2: float, c = "#8ff0ff", snd = null, th := false) -> void:
	sfx(snd if snd else ("shot" if str(c) == "#ffd36b" else "zap"))
	s.bolts.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "l": .1, "c": col(c), "th": th})

func enemy_shot(d: Dictionary, x: float, y: float) -> void:
	s.eshots.append({"x": d.x, "y": d.y + 3, "tx": x, "ty": y, "sp": 260.0})

func shoot(x: float, y: float, d: Dictionary, o: Dictionary) -> void:
	var k: float = o.get("k", 0.0)
	var miss: bool
	if o.has("acc"):
		miss = randf() < 1 - o.acc * (1 - .35 * pow(k, 1.6))
	else:
		miss = randf() < D.ACC.miss * pow(k, 1.6)
	s.shots.append({"x": x, "y": y, "d": d, "lx": d.x, "ly": d.y, "miss": miss, "ox": rnd(-12, 12), "oy": rnd(-10, 10),
		"dmg": o.dmg * pmul * (1 - D.ACC.fall * minf(1.0, k)), "pl": o.get("pl", 0), "spark": o.get("spark"), "col": col(o.get("col", "#ffffff")),
		"sp": o.get("sp", 540.0), "size": o.get("size", 2.0), "trail": o.get("trail", 7), "shape": o.get("shape", "dot"), "cb": o.get("cb"), "a": 0.0})

func fire_slug(x: float, y: float, a: float, reach: float, dmg: float) -> void:
	s.slugs.append({"x": x, "y": y, "x0": x, "y0": y, "vx": cos(a) * 1100.0, "vy": sin(a) * 1100.0, "reach": reach, "dmg": dmg * pmul, "hit": {}})

func fire_missile(x: float, y: float, ang: float, tgt: Dictionary, dmg: float, spl: float, small: bool, reach: float, tlv: int) -> void:
	var v = 90.0 if small else 60.0
	var k = range_k(hyp(tgt.x - x, tgt.y - y), reach) if reach > 0 else 0.0
	var p = {"x": x, "y": y, "vx": cos(ang) * v, "vy": sin(ang) * v, "sp": v, "tgt": tgt, "dmg": dmg * pmul * (1 - D.ACC.fall * k), "spl": spl,
		"small": small, "tlv": tlv, "l": 3.0 if small else 5.0, "aim": null}
	if randf() < D.ACC.miss * pow(k, 1.6):
		p.aim = {"x": tgt.x + rnd(-36, 36), "y": tgt.y + rnd(-30, 30)}
		p.tgt = null
	s.missiles.append(p)

func clear_tower(t: Dictionary) -> void:
	var nb: Array = []
	for b in s.bps:
		if b.slot != t.i:
			nb.append(b)
	s.bps = nb
	t.ruin = null; t.lv = 0; t.ty = "g"; t.sh = 0; t.shHp = 0.0; t.brk = false; t.au = 0; t.spent = 0; t.hp = 0.0
	t.cd = 0.0; t.fl = 0.0; t.beam = 0.0; t.tgt = null; t.lock = 0.0; t.hHit = 0.0
	for d in s.drones:
		if d.tw == t.i:
			d.tw = -1
			d.atk = ""

func damage_tower(t: Dictionary, dmg: float) -> void:
	t.hp -= dmg
	t.hHit = .25
	sfx("clank")
	if t.hp <= 0:
		var y: float = t.y - D.TWH[t.lv] / 2.0
		sfx("boom"); ring(t.x, y, 4, 40, .5, "#ffb347"); puff(t.x, y, 16, "#8a8f98"); puff(t.x, y, 8, "#ffb347")
		light(t.x, y, 90, "255,170,80", .9, .45)
		for i in 10:
			fxp(t.x, y, rnd(-90, 90), rnd(-140, -30), 320, rnd(.6, 1), "#5a6070" if i % 2 else "#7a6a4a", 2)
		s.shake = maxf(s.shake, .35)
		var rn = {"ty": t.ty, "lv": t.lv, "sh": t.sh, "au": t.au, "spent": t.spent}
		clear_tower(t)
		t.ruin = rn

func nearest_building(d: Dictionary, core_dist: float) -> Array:
	var best = null
	var bd = core_dist
	for t in s.towers:
		if not t.lv:
			continue
		var dd = hyp(d.x - t.x, d.y - (t.y - D.TWH[t.lv] / 2.0 - 2))
		if dd < bd:
			bd = dd
			best = t
	return [best, bd]

func near_tower(t: Dictionary) -> bool:
	return s.m.stillA > .02 and absf(s.m.x - t.x) <= 34 and absf(s.m.y - t.y) <= 40

func decoy_on(t: Dictionary) -> bool:
	return t.ty == "decoy" and t.lv > 0 and not tower_busy(t) and t.hp > 0

func decoy_for(d: Dictionary) -> Variant:
	var best = null
	var bd = 1e9
	for t in s.towers:
		if not decoy_on(t):
			continue
		var dd = hyp(d.x - t.x, d.y - (t.y - D.TWH[t.lv] - 4))
		if dd <= D.TY.decoy.rng[t.lv] and dd < bd:
			bd = dd
			best = t
	return best

func magnet_near(x: float, y: float) -> Variant:
	for t in s.towers:
		if t.ty == "magnet" and t.lv > 0 and not tower_busy(t) and hyp(x - t.x, y - (t.y - D.TWH[t.lv])) <= D.TY.magnet.rng[t.lv]:
			return t
	return null

func magnet_bonus(x: float, y: float) -> float:
	var b = 0.0
	for t in s.towers:
		if t.ty == "magnet" and t.lv > 0 and not tower_busy(t) and hyp(x - t.x, y - (t.y - D.TWH[t.lv])) <= D.TY.magnet.rng[t.lv]:
			b += D.TY.magnet.bonus[t.lv]
	return b

func solar_boost() -> float:
	var b = 0.0
	for t in s.towers:
		if t.ty == "solar" and t.lv > 0 and not tower_busy(t):
			b += D.TY.solar.chg[t.lv]
	return minf(2.0, b)

func boost_now() -> float:
	return 1.0 + (s.coreLv - 1.0) / (D.CORE.max - 1.0) if hyp(s.m.x - CX, (s.m.y - 10) - (GW - 17)) <= D.CORE.near else 1.0
