extends Node
## Autoload "Audio": semua suara disintesis lewat kode (tanpa berkas), port dari vaud.js.
## SFX dirender sekali saat start (thread), musik dirender sebagai loop (menu, siang, malam).

const R := 22050
const RM := 16000
const SFXLIM := {"mortar":.15,"rocket":.2,"emp":.3,"net":.2,"blast":.3,"zap":.12,"shot":.07,"mg":.06,"beep":.4,"boom":.05,"clank":.25,"slash":.1,"x_weld":.1,"x_rail":.2,"x_saw":.4,"x_throw":.15,"x_nade":.2,"x_buddy":.09,"x_buddy2":.1,"x_rail2":.1,"regen":.9,"x_orbit":.1,"x_shot":.1,"x_mini":.15,"x_minihit":.08,"x_field":.14,"snipe":.2,"gat":.035,"slot":.015,"slotend":.04,"crit":.12,"slowmo":1.0,"shatter":.3,"burn":.4,"hurt":.3,"pickup":.05,"repel":.3,"coin":0.0,"jackpot":.5,"land":.1,"jump":.1,"tick":.05,"crash":.2}
const NAMES := ["zap","shot","mg","beep","mortar","rocket","emp","net","blast","boom","x_weld","x_rail","x_saw","x_throw","x_nade","x_buddy2","x_rail2","x_buddy","x_orbit","x_shot","x_mini","x_minihit","x_field","snipe","gat","regen","slot","slotend","crit","shatter","slowmo","slash","clank","crash","burn","hurt","pickup","tick","jump","land","drop","blueprint","built","turret","fuel","power","nope","night","dawn","over","repel","coin","jackpot","click"]
const PROG := [[57,60,64],[53,57,60],[55,60,64],[55,59,62],[57,60,64],[53,57,60],[55,59,62],[52,56,59]]
const ARP := [0,-1,2,-1,1,-1,2,1]
const MEL := [[76,0,0,0,74,0,72,0],[77,0,0,0,76,0,72,0],[79,0,0,76,0,0,72,76],[74,0,0,0,71,0,74,0],[76,0,0,0,81,0,79,0],[77,0,76,0,72,0,69,0],[74,0,76,0,79,0,76,0],[71,0,0,0,68,0,71,0]]

var streams := {}          # nama -> AudioStreamWAV
var music := {}            # "menu"/"day"/"night" -> AudioStreamWAV
var ready_audio := false
var players: Array = []
var pidx := 0
var mus_p := {}            # nama -> AudioStreamPlayer
var last := {}
var thread: Thread
var mode := 0              # 0 hening, 1 main, 2 menu
var dark := 0.0
var th_p: AudioStreamPlayer
var ch_p: AudioStreamPlayer
var th_on := false
var cf := 880.0
var bg := false
var _rs := 12345

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 14:
		var p = AudioStreamPlayer.new()
		add_child(p)
		players.append(p)
	for k in ["menu", "day", "night"]:
		var p2 = AudioStreamPlayer.new()
		p2.volume_db = -80
		add_child(p2)
		mus_p[k] = p2
	th_p = AudioStreamPlayer.new()
	add_child(th_p)
	ch_p = AudioStreamPlayer.new()
	add_child(ch_p)
	thread = Thread.new()
	thread.start(_render_all)
	apply_settings()

func _exit_tree() -> void:
	if thread != null and thread.is_started():
		thread.wait_to_finish()

# ---------- sintesis ----------
func _rnd() -> float:
	_rs = (_rs * 1664525 + 1013904223) & 0x7fffffff
	return float(_rs) / 2147483648.0

func _midi(n: float) -> float:
	return 440.0 * pow(2.0, (n - 69.0) / 12.0)

func _T(b: PackedFloat32Array, f: float, when: float, dur: float, type: String, vol: float, slide := 0.0, lp := 0.0, rate := R, wrap := false) -> void:
	var n = int((dur + .05) * rate)
	var s0 = int(when * rate)
	var len = b.size()
	vol = maxf(.0002, vol)
	var ph = 0.0
	var y = 0.0
	var a = 1.0
	if lp > 0:
		a = 1.0 - exp(-TAU * lp / rate)
	var ratio = 1.0
	if slide > 0:
		ratio = maxf(20.0, slide) / f
	for i in n:
		var t = float(i) / rate
		var idx = s0 + i
		if idx >= len:
			if wrap:
				idx = idx % len
			else:
				break
		var fr = f
		if slide > 0:
			fr = f * pow(ratio, minf(1.0, t / dur))
		ph += fr / rate
		var w = 0.0
		var pf = ph - floor(ph)
		match type:
			"sine": w = sin(ph * TAU)
			"square": w = 1.0 if pf < .5 else -1.0
			"sawtooth": w = 2.0 * pf - 1.0
			_: w = 4.0 * absf(pf - .5) - 1.0
		var env = 0.0
		if t < .01:
			env = .0001 * pow(vol / .0001, t / .01)
		elif t < dur:
			env = vol * pow(.0001 / vol, (t - .01) / maxf(.001, dur - .01))
		if lp > 0:
			y += a * (w - y)
			w = y
		b[idx] += w * env

func _N(b: PackedFloat32Array, when: float, dur: float, type: String, freq: float, vol: float, sweep := 0.0, rate := R, wrap := false) -> void:
	var n = int(dur * rate)
	var s0 = int(when * rate)
	var len = b.size()
	var low = 0.0
	var band = 0.0
	vol = maxf(.0002, vol)
	var ratio = 1.0
	if sweep > 0:
		ratio = maxf(40.0, sweep) / freq
	for i in n:
		var idx = s0 + i
		if idx >= len:
			if wrap:
				idx = idx % len
			else:
				break
		var t = float(i) / rate
		var f = freq
		if sweep > 0:
			f = freq * pow(ratio, t / dur)
		var F = minf(1.4, 2.0 * sin(PI * minf(f, rate * .45) / rate))
		var x = _rnd() * 2.0 - 1.0
		var high = x - low - band
		band += F * high
		low += F * band
		var o = low if type == "lowpass" else (high if type == "highpass" else band)
		b[idx] += o * vol * pow(.0001 / vol, t / dur)

func _to_wav(b: PackedFloat32Array, rate: int, gain: float, loop := false) -> AudioStreamWAV:
	var bytes = PackedByteArray()
	bytes.resize(b.size() * 2)
	for i in b.size():
		var v = tanh(b[i] * gain)
		bytes.encode_s16(i * 2, int(clampf(v, -1.0, 1.0) * 32000))
	var w = AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = rate
	w.stereo = false
	w.data = bytes
	if loop:
		w.loop_mode = AudioStreamWAV.LOOP_FORWARD
		w.loop_begin = 0
		w.loop_end = b.size()
	return w

func _sfx_buf(n: String) -> PackedFloat32Array:
	var b = PackedFloat32Array()
	b.resize(int(R * (2.2 if n == "slowmo" else 1.2)))
	var t = 0.0
	match n:
		"zap":
			_N(b, t, .09, 'bandpass', 2200, .16, 800)
			_T(b, 520, t, .1, 'square', .07, 180)
		"shot":
			_N(b, t, .07, 'highpass', 1800, .18, 600)
			_T(b, 220, t, .09, 'square', .08, 70)
		"mg":
			_N(b, t, .045, 'highpass', 2200, .1, 900)
			_T(b, 170, t, .05, 'square', .05, 80)
		"beep":
			_T(b, 1000, t, .07, 'square', .07)
		"mortar":
			_N(b, t, .18, 'lowpass', 700, .32, 120)
			_T(b, 140, t, .16, 'sine', .25, 60)
		"rocket":
			_N(b, t, .4, 'bandpass', 1500, .16, 500)
			_T(b, 300, t, .3, 'sawtooth', .05, 900)
		"emp":
			_T(b, 1400, t, .35, 'sine', .12, 120)
			_N(b, t, .3, 'highpass', 3000, .12, 600)
		"net":
			_N(b, t, .12, 'bandpass', 900, .14, 300)
			_T(b, 260, t, .08, 'triangle', .08, 160)
		"blast":
			_N(b, t, .6, 'lowpass', 3200, .42, 120)
			_T(b, 220, t, .5, 'sine', .32, 40)
			_T(b, 880, t, .18, 'square', .08, 1800)
			_N(b, t, .25, 'highpass', 4000, .16, 9000)
		"boom":
			_N(b, t, .35, 'lowpass', 1800, .34, 150)
			_T(b, 110, t, .3, 'sine', .3, 40)
		"x_weld":
			_N(b, t, .12, 'bandpass', 3600, .2, 1100)
			_T(b, 150, t, .12, 'sawtooth', .13, 430)
			_T(b, 1900, t, .05, 'square', .06, 900)
			_T(b, 95, t+.03, .08, 'square', .06, 200)
		"x_rail":
			_T(b, 180, t, .18, 'sawtooth', .12, 1600)
			_N(b, t+.12, .3, 'lowpass', 5200, .4, 180)
			_T(b, 900, t+.12, .3, 'sine', .28, 55)
			_T(b, 2600, t+.12, .12, 'square', .07, 420)
		"x_saw":
			_T(b, 110, t, .4, 'sawtooth', .15, 280)
			_T(b, 114, t, .4, 'sawtooth', .11, 285)
			_N(b, t, .36, 'bandpass', 800, .16, 3200)
			_T(b, 1500, t+.05, .2, 'triangle', .05, 500)
		"x_throw":
			_T(b, 280, t, .1, 'triangle', .2, 110)
			_N(b, t, .07, 'bandpass', 700, .16, 300)
			_T(b, 520, t+.05, .08, 'sine', .07, 260)
		"x_nade":
			_N(b, t, .55, 'lowpass', 2600, .55, 90)
			_T(b, 85, t, .45, 'sine', .55, 32)
			_T(b, 1300, t, .08, 'square', .06, 200)
			_N(b, t+.02, .2, 'highpass', 4000, .16, 1500)
		"x_buddy2":
			_T(b, 1100, t, .06, 'square', .1, 1900)
			_T(b, 1500, t+.03, .06, 'square', .09, 800)
			_T(b, 1900, t+.07, .07, 'triangle', .07, 900)
			_N(b, t, .05, 'highpass', 5000, .08, 8000)
		"x_rail2":
			_T(b, 1400, t, .2, 'sawtooth', .09, 260)
			_N(b, t, .18, 'highpass', 4500, .18, 900)
			_T(b, 520, t, .2, 'sine', .15, 90)
		"x_buddy":
			_T(b, 950, t, .07, 'square', .1, 1600)
			_T(b, 1400, t+.035, .06, 'triangle', .08, 700)
		"x_orbit":
			_T(b, 1150, t, .16, 'triangle', .14, 1700)
			_N(b, t, .09, 'highpass', 3500, .13, 6500)
			_T(b, 2300, t+.02, .1, 'sine', .05, 1800)
		"x_shot":
			_N(b, t, .13, 'bandpass', 1500, .45, 280)
			_T(b, 125, t, .13, 'square', .22, 48)
			_N(b, t+.015, .06, 'highpass', 3200, .22, 1000)
		"x_mini":
			_N(b, t, .4, 'bandpass', 1900, .22, 650)
			_T(b, 480, t, .32, 'sawtooth', .09, 1300)
			_T(b, 240, t, .2, 'square', .05, 520)
		"x_minihit":
			_N(b, t, .12, 'lowpass', 2400, .34, 280)
			_T(b, 230, t, .12, 'sine', .28, 85)
			_T(b, 900, t, .05, 'square', .05, 300)
		"x_field":
			_T(b, 105, t, .13, 'sawtooth', .11, 58)
			_N(b, t, .08, 'bandpass', 2700, .15, 5200)
			_T(b, 1400, t+.02, .05, 'square', .04, 700)
		"snipe":
			_N(b, t, .1, 'highpass', 3500, .4, 900)
			_T(b, 1300, t, .08, 'sawtooth', .2, 160)
			_T(b, 110, t+.01, .28, 'sine', .3, 40)
			_N(b, t+.06, .35, 'lowpass', 1200, .12, 200)
		"gat":
			_N(b, t, .03, 'bandpass', 2600, .2, 1400)
			_T(b, 210, t, .03, 'square', .07, 120)
		"regen":
			_T(b, 660, t, .14, 'sine', .1, 990)
			_T(b, 990, t+.09, .2, 'sine', .09, 1320)
			_T(b, 1320, t+.2, .3, 'triangle', .07, 1760)
			_N(b, t, .3, 'highpass', 6000, .04, 9000)
		"slot":
			_N(b, t, .02, 'highpass', 3000, .05, 6000)
			_T(b, 520, t, .025, 'square', .02, 330)
		"slotend":
			_N(b, t, .04, 'bandpass', 1800, .07, 900)
			_T(b, 210, t, .06, 'square', .035, 110)
			_T(b, 840, t, .02, 'square', .02, 400)
		"crit":
			_T(b, 1568, t, .09, 'square', .13)
			_T(b, 2093, t+.07, .2, 'square', .11)
			_N(b, t, .08, 'highpass', 5000, .15, 9000)
		"shatter":
			_N(b, t,.5,'lowpass',3800,.5,120)
			_T(b, 70,t,.4,'sine',.5,30)
			for i in 7:
				_T(b, 1800+randf()*2500,t+.02+i*.035,.05,'square',.06,500)
			_N(b, t+.03,.3,'highpass',5000,.2,1500)
		"slowmo":
			_T(b, 520, t, 1.6, 'sawtooth', .09, 70, 900)
			_T(b, 260, t, 1.8, 'sine', .12, 45)
		"slash":
			_N(b, t, .2, 'bandpass', 5200, .26, 700)
			_N(b, t+.02, .12, 'highpass', 6000, .14, 2500)
			_T(b, 2100, t+.03, .22, 'triangle', .07, 3200)
			_T(b, 330, t, .12, 'sawtooth', .09, 110)
			_T(b, 1400, t+.1, .12, 'sine', .05, 600)
		"clank":
			_T(b, 420, t, .12, 'square', .07, 300)
			_N(b, t, .05, 'bandpass', 3000, .1)
		"crash":
			_N(b, t, .5, 'lowpass', 2600, .4, 200)
			_T(b, 90, t, .4, 'sawtooth', .2, 40)
		"burn":
			_N(b, t, .2, 'lowpass', 900, .18, 300)
		"hurt":
			_T(b, 300, t, .28, 'sawtooth', .18, 90)
			_N(b, t, .2, 'bandpass', 900, .15)
		"pickup":
			_T(b, 880, t, .08, 'sine', .16)
			_T(b, 1320, t+.07, .14, 'sine', .16)
		"tick":
			_T(b, 1200, t, .05, 'sine', .08)
		"jump":
			_T(b, 260, t, .14, 'square', .06, 520)
		"land":
			_N(b, t, .08, 'lowpass', 500, .2)
			_T(b, 90, t, .1, 'sine', .18, 50)
		"drop":
			_N(b, t, .18, 'bandpass', 700, .08, 250)
		"blueprint":
			for i in 3:
				_T(b, [660,880,1100][i],t+i*.06,.12,'triangle',.14)
		"built":
			_T(b, 180, t, .2, 'square', .1, 90)
			_N(b, t, .12, 'bandpass', 2500, .14)
			_T(b, 1040, t+.12, .25, 'triangle', .12)
			_T(b, 1560, t+.12, .25, 'sine', .06)
		"turret":
			_T(b, 120,t,.25,'sawtooth',.18,60)
			_N(b, t,.15,'lowpass',1200,.2)
			for i in 4:
				_T(b, [523,659,784,1046][i],t+.15+i*.06,.18,'square',.07)
		"fuel":
			_N(b, t, .3, 'highpass', 2500, .12, 5000)
			_T(b, 330, t, .2, 'triangle', .12, 500)
		"power":
			for i in 5:
				_T(b, [392,523,659,784,1046][i],t+i*.07,.2,'square',.07)
		"nope":
			_T(b, 200, t, .12, 'square', .09)
			_T(b, 150, t+.1, .16, 'square', .09)
		"night":
			_T(b, 220, t, 1.4, 'sawtooth', .12, 110)
			_T(b, 223, t, 1.4, 'sawtooth', .1, 112)
		"dawn":
			for i in 4:
				_T(b, [440,554,659,880][i],t+i*.14,.5,'triangle',.12)
		"over":
			for i in 5:
				var f = [330,294,262,196,131][i]
				_T(b, f,t+i*.22,.45,'sawtooth',.12,f*.97)
		"repel":
			_T(b, 180, t, .3, 'sine', .2, 520)
			_N(b, t, .2, 'bandpass', 1200, .16, 3000)
			_T(b, 90, t, .2, 'square', .07, 40)
		"coin":
			_T(b, cf,t,.07,'square',.07)
			_T(b, cf*1.5,t+.04,.12,'sine',.1)
		"jackpot":
			for i in 5:
				var f = [784,988,1175,1568,1976][i]
				_T(b, f,t+i*.08,.35,'triangle',.14)
				_T(b, f*2,t+i*.08,.2,'sine',.05)
			_N(b, t+.35,.5,'highpass',5000,.1,9000)
		"click":
			_T(b, 700, t, .05, 'square', .06)
		_:
			pass
	return b

func _render_all() -> void:
	var out := {}
	for n in NAMES:
		out[n] = _to_wav(_sfx_buf(n), R, 3.0)
	# loop tipis untuk jetpack dan charge
	var tb = PackedFloat32Array()
	tb.resize(R)
	_N(tb, 0.0, 0.999, "bandpass", 650, .5, 0.0, R, true)
	var tw = _to_wav(tb, R, 6.0, true)
	out["_thrust"] = tw
	var cb = PackedFloat32Array()
	cb.resize(R)
	for i in R:
		var ph = float(i) / R * 200.0
		cb[i] = (4.0 * absf((ph - floor(ph)) - .5) - 1.0) * .15
	out["_charge"] = _to_wav(cb, R, 2.0, true)
	# musik
	out["menu"] = _render_menu()
	out["day"] = _render_play(0.0)
	out["night"] = _render_play(1.0)
	call_deferred("_done", out)

func _done(out: Dictionary) -> void:
	for k in out:
		if k in ["menu", "day", "night"]:
			music[k] = out[k]
		else:
			streams[k] = out[k]
	for k in music:
		mus_p[k].stream = music[k]
	th_p.stream = streams["_thrust"]
	th_p.volume_db = -80
	ch_p.stream = streams["_charge"]
	ch_p.volume_db = -80
	ready_audio = true
	_update_mode(true)

func _render_play(d: float) -> AudioStreamWAV:
	var bpm = 76.0 + d * 30.0
	var st = 60.0 / bpm / 2.0
	var b = PackedFloat32Array()
	b.resize(int(64 * st * RM))
	var aw = 1.0 - d
	for i in 64:
		var when = i * st
		var bar = (i >> 3) & 7
		var s = i & 7
		var ch = PROG[bar]
		var root = ch[0] - 24
		if s == 0 or s == 4:
			_T(b, _midi(root), when, .55, "sine", .26, 0.0, 0.0, RM, true)
		if d > .15:
			_T(b, _midi(root), when, .18, "sawtooth", .11 * d * (.7 if s % 2 else 1.0), 0.0, 260 + d * 200, RM, true)
		if aw > .12 and ARP[s] >= 0:
			_T(b, _midi(ch[ARP[s]] + 12), when, .5, "triangle", .12 * aw, 0.0, 0.0, RM, true)
		if s == 6 and (bar & 1) and aw > .3:
			_T(b, _midi(ch[2] + 24), when, 1.0, "sine", .06 * aw, 0.0, 0.0, RM, true)
		if d > .2:
			_N(b, when, .04, "highpass", 6500, .09 * d * (.6 if s % 2 else 1.0), 0.0, RM, true)
		if d > .4 and s == 0 and (bar & 1):
			_T(b, _midi(ch[0] + 13), when, .7, "square", .045 * d, 0.0, 900, RM, true)
	return _to_wav(b, RM, 1.6, true)

func _render_menu() -> AudioStreamWAV:
	var st = 60.0 / 92.0 / 2.0
	var b = PackedFloat32Array()
	b.resize(int(64 * st * RM))
	for i in 64:
		var when = i * st
		var bar = (i >> 3) & 7
		var s = i & 7
		var ch = PROG[bar]
		var root = ch[0] - 24
		if s == 0:
			for n in ch:
				_T(b, _midi(n), when, st * 8.2, "triangle", .055, 0.0, 1400, RM, true)
			_T(b, _midi(root + 12), when, st * 3.8, "sawtooth", .06, 0.0, 420, RM, true)
		if s == 4:
			_T(b, _midi(root + (7 if (bar & 1) else 12)), when, st * 3.5, "sawtooth", .05, 0.0, 380, RM, true)
		if s == 0 or s == 4:
			_T(b, 95, when, .16, "sine", .3, 45, 0.0, RM, true)
			_N(b, when, .05, "lowpass", 500, .12, 150, RM, true)
		if s == 4:
			_N(b, when, .12, "bandpass", 1900, .09, 900, RM, true)
		if s & 1:
			_N(b, when, .03, "highpass", 7000, .05, 0.0, RM, true)
		var m = MEL[bar][s]
		if m:
			_T(b, _midi(m), when, st * (1.2 if MEL[bar][(s + 1) & 7] else 3.6), "square", .065, 0.0, 2300, RM, true)
			_T(b, _midi(m - 12), when, st * 2, "triangle", .05, 0.0, 0.0, RM, true)
		if s == 2 or s == 6:
			_T(b, _midi(ch[(s >> 1) % 3] + 24), when, st * 1.6, "sine", .045, 0.0, 0.0, RM, true)
	return _to_wav(b, RM, 1.6, true)

# ---------- pemutaran ----------
func vol_lin() -> float:
	return float(Prof.settings.vol) / 8.0

func apply_settings() -> void:
	AudioServer.set_bus_volume_db(0, linear_to_db(maxf(.0001, vol_lin() * .9)))
	_update_mode(true)

func sfx(n: String) -> void:
	if not ready_audio or not Prof.settings.sfx or bg or vol_lin() <= 0:
		return
	if not streams.has(n):
		return
	var t = Time.get_ticks_msec() / 1000.0
	var lim: float = SFXLIM.get(n, 0.0)
	if last.has(n) and t - last[n] < lim:
		return
	last[n] = t
	var p: AudioStreamPlayer = players[pidx]
	pidx = (pidx + 1) % players.size()
	p.stream = streams[n]
	var wp = n.begins_with("x_") or n == "slash"
	p.volume_db = 5.0 if wp else 0.0
	if n == "coin":
		p.pitch_scale = cf / 880.0
	else:
		p.pitch_scale = 1.0
	p.play()

func set_mode(m: int, d: float) -> void:
	dark = d
	if m != mode:
		mode = m
		_update_mode(false)
	_mix()

func _update_mode(_force: bool) -> void:
	if not ready_audio:
		return
	var on: bool = Prof.settings.music and not bg and vol_lin() > 0
	for k in mus_p:
		var want: bool = on and ((k == "menu" and mode == 2) or (k != "menu" and mode == 1))
		var p: AudioStreamPlayer = mus_p[k]
		if want and not p.playing:
			p.play()
		elif not want and p.playing:
			p.stop()
	_mix()

func _mix() -> void:
	if not ready_audio:
		return
	var base = -9.0
	mus_p["menu"].volume_db = base
	var dn = clampf(dark, 0.0, 1.0)
	mus_p["day"].volume_db = base + linear_to_db(maxf(.001, 1.0 - dn))
	mus_p["night"].volume_db = base + linear_to_db(maxf(.001, dn))

func charge(p: float) -> void:
	if not ready_audio or not Prof.settings.sfx:
		return
	if p < 0:
		if ch_p.playing:
			ch_p.stop()
		return
	if not ch_p.playing:
		ch_p.volume_db = -14.0
		ch_p.play()
	ch_p.pitch_scale = (200.0 + p * 520.0) / 200.0

func thrust(on: bool) -> void:
	if not ready_audio or not Prof.settings.sfx:
		if th_p != null and th_p.playing:
			th_p.stop()
		return
	if on and not th_p.playing:
		th_p.volume_db = -8.0
		th_p.play()
	elif not on and th_p.playing:
		th_p.stop()
	th_on = on

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_WINDOW_FOCUS_OUT:
		bg = true
		_update_mode(true)
		AudioServer.set_bus_mute(0, true)
	elif what == NOTIFICATION_APPLICATION_RESUMED or what == NOTIFICATION_WM_WINDOW_FOCUS_IN:
		bg = false
		AudioServer.set_bus_mute(0, false)
		_update_mode(true)
