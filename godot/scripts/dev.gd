extends Node
## Menu Dev / Balancing, bagian logika (autoload "Dev"). Port dari vdev.js.
## Layer 1: per entitas dan stat: Min (Lv1), Max (Lv maks), Level maks, Kurva atau Faktor/level. Kosong (null) = nilai asli game.
## Layer 2: pengali global Musuh / Tower / Senjata, dikalikan setelah Layer 1.
## UI-nya ada di scenes/dev_panel.tscn (dev_panel.gd).

const PATH := "user://mr_dev.json"
const CATS := ["enemy", "tower", "weapon"]

var cfg := {"btn": false, "pause": true, "g": {"enemy": 1.0, "tower": 1.0, "weapon": 1.0, "rmax": 10.0},
	"e": {"enemy": {}, "tower": {}, "weapon": {}}}

# stat utama tiap tower: [kunci array, label, integer?]
const TPRI := {
	"g":["dmg","Damage",false],"f":["dmg","Damage/tick",false],"mortar":["dmg","Damage",false],"gatling":["dmg","Damage",false],
	"sniper":["dmg","Damage",false],"rocket":["dmg","Damage",false],"tesla":["dmg","Damage",false],"laser":["dmg","Damage/detik",false],
	"emp":["dmg","Damage",false],"net":["hold","Tahan (detik)",false],"decoy":["hp","HP umpan",true],
	"magnet":["bonus","Bonus suku cadang/kill",true],"repair":["heal","Pulih shield",true],"solar":["parts","Suku cadang/fajar",true]}
const EBASE := {
	"s":{"hp":2.0,"dmg":1.0,"min":2,"n":"Pengintai"},"h":{"hp":9.0,"dmg":2.0,"min":1,"n":"Drone berat"},
	"m":{"hp":.3,"dmg":.45,"min":1,"n":"Tungau"},"b":{"hp":21.0,"dmg":2.5,"min":1,"n":"Bos"}}
const LV := {"enemy":15, "tower":9, "weapon":5}
const HARD := {"enemy":99, "tower":9, "weapon":5}
const GL := {"enemy":"enemy", "tower":"tower", "weapon":"weapon"}

var orig_t := {}     # id -> array asli stat utama tower
var orig_w := {}     # id -> array asli damage senjata
var warrs := {}      # id -> referensi array damage yang hidup (diubah devApply)

func _ready() -> void:
	call_deferred("_init_orig")

func _init_orig() -> void:
	warrs = {"weld":D.WEAP.weld.dmg,"rail":D.WEAP.rail.dmg,"saw":D.WEAP.saw.dmg,"nade":D.WEAP.nade.dmg,"buddy":D.WEAP.buddy.dmg,
		"katana":D.PWD.katana.dmg,"orbit":D.PWD.orbit.dmg,"shot":D.PWD.shot.dmg,"mini":D.PWD.mini.dmg,"field":D.PWD.field.dps}
	for id in TPRI:
		orig_t[id] = D.TY[id][TPRI[id][0]].duplicate()
	for id in warrs:
		orig_w[id] = warrs[id].duplicate()
	load_cfg()
	apply()

static func num_or_null(v):
	if v == null or (v is String and v == ""):
		return null
	if v is float or v is int:
		return float(v)
	var s := str(v).replace(",", ".")
	return s.to_float() if s.is_valid_float() else null

func clean(j) -> bool:
	if not (j is Dictionary):
		return false
	if j.get("g") is Dictionary:
		for k in ["enemy", "tower", "weapon", "rmax"]:
			var v = num_or_null(j.g.get(k))
			if v != null and v > 0:
				cfg.g[k] = v
	if j.get("e") is Dictionary:
		for c in CATS:
			var src = j.e.get(c)
			if not (src is Dictionary):
				continue
			cfg.e[c] = {}
			for id in src:
				var s = src[id]
				if not (s is Dictionary):
					continue
				var o := {"maxLv": num_or_null(s.get("maxLv")), "st": {}}
				var sts = s.get("st", {})
				if sts is Dictionary:
					for k in sts:
						var q = sts[k] if sts[k] is Dictionary else {}
						o.st[k] = {"min": num_or_null(q.get("min")), "max": num_or_null(q.get("max")),
							"curve": num_or_null(q.get("curve")), "mul": num_or_null(q.get("mul"))}
				cfg.e[c][id] = o
	if j.has("btn"):
		cfg.btn = bool(j.btn)
	if j.has("pause"):
		cfg.pause = j.pause != false
	return true

func save_cfg() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(cfg))

func load_cfg() -> void:
	if FileAccess.file_exists(PATH):
		clean(JSON.parse_string(FileAccess.get_file_as_string(PATH)))

func reset_all() -> void:
	cfg.g = {"enemy": 1.0, "tower": 1.0, "weapon": 1.0, "rmax": 10.0}
	cfg.e = {"enemy": {}, "tower": {}, "weapon": {}}
	apply()
	save_cfg()

# ---------- katalog entitas ----------
func ids(c: String) -> Array:
	match c:
		"enemy": return ["s", "h", "m", "b"]
		"tower": return D.TORDER
		_: return warrs.keys()

func ent_name(c: String, id: String) -> String:
	match c:
		"enemy": return EBASE[id].n
		"tower": return D.TY[id].name
		_: return D.WEAP[id].name if D.WEAP.has(id) else D.UPG[id].name

## daftar stat yang bisa diubah: [{k,label,int,noGl}]
func stats(c: String, id: String) -> Array:
	match c:
		"enemy":
			return [{"k":"hp","label":"HP (per malam)","int":true,"noGl":false},{"k":"dmg","label":"Damage (per malam)","int":false,"noGl":false}]
		"tower":
			var r := [{"k":"pri","label":TPRI[id][1],"int":TPRI[id][2],"noGl":false}]
			if id != "decoy":
				r.append({"k":"hp","label":"HP menara","int":true,"noGl":false})
			r.append({"k":"cost","label":"Harga naik ke level ini (tanpa multiplier global)","int":true,"noGl":true})
			return r
		_:
			return [{"k":"dmg","label":"Damage/detik" if id == "field" else "Damage","int":false,"noGl":false}]

func stat_def(c: String, id: String, k: String) -> Dictionary:
	for s in stats(c, id):
		if s.k == k:
			return s
	return {}

## nilai asli (tanpa Dev) stat k pada level L
func orig(c: String, id: String, k: String, L: int) -> float:
	match c:
		"enemy":
			var w := D.wave_info(L)
			if k == "hp":
				return maxf(EBASE[id].min, floorf(EBASE[id].hp * w.hpm + .5))
			return EBASE[id].dmg * w.dmm
		"tower":
			if k == "pri":
				return float(orig_t[id][L])
			if k == "hp":
				return floorf(D.TWHP[L] * D.THPM.get(id, 1.0) + .5)
			if L <= 1:
				return maxf(2, floorf(D.TW.cost[0] * D.TY[id].get("cost", 1.0) + .5))
			return float(D.TW.up[L - 1])
		_:
			return float(orig_w[id][L])

func ent_cfg(c: String, id: String):
	return cfg.e[c].get(id)

func ent_make(c: String, id: String) -> Dictionary:
	if not cfg.e[c].has(id):
		cfg.e[c][id] = {"maxLv": null, "st": {}}
	return cfg.e[c][id]

func max_lv(c: String, id: String) -> int:
	var e = ent_cfg(c, id)
	var v: int = LV[c]
	if e != null and e.maxLv != null:
		v = int(floorf(float(e.maxLv) + .5))
	return clampi(v, 1, HARD[c])

## nilai satu stat pada level L: Layer 1 (min/max/level maks/kurva) lalu Layer 2 (pengali global)
func val(c: String, id: String, k: String, L: int, no_global := false) -> float:
	var def := stat_def(c, id, k)
	var ml := max_lv(c, id)
	var e = ent_cfg(c, id)
	var q = e.st.get(k) if e != null else null
	L = clampi(L, 1, ml)
	var v: float
	if q == null or (q.min == null and q.max == null and q.curve == null and q.mul == null):
		v = orig(c, id, k, L)
	else:
		var a := orig(c, id, k, 1)
		var b := orig(c, id, k, ml)
		var mn: float = q.min if q.min != null else a
		var mx: float = q.max if q.max != null else b
		var t: float = (L - 1.0) / (ml - 1.0) if ml > 1 else 0.0
		if q.mul != null:
			v = mn * pow(q.mul, L - 1)
			if q.max != null:
				v = minf(v, mx) if mx >= mn else maxf(v, mx)
		else:
			var s: float
			if q.curve != null:
				s = pow(t, maxf(.05, q.curve))
			elif b == a:
				s = t
			else:
				s = (orig(c, id, k, L) - a) / (b - a)
			v = mn + (mx - mn) * s
	if not no_global and not def.noGl:
		v *= float(cfg.g[GL[c]])
	if def.int:
		return maxf(1.0 if k == "hp" else 0.0, floorf(v + .5))
	return floorf(v * 1000.0 + .5) / 1000.0

## dorong konfigurasi ke tabel game yang hidup
func apply() -> void:
	for id in orig_t:
		var arr: Array = D.TY[id][TPRI[id][0]]
		for L in range(1, arr.size()):
			arr[L] = val("tower", id, "pri", L)
	for id in warrs:
		var arr: Array = warrs[id]
		for L in range(1, arr.size()):
			arr[L] = val("weapon", id, "dmg", L)

# ---------- hook yang dipakai logika game ----------
func enemy(kind: String, stat: String, day: int) -> float:
	return val("enemy", kind if EBASE.has(kind) else "s", stat, day)

func tw_hp(ty: String, L: int) -> float:
	return val("tower", ty, "hp", L)

func tw_max(ty: String) -> int:
	return max_lv("tower", ty)

func cost_ratio(ty: String, L: int) -> float:
	var e = ent_cfg("tower", ty)
	if e == null or not e.st.has("cost"):
		return 1.0
	return val("tower", ty, "cost", L) / maxf(1.0, orig("tower", ty, "cost", mini(L, max_lv("tower", ty))))

func tw_build_cost(ty: String, base: float) -> int:
	return maxi(2, int(floorf(base * cost_ratio(ty, 1) + .5)))

func tw_up_cost(ty: String, lv: int) -> int:
	return maxi(1, int(floorf(D.TW.up[lv] * cost_ratio(ty, lv + 1) + .5)))

func up_cap(k: String, ch_id: String) -> int:
	if k == "main":
		return max_lv("weapon", D.char_by_id(ch_id).weap)
	if warrs.has(k):
		return max_lv("weapon", k)
	return D.UMAX
