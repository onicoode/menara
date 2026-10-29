extends "res://scripts/sim_tower.gd"
## Simulasi bagian 3: menu bangun, siang/malam, loop update utama. Port dari va.js (menu) dan vb.js (update).

const NMAP := {"Bangun tower":"Bangun","Sedang dikerjakan":"Dibangun","Upgrade tower":"Naik Lv","Tower maks":"Maks","Upgrade shield":"Shield","Shield maks":"Shield",
	"Upgrade aura lambat":"Aura","Aura maks":"Aura","Jual tower":"Jual","Crane naik":"Naik","Crane turun":"Turun","Putar kiri":"Kiri","Putar kanan":"Kanan",
	"Upgrade crane kiri":"Crane kiri","Upgrade crane kanan":"Crane kanan","Upgrade crane":"Crane","Crane maks":"Crane","Isi energi core":"Isi core","Upgrade core":"Core",
	"Las robot":"Las robot","Las robot maks":"Las robot","Pekerja baru":"Pekerja","Riset":"Riset","Upgrade alat las":"Alat las","Alat las maks":"Alat las","Pilihan lain":"Lainnya"}
const RNM := {"shield":"Shield","slow":"Aura"}
const ZONE := 26.0

func tower_icon(t: String) -> String:
	return "tower" if t == "g" else "flame" if t == "f" else t

func tw_owned(ty: String) -> bool:
	return Prof.tw_own(ty)

func paged(list: Array, id: String, cap := 8) -> Array:
	if list.size() <= cap:
		return list
	var n = cap - 1
	var pages: int = int(ceil(list.size() / float(n)))
	var p: int = int(s.pg.get(id, 0)) % pages
	var out: Array = list.slice(p * n, p * n + n)
	out.append({"key": "pg_" + id + str(p), "kind": "page", "icon": "next", "label": "Pilihan lain", "state": "ok", "page": id, "badge": str(p + 1) + "/" + str(pages), "badgePlain": 1})
	return out

func opt(d: Dictionary) -> Dictionary:
	return d

## kartu yang ditawarkan menurut posisi mekanik
func ctx_options() -> Array:
	var m: Dictionary = s.m
	var o: Array = []
	if m.st == "" or m.thr:
		s.pick = null
		return o
	var on_p: bool = m.st == "p"
	var base: bool = not on_p and m.x >= 338
	var base2: bool = not on_p and not base and m.x <= 22
	var near_core: bool = not on_p and not base and not base2 and absf(m.x - CX) <= ZONE
	var tw = null
	var bd = ZONE + 1
	for t in s.towers:
		if base or base2 or t.pl != (m.pf if on_p else 0) or not slot_active(t):
			continue
		var dd = absf(m.x - t.x)
		if dd < bd:
			bd = dd
			tw = t
	if tw != null:
		var i: int = tw.i
		if tower_busy(tw):
			var bp: Dictionary = {}
			for b in s.bps:
				if b.slot == i:
					bp = b
			var ic: String = tower_icon(bp.get("ty", "g")) if bp.kind == "tower" else "shield" if bp.get("what") == "sh" else "slow" if bp.get("what") == "au" else "towerup"
			o.append({"key": "tw%db%s" % [i, ic], "kind": "tbuild", "icon": ic, "label": "Sedang dikerjakan", "state": "busy", "tw": tw, "prog": bp.prog})
		elif tw.lv == 0 and tw.ruin != null:
			var rn: Dictionary = tw.ruin
			o.append({"key": "tw%drp%d%s" % [i, rn.lv, rn.ty], "kind": "tbuild", "icon": tower_icon(rn.ty), "badge": str(rn.lv), "label": "Perbaiki tower", "nm": "Perbaiki", "cost": ruin_cost(tw), "tw": tw, "rebuild": 1})
			o.append({"key": "tw%dclr" % i, "kind": "sell", "icon": "sell", "label": "Bongkar rongsokan", "nm": "Bongkar", "gain": 0, "tw": tw, "clear": 1, "state": "ok"})
		elif tw.lv == 0:
			if s.pick is int and s.pick == i:
				var lst: Array = []
				for ty in D.TORDER:
					if tw_owned(ty):
						lst.append({"key": "tw%d%s" % [i, ty], "kind": "tbuild", "icon": tower_icon(ty), "label": "Tower " + D.TY[ty].name, "cost": tower_cost(ty), "tw": tw, "ty": ty})
				o.append_array(paged(lst, "tw", 7 if on_p else 8))
			else:
				o.append({"key": "tw%dh" % i, "kind": "hub", "icon": "hub", "label": "Bangun tower", "state": "ok", "tw": tw})
		else:
			var ti = tower_icon(tw.ty)
			var tmax = Dev.tw_max(tw.ty)
			if tw.lv < tmax and tw.lv >= tower_cap():
				o.append({"key": "tw%dck%d" % [i, tw.lv], "kind": "tup", "icon": ti, "badge": str(tw.lv + 1), "label": "Butuh upgrade core Lv %d" % core_need(tw.lv + 1), "nm": "Core Lv %d" % core_need(tw.lv + 1), "tw": tw, "state": "locked"})
			elif tw.lv < tmax:
				o.append({"key": "tw%du%d" % [i, tw.lv], "kind": "tup", "icon": ti, "badge": str(tw.lv + 1), "label": "Upgrade tower", "cost": Dev.tw_up_cost(tw.ty, tw.lv), "tw": tw})
			else:
				o.append({"key": "tw%dm" % i, "kind": "tup", "icon": ti, "label": "Tower maks", "state": "max", "tw": tw})
			if tw.sh < D.SH.max:
				var dsh = {"key": "tw%ds%d" % [i, tw.sh], "kind": "tup", "icon": "shield", "badge": str(tw.sh + 1), "label": "Upgrade shield", "cost": D.SH.up[tw.sh], "tw": tw, "shield": 1}
				if not s.res.shield:
					dsh.state = "locked"
				o.append(dsh)
			else:
				o.append({"key": "tw%dsm" % i, "kind": "tup", "icon": "shield", "label": "Shield maks", "state": "max", "tw": tw, "shield": 1})
			if tw.au < D.SL.max:
				var dau = {"key": "tw%da%d" % [i, tw.au], "kind": "tup", "icon": "slow", "badge": str(tw.au + 1), "label": "Upgrade aura lambat", "cost": D.SL.up[tw.au], "tw": tw, "aura": 1}
				if not s.res.slow:
					dau.state = "locked"
				o.append(dau)
			else:
				o.append({"key": "tw%dam" % i, "kind": "tup", "icon": "slow", "label": "Aura maks", "state": "max", "tw": tw, "aura": 1})
			o.append({"key": "tw%dsell%d" % [i, tw.spent], "kind": "sell", "icon": "sell", "label": "Jual tower", "gain": int(floor(tw.spent / 2.0)), "tw": tw, "state": "ok"})
	var keep_pick: bool
	if near_core:
		keep_pick = (s.pick is String and (s.pick == "core" or s.pick == "wpn"))
	else:
		keep_pick = tw != null and s.pick is int and s.pick == tw.i
	if not keep_pick:
		s.pick = null
	if base:
		o.append({"key": "cup", "kind": "ctl", "icon": "ar_u", "label": "Crane naik", "state": "ok", "ctl": "up"})
		o.append({"key": "cdn", "kind": "ctl", "icon": "ar_d", "label": "Crane turun", "state": "ok", "ctl": "dn"})
		o.append({"key": "cl", "kind": "ctl", "icon": "ar_l", "label": "Putar kiri", "state": "ok", "ctl": "l"})
		o.append({"key": "cr", "kind": "ctl", "icon": "ar_r", "label": "Putar kanan", "state": "ok", "ctl": "r"})
	if base2:
		o.append({"key": "c2up", "kind": "ctl", "icon": "ar_u", "label": "Crane kiri naik", "nm": "Naik", "state": "ok", "ctl": "up2"})
		o.append({"key": "c2dn", "kind": "ctl", "icon": "ar_d", "label": "Crane kiri turun", "nm": "Turun", "state": "ok", "ctl": "dn2"})
		o.append({"key": "c2l", "kind": "ctl", "icon": "ar_l", "label": "Geser kiri", "nm": "Kiri", "state": "ok", "ctl": "l2"})
		o.append({"key": "c2r", "kind": "ctl", "icon": "ar_r", "label": "Geser kanan", "nm": "Kanan", "state": "ok", "ctl": "r2"})
	if on_p:
		var pn: int = 2 if m.pf == 2 else 1
		var cr: Dictionary = s.crane2 if pn == 2 else s.crane
		if cr.lv < D.CR.max:
			o.append({"key": "cr%d%d" % [pn, cr.lv], "kind": "crane", "icon": "crane", "badge": str(cr.lv + 1), "label": "Upgrade crane " + ("kiri" if pn == 2 else "kanan"), "cost": D.CR.up[cr.lv], "crane": pn})
		else:
			o.append({"key": "crm%d" % pn, "kind": "crane", "icon": "crane", "label": "Crane maks", "state": "max", "crane": pn})
	if near_core:
		if s.pick is String and s.pick == "core":
			var cur = s.res.cur
			var rq: Array = s.res.q
			var L: Array = []
			for k in D.RESK:
				if s.res[k]:
					continue
				var R2: Dictionary = D.RES[k]
				var qi = rq.find(k)
				if cur != null and cur.key == k:
					L.append({"key": "rs_" + k, "kind": "res", "icon": k, "corner": "research", "label": "Riset " + R2.name, "state": "busy", "prog": cur.t / R2.time, "rkey": k})
				elif qi >= 0:
					L.append({"key": "rs_" + k + "q", "kind": "res", "icon": k, "corner": "research", "label": "Batalkan antrian " + R2.name, "nm": "Batal", "gain": R2.cost, "state": "ok", "badge": str(qi + 1), "badgePlain": 1, "rkey": k, "cancel": 1})
				else:
					var dr = {"key": "rs_" + k, "kind": "res", "icon": k, "corner": "research", "label": "Riset " + R2.name, "cost": R2.cost, "rkey": k}
					if cur != null and rq.size() >= D.RQMAX:
						dr.state = "busy"
					L.append(dr)
			o.append_array(paged(L, "rs"))
		elif s.pick is String and s.pick == "wpn":
			var L: Array = []
			if s.tool < 3:
				L.append({"key": "weld%d" % s.tool, "kind": "weld", "icon": "weld", "badge": str(s.tool + 1), "label": "Upgrade alat las", "cost": D.TOOL_COST[s.tool + 1], "fire": 2})
			else:
				L.append({"key": "weldm", "kind": "weld", "icon": "weld", "label": "Alat las maks", "state": "max"})
			for k in D.PWK:
				var lv: int = s.wp[k]
				if lv < 3:
					L.append({"key": "wp%s%d" % [k, lv], "kind": "weld", "icon": "wp_" + k, "badge": str(lv + 1), "label": ("Upgrade " if lv else "Pasang ") + D.PW[k].name, "cost": D.PW[k].cost[lv + 1], "wp": k})
				else:
					L.append({"key": "wp%sm" % k, "kind": "weld", "icon": "wp_" + k, "label": D.PW[k].name + " maks", "state": "max"})
			o.append_array(paged(L, "wp"))
		else:
			if s.hp < s.maxHp:
				o.append({"key": "fuel", "kind": "fuel", "icon": "fuel", "label": "Isi energi core", "cost": 1, "fire": 1})
			if s.coreLv < D.CORE.max:
				o.append({"key": "core%d" % s.coreLv, "kind": "core", "icon": "core", "badge": str(s.coreLv + 1), "label": "Upgrade core", "cost": D.CORE.up[s.coreLv], "core": 1})
			if s.botw < D.BOTW.max:
				o.append({"key": "bw%d" % s.botw, "kind": "botw", "icon": "worker", "corner": "weld", "badge": str(s.botw + 1), "label": "Las robot", "cost": D.BOTW.up[s.botw + 1], "botw": 1})
			else:
				o.append({"key": "bwm", "kind": "botw", "icon": "worker", "corner": "weld", "label": "Las robot maks", "state": "max", "botw": 1})
			var dw = {"key": "wk%d" % s.bots.size(), "kind": "worker", "icon": "worker", "badge": "+" if s.bots.size() < D.MAXBOTS else "", "label": "Pekerja baru", "cost": 10, "worker": 1}
			if s.bots.size() >= D.MAXBOTS:
				dw.state = "max"
			o.append(dw)
			var left = false
			for k in D.RESK:
				if not s.res[k]:
					left = true
			o.append({"key": "rs", "kind": "hub", "icon": "research", "label": "Riset", "state": "ok" if left else "max", "core": 1})
	if o.size() > 8:
		var kp: Array = []
		for x in o:
			if x.kind != "page":
				kp.append(x)
		o = paged(kp, "all")
	for x in o:
		if not x.has("state"):
			x.state = "ok" if s.coins >= x.get("cost", 0) else "poor"
		if not x.has("nm"):
			var lb: String = x.label
			if NMAP.has(lb):
				x.nm = NMAP[lb]
			elif x.has("rkey"):
				x.nm = ("Antri " if lb.begins_with("Antri") else "") + RNM[x.rkey]
			elif lb.begins_with("Tower "):
				x.nm = lb.substr(6)
			else:
				var r = lb
				if r.begins_with("Upgrade "):
					r = r.substr(8)
				elif r.begins_with("Pasang "):
					r = r.substr(7)
				if r.ends_with(" maks"):
					r = r.substr(0, r.length() - 5)
				x.nm = r
	return o

## posisi bar progres kartu di dunia
func opt_pos(o: Dictionary) -> Vector2:
	if o.kind == "ctl":
		return Vector2(D.CLMX + 4 if str(o.ctl).ends_with("2") else D.CRMX - 4, GW - 30)
	if o.has("tw"):
		return Vector2(o.tw.x, o.tw.y - 34)
	if o.has("fire"):
		return Vector2(CX, GW - 38)
	return Vector2(s.m.x, s.m.y - 34)

func complete_hold(o: Dictionary) -> void:
	var m: Dictionary = s.m
	if o.get("fire", 0) == 1:
		if s.hp >= s.maxHp:
			return say("Core sudah penuh", 1.2)
		if s.coins < 1:
			return say("Suku cadang habis")
		s.coins -= 1
		s.hp = minf(s.maxHp, s.hp + 4)
		sfx("fuel"); puff(CX, GW - 14, 6, "#8ff0ff"); ring(CX, GW - 17, 4, 26, .35, "#8ff0ff")
		return say("Core diisi energi", 1.6)
	if o.get("fire", 0) == 2:
		if s.tool >= 3:
			return say("Alat las sudah maksimal")
		var c: int = D.TOOL_COST[s.tool + 1]
		if s.coins < c:
			return say("Upgrade alat las butuh %d suku cadang" % c)
		s.coins -= c
		s.tool += 1
		sfx("power"); puff(CX, GW - 20, 12, "#8ff0ff")
		return say("Alat las naik ke Lv %d" % s.tool, 2.2)
	if o.kind == "hub":
		s.pick = "wpn" if o.has("wpn") else "core" if o.has("core") else o.tw.i
		sfx("click")
		return
	if o.has("clear"):
		var t: Dictionary = o.tw
		if t.lv or t.ruin == null or tower_busy(t):
			return
		t.ruin = null
		sfx("pickup"); puff(t.x, t.y - 8, 10, "#a9bccf")
		return
	if o.kind == "sell":
		var t: Dictionary = o.tw
		if not t.lv or tower_busy(t):
			return
		s.coins += o.gain
		sfx("pickup"); puff(t.x, t.y - 12, 12, "#a9bccf"); ring(t.x, t.y - 10, 4, 26, .35, "#a9bccf")
		for k in mini(8, o.gain):
			fxp(t.x, t.y - 14, rnd(-40, 40), rnd(-90, -40), 300, .6, "#a9bccf", 2)
		clear_tower(t)
		return
	if o.kind == "page":
		s.pg[o.page] = int(s.pg.get(o.page, 0)) + 1
		sfx("click")
		return
	if o.has("wp"):
		var k: String = o.wp
		var lv: int = s.wp[k]
		if lv >= 3:
			return
		var c: int = D.PW[k].cost[lv + 1]
		if s.coins < c:
			return say("Senjata butuh %d suku cadang" % c)
		s.coins -= c
		s.wp[k] += 1
		sfx("power"); puff(CX, GW - 20, 12, "#8ff0ff"); ring(m.x, m.y - 10, 4, 30, .4, "#8ff0ff")
		return
	if o.kind == "res":
		var R2: Dictionary = D.RES[o.rkey]
		var rq: Array = s.res.q
		if o.has("cancel"):
			var qi = rq.find(o.rkey)
			if qi >= 0:
				rq.remove_at(qi)
				s.coins += R2.cost
				sfx("coin"); ring(m.x, m.y - 10, 3, 22, .3, "#ffe08a")
			return
		if s.res[o.rkey] or (s.res.cur != null and s.res.cur.key == o.rkey) or rq.has(o.rkey):
			return
		if s.coins < R2.cost:
			return say("Riset butuh %d suku cadang" % R2.cost)
		if s.res.cur != null:
			if rq.size() >= D.RQMAX:
				sfx("nope")
				return
			s.coins -= R2.cost
			rq.append(o.rkey)
			sfx("blueprint")
			return
		s.coins -= R2.cost
		s.res.cur = {"key": o.rkey, "t": 0.0}
		sfx("blueprint")
		return say("Riset %s dimulai (%d detik)" % [R2.name, int(R2.time)], 3)
	if o.kind == "botw":
		if s.botw >= D.BOTW.max:
			return
		var c: int = D.BOTW.up[s.botw + 1]
		if s.coins < c:
			return say("Butuh %d suku cadang" % c)
		s.coins -= c
		s.botw += 1
		sfx("power"); puff(CX, GW - 14, 10, "#8ff0ff"); ring(CX, GW - 10, 4, 34, .5, "#8ff0ff")
		return
	if o.kind == "worker":
		if s.bots.size() >= D.MAXBOTS:
			return say("Pekerja sudah maksimal")
		if s.coins < 10:
			return say("Pekerja butuh 10 suku cadang")
		s.coins -= 10
		s.bots.append(mk_bot(CX + rnd(-14, 14)))
		sfx("built"); puff(CX, GW - 12, 10, "#8ff0ff"); ring(CX, GW - 8, 4, 30, .4, "#ffd36b")
		return
	if o.kind == "core":
		if s.coreLv >= D.CORE.max:
			return say("Core sudah level maksimal")
		var c: int = D.CORE.up[s.coreLv]
		if s.coins < c:
			return say("Upgrade core butuh %d suku cadang" % c)
		s.coins -= c
		s.coreLv += 1
		var nm: float = D.CORE.hp[s.coreLv - 1]
		s.hp += nm - s.maxHp
		s.maxHp = nm
		sfx("power"); puff(CX, GW - 16, 14, "#8ff0ff"); ring(CX, GW - 17, 6, 70, .7, "#8ff0ff")
		return say("Core Lv %d: HP maks %d" % [s.coreLv, int(nm)], 2.6)
	if o.has("crane"):
		var cr: Dictionary = s.crane2 if o.crane == 2 else s.crane
		if cr.lv >= D.CR.max:
			return say("Crane sudah level maksimal")
		var c: int = D.CR.up[cr.lv]
		if s.coins < c:
			return say("Upgrade crane butuh %d suku cadang" % c)
		s.coins -= c
		cr.lv += 1
		sfx("power"); puff(cr.px, cr.y, 14, "#ffd36b")
		return say("Crane Lv %d" % cr.lv, 3)
	if o.has("tw"):
		var tw: Dictionary = o.tw
		if o.has("rebuild"):
			if tw.lv or tw.ruin == null or tower_busy(tw):
				return
			var c = ruin_cost(tw)
			if s.coins < c:
				return say("Perbaikan butuh %d suku cadang" % c)
			s.coins -= c
			s.bps.append({"kind": "rebuild", "slot": tw.i, "x": tw.x, "top": tw.y, "prog": 0.0, "w": 26, "work": 4 + tw.ruin.lv * 1.2, "rl": tw.ruin.lv, "uid": nuid(), "done": false})
			s.pick = null
			sfx("blueprint"); puff(tw.x, tw.y - 8, 8, "#8ff0ff")
			return
		if tw.lv == 0:
			if tower_busy(tw):
				return
			var c = tower_cost(o.ty)
			if s.coins < c:
				return say("Menara butuh %d suku cadang" % c)
			s.coins -= c
			tw.spent = c
			s.bps.append({"kind": "tower", "slot": tw.i, "x": tw.x, "top": tw.y, "prog": 0.0, "w": 26, "work": 8.5, "ty": o.get("ty", "g"), "uid": nuid(), "done": false})
			s.pick = null
			sfx("blueprint"); puff(tw.x, tw.y - 8, 8, "#8ff0ff")
			return say("Cetak biru menara terpasang.", 2.8)
		if tower_busy(tw):
			return
		if o.has("aura"):
			if tw.au >= D.SL.max:
				return
			var c: int = D.SL.up[tw.au]
			if s.coins < c:
				return say("Aura butuh %d suku cadang" % c)
			s.coins -= c
			tw.spent += c
			s.bps.append({"kind": "tup", "what": "au", "slot": tw.i, "x": tw.x, "top": tw.y, "prog": 0.0, "w": 26, "work": 2 + tw.au * 1.3, "uid": nuid(), "done": false})
			sfx("blueprint")
			return
		if o.has("shield"):
			if tw.sh >= D.SH.max:
				return say("Shield sudah level maksimal")
			var c: int = D.SH.up[tw.sh]
			if s.coins < c:
				return say("Shield butuh %d suku cadang" % c)
			s.coins -= c
			tw.spent += c
			s.bps.append({"kind": "tup", "what": "sh", "slot": tw.i, "x": tw.x, "top": tw.y, "prog": 0.0, "w": 26, "work": 2 + tw.sh * 1.3, "uid": nuid(), "done": false})
			sfx("blueprint")
			return say("Robot memasang shield.", 2.8)
		if tw.lv >= Dev.tw_max(tw.ty):
			return say("Menara sudah level maksimal")
		if tw.lv >= tower_cap():
			return
		var c = Dev.tw_up_cost(tw.ty, tw.lv)
		if s.coins < c:
			return say("Upgrade menara butuh %d suku cadang" % c)
		s.coins -= c
		tw.spent += c
		s.bps.append({"kind": "tup", "what": "lv", "slot": tw.i, "x": tw.x, "top": tw.y, "prog": 0.0, "w": 26, "work": 3 + tw.lv, "uid": nuid(), "done": false})
		sfx("blueprint")
		return say("Robot meng-upgrade menara.", 2.8)

# ---------- pancingan siang, aura kejut, jetpack ----------
func can_lure() -> bool:
	return not s.is_empty() and running and not paused and not s.over and not s.nightOn and s.lures < D.LUREMAX and s.lq.size() < D.LUREPAR and s.t < D.DAY - 4

func lure() -> void:
	if not can_lure():
		return
	s.lures += 1
	s.wv = D.wave_info(s.day)
	s.lid += 1
	s.lq.append({"id": s.lid, "n": 8, "t": 0.0})
	sfx("night")

func can_blast() -> bool:
	return not s.is_empty() and running and not paused and not s.over and s.m.bat >= D.MECH.bat * blast.cost - 1e-6

func do_blast() -> void:
	if s.is_empty() or not running or paused or s.over:
		return
	if not can_blast():
		sfx("nope")
		return
	var m: Dictionary = s.m
	var cx: float = m.x
	var cy: float = m.y - 10
	m.bat -= D.MECH.bat * blast.cost
	s.waves.append({"x": cx, "y": cy, "r": 4.0, "hit": {}})
	light(cx, cy, 90, "143,240,255", 1.0, .5)
	for i in 36:
		var a: float = i / 36.0 * 6.283
		var v = rnd(40, 65)
		fxp(cx, cy, cos(a) * v, sin(a) * v, 0, rnd(1.2, 1.8), "#8ff0ff" if i % 3 else "#ffffff", 2)
	s.shake = maxf(s.shake, .4)
	sfx("blast")

func can_fly() -> bool:
	if s.is_empty() or not running or paused or s.over:
		return false
	if s.m.bat < .4:
		say("Batre jetpack habis. Matahari akan mengisinya lagi.", 1.6)
		return false
	return true

# ---------- siang / malam ----------
func new_day() -> void:
	s.t -= D.CYC
	s.nightOn = false
	s.lures = 0
	for d in s.drones:
		puff(d.x, d.y, 5, "#8a96a8")
	for d in s.drones:
		d.flee = true
		d.chase = false
	s.queue = []
	s.lq = []
	var bonus: int = 6 + 2 * s.day
	s.coins += bonus
	s.day += 1
	if s.day - 1 > Prof.best:
		Prof.best = s.day - 1
		Prof.save_all()
	if s.run.len and s.day - 1 >= s.run.len:
		s.over = true
		game_won.emit()
		return
	s.hp = minf(s.maxHp, s.hp + 3)
	for t in s.towers:
		if t.sh:
			t.shHp = D.SH.hp[t.sh]
			t.brk = false
	for t in s.towers:
		if t.lv:
			t.hp = minf(tower_max_hp(t), t.hp + tower_max_hp(t) * .5)
		if t.ty == "solar" and t.lv:
			s.coins += int(D.TY.solar.parts[t.lv])
			puff(t.x, t.y - D.TWH[t.lv] - 8, 5, "#ffd36b")
	sfx("dawn")
	var nx = D.wave_info(s.day)
	say("Fajar. Bonus selamat +%d suku cadang. Gelombang berikutnya: %d drone%s." % [bonus, nx.n, " dan 1 bos" if nx.boss else ""], 4)
	for i in mini(bonus, 10):
		fxp(CX + rnd(-20, 20), GW - 40 - rnd(0, 20), rnd(-20, 20), -rnd(30, 70), 300, .8, "#a9bccf", 2)

func start_night() -> void:
	var w = D.wave_info(s.day)
	s.wv = w
	var q: Array = []
	var heavy = 0
	for i in w.n:
		var h = randf() < w.hv
		if h:
			heavy += 1
		q.append("h" if h else "s")
	var sw: int = mini(36, int(rj(2 + .5 * s.day + .04 * s.day * s.day)))
	var parts: int = 2 if s.day >= 6 else 1
	for p in parts:
		var cnt: int = int(rj(sw / float(parts)))
		var at: int = int(randf() * (q.size() + 1))
		for k in cnt:
			q.insert(at, "m")
	if w.boss:
		q.push_front("b")
	s.queue = q
	s.quota = q.size()
	s.spawnT = 1.5
	sfx("night")
	say("Gelombang %d: %d drone%s%s. Lindungi core energimu!" % [s.day, w.n, " (%d berat)" % heavy if heavy else "", " dan 1 bos" if w.boss else ""], 3.6)

func walk(b: Dictionary, tx: float, sp: float, dt: float) -> bool:
	var dx = tx - b.x
	if absf(dx) > 1:
		b.x += signf(dx) * minf(absf(dx), sp * dt)
		b.dir = int(signf(dx))
		b.mv = 1
		return false
	b.mv = 0
	return true

# ---------- update utama ----------
func update(dt: float) -> void:
	var m: Dictionary = s.m
	s.anim += dt
	s.t += dt
	if s.msgT > 0:
		s.msgT -= dt
	# tindakan tertunda
	var np: Array = []
	for p in pending:
		p.t -= dt
		if p.t <= 0:
			p.fn.call()
		else:
			np.append(p)
	pending = np
	if s.t >= D.CYC:
		new_day()
		if s.over:
			return
	if s.t >= D.DAY and not s.nightOn:
		s.nightOn = true
		start_night()
	# riset
	if s.res.cur != null:
		var rc: Dictionary = s.res.cur
		var R2: Dictionary = D.RES[rc.key]
		rc.t += dt
		if rc.t >= R2.time:
			s.res[rc.key] = 1
			s.res.cur = null
			if s.res.q.size() > 0:
				s.res.cur = {"key": s.res.q.pop_front(), "t": 0.0}
			sfx("power"); ring(CX, GW - 17, 6, 90, .9, "#c58aff"); ring(CX, GW - 17, 4, 50, .6, "#e0c8ff")
			say("Riset selesai: " + R2.name + " terbuka", 3.5)
	# kartu yang ditahan
	var charge = -1.0
	if card_hold != null and not card_hold.done:
		var found = null
		for x in ctx_options():
			if x.key == card_hold.key:
				found = x
		if found == null or found.state != "ok":
			card_hold = null
		elif found.kind == "ctl":
			var cr: Dictionary = s.crane
			var c2: Dictionary = s.crane2
			match found.ctl:
				"up2": c2.h = minf(c2.h + 36 * dt, D.CR2.h[c2.lv - 1])
				"dn2": c2.h = maxf(c2.h - 36 * dt, cr.h + D.CRCLEAR)
				"up": cr.h = minf(minf(cr.h + 36 * dt, D.CR.h[cr.lv - 1]), c2.h - D.CRCLEAR)
				"dn": cr.h = maxf(cr.h - 36 * dt, D.CR.hmin)
				"l": cr.ox -= 44 * dt
				"r": cr.ox += 44 * dt
				"l2": c2.ox -= 44 * dt
				"r2": c2.ox += 44 * dt
		else:
			var need: float = D.HT[found.kind]
			card_hold.t += dt
			charge = card_hold.t / need
			if card_hold.t >= need:
				card_hold.done = true
				complete_hold(found)
	var ac = get_node_or_null("/root/Audio")
	if ac:
		ac.charge(charge if charge > .03 and charge < 1 else -1.0)
	# crane
	var cr: Dictionary = s.crane
	var pw: float = D.CR.w[cr.lv - 1]
	var c2: Dictionary = s.crane2
	var pw2: float = D.CR.w[c2.lv - 1]
	c2.h = clampf(maxf(c2.h, cr.h + D.CRCLEAR), D.CR.hmin + D.CRCLEAR, D.CR2.h[c2.lv - 1])
	cr.h = clampf(cr.h, D.CR.hmin, minf(D.CR.h[cr.lv - 1], c2.h - D.CRCLEAR))
	cr.y += clampf(GW - cr.h - cr.y, -60 * dt, 60 * dt)
	var lo = D.CLMX + 10 + pw / 2 - CX
	var hi = D.CRMX - 8 - CX - pw / 2
	cr.ox += clampf(clampf(cr.ox, lo, hi) - cr.ox, -40 * dt, 40 * dt)
	var npx: float = CX + cr.ox
	var dpx: float = npx - cr.px
	cr.px = npx
	if m.st == "p" and m.pf == 1:
		m.x += dpx
	c2.y += clampf(GW - c2.h - c2.y, -60 * dt, 60 * dt)
	var lo2 = D.CLMX + 10 + pw2 / 2 - CX
	var hi2 = D.CRMX - 8 - CX - pw2 / 2
	c2.ox += clampf(clampf(c2.ox, lo2, hi2) - c2.ox, -40 * dt, 40 * dt)
	var n2: float = CX + c2.ox
	var d2: float = n2 - c2.px
	c2.px = n2
	if m.st == "p" and m.pf == 2:
		m.x += d2
	for t in s.towers:
		if t.pl == 1:
			var tx: float = cr.px + D.CR.off[cr.lv - 1][mini(t.k, D.CR.n[cr.lv - 1] - 1)]
			t.x += (tx - t.x) * minf(1.0, dt * 5)
			t.y = cr.y
		elif t.pl == 2:
			var tx: float = c2.px + D.CR2.off[c2.lv - 1][mini(t.k, D.CR2.n[c2.lv - 1] - 1)]
			t.x += (tx - t.x) * minf(1.0, dt * 5)
			t.y = c2.y
	for bp in s.bps:
		var t: Dictionary = s.towers[bp.slot]
		bp.x = t.x
		bp.top = t.y
	if m.st == "p":
		var P = plat(m.pf)
		m.y = P.y
	# mekanik
	var kb: bool = keys.thr != 0 and not jet_in.on
	var want_jet: bool = jet_in.on or keys.thr != 0
	var jx: float = (float(keys.r) - float(keys.l)) if kb else float(jet_in.x)
	var jy: float = (.8 if keys.dn else -1.0) if kb else float(jet_in.y)
	var was_air: bool = m.st == ""
	var was_thr: bool = m.thr
	m.hurt = maxf(0.0, m.hurt - dt)
	m.zt = maxf(0.0, m.zt - dt)
	if not want_jet:
		m.lock = false
	var wj: bool = want_jet and not m.lock
	m.thr = wj and (m.bat > 0 if was_thr else m.bat > .4)
	if was_thr and not m.thr and wj:
		m.lock = true
		say("Batre jetpack habis!", 1.6)
	if m.thr:
		m.st = ""
		m.bat = maxf(0.0, m.bat - D.MECH.drain * dt)
		m.vx += (jx * D.MECH.vx - m.vx) * minf(1.0, dt * 6)
		m.vy += (jy * D.MECH.vy - m.vy) * minf(1.0, dt * 6)
		if absf(jx) > .15:
			m.dir = 1 if jx > 0 else -1
		m.peak = m.y
		if randf() < dt * 45:
			fxp(m.x - m.dir * 7 + rnd(-1, 1), m.y - 4, rnd(-14, 14), rnd(70, 120), 0, rnd(.15, .3), "#fff6c8" if randf() < .4 else "#ffb347", 2)
		if m.bat < 2.5:
			m.warn -= dt
			if m.warn <= 0:
				m.warn = .45
				sfx("beep")
	else:
		m.bat = minf(D.MECH.bat, m.bat + D.MECH.charge * (1 + solar_boost()) * (1 - D.darkness(s.t)) * dt)
		if not was_air:
			var din: float = (1.0 if (keys.r or gk.r) else 0.0) - (1.0 if (keys.l or gk.l) else 0.0)
			m.vx += (din * 70 - m.vx) * minf(1.0, dt * 9)
			if din != 0:
				m.dir = int(din)
			m.vy = 0.0
		else:
			m.vy += 560 * dt
			m.vx -= m.vx * minf(1.0, dt * 1.5)
			if D.MECH.jet and m.vy > D.JETF.v[D.MECH.jet]:
				m.vy += (D.JETF.v[D.MECH.jet] - m.vy) * minf(1.0, dt * 7)
				m.soft = 1
				if randf() < dt * 40:
					fxp(m.x - m.dir * 5 + rnd(-2, 2), m.y - 3, rnd(-16, 16), rnd(60, 110), 0, rnd(.12, .25), "#9ad8ff" if randf() < .5 else "#e6fbff", 2)
			if m.y < m.peak:
				m.peak = m.y
	m.x = clampf(m.x + m.vx * dt, 8, W - 8)
	if m.st == "p":
		var P = plat(m.pf)
		if absf(m.x - P.px) > P.w / 2 + 2:
			m.st = ""
			m.peak = m.y
			m.vy = 0.0
	var ny: float = m.y + m.vy * dt
	if m.st == "":
		var land = ""
		var lpf = 0
		for n in [2, 1]:
			var P = plat(n)
			if m.vy >= 0 and m.y <= P.y + .5 and ny >= P.y and absf(m.x - P.px) <= P.w / 2 + 2:
				land = "p"
				lpf = n
				break
		if land == "" and ny >= GW:
			land = "g"
		if land != "":
			if land == "p":
				m.pf = lpf
			var sy: float = plat(lpf).y if land == "p" else GW
			var drop: float = sy - m.peak
			var soft: int = m.soft
			m.soft = 0
			var dmg = 0
			if drop > D.MECH.safe:
				dmg = maxi(1, int(ceil((drop - D.MECH.safe) / D.MECH.dmgPer)))
			if dmg and D.MECH.jet:
				var rd: float = D.JETF.red[D.MECH.jet]
				dmg = 0 if rd >= 1 else maxi(1, int(ceil(dmg * (1 - rd))))
				if not dmg and soft:
					puff(m.x, sy - 2, 6, "#9ad8ff")
					ring(m.x, sy - 2, 2, 14, .25, "#9ad8ff")
			if dmg:
				m.hp -= dmg
				m.hurt = .9
				sfx("hurt")
				puff(m.x, sy - 2, 10, "#8a8f98")
				say("Mendarat keras! HP -%d" % dmg, 1.8)
				if m.hp <= 0 and not s.over:
					m.hp = 0
					s.cause = "mech"
					s.over = true
					game_over.emit()
			elif m.vy > 140:
				sfx("land")
			ny = sy
			m.vy = 0.0
			m.peak = sy
			m.st = land
		elif ny < 24:
			ny = 24
			if m.vy < 0:
				m.vy = 0.0
	m.y = ny
	if not m.thr and m.st == "g" and absf(m.x - CX) <= 30 and m.hp < D.MECH.hp:
		m.hp = minf(D.MECH.hp, m.hp + .12 * dt)
		m.rg -= dt
		if m.rg <= 0:
			m.rg = .85
			sfx("regen")
			ring(m.x, m.y - 10, 4, 22, .7, "#7dff9a")
			ring(m.x, m.y - 10, 2, 14, .5, "#d0ffd8")
		m.rp -= dt
		if m.rp <= 0:
			m.rp = .32
			var Lf = rnd(.8, 1.2)
			s.fx.append({"plus": 1, "x": m.x + rnd(-13, 13), "y": m.y - rnd(6, 22), "vx": rnd(-6, 6), "vy": -rnd(18, 36), "g": 0.0, "l": Lf, "L": Lf, "c": col("#d0ffd8" if randf() < .35 else "#4dff7a"), "z": 1})
		if randf() < dt * 14:
			fxp(m.x + rnd(-9, 9), m.y - rnd(0, 6), rnd(-6, 6), -rnd(30, 60), 0, rnd(.5, .9), "#7dff9a", 2)
		if randf() < dt * 6:
			light(m.x, m.y - 12, 26, "110,255,150", .45, .35)
	else:
		m.rg = 0.0
	var mv: bool = absf(m.vx) > 4 or m.st == "" or m.thr
	m.stillT = 0.0 if mv else m.stillT + dt
	m.stillA = clampf((m.stillT - .25) / .9, 0.0, 1.0)
	var ac2 = get_node_or_null("/root/Audio")
	if ac2:
		ac2.thrust(m.thr)
	cam_y += (clampf(m.y - vh * .62, 0.0, camy_max()) - cam_y) * minf(1.0, dt * 4)
	update_spawns(dt)
	update_bps_and_bots(dt)
	update_towers_loop(dt)
	pmul = boost_now()
	s.pdm = pmul
	plyr = true
	update_main_weapon(dt)
	update_main_projectiles(dt)
	update_weapons(dt)
	plyr = false
	pmul = 1.0
	update_projectiles(dt)
	update_waves(dt)
	update_drones(dt)
	update_drops_fx(dt)
	if s.hp <= 0 and not s.over:
		s.hp = 0
		s.cause = "fire"
		s.over = true
		game_over.emit()

func update_spawns(dt: float) -> void:
	if s.nightOn and s.queue.size() > 0:
		s.spawnT -= dt
		if s.spawnT <= 0:
			var solo: bool = s.queue[0] == "b"
			var bx = rnd(30, W - 30)
			var gs: int = 1 if solo else maxi(1, 1 + int(floor((s.day - 1) / float(D.WAVE.bd))))
			if s.queue[0] == "m":
				var c = 0
				while c < s.queue.size() and s.queue[c] == "m" and c < 40:
					c += 1
				for i in c:
					s.queue.pop_front()
					var q = spawn_drone("m", clampf(bx + rnd(-16, 16), 8, W - 8))
					q.y -= rnd(0, 18)
					q.ox = rnd(-14, 14)
				gs = maxi(2, int(rj(c / 3.0)))
			else:
				var i = 0
				while i < gs and s.queue.size() > 0:
					spawn_drone(s.queue.pop_front(), clampf(bx + rnd(-18, 18), 12, W - 12) if gs > 1 else -999.0)
					i += 1
			s.spawnT = (D.NIGHT * .6) / s.quota * gs * rnd(.6, 1.4)

func update_bps_and_bots(dt: float) -> void:
	var m: Dictionary = s.m
	var bpids = {}
	for bp in s.bps:
		bpids[bp.uid] = true
	for b in s.bots:
		if b.job != null and not bpids.has(b.job.uid):
			b.job = null
			b.onsite = false
	for bp in s.bps:
		var n = 0
		for b in s.bots:
			if b.job != null and b.job.uid == bp.uid:
				n += 1
		while n < 6:
			var pick = null
			var bd = 1e9
			for b in s.bots:
				if b.job != null or (b.st == "back" and b.carry):
					continue
				var d = absf(b.x - bp.x) + absf(b.y - bp.top)
				if d < bd:
					bd = d
					pick = b
			if pick == null:
				break
			pick.job = bp
			pick.onsite = false
			pick.st = "rest"
			pick.t = 1.0
			pick.atkD = null
			n += 1
	m.help = false
	for bp in s.bps:
		var rate = 0.0
		for b in s.bots:
			if b.job != null and b.job.uid == bp.uid and b.onsite:
				rate += .11
		if (bp.kind == "tower" or bp.kind == "rebuild") and hyp(m.x - bp.x, (m.y - 10) - (bp.top + 2)) <= 34:
			rate += .16
			m.help = true
			if absf(m.vx) < 10:
				m.dir = 1 if bp.x >= m.x else -1
		bp.prog += rate / bp.get("work", 1.0) * dt
		if rate > 0 and randf() < dt * 14:
			fxp(bp.x + rnd(-12, 12), bp.top, rnd(-20, 20), -rnd(20, 50), 200, .4, "#fff6c8" if randf() < .5 else "#8ff0ff")
		if bp.prog >= 1:
			bp.done = true
			sfx("built")
			if bp.kind == "tup":
				var t: Dictionary = s.towers[bp.slot]
				t.pop = .45
				ring(bp.x, bp.top - 12, 6, 34, .45, "#5ad1e6" if bp.what == "sh" else "#c58aff" if bp.what == "au" else "#ffd36b")
				if bp.what == "au":
					t.au += 1
					puff(bp.x, bp.top - 12, 12, "#c58aff")
				elif bp.what == "sh":
					t.sh += 1
					t.shHp = D.SH.hp[t.sh]
					t.brk = false
					puff(bp.x, bp.top - 12, 12, "#5ad1e6")
					say("Shield menara Lv %d aktif" % t.sh, 2)
				else:
					var h0 = tower_max_hp(t)
					t.lv += 1
					t.hp = minf(tower_max_hp(t), t.hp + tower_max_hp(t) - h0)
					puff(bp.x, bp.top - D.TWH[t.lv], 12, "#ffd36b")
					say("Menara naik ke Lv %d" % t.lv, 2)
				t.cd = .5
			elif bp.kind == "rebuild":
				var t: Dictionary = s.towers[bp.slot]
				var rn = t.ruin
				if rn != null:
					t.ty = rn.ty
					t.lv = rn.lv
					t.sh = rn.sh
					t.au = rn.au
					t.spent = rn.spent
					t.ruin = null
					t.hp = tower_max_hp(t)
					t.shHp = D.SH.hp[t.sh] if t.sh else 0.0
					t.brk = false
					t.cd = .5
					t.pop = .5
					ring(bp.x, bp.top - 10, 6, 40, .5, "#7dff9a")
					puff(bp.x, bp.top - 12, 14, "#ffd36b")
					s.shake = maxf(s.shake, .12)
			elif bp.kind == "tower":
				var t: Dictionary = s.towers[bp.slot]
				t.lv = 1
				t.cd = .5
				t.ty = bp.get("ty", "g")
				t.hp = tower_max_hp(t)
				t.pop = .5
				ring(bp.x, bp.top - 10, 6, 36, .5, "#ffd36b")
				s.shake = maxf(s.shake, .12)
				puff(bp.x, bp.top - 12, 12, "#ffd36b")
				say("Menara siap", 1.8)
	var nb: Array = []
	for b in s.bps:
		if not b.done:
			nb.append(b)
	s.bps = nb
	# robot pekerja
	for i in s.bots.size():
		var b: Dictionary = s.bots[i]
		b.ph += dt
		if (b.job != null or s.nightOn) and b.fetch != null:
			b.fetch.claim = null
			b.fetch = null
		if b.job != null:
			var bp: Dictionary = b.job
			var idx = 0
			var cnt = 0
			for o in s.bots:
				if o.job != null and o.job.uid == bp.uid:
					if o == b:
						idx = cnt
					cnt += 1
			var offs = [-10, 10, -17, 17, -24, 24]
			var tx: float = bp.x + (offs[idx] if idx < 6 else 0)
			var ty: float = bp.top
			var dx: float = tx - b.x
			var dy: float = ty - b.y
			var dd = hyp(dx, dy)
			if dd > 2:
				var st = minf(dd, 48 * dt)
				b.x += dx / dd * st
				b.y += dy / dd * st
				b.mv = 1
				b.dir = int(signf(dx)) if signf(dx) != 0 else b.dir
				b.onsite = false
			else:
				b.mv = 0
				b.onsite = true
				b.dir = 1 if bp.x >= b.x else -1
			continue
		b.attach = 0
		if b.atkD != null and (b.atkD.hp <= 0 or b.atkD.dead or b.atkD.flee or not dalive(b.atkD)):
			b.atkD = null
		b.fighter = i < int(cur_up().bots)
		if not b.fighter:
			b.atkD = null
		if b.fighter and b.atkD == null and not b.carry:
			b.scanT -= dt
			if b.scanT <= 0:
				b.scanT = .35
				var best = null
				var bd: float = D.BOTW.reach
				for d in s.drones:
					if d.hp <= 0 or d.flee or d.dead:
						continue
					var dd = hyp(d.x - b.x, d.y - b.y)
					if dd >= bd:
						continue
					var cnt = 0
					for o in s.bots:
						if o.atkD != null and o.atkD.uid == d.uid:
							cnt += 1
					if cnt >= 3:
						continue
					bd = dd
					best = d
				if best != null:
					b.atkD = best
					b.ao = rnd(-3, 3)
					if b.fetch != null:
						b.fetch.claim = null
						b.fetch = null
		if b.atkD != null:
			var d: Dictionary = b.atkD
			var tx: float = d.x + b.ao
			var ty: float = d.y + d.h / 2 + 4
			var dx: float = tx - b.x
			var dy: float = ty - b.y
			var dd = hyp(dx, dy)
			b.onsite = false
			if dd > 2.5:
				var st = minf(dd, D.BOTW.spd * dt)
				b.x += dx / dd * st
				b.y += dy / dd * st
				b.mv = 1
				b.dir = int(signf(dx)) if signf(dx) != 0 else b.dir
			else:
				b.x = tx
				b.y = ty
				b.mv = 0
				b.attach = 1
				b.dir = 1 if d.x >= b.x else -1
				hurt(d, D.BOTW.dps[s.botw] * dt)
				if randf() < dt * 10:
					fxp(b.x + rnd(-2, 2), b.y - 8, rnd(-25, 25), -rnd(10, 40), 150, .3, "#fff6c8" if randf() < .5 else "#8ff0ff")
				if not (b.sT > s.anim):
					b.sT = s.anim + .45
					sfx("tick")
			continue
		if b.y < GW:
			b.y = minf(GW, b.y + 110 * dt)
			b.mv = 1
			continue
		b.onsite = false
		if s.nightOn:
			b.st = "weld"
			if walk(b, CX + (1 if i % 2 else -1) * (18 + 9 * (i / 2)), 26, dt):
				b.dir = -1 if i % 2 else 1
				b.weld += dt
				if b.weld >= 5:
					b.weld = 0.0
					if s.hp < s.maxHp:
						s.hp += 1
						puff(CX, GW - 12, 3, "#fff6c8")
			continue
		if b.st == "weld":
			b.st = "rest"
			b.t = rnd(.5, 2)
		if b.st == "rest":
			b.mv = 0
			b.t -= dt
			if b.t <= 0:
				var dr = null
				for o in s.drops:
					if o.rest and o.y >= GW - 1 and o.claim == null:
						dr = o
						break
				if dr != null:
					dr.claim = b
					b.fetch = dr
					b.st = "fetch"
				else:
					b.st = "go"
					b.tx = D.PILES[int(randf() * D.PILES.size())] + rnd(-6, 6)
		elif b.st == "fetch":
			var dr = b.fetch
			if dr == null or not dr_alive(dr):
				b.fetch = null
				b.st = "rest"
				b.t = .3
			elif walk(b, dr.x, 34, dt):
				remove_drop(dr)
				b.fetch = null
				b.carry = 1
				b.st = "back"
				b.tx = CX + rnd(-10, 10)
				sfx("tick")
		elif b.st == "go":
			if walk(b, b.tx, 26, dt):
				b.st = "dig"
				b.t = rnd(4, 6)
		elif b.st == "dig":
			b.mv = 0
			b.t -= dt
			if b.t <= 0:
				b.carry = 1
				b.st = "back"
				b.tx = CX + rnd(-10, 10)
		elif b.st == "back":
			if walk(b, b.tx, 26, dt):
				if b.carry:
					b.carry = 0
					s.coins += 1
					sfx("tick")
					puff(b.x, GW - 8, 4, "#a9bccf")
				b.st = "rest"
				b.t = rnd(2, 4)

func dr_alive(dr: Dictionary) -> bool:
	for o in s.drops:
		if o.uid == dr.uid:
			return true
	return false

func remove_drop(dr: Dictionary) -> void:
	for i in s.drops.size():
		if s.drops[i].uid == dr.uid:
			s.drops.remove_at(i)
			return

func update_towers_loop(dt: float) -> void:
	for t in s.towers:
		t.shT += dt
		t.shHit = maxf(0.0, t.shHit - dt)
		t.pop = maxf(0.0, t.pop - dt)
		if t.au and t.lv and not tower_busy(t) and near_tower(t) and randf() < dt * 6:
			var a = rnd(0, 6.28)
			var r = sqrt(randf()) * D.SL.r[t.au]
			fxp(t.x + cos(a) * r, t.y - D.TWH[t.lv] / 2.0 - 3 + sin(a) * r, rnd(-4, 4), rnd(4, 10), 0, rnd(.8, 1.4), "#e0c8ff" if randf() < .5 else "#a98aff")
		if t.sh and not t.brk and t.shT > 5 and t.shHp < D.SH.hp[t.sh]:
			t.shHp = minf(D.SH.hp[t.sh], t.shHp + D.SH.hp[t.sh] * .06 * dt)
		if t.lv and (is_nan(t.hp) or is_inf(t.hp)):
			t.hp = tower_max_hp(t)
		t.dHit = maxf(0.0, t.dHit - dt)
		t.hHit = maxf(0.0, t.hHit - dt)
		if t.lv < 1 or tower_busy(t):
			t.beam = 0.0
			continue
		t.cd -= dt
		t.fl = maxf(0.0, t.fl - dt)
		if t.ty != "g" and t.ty != "f" and t.ty != "gatling" and t.ty != "sniper":
			tower_type(t, dt)
			continue
		tower_basic(t, dt)

func update_waves(dt: float) -> void:
	if s.waves.size() > 0:
		for w in s.waves:
			w.r += blast.sp * dt
			for d in s.drones:
				if d.kb > 0:
					continue
				var dx: float = d.x - w.x
				var dy: float = d.y - w.y
				var dd = maxf(hyp(dx, dy), .001)
				if dd > w.r + d.w / 2 + 2 or dd < w.r - d.w / 2 - 8:
					continue
				w.hit[d.uid] = true
				var p: float = blast.pow * (.45 + .55 * maxf(0.0, 1 - dd / blast.r)) * (.35 if d.boss else .6 if d.heavy else 1.0)
				d.kvx = dx / dd * p
				d.kvy = dy / dd * p - 70
				d.kb = .75
				d.chase = false
				d.atk = ""
				d.hit = .15
				d.hp -= blast.dmg * (.5 + .5 * maxf(0.0, 1 - dd / blast.r)) * (.5 if d.boss else 1.0) * boost_now()
				puff(d.x, d.y, 4, "#8ff0ff")
		var nw: Array = []
		for w in s.waves:
			if w.r < blast.r:
				nw.append(w)
		s.waves = nw
	if s.lq.size() > 0 and not s.nightOn:
		for L in s.lq:
			if L.n > 0:
				L.t -= dt
				if L.t <= 0:
					var q = spawn_drone("s", rnd(30, W - 30))
					q.drop = int(rj(q.drop * 1.5))
					q.lure = L.id
					L.n -= 1
					L.t = 3.2
		var nl: Array = []
		for L in s.lq:
			var keep: bool = L.n > 0
			if not keep:
				for d in s.drones:
					if d.lure == L.id and d.hp > 0 and not d.flee and not d.dead:
						keep = true
						break
			if keep:
				nl.append(L)
		s.lq = nl

func update_drones(dt: float) -> void:
	var m: Dictionary = s.m
	for d in s.drones:
		d.ph += dt
		d.hit = maxf(0.0, d.hit - dt)
		d.cd -= dt
		var ox0: float = d.x
		var oy0: float = d.y
		d.stun = maxf(0.0, d.stun - dt)
		d.net = maxf(0.0, d.net - dt)
		d.shock = maxf(0.0, d.shock - dt)
		var dc = null
		if d.burn > 0:
			d.burn -= dt
			hurt(d, d.bdps * dt)
			if randf() < dt * 20:
				var fc = ["#ffd36b", "#ff9a3a", "#ff5a1a"]
				fxp(d.x + rnd(-d.w / 3, d.w / 3), d.y - rnd(0, d.h / 2), rnd(-8, 8), -rnd(20, 50), -30, rnd(.25, .5), fc[int(randf() * 3)], 2)
			if randf() < dt * 5:
				puff(d.x, d.y - d.h / 2, 1, "#4a4f58")
			if d.burn <= 0:
				d.bdps = 0.0
				puff(d.x, d.y - d.h / 2, 4, "#8a8f98")
		var tx: float = CX + d.ox
		var ty: float = GW - 16
		var dx: float = tx - d.x
		var dy: float = ty - d.y
		var dist = hyp(dx, dy)
		var pdx: float = m.x - d.x
		var pdy: float = (m.y - 10) - d.y
		var pd = hyp(pdx, pdy)
		var nb = nearest_building(d, dist)
		if not d.chase and pd <= D.AGGRO.on and pd < nb[1]:
			d.chase = true
		elif d.chase and (pd > D.AGGRO.off or pd > nb[1] + 30):
			d.chase = false
		var na = 0
		for t in s.towers:
			if t.au and t.lv and not tower_busy(t) and hyp(d.x - t.x, d.y - (t.y - D.TWH[t.lv] / 2.0 - 3)) < D.SL.r[t.au]:
				na += 1
		d.slow = na > 0
		var sf: float = 1 - minf(D.SL.cap, D.SL.f * na)
		var tgx = null
		var tgy = 0.0
		var spd: float = d.sp * sf
		if d.kb > 0:
			d.kb -= dt
			d.atk = ""
			d.chase = false
			d.x = clampf(d.x + d.kvx * dt, 4, W - 4)
			d.y = clampf(d.y + d.kvy * dt, -30, GW - 8)
			var k = exp(-2.6 * dt)
			d.kvx *= k
			d.kvy = d.kvy * k + 40 * dt
			if randf() < dt * 30:
				fxp(d.x, d.y, -d.kvx * .1, -d.kvy * .1, 0, .25, "#8ff0ff")
		elif d.shock > 0:
			d.atk = ""
			d.chase = false
			d.rt -= dt
			if d.rt <= 0:
				d.rt = rnd(.05, .14)
				var a = rnd(0, 6.283)
				var v = rnd(45, 110)
				d.rvx = cos(a) * v
				d.rvy = sin(a) * v
			d.x = clampf(d.x + d.rvx * dt, 4, W - 4)
			d.y = clampf(d.y + d.rvy * dt, -30, GW - 8)
		elif d.stun > 0 or d.net > 0:
			d.atk = ""
			if d.stun > 0:
				d.y = minf(GW - 8, d.y + 14 * dt)
		elif d.flee:
			d.atk = ""
			d.y -= d.sp * 1.4 * sf * dt
			d.x += sin(d.ph * 2.2) * 10 * sf * dt
			if d.y < maxf(-30.0, cam_y - 34):
				d.dead = true
		else:
			dc = decoy_for(d)
			if dc != null:
				var dy2: float = dc.y - D.TWH[dc.lv] - 4
				if hyp(dc.x - d.x, dy2 - d.y) <= 14:
					d.atk = "decoy"
					d.dc = dc.i
					if d.cd <= 0:
						d.cd = 1.0
						dc.dHit = .25
						enemy_shot(d, dc.x, dy2)
						damage_tower(dc, d.dmg)
				else:
					d.atk = ""
					tgx = dc.x
					tgy = dy2
			elif d.chase:
				d.atk = ""
				spd *= 1.15
				var sh = null
				var sd = 1e9
				for t in s.towers:
					if not sh_active(t):
						continue
					var dd = hyp(d.x - t.x, d.y - (t.y - D.TWH[t.lv] / 2.0 - 3))
					if dd > D.SH.r[t.sh] and dd - D.SH.r[t.sh] < sd:
						sd = dd - D.SH.r[t.sh]
						sh = t
				if sh != null and sd < pd:
					tgx = sh.x
					tgy = sh.y - D.TWH[sh.lv] / 2.0 - 3
				else:
					tgx = m.x
					tgy = m.y - 10
			elif nb[0] != null:
				var bt: Dictionary = nb[0]
				var cy2: float = bt.y - D.TWH[bt.lv] / 2.0 - 2
				if nb[1] <= 10 + d.w / 2:
					d.atk = "tower"
					d.tw = bt.i
					if d.cd <= 0:
						d.cd = 1.0
						enemy_shot(d, bt.x, cy2)
						damage_tower(bt, d.dmg)
				else:
					d.atk = ""
					tgx = bt.x
					tgy = cy2
			else:
				if dist <= 18:
					d.atk = "fire"
					if d.cd <= 0:
						d.cd = 1.0
						enemy_shot(d, CX + d.ox * .4, GW - 16)
						s.hp -= d.dmg
						sfx("burn")
						puff(CX, GW - 14, 3, "#ff9a6a")
						ring(CX, GW - 17, 4, 22, .3, "#ff6a4a")
						light(CX, GW - 16, 50, "255,80,60", .6, .3)
						s.shake = maxf(s.shake, .18)
						s.coreHit = .3
				else:
					d.atk = ""
					tgx = tx
					tgy = ty
		if tgx != null:
			var ex: float = tgx - d.x
			var ey: float = tgy - d.y
			var ed = hyp(ex, ey)
			if ed > 5:
				var nx: float = d.x + ex / ed * spd * dt + sin(d.ph * 2.2) * (8.0 if d.chase else 10.0) * dt
				var ny2: float = d.y + ey / ed * spd * dt
				var blk = null
				for t in s.towers:
					if not sh_active(t):
						continue
					var cx: float = t.x
					var cy: float = t.y - D.TWH[t.lv] / 2.0 - 3
					var r: float = D.SH.r[t.sh]
					if hyp(nx - cx, ny2 - cy) < r and hyp(d.x - cx, d.y - cy) >= r:
						blk = t
						break
				if blk != null:
					d.atk = "shield"
					d.sh = blk.i
					if d.cd <= 0:
						d.cd = 1.0
						enemy_shot(d, nx, ny2)
						blk.shHp -= d.dmg
						blk.shT = 0.0
						blk.shHit = .3
						sfx("clank")
						if blk.shHp <= 0:
							blk.shHp = 0.0
							blk.brk = true
							puff(blk.x, blk.y - 12, 10, "#5ad1e6")
							light(blk.x, blk.y - 12, 70, "143,240,255", .7, .4)
							ring(blk.x, blk.y - D.TWH[blk.lv] / 2.0 - 3, D.SH.r[blk.sh] * .6, D.SH.r[blk.sh] * 1.3, .5, "#8ff0ff")
							s.shake = maxf(s.shake, .2)
				else:
					d.x = nx
					d.y = ny2
		if absf(d.x - m.x) < d.w / 2 + 5 and absf(d.y - (m.y - 9)) < d.h / 2 + 9 and m.hurt <= 0 and not d.flee and not d.kb > 0 and not d.stun > 0 and not d.net > 0 and not d.shock > 0:
			var lose: int = mini(s.coins, 4 if d.boss else 3 if d.heavy else 1 if d.swarm else 2)
			var away = 1 if m.x >= d.x else -1
			s.coins -= lose
			m.hurt = 1.2
			m.vx = away * 80.0
			m.hp -= 3 if d.boss else 2 if d.heavy else .5 if d.swarm else 1
			s.shake = maxf(s.shake, .25)
			m.st = ""
			m.peak = m.y
			m.vy = -110.0
			m.y -= 1
			for i in lose:
				fxp(m.x, m.y - 14, rnd(-50, 50), rnd(-110, -60), 400, .6, "#a9bccf", 2)
			sfx("hurt")
			say("Drone menyerangmu dan mencuri suku cadang!" if lose else "Drone menyerangmu!", 1.8)
			if m.hp <= 0 and not s.over:
				m.hp = 0
				s.cause = "mech"
				s.over = true
				game_over.emit()
		if d.hp <= 0:
			kill_drone(d)
		if dt > 0:
			d.vx = (d.x - ox0) / dt
			d.vy = (d.y - oy0) / dt
	var nd: Array = []
	for d in s.drones:
		if not d.dead:
			nd.append(d)
	s.drones = nd
	rebuild_dmap()

func kill_drone(d: Dictionary) -> void:
	if d.dead:
		return
	sfx("boom")
	light(d.x, d.y, 120 if d.boss else 64 if d.heavy else 42, "255,180,90", .95, .4)
	ring(d.x, d.y, 3, 60 if d.boss else 26 if d.heavy else 16, .6 if d.boss else .3, "#ffd36b")
	if d.boss or d.heavy:
		s.shake = maxf(s.shake, .6 if d.boss else .15)
	for i in (8 if d.boss else 3):
		fxp(d.x, d.y, rnd(-90, 90), rnd(-120, -20), 320, rnd(.5, .9), "#5a6070", 2)
	puff(d.x, d.y, 24 if d.boss else 9, "#8a96a8")
	puff(d.x, d.y, 12 if d.boss else 4, "#ffb347")
	s.kills += 1
	d.drop += int(magnet_bonus(d.x, d.y))
	var ck: bool = d.critAt >= 0 and s.anim - d.critAt < .25
	if ck:
		var n: int = 40 if d.boss else 28 if d.heavy else 20
		var pc = ["#59606c", "#8e99a8", "#3a4252", "#59606c", "#ffb347"]
		for i in n:
			var a = rnd(0, 6.283)
			var v = rnd(50, 210)
			fxp(d.x, d.y, cos(a) * v, sin(a) * v - 50, 260, rnd(.6, 1.2), pc[i % 5], 3 if i % 4 == 0 else 2)
		for i in 14:
			var a = i / 14.0 * 6.283 + rnd(-.2, .2)
			var v = rnd(120, 260)
			fxp(d.x, d.y, cos(a) * v, sin(a) * v, 0, rnd(.12, .28), "#ffffff" if i & 1 else "#ffd36b", 1)
		ring(d.x, d.y, 2, 90 if d.boss else 40, .45, "#ffffff")
		ring(d.x, d.y, 2, 64 if d.boss else 28, .4, "#ff9a3a")
		ring(d.x, d.y, 2, 40 if d.boss else 16, .3, "#ffe08a")
		light(d.x, d.y, 170 if d.boss else 100, "255,200,110", 1.0, .55)
		puff(d.x, d.y, 16, "#ff8a3a")
		puff(d.x, d.y, 12, "#3a3f4a")
		s.shake = maxf(s.shake, .45)
	var far = clampf(hyp(d.x - CX, d.y - (GW - 16)) / (GW - 16), 0.0, 1.0)
	if randf() < .7 * far:
		d.drop += 1
		ftext(d.x, d.y - 8, "+1", -26, .8, "#ffe08a")
	if ck and s.slow == null:
		s.slow = {"t": 0.0, "T": .5, "x": d.x, "y": d.y}
		sfx("slowmo")
		sfx("shatter")
	for i in d.drop:
		var a = rnd(0, 6.283)
		var v = rnd(35, 125)
		s.drops.append({"x": d.x, "y": d.y, "vx": cos(a) * v, "vy": sin(a) * v - 35, "ph": rnd(0, 6), "life": 70.0, "rest": false, "claim": null, "uid": nuid()})
	d.dead = true

func update_drops_fx(dt: float) -> void:
	var m: Dictionary = s.m
	var kd: Array = []
	for dr in s.drops:
		dr.life -= dt
		if dr.life <= 0:
			continue
		var mg = magnet_near(dr.x, dr.y)
		if mg != null:
			var tx: float = mg.x
			var ty: float = mg.y - D.TWH[mg.lv] - 4
			var ex: float = tx - dr.x
			var ey: float = ty - dr.y
			var ed = maxf(hyp(ex, ey), .001)
			if ed < 6:
				s.coins += 1
				sfx("tick")
				puff(tx, ty, 3, "#ff9a9a")
				continue
			var sp = minf(ed / dt, 90.0)
			dr.x += ex / ed * sp * dt
			dr.y += ey / ed * sp * dt
			dr.rest = false
			dr.vy = 0.0
			dr.vx = 0.0
			dr.claim = null
			kd.append(dr)
			continue
		if not dr.rest:
			dr.vy += 300 * dt
			var ny: float = dr.y + dr.vy * dt
			var hit: bool = ny >= GW
			if dr.vx != 0:
				dr.x = clampf(dr.x + dr.vx * dt, 4, W - 4)
				dr.vx *= exp(-.7 * dt)
			if hit:
				dr.y = GW
				dr.rest = true
				dr.vy = 0.0
				dr.vx = 0.0
			else:
				dr.y = ny
		if absf(dr.x - m.x) < 12 and dr.y > m.y - 20 and dr.y < m.y + 6:
			s.coins += 1
			sfx("pickup")
			puff(dr.x, dr.y - 3, 3, "#d8e6f2")
			continue
		kd.append(dr)
	s.drops = kd
	if randf() < dt * 5:
		fxp(CX + rnd(-3, 3), GW - 14, rnd(-6, 6), -rnd(20, 40), -8, rnd(.5, 1), "#8ff0ff")
	s.shake = maxf(0.0, s.shake - dt)
	s.coreHit = maxf(0.0, s.coreHit - dt)
	s.pulseT -= dt
	if s.pulseT <= 0:
		s.pulseT = 1.8
		ring(CX, GW - 17, 6, 34, 1.1, "#5ad1e6")
	for f in s.fx:
		f.x += f.vx * dt
		f.y += f.vy * dt
		f.vy += f.g * dt
		f.l -= dt
	var kf: Array = []
	for f in s.fx:
		if f.l > 0:
			kf.append(f)
	s.fx = kf
	for b in s.bolts:
		b.l -= dt
	var kb: Array = []
	for b in s.bolts:
		if b.l > 0:
			kb.append(b)
	s.bolts = kb
