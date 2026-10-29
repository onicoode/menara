extends Node
## Profil pemain, pengaturan, dan simpanan (autoload "Prof"). Port dari vm.js.

const PSLOTS := 3
const PATH := "user://mr_prof.json"
const SET_PATH := "user://mr_set.json"

var active := 0
var list: Array = []          # PSLOTS profil (Dictionary atau null)
var settings := {"music": 1, "sfx": 1, "shake": 1, "light": 1, "vol": 8}
var best := 0

func _ready() -> void:
	load_all()

func new_up() -> Dictionary:
	var u := {}
	for k in D.UPGK:
		u[k] = 1 if k == "main" else 0
	return u

func new_profile(nm: String) -> Dictionary:
	var p := {"name": nm.substr(0, 12), "coins": 0, "best": 0, "runs": 0, "ch": "mek", "chars": {}, "tw": {}}
	for c in D.CHARS:
		p.chars[c.id] = {"own": 1 if c.cost == 0 else 0, "up": new_up()}
	return p

func fix_profile(p) -> Dictionary:
	var q := new_profile(str(p.get("name", "Pemain")) if p is Dictionary else "Pemain")
	if not (p is Dictionary):
		return q
	var tw = p.get("tw", {})
	if tw is Dictionary:
		for k in tw:
			if tw[k] and D.TY.has(k):
				q.tw[k] = 1
	q.coins = maxi(0, int(p.get("coins", 0)))
	q.best = maxi(0, int(p.get("best", 0)))
	q.runs = maxi(0, int(p.get("runs", 0)))
	var ch := str(p.get("ch", "mek"))
	q.ch = ch if q.chars.has(ch) else "mek"
	var pc = p.get("chars", {})
	for c in D.CHARS:
		if not (pc is Dictionary) or not pc.has(c.id):
			continue
		var src: Dictionary = pc[c.id]
		q.chars[c.id].own = 1 if (src.get("own", 0) or c.cost == 0) else 0
		for k in D.UPGK:
			var lo := 1 if k == "main" else 0
			q.chars[c.id].up[k] = clampi(int(src.get("up", {}).get(k, 0)), lo, D.UMAX)
	if not q.chars[q.ch].own:
		q.ch = "mek"
	return q

func save_all() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify({"active": active, "list": list, "best": best}))
	var g := FileAccess.open(SET_PATH, FileAccess.WRITE)
	if g:
		g.store_string(JSON.stringify(settings))

func load_all() -> void:
	list = []
	if FileAccess.file_exists(PATH):
		var j = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		if j is Dictionary and j.get("list") is Array:
			for p in j.list.slice(0, PSLOTS):
				list.append(fix_profile(p) if p != null else null)
			active = clampi(int(j.get("active", 0)), 0, PSLOTS - 1)
			best = int(j.get("best", 0))
	while list.size() < PSLOTS:
		list.append(null)
	var any := false
	for p in list:
		if p != null:
			any = true
	if not any:
		list[0] = new_profile("Pemain 1")
		active = 0
	if list[active] == null:
		for i in PSLOTS:
			if list[i] != null:
				active = i
				break
	if FileAccess.file_exists(SET_PATH):
		var s = JSON.parse_string(FileAccess.get_file_as_string(SET_PATH))
		if s is Dictionary:
			for k in settings:
				if s.has(k):
					settings[k] = clampi(int(s[k]), 0, 10) if k == "vol" else (1 if s[k] else 0)
	save_all()

func prof() -> Dictionary:
	return list[active]

func cur_char() -> Dictionary:
	return D.char_by_id(prof().ch)

func cur_up() -> Dictionary:
	return prof().chars[prof().ch].up

func tw_own(ty: String) -> bool:
	return ty in D.TWFREE or (prof().tw.has(ty) and prof().tw[ty])

func up_cost(k: String, lv: int) -> int:
	return D.UPG[k].cost[lv + 1]

func buy_up(k: String) -> bool:
	var p := prof()
	var u := cur_up()
	var lv: int = u[k]
	if lv >= Dev.up_cap(k, p.ch):
		return false
	var c := up_cost(k, lv)
	if p.coins < c:
		return false
	p.coins -= c
	u[k] = lv + 1
	save_all()
	return true

func buy_tower(ty: String) -> bool:
	var p := prof()
	if tw_own(ty):
		return true
	var c: int = D.TY[ty].uc
	if p.coins < c:
		return false
	p.coins -= c
	p.tw[ty] = 1
	save_all()
	return true

func buy_char(id: String) -> bool:
	var p := prof()
	var c := D.char_by_id(id)
	var st: Dictionary = p.chars[id]
	if st.own:
		return true
	if p.coins < c.cost:
		return false
	p.coins -= c.cost
	st.own = 1
	p.ch = id
	save_all()
	return true

# ---------- simpanan run (per profil) ----------
func run_path(i := -1) -> String:
	return "user://mr_run_%d.json" % (active if i < 0 else i)

func clear_run(i := -1) -> void:
	if FileAccess.file_exists(run_path(i)):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(run_path(i)))

func peek_run():
	var p = run_path()
	if not FileAccess.file_exists(p):
		return null
	var f = FileAccess.open(p, FileAccess.READ)
	var v = str_to_var(f.get_as_text())
	if v is Dictionary and v.has("S"):
		return v.S
	return null
