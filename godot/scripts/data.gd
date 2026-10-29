extends Node
## Tabel data game (autoload "D"). Port dari va.js / vm.js / vt.js (game HTML5 v1.23).
## Angka-angka di sini harus sama dengan data/balance.json (dicek oleh tests/selftest.gd).

const K := 1.5
const VW := 360.0
const W := 360.0
const CX := 180.0
const TIER := 38.0
const MAXT := 18
const GW := 794.0            # MAXT*TIER+110 : garis tanah
const BOT := 146.0           # area bawah layar (dock)
const MAXBOTS := 16
const DAY := 50.0
const NIGHT := 40.0
const CYC := 90.0
const DUSK := 7.0

const HT := {"sell":1.2,"worker":1.2,"fuel":.5,"weld":1.0,"tbuild":.8,"tup":1.0,"crane":1.2,"res":1.0,"core":1.5,"botw":1.2}
const CRMX := 350.0
const CLMX := 10.0
const CRCLEAR := 84.0
const CRROPE := 64.0
const CR2H := 120.0
const AGGRO := {"on":70.0,"off":110.0}
const JETF := {"v":[1e9,360.0,280.0,210.0,150.0,100.0],"red":[0.0,.25,.5,.7,.88,1.0]}
const TOOL_COST := [0,0,5,8]
const SLOTX := [34.0,80.0,126.0,234.0,280.0,326.0]
const PILES := [57.0,103.0,257.0,303.0]
const SH := {"max":5,"up":[6,10,16,25,40],"hp":[0,8,15,25,40,63],"r":[0,32,44,56,70,86]}
const CORE := {"hp":[40,60,85,120],"up":[0,12,22,36],"max":4,"near":110.0}
const BOTW := {"dps":[0,.7,1.4,2.3,3.4,4.8],"up":[0,0,14,24,38,56],"max":5,"reach":280.0,"spd":130.0}
const RES := {"shield":{"name":"Shield","cost":15,"time":90.0},"slow":{"name":"Aura lambat","cost":20,"time":120.0}}
const RESK := ["shield","slow"]
const TWFREE := ["g","f","mortar"]
const SL := {"max":5,"up":[8,14,22,34,50],"r":[0,136,160,184,208,232],"f":.1,"cap":.5}
const TW := {"cost":[4,5,6,7,8,9,10,11,12,13],"up":[0,5,9,15,26,44,70,105,150],"max":9}
const TWHP := [0,24,32,42,54,68,84,102,122,144]
const THPM := {"f":1.1,"mortar":1.4,"rocket":.9,"laser":.8,"magnet":1.2,"repair":1.1,"solar":.7,"net":.9,"emp":.9,"gatling":.9,"sniper":.7,"tesla":.9}
const TORDER := ["g","f","mortar","gatling","sniper","rocket","tesla","laser","emp","net","decoy","magnet","repair","solar"]
const TWH := [0,12,16,20,23,25,26,28,30,32]
const TWL := [0,8,10,12,14,15,16,17,18,19]
const TWW := [0,14,16,18,20,22,22,24,24,26]
const WAVE := {"nk":1.3,"n2":.6,"n2f":10,"nmax":90,"hk":.2,"h2":.2,"h2f":6,"h3":.15,"h3f":14,"hvMax":.4,"bossHp":21.0,"bossDmg":2.5,"bd":6}
const HPX := [0,1,10,18.6,27.9,39.1,53.2,70.2,89.7,111,133.8,157.4,181.3,205.1,228.1,250]
const CRIT := {"max":.2,"mul0":1.5,"mul1":2.5}
const ACC := {"miss":.55,"fall":.5}
const BLAST_BASE := {"cost":.75,"r":192.0,"pow":540.0,"sp":48.0,"dmg":5.0}
const LUREMAX := 4
const LUREPAR := 2
const RQMAX := 3
const UMAX := 5
const TOOLC := [null,"#8ff0ff","#7dff9a","#c8ff6a","#ff7ae6","#ffd36b"]
const DVAR := {"s":4,"h":3,"b":2,"m":2}
const PWK := ["katana","orbit","shot","mini","field"]
const PW := {
	"katana":{"name":"Katana","cost":[0,12,18,28]},
	"orbit":{"name":"Bilah orbit","cost":[0,10,16,26]},
	"shot":{"name":"Senapan tabur","cost":[0,10,16,26]},
	"mini":{"name":"Roket mini","cost":[0,12,18,28]},
	"field":{"name":"Medan statis","cost":[0,10,16,26]}}

# crane (platform kanan) dan crane2 (platform kiri)
var CR := {"w":[84,124,164],"n":[2,3,4],"h":[110,170,240],"hmin":46.0,"up":[0,10,20],"max":3,
	"off":[[-18,18],[-36,0,36],[-54,-18,18,54]]}
var CR2 := {"w":[84,124,164],"n":[2,3,4],"h":[250,340,444],"up":[0,10,20],"max":3,
	"off":[[-18,18],[-36,0,36],[-54,-18,18,54]]}
var MECH := {"hp":10.0,"bat":20.0,"drain":1.0,"charge":1.4,"vx":95.0,"vy":110.0,"safe":60.0,"dmgPer":40.0,"jet":0}

var TY := {}
var WEAP := {}
var PWD := {}
var UPG := {}
var CHARS := []
const UPGK := ["main","katana","orbit","shot","mini","field","bots","hp","bat","jet","aura"]
const RUNS := [{"len":5,"name":"Short run","f":.25,"b":10},{"len":10,"name":"Medium run","f":.6,"b":40},{"len":15,"name":"Long run","f":1.2,"b":100}]
const TBODY := {"mortar":"#5e6248","rocket":"#6a5a4a","tesla":"#5a4f6a","laser":"#5a4a52","emp":"#4a5a6a","net":"#5e624e","decoy":"#6a5a3a","magnet":"#6a4a4a","repair":"#4a6250","solar":"#4a5262"}
const TBODYG := {"sniper":"#46525e","gatling":"#6a4a3a"}
const PGRAD := {
	"g":["#8ff0ff","#7dffa8","#ffe85a","#ff7a5a","#ff6ae6"],
	"gatling":["#ffd36b","#ffa23a","#ff6a3a","#ff4a8a","#ffffff"],
	"sniper":["#b8ff8a","#5af0c8","#5ab8ff","#b48aff","#ffffff"],
	"f":["#ffb347","#ff7a2a","#ff4a2a","#7ad0ff","#e0f4ff"],
	"mortar":["#ffb347","#ff8a3a","#ff5a2a","#ff3a6a","#ffe0ff"],
	"rocket":["#ff9a6a","#ff7a4a","#ff5a5a","#ff4aa0","#ffd0ff"],
	"tesla":["#c9a8ff","#a88aff","#8aa8ff","#8affff","#ffffff"],
	"laser":["#ff4a6a","#ff6a4a","#ff9a3a","#ffd36b","#ffffff"],
	"emp":["#9ad8ff","#7ab8ff","#8a9aff","#c58aff","#ffffff"],
	"net":["#d8e0a0","#b8e87a","#7ae8a8","#7ad8ff","#ffffff"]}

func _r(v: float) -> float:
	return floorf(v + 0.5)

## kurva stat dari nilai Lv1 ke Lv9 (p>1: level akhir naik lebih cepat)
func ramp(a: float, b: float, p: float = 1.0, is_int: bool = false) -> Array:
	var r: Array = [0.0]
	for i in range(1, 10):
		var v: float = a + (b - a) * pow((i - 1) / 8.0, p)
		r.append(_r(v) if is_int else _r(v * 100.0) / 100.0)
	return r

func _ready() -> void:
	_build_towers()
	_build_weapons()
	_build_upgrades()

func _build_towers() -> void:
	TY = {
	"g":{"name":"Gun","dmg":ramp(.8,6,1.1),"cd":ramp(.34,.16),"rng":ramp(150,300,1,true),"acc":ramp(.85,.97),"crit":ramp(.05,.2),"sp":560.0,"col":"#8ff0ff"},
	"f":{"name":"Api","dmg":ramp(.5,8,1.25),"cd":ramp(.1,.1),"rng":ramp(55,125,1,true),"cone":.42,"col":"#ff9a3a"},
	"mortar":{"name":"Mortir","cost":1.2,"rng":ramp(170,330,1,true),"min":45.0,"cd":ramp(2.8,1.5),"dmg":ramp(4,34,1.15),"spl":ramp(26,50,1,true),"acc":ramp(.5,.8),"col":"#ffd36b"},
	"gatling":{"name":"Gatling","uc":60,"cost":1.1,"dmg":ramp(.45,2.8),"cd":ramp(.09,.05),"rng":ramp(110,190,1,true),"acc":ramp(.45,.7),"sp":640.0,"col":"#ffd36b"},
	"sniper":{"name":"Penembak jitu","uc":100,"cost":1.5,"dmg":ramp(8,52,1.2),"cd":ramp(2.6,1.5),"rng":ramp(260,460,1,true),"min":70.0,"acc":ramp(.92,.99),"sp":1500.0,"col":"#b8ff8a"},
	"rocket":{"name":"Rudal","uc":120,"cost":1.4,"rng":ramp(170,300,1,true),"cd":ramp(3.6,2.2),"dmg":ramp(12,80,1.25),"acc":ramp(.8,.95),"col":"#ff9a6a"},
	"tesla":{"name":"Tesla","uc":80,"cost":1.1,"rng":ramp(75,160,1,true),"cd":ramp(1.1,.6),"dmg":ramp(2,16,1.1),"jump":ramp(2,7,1,true),"shock":ramp(.12,.38),"col":"#c9a8ff"},
	"laser":{"name":"Laser","uc":140,"cost":1.2,"rng":ramp(110,230,1,true),"dmg":ramp(2,14,1.1),"col":"#ff4a6a"},
	"emp":{"name":"EMP","uc":90,"cost":1.0,"rng":ramp(55,130,1,true),"cd":ramp(6.5,3.5),"dmg":ramp(.8,5),"stun":ramp(1.2,3),"col":"#9ad8ff"},
	"net":{"name":"Jaring","uc":70,"cost":.9,"rng":ramp(120,240,1,true),"cd":ramp(4.2,2.4),"hold":ramp(1.8,4.5),"acc":ramp(.6,.9),"col":"#d8e0a0"},
	"decoy":{"name":"Suar umpan","uc":50,"cost":.8,"rng":ramp(90,180,1,true),"hp":ramp(30,200,1.2,true),"col":"#ffb347"},
	"magnet":{"name":"Magnet","uc":70,"cost":.8,"rng":ramp(70,160,1,true),"bonus":ramp(1,4,1,true),"push":ramp(34,62,1,true),"pcd":ramp(9,4.5),"col":"#ff7a7a"},
	"repair":{"name":"Dok perbaikan","uc":90,"cost":1.0,"rng":ramp(75,165,1,true),"cd":ramp(8,3.5),"heal":ramp(4,22,1,true),"core":ramp(1,3.5),"col":"#7dff9a"},
	"solar":{"name":"Panel surya","uc":60,"cost":.7,"rng":[0,0,0,0,0,0,0,0,0,0],"chg":ramp(.25,1),"parts":ramp(2,10,1,true),"col":"#5ad1e6"}}

func _mul(a: Array, f: float) -> Array:
	var o: Array = []
	for v in a:
		o.append(float(v) * f)
	return o

func _build_weapons() -> void:
	WEAP = {
	"weld":{"name":"Las busur","r":[0,60,70,80,92,105],"cd":[0,.9,.75,.62,.52,.44],"dmg":[0,1,1.4,1.9,2.5,3.2],"chain":[0,0,0,1,2,3]},
	"rail":{"name":"Railgun","r":[0,170,190,210,235,260],"cd":[0,2.2,2,1.8,1.6,1.4],"dmg":[0,4,6,8.5,11.5,15]},
	"saw":{"name":"Bumerang gergaji","r":[0,90,105,120,135,150],"cd":[0,1.8,1.6,1.4,1.25,1.1],"dmg":[0,1.5,2,2.8,3.6,4.6]},
	"nade":{"name":"Granat lengket","r":[0,110,125,140,155,170],"cd":[0,2.4,2.1,1.9,1.7,1.5],"dmg":[0,4,5.5,7.5,10,13],"spl":[0,24,27,30,33,36]},
	"buddy":{"name":"Drone pendamping","r":[0,110,125,140,155,170],"cd":[0,.7,.6,.5,.45,.4],"dmg":[0,.8,1.1,1.5,2,2.6]}}
	for k in WEAP:
		WEAP[k].r = _mul(WEAP[k].r, 2.0)
		WEAP[k].dmg = _mul(WEAP[k].dmg, 3.4)
	WEAP.weld.chain = [0,1,2,3,4,5]
	WEAP.rail.cd = [0,1.9,1.7,1.5,1.35,1.2]
	WEAP.saw.cd = [0,1.5,1.35,1.2,1.05,.9]
	WEAP.nade.cd = [0,2,1.8,1.6,1.45,1.3]
	WEAP.buddy.cd = [0,.5,.44,.38,.33,.28]
	WEAP.weld.cd = [0,.7,.6,.5,.42,.35]
	PWD = {
	"katana":{"cd":[0,1,.9,.8,.7,.6],"dmg":[0,6,8,11,14,18],"r":[0,14,16,18,20,22]},
	"orbit":{"n":[0,2,4,6,8,10],"dmg":[0,1.2,1.6,2.2,2.8,3.6],"r":[0,22,26,30,34,38]},
	"shot":{"cd":[0,1.6,1.4,1.2,1.05,.9],"n":[0,5,5,6,7,8],"dmg":[0,.8,1,1.3,1.6,2],"rng":[0,90,100,112,125,140]},
	"mini":{"cd":[0,3,2.7,2.4,2.1,1.8],"n":[0,2,2,3,3,4],"dmg":[0,3,3.8,4.8,6,7.5],"rng":[0,150,165,180,200,220]},
	"field":{"dps":[0,1,1.4,1.9,2.5,3.2],"r":[0,38,44,50,56,62]}}
	for k in PWD:
		for f in ["dmg","dps","r","rng"]:
			if PWD[k].has(f):
				PWD[k][f] = _mul(PWD[k][f], 2.0)

func _build_upgrades() -> void:
	CHARS = [
	{"id":"mek","name":"Bara","role":"Mekanik","weap":"weld","cost":0,"suit":"#e0782a","suitD":"#7a4a1a","helm":"#f2c14e","visor":"#5ad1e6","skin":"#d9a77a","pack":"#6a707c","acc":""},
	{"id":"snp","name":"Sela","role":"Penembak","weap":"rail","cost":0,"suit":"#4f7a4a","suitD":"#2a4a2a","helm":"#3a5a3a","visor":"#ff6a4a","skin":"#c99a72","pack":"#5a5f50","acc":"hood"},
	{"id":"saw","name":"Gerinda","role":"Pemotong","weap":"saw","cost":150,"suit":"#a83a3a","suitD":"#5a1a1a","helm":"#2a2a30","visor":"#ffd36b","skin":"#b98a62","pack":"#6a5a4a","acc":"band"},
	{"id":"bom","name":"Dinamo","role":"Peledak","weap":"nade","cost":250,"suit":"#6a6e78","suitD":"#3a3a40","helm":"#4a4f58","visor":"#9dffb0","skin":"#d9a77a","pack":"#4a4f58","acc":"mask"},
	{"id":"drn","name":"Nara","role":"Operator drone","weap":"buddy","cost":400,"suit":"#6a4a9a","suitD":"#3a2a5a","helm":"#e6ecff","visor":"#c58aff","skin":"#e0b48a","pack":"#5a5f7a","acc":"goggle"}]
	UPG = {
	"main":{"cost":[0,0,40,100,200,360]},
	"katana":{"name":"Katana","cost":[0,40,100,190,320,500]},
	"orbit":{"name":"Bilah orbit","cost":[0,30,80,160,280,450]},
	"shot":{"name":"Senapan tabur","cost":[0,30,80,160,280,450]},
	"mini":{"name":"Roket mini","cost":[0,40,100,190,320,500]},
	"field":{"name":"Medan statis","cost":[0,30,80,160,280,450]},
	"bots":{"name":"Robot tempur","cost":[0,50,110,190,300,450]},
	"hp":{"name":"Baju zirah","cost":[0,40,70,110,160,230]},
	"bat":{"name":"Batre jetpack","cost":[0,40,70,110,160,230]},
	"jet":{"name":"Jet peredam","cost":[0,40,80,140,220,340]},
	"aura":{"name":"Aura kejut","cost":[0,50,90,140,200,280]}}

func char_by_id(id: String) -> Dictionary:
	for c in CHARS:
		if c.id == id:
			return c
	return CHARS[0]

func coins_for(n: int) -> int:
	return 0 if n <= 0 else 8 * n + n * (n - 1)

func run_bonus(length: int, n: int) -> int:
	for r in RUNS:
		if r.len == length:
			return int(_r(coins_for(n) * r.f + r.b))
	return 0

func wave_info(d: float) -> Dictionary:
	return {
		"n": 2 * mini(WAVE.nmax, int(_r(3 + .7 * (d - 1) + .07 * (d - 1) * (d - 1)))),
		"hpm": 3.0 * float(HPX[maxi(1, mini(15, int(_r(d))))]),
		"spm": minf(1.55, .9 + .045 * (d - 1)),
		"dmm": (.7 + .1 * (d - 1)) if d < 4 else (1.0 * (1 + floorf((d - 1) / 10.0) * .5)),
		"hv": 0.0 if d < 3 else minf(WAVE.hvMax, .1 + .025 * (d - 3)),
		"boss": int(d) % 5 == 0}

# ---------- warna / util ----------
func to_col(c) -> Color:
	return c if c is Color else Color(c)

func mixc(a, b, t: float) -> Color:
	return to_col(a).lerp(to_col(b), t)

func tier_col(ty: String, lv: int) -> Color:
	var g: Array = PGRAD.get(ty, PGRAD.g)
	var u: float = (clampi(lv, 1, 9) - 1) / 8.0 * (g.size() - 1)
	var i: int = mini(g.size() - 2, int(floorf(u)))
	return mixc(g[i], g[i + 1], u - i)

func darkness(t: float) -> float:
	if t < DAY - DUSK: return 0.0
	if t < DAY: return (t - (DAY - DUSK)) / DUSK
	if t < CYC - DUSK: return 1.0
	return 1.0 - (t - (CYC - DUSK)) / DUSK

func flame_cols(lv: int) -> Array:
	if lv >= 8: return ["#e0f4ff", "#7ad0ff", "#3a7aff"]
	if lv >= 5: return ["#fff0a0", "#ffb347", "#ff6a1a"]
	return ["#ffd36b", "#ff9a3a", "#ff5a1a"]

func proj_look(ty: String, lv: int) -> Dictionary:
	lv = clampi(lv, 1, 9)
	var sn: bool = ty == "sniper"
	var gt: bool = ty == "gatling"
	return {"col": tier_col(ty, lv),
		"size": (3.0 if sn else 1.6 if gt else 2.0) + (lv - 1) * (.45 if sn else .25 if gt else .35),
		"trail": int(_r((18 if sn else 5 if gt else 7) * (1 + (lv - 1) * .14))),
		"shape": "star" if lv >= 9 else "diamond" if lv >= 7 else "bolt" if lv >= 4 else "dot"}
