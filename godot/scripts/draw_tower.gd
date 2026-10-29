extends "res://scripts/draw_base.gd"
## Gambar bagian 2: tower (badan, kepala, gaya per level), proyektil, senjata, slot. Port dari vt.js / vc.js.

const EFFW := {"tesla": 12, "laser": 14, "emp": 16, "rocket": 18}

func tower_body_col(t: Dictionary, lv: int):
	var c = D.TBODY.get(t.ty, D.TBODYG.get(t.ty))
	if c == null:
		return null
	return mixs(c, "#c8c8c8", minf(9.0, lv) * .045)

func draw_bullet(p: Dictionary) -> void:
	var a: float = p.get("a", 0.0)
	var ca = cos(a)
	var sn2 = sin(a)
	var sz: float = p.size
	var sh: String = p.get("shape", "dot")
	if sh == "dot":
		R(p.x - sz / 2, p.y - sz / 2, sz, sz, "#ffffff")
		return
	if sh == "bolt":
		line(p.x - ca * sz * 1.4, p.y - sn2 * sz * 1.4, p.x + ca * sz, p.y + sn2 * sz, "#ffffff")
		R(p.x - sz / 2, p.y - sz / 2, sz, sz, p.col)
		return
	ga = .35
	R(p.x - sz * 1.3, p.y - sz * 1.3, sz * 2.6, sz * 2.6, p.col)
	ga = 1.0
	R(p.x - sz, p.y - sz / 4, sz * 2, sz / 2, p.col); R(p.x - sz / 4, p.y - sz, sz / 2, sz * 2, p.col); R(p.x - sz / 2, p.y - sz / 2, sz, sz, "#ffffff")
	if sh == "star":
		var d = sz * .8
		R(p.x - d, p.y - d, 1.5, 1.5, p.col); R(p.x + d - 1.5, p.y - d, 1.5, 1.5, p.col); R(p.x - d, p.y + d - 1.5, 1.5, 1.5, p.col); R(p.x + d - 1.5, p.y + d - 1.5, 1.5, 1.5, p.col)

func draw_tower_style(t: Dictionary, x: float, B: float, ww: float, lv: int, myB: float) -> void:
	if lv < 2:
		return
	var ty: String = t.ty
	var ac = D.tier_col(ty, lv)
	var an: float = s.anim
	var half: float = minf(ww, EFFW.get(ty, ww)) / 2
	var top: float = myB + 3
	var bh: float = B - top
	var blink = int(an * 3 + t.i) % 2
	if bh < 7:
		return
	R(x - half - 2, B - 6, 1, 2, "#c9c2b0"); R(x + half + 1, B - 6, 1, 2, "#c9c2b0")
	if lv >= 3:
		R(x - half, B - rj(bh * .4), half * 2, 1, ac); R(x - half, B - rj(bh * .4) + 1, half * 2, 1, "rgba(0,0,0,.3)")
	if lv >= 4:
		for sd in [-1, 1]:
			var px: float = x - half - 3 if sd < 0 else x + half
			R(px, top + 3, 3, bh - 9, "#59606c"); R(px, top + 3, 3, 1, "#8a909b"); R(px + (0 if sd < 0 else 2), top + 4, 1, bh - 11, "rgba(0,0,0,.3)")
	if lv >= 5:
		R(x - half + 1, top + 2, 2, 1, ac if blink else "#2a3040"); R(x + half - 3, top + 2, 2, 1, "#2a3040" if blink else ac)
	if lv >= 6:
		line(x + half - 1, top, x + half - 1, top - 7, "#8a909b"); R(x + half - 2, top - 9, 3, 3, ac if blink else "#ffffff")
	if lv >= 7:
		R(x - half + 1, top + 4, 1, maxf(2.0, bh - 12), ac); R(x + half - 2, top + 4, 1, maxf(2.0, bh - 12), ac)
	if lv >= 8:
		for sd in [-1, 1]:
			var px: float = x - half - 6 if sd < 0 else x + half + 3
			R(px, top + 1, 3, 5, "#8a909b"); R(px, top + 1, 3, 1, "#c8cdd6"); R(px + 1, top + 3, 1, 1, ac)
	if lv >= 9:
		for sd in [-1, 1]:
			var px: float = x - half - 1 if sd < 0 else x + half - 2
			R(px, top - 4, 3, 5, "#ffd36b"); R(px, top - 4, 3, 1, "#fff2b0")
		R(x - 1, top - 5, 3, 4, "#ffd36b"); R(x - 1, top - 5, 3, 1, "#fff2b0")

func draw_barrels(t: Dictionary, x: float, my: float, lv: int) -> void:
	var ty: String = t.ty
	var fT: bool = ty == "f"
	var L: float = rj(D.TWL[lv] * (1.7 if ty == "sniper" else .85 if ty == "gatling" else 1.0)) - (2 if t.fl > 0 and not fT else 0)
	var ca = cos(t.ang)
	var sn2 = sin(t.ang)
	var ac = D.tier_col(ty, lv)
	R(x - 4, my - 1, 8, 4, "#4d525c"); R(x - 3, my - 3, 6, 3, "#6a707c")
	if lv >= 4:
		R(x - 6, my, 12, 3, "#59606c"); R(x - 6, my, 12, 1, "#8a909b")
	if lv >= 7:
		R(x - 7, my - 4, 14, 2, ac)
	var offs: Array = [-2.4, 0.0, 2.4] if ty == "gatling" else [0.0] if ty == "sniper" else [-3.0, 0.0, 3.0] if lv >= 7 else [-1.8, 1.8] if lv >= 3 else [0.0]
	var bc = "#3a2a26" if fT else "#3a4254" if lv >= 7 else "#363b46" if lv >= 4 else "#2d3038"
	for o in offs:
		var ox: float = -sn2 * o
		var oy: float = ca * o
		line(x + ox, my + oy, x + ox + ca * L, my + oy + sn2 * L, bc)
		if lv >= 5 and not fT:
			R(x + ox + ca * L - 1, my + oy + sn2 * L - 1, 2, 2, ac)
	if fT:
		R(x + ca * L - 1, my + sn2 * L - 1, 3, 3, "#ffd36b" if t.fl > 0 else "#ff7a2a"); R(x - 3, my - 5, 6, 2, "#c0651f")

func draw_tower_top(t: Dictionary, x: float, my: float, lv: int) -> void:
	var a: float = t.ang
	var ca = cos(a)
	var sn2 = sin(a)
	var fl: bool = t.fl > 0
	var an: float = s.anim
	match t.ty:
		"mortar":
			R(x - 6, my - 1, 12, 4, "#3e4230"); R(x - 6, my - 1, 12, 1, "#6a6e52")
			var ta = -PI / 2 + clampf(ca, -1.0, 1.0) * .55
			var tc = cos(ta)
			var ts = sin(ta)
			var L = 9 - (2 if fl else 0)
			for o in [-1.5, 0.0, 1.5]:
				line(x - ts * o, my + tc * o, x - ts * o + tc * L, my + tc * o + ts * L, "#2d3022")
			R(x + tc * L - 2, my + ts * L - 2, 4, 3, "#ffd36b" if fl else "#4a4e36")
		"rocket":
			R(x - 6, my - 6, 12, 8, "#4a3e34"); R(x - 6, my - 6, 12, 1, "#7a6a5a")
			for p in [[-4, -4], [1, -4], [-4, -1], [1, -1]]:
				R(x + p[0], my + p[1], 3, 2, "#1d2028")
				if t.cd < 1.2:
					R(x + p[0] + 1, my + p[1], 1, 1, "#ff5a4a")
			if fl:
				R(x - 2, my + 2, 4, 2, "#ffb347")
		"tesla":
			R(x - 2, my - 9, 4, 10, "#7a5a2a")
			for k in 3:
				R(x - 3, my - 8 + k * 3, 6, 1, "#c9a22a")
			R(x - 3, my - 14, 6, 5, "#b9c2cc"); R(x - 2, my - 13, 2, 2, "#e6ecff")
			if fl or int(an * 7 + t.i) % 5 == 0:
				R(x + 3, my - 14, 2, 1, "#c9a8ff"); R(x - 5, my - 12, 2, 1, "#c9a8ff")
		"laser":
			R(x - 4, my - 2, 8, 5, "#3e4048"); R(x - 4, my - 2, 8, 1, "#6a707c")
			line(x, my - 1, x + ca * 7, my - 1 + sn2 * 7, "#2d3038"); R(x + ca * 7 - 1, my - 1 + sn2 * 7 - 1, 3, 3, "#ffd0dc" if t.beam > 0 else "#ff4a6a")
			R(x - 1, my - 5, 3, 3, "#ff6a8a")
		"emp":
			R(x - 6, my - 1, 12, 2, "#9aa1ad"); R(x - 4, my - 3, 8, 2, "#7d838e"); R(x, my - 9, 1, 7, "#9aa1ad")
			var pc = ("#e6fbff" if int(an * 10) % 2 else "#9ad8ff") if t.cd < 1 else "#4a7a9a"
			R(x - 1, my - 12, 3, 3, pc)
		"net":
			R(x - 4, my - 2, 8, 4, "#4a4e3c")
			line(x, my, x + ca * 7, my + sn2 * 7, "#3a3e2c"); R(x + ca * 7 - 2, my + sn2 * 7 - 2, 4, 4, "#d8e0a0"); R(x + ca * 7 - 1, my + sn2 * 7 - 1, 2, 2, "#7a7e5a")
		"decoy":
			R(x - 1, my - 14, 2, 15, "#9aa1ad"); R(x - 3, my - 18, 6, 4, "#5a4a2a")
			var on: bool = t.hp > 0
			var bl = int(an * 3) % 2
			R(x - 2, my - 17, 4, 2, ("#ffd36b" if bl else "#ff9a3a") if on else "#3a2a1a")
			if t.dHit > 0:
				R(x - 3, my - 18, 6, 4, "#ffffff")
		"magnet":
			R(x - 6, my - 9, 3, 9, "#c83a3a"); R(x + 3, my - 9, 3, 9, "#c83a3a"); R(x - 6, my - 1, 12, 3, "#c83a3a"); R(x - 6, my - 1, 12, 1, "#ff7a7a")
			R(x - 6, my - 11, 3, 2, "#d0d6e2"); R(x + 3, my - 11, 3, 2, "#d0d6e2")
			var k = fmod(an * 3 + t.i, 1.0)
			R(x - 1, my - 11 + rj(k * 8), 2, 1, "#a9bccf")
		"repair":
			R(x - 6, my - 1, 12, 3, "#2e3e32"); R(x - 1, my - 7, 3, 7, "#7dff9a"); R(x - 3, my - 5, 7, 3, "#7dff9a")
			var bx: float = x + sin(an * 1.7 + t.i) * 6
			var by: float = my - 14 + sin(an * 3.1) * 2
			R(bx - 3, by, 7, 2, "#9aa1ad"); R(bx - 4, by - 2, 9, 1, "#59606c" if int(an * 20) % 2 else "#8e99a8"); R(bx, by + 2, 1, 1, "#7dff9a")
		"solar":
			var tilt = rj(clampf((sun.x - x) / 70.0, -1.0, 1.0) * 3)
			R(x - 1, my - 5, 2, 6, "#9aa1ad")
			for i in range(-8, 8):
				var yy: float = my - 6 - rj(tilt * i / 8.0)
				R(x + i, yy - 1, 1, 3, "#1d3a6a")
				if i % 4 == 0:
					R(x + i, yy - 1, 1, 3, "#5a8ad8")
			if sun.a > .2 and int(an * 2 + t.i) % 4 == 0:
				var gi = int(fmod(an * 5, 14.0)) - 7
				R(x + gi, my - 7 - rj(tilt * gi / 8.0), 2, 1, "#e6fbff")

## badan tower; mengembalikan y kepala tower
func draw_tower_body(t: Dictionary, x: float, B: float, hh: float, ww: float, lv: int, body) -> float:
	var top = B - hh
	var sr: bool = sun.x <= x
	match t.ty:
		"f":
			var tw = floorf(ww / 2) - 1
			for ox in [-floorf(ww / 2), 1.0]:
				R(x + ox, top + 2, tw, hh - 6, body); R(x + ox + 1, top + 1, tw - 2, 1, body); R(x + ox, top + 2, 1, hh - 6, "rgba(255,255,255,.18)"); R(x + ox + tw - 2, top + 2, 2, hh - 6, "rgba(0,0,0,.25)")
			var i = top + 6
			while i < B - 7:
				R(x - ww / 2, i, ww, 2, "#e0c040")
				var k = 0
				while k < ww:
					R(x - ww / 2 + k, i, 2, 2, "#2a2a2a")
					k += 4
				i += 7
			return B - hh - 3
		"mortar":
			var hb = rj(hh * .6)
			var tp = B - 4 - hb
			var r = 0
			var yy = B - 8
			while yy >= tp:
				var k = (r & 1) * 3 - 3
				while k < ww + 3:
					R(x - ww / 2 + k, yy, 5, 4, "#8a7a52" if (int((k + 9) / 6.0) + r) % 2 else "#77683f")
					k += 6
				R(x - ww / 2 - 1, yy + 3, ww + 2, 1, "#4a4028")
				r += 1
				yy -= 4
			return tp - 2
		"tesla":
			R(x - 3, top, 6, hh - 4, "#4a3a2e")
			var i = top + 2
			while i < B - 5:
				R(x - 4, i, 8, 2, "#c9803a" if int((i - top) / 3.0) % 2 else "#a8642a")
				i += 3
			R(x + 2 if sr else x - 4, top, 2, hh - 4, "rgba(0,0,0,.25)")
			return B - hh - 3
		"rocket":
			for p in [[-ww / 2, -ww / 2 + 4], [ww / 2 - 1, ww / 2 - 5], [-ww / 2 + 3, -ww / 2 + 6], [ww / 2 - 4, ww / 2 - 7]]:
				line(x + p[0], B - 4, x + p[1], top + 8, "#3a3f4a")
			line(x - ww / 2 + 3, B - 10, x + ww / 2 - 4, top + 12, "#2d3038"); line(x + ww / 2 - 4, B - 10, x - ww / 2 + 3, top + 12, "#2d3038")
			R(x - ww / 2 + 1, top + 6, ww - 2, 3, body); R(x - ww / 2 + 1, top + 6, ww - 2, 1, "rgba(255,255,255,.2)")
			return top + 5
		"laser":
			var n = hh - 4
			for i in int(n):
				var w = maxf(4.0, rj(ww * (.4 + .6 * i / n)))
				R(x - w / 2, top + i, w, 1, "#3a3440" if i % 5 == 0 else body)
			R(x - 1, top + 2, 2, n - 4, "#ff4a6a" if int(s.anim * 3 + t.i) % 3 else "#ff8aa0"); R(x + 1 if sr else x - 3, top + 4, 2, n - 6, "rgba(0,0,0,.22)")
			return B - hh - 3
		"emp":
			line(x - ww / 2 + 1, B - 4, x - 1, top + 4, "#6a707c"); line(x + ww / 2 - 1, B - 4, x + 1, top + 4, "#6a707c"); line(x, B - 4, x, top + 4, "#4a4f58")
			R(x - ww / 2 + 3, top + rj(hh * .55), ww - 6, 1, "#4a4f58"); R(x - 3, top, 6, 5, body); R(x - 3, top, 6, 1, "#9aa1ad")
			return top + 1
		"net":
			R(x - ww / 2, top, 2, hh - 4, body); R(x + ww / 2 - 2, top, 2, hh - 4, body); R(x - ww / 2, top, ww, 2, body)
			var i = top + 2
			while i < B - 6:
				line(x - ww / 2 + 2, i, x + ww / 2 - 2, i + 6, "#4a4e3c"); line(x + ww / 2 - 2, i, x - ww / 2 + 2, i + 6, "#4a4e3c")
				i += 7
			return B - hh - 3
		"decoy":
			R(x - ww / 2, B - 10, ww, 6, "#2a2a2a")
			var k = 0
			while k < ww:
				R(x - ww / 2 + k, B - 10, 2, 6, "#ffc75a")
				k += 4
			R(x - ww / 2, B - 10, ww, 1, "rgba(255,255,255,.25)")
			return B - 10
		"magnet":
			var hb = rj(hh * .5)
			var tp = B - 4 - hb
			R(x - ww / 2, tp, ww, hb, "#4a4f58"); R(x - ww / 2, tp, ww, 2, "#7d838e"); R(x - ww / 2, B - 6, ww, 2, "#3a3f48")
			var k = 2
			while k < ww - 1:
				R(x - ww / 2 + k, tp + 3, 1, 1, "#9aa1ad")
				k += 4
			R(x + ww / 2 - 4 if sr else x - ww / 2, tp + 2, 4, hb - 2, "rgba(0,0,0,.22)")
			return tp - 2
		"repair":
			var hb = rj(hh * .6)
			var tp = B - 4 - hb
			R(x - ww / 2, tp, ww, hb, body)
			for i in 5:
				R(x - ww / 2 + i * 2, tp - 5 + i, ww - i * 4, 1, "#3e5244")
			R(x - 3, B - 4 - minf(8.0, hb - 2), 6, minf(8.0, hb - 2), "#1d2620"); R(x - ww / 2 + 2, tp + 2, 4, 4, "#e6fbff"); R(x - ww / 2 + 3, tp + 2, 2, 4, "#3fbf62"); R(x - ww / 2 + 2, tp + 3, 4, 2, "#3fbf62")
			return tp - 6
		"solar":
			R(x - 6, B - 10, 12, 6, "#3a4a5a"); R(x - 6, B - 10, 12, 1, "#6a7a8a")
			var k = -4
			while k < 5:
				R(x + k, B - 8, 1, 3, "#7dff9a")
				k += 3
			return B - 12
		_:
			R(x - ww / 2, B - hh, ww, hh - 4, body); R(x - ww / 2, B - hh, ww, 2, "#a8a49c")
			var sw = ceil(ww * .38)
			var hw = ceil(ww * .25)
			H(x + ww / 2 - sw if sr else x - ww / 2, B - hh + 2, sw, hh - 6, "#000", 5)
			H(x - ww / 2 if sr else x + ww / 2 - hw, B - hh + 2, hw, hh - 6, "#fff", 3)
			var i = 6
			while i < hh - 4:
				R(x - ww / 2, B - hh + i, ww, 1, "#4a4742")
				i += 5
			if lv >= 3:
				R(x - ww / 2 - 1, B - hh + 4, 1, hh - 8, "#5d5953"); R(x + ww / 2, B - hh + 4, 1, hh - 8, "#5d5953")
			if lv >= 4:
				R(x - ww / 2, B - hh + 8, ww, 2, "#e0782a")
			if lv >= 5:
				R(x - ww / 2, B - hh + 13, ww, 2, "#e0782a")
			return B - hh - 3

func draw_ruin(t: Dictionary) -> void:
	var x: float = t.x
	var B: float = t.y
	var rl: int = t.ruin.lv
	var h = rj(D.TWH[rl] * .5) + 4
	var w: float = D.TWW[rl]
	var sd: int = t.i * 7
	R(x - w / 2 - 3, B - 4, w + 6, 4, "#6a5c40"); R(x - w / 2 - 3, B - 4, w + 6, 1, "#7d6d4c"); R(x - w / 2 - 3, B - 1, w + 6, 1, "#3f3626")
	for p in [[-w / 2 + 1, h], [-1.0, rj(h * .55)], [w / 2 - 3, rj(h * .8)]]:
		R(x + p[0], B - 4 - p[1], 2, p[1], "#59606c"); R(x + p[0], B - 4 - p[1], 2, 1, "#8a5a3a"); R(x + p[0] + 1, B - 4 - p[1], 1, p[1], "rgba(255,255,255,.12)")
	line(x - w / 2 + 2, B - 5, x + 3, B - 3 - h, "#3d4048"); line(x + w / 2 - 2, B - 5, x + 2, B - 3 - rj(h * .7), "#4a4f58")
	R(x - w / 2, B - 9, 5, 5, "#5d5953"); R(x - w / 2 + 1, B - 9, 3, 1, "#7a766f"); R(x + w / 2 - 4, B - 8, 5, 4, "#4a4742"); R(x + w / 2 - 3, B - 8, 2, 1, "#6a665f")
	R(x - 3, B - 7, 3, 3, "#77736d"); R(x + 1 + (sd % 3), B - 6, 2, 2, "#4d525c")
	H(x - w / 2 - 3, B - 4, w + 6, 3, "#000", 6)
	if int(s.anim * 3 + t.i) % 4 == 0:
		R(x + (sd % 9) - 4, B - 6, 1, 1, "#ff7a2a")

func draw_towers() -> void:
	for t in s.towers:
		if t.lv < 1:
			if t.ruin != null and slot_active(t):
				draw_ruin(t)
			continue
		if t.au and not tower_busy(t) and near_tower(t):
			var acy: float = t.y - D.TWH[t.lv] / 2.0 - 3
			var R0: float = D.SL.r[t.au]
			ga = .15 * s.m.stillA
			ci.draw_circle(Vector2(t.x, acy - cam_y), R0, Color(.67, .51, 1.0, ga))
			ga = .75 * s.m.stillA
			px_circle(t.x, acy, rj(R0 + sin(s.anim * 2 + t.i) * 1.5), "#c9a8ff", 3, 5, s.anim * 12)
			ga = 1.0
		var B: float = t.y - (rj(sin((1 - t.pop / .5) * PI) * 5) if t.pop > 0 else 0.0)
		var x: float = t.x
		var lv: int = t.lv
		var hh: float = D.TWH[lv]
		var ww: float = D.TWW[lv]
		var my = B - hh - 3
		var fT: bool = t.ty == "f"
		var bz = tower_busy(t)
		if bz:
			ga = .5
		var body = tower_body_col(t, lv)
		if body == null:
			body = (["", "#6e4a40", "#7a5046", "#86564a", "#905c4e", "#9c6252", "#a86a58"] if fT else ["", "#6b6762", "#77736d", "#85817a", "#8d8982", "#98948c", "#a29e96"])[mini(lv, 6)]
		R(x - ww / 2 - 3, B - 4, ww + 6, 4, "#7a6a4a"); R(x - ww / 2 - 3, B - 4, ww + 6, 1, "#94825a")
		var myB = draw_tower_body(t, x, B, hh, ww, lv, body)
		if lv >= 6 and int(s.anim * 4) % 2:
			R(x + ww / 2 - 2, B - hh + 2, 1, 1, "#ff4040")
		var special: bool = D.TBODY.has(t.ty)
		if special:
			draw_tower_style(t, x, B, ww, lv, myB)
			draw_tower_top(t, x, myB, lv)
		else:
			draw_tower_style(t, x, B, ww, lv, myB)
			draw_barrels(t, x, my, lv)
		ga = 1.0
		var mh = tower_max_hp(t)
		if t.hp < mh:
			bar(x, (myB - 22) if special else (B - hh - (22 if D.TBODY.has(t.ty) else 14)), 18, maxf(0.0, t.hp) / mh, "#ff5a4a" if t.hp < mh * .35 else "#7dff9a")
		if t.hHit > 0:
			ga = .5
			R(x - ww / 2, B - hh, ww, hh - 4, "#ffffff")
			ga = 1.0
		if t.sh and t.shHit > 0:
			ga = qa(t.shHit * 3)
			px_circle(x, B - hh / 2 - 3, D.SH.r[t.sh], "#8ff0ff")
			px_circle(x, B - hh / 2 - 3, D.SH.r[t.sh] + 1, "#8ff0ff")
			ga = 1.0
		elif t.sh and not t.brk and near_tower(t):
			ga = .4 * s.m.stillA
			px_circle(x, B - hh / 2 - 3, D.SH.r[t.sh], "#8ff0ff", 2, 4, s.anim * 6)
			ga = 1.0

func draw_tower_bp(bp: Dictionary) -> void:
	var x: float = bp.x
	var B: float = bp.top
	var Hh: float = (D.TWH[s.towers[bp.slot].lv] + 6) if bp.kind == "tup" else (D.TWH[bp.rl] + 6) if bp.kind == "rebuild" else 22.0
	ga = .5
	R(x - 12, B - Hh, 24, Hh, "#3a7f9a")
	var i = 0
	while i < 24:
		R(x - 12 + i, B - Hh, 2, Hh, "#8ff0ff")
		i += 4
	ga = 1.0
	outline(x - 12, B - Hh, 24, Hh, "#8ff0ff")
	R(x - 11, B - Hh + 1 + floorf(fmod(s.anim * 26, Hh - 2)), 22, 1, "#e6fbff")
	bar(x, B + (9 if bp.top < GW else 6), 22, clampf(bp.prog, 0.0, 1.0), "#8ff0ff")

func draw_slots() -> void:
	var pulse = .45 + .25 * sin(s.anim * 4)
	var can: bool = s.coins >= tower_cost("g")
	var opts = ctx_options()
	var near = null
	for o in opts:
		if o.has("tw"):
			near = o
			break
	var hold_opt = null
	if card_hold != null and not card_hold.done:
		for o in opts:
			if o.key == card_hold.key:
				hold_opt = o
	for t in s.towers:
		if not slot_active(t):
			continue
		var x: float = t.x
		var B: float = t.y
		var on: bool = near != null and near.tw.i == t.i
		if t.lv < 1:
			if tower_busy(t) or t.ruin != null:
				continue
			var nd = hyp(s.m.x - x, (s.m.y - 10) - (B - 10))
			if nd > 56:
				continue
			var fade = 1.0 if nd < 36 else .5 if nd < 46 else .25
			var colr = "#8ff0ff" if can else "#8a96a8"
			ga = qa((.95 if on else (pulse if can else .35)) * fade)
			outline(x - 13, B - 20, 26, 20, colr); R(x - 1, B - 14, 3, 9, colr); R(x - 4, B - 11, 9, 3, colr)
			if on:
				ga = .25
				R(x - 13, B - 20, 26, 20, colr)
			ga = 1.0
			continue
		var hh: float = D.TWH[t.lv]
		var tmax = Dev.tw_max(t.ty)
		var up: bool = t.lv < tmax and t.lv < tower_cap() and s.coins >= Dev.tw_up_cost(t.ty, t.lv)
		var pc = "#7dff9a" if (up and int(s.anim * 3) % 2) else "#ffd36b"
		for i in tmax:
			R(x - (tmax * 4 - 1) / 2.0 + i * 4, B + (2 if t.pl else 5), 3, 3, pc if i < t.lv else "#3a3f4a")
		if t.sh:
			for i in D.SH.max:
				R(x - (D.SH.max * 4 - 1) / 2.0 + i * 4, B + (2 if t.pl else 5) + 4, 3, 2, ("#8a4a4a" if t.brk else "#5ad1e6") if i < t.sh else "#2a3340")
		if t.fl > 0:
			var L: float = D.TWL[t.lv] + 2
			R(x + cos(t.ang) * L - 2, B - hh - 3 + sin(t.ang) * L - 2, 4, 4, "#fff3b0")
		if on:
			ga = .25
			R(x - 12, B - hh - 4, 24, hh + 4, "#8ff0ff")
			ga = 1.0
	if near != null and near.kind != "hub" and near.state != "max" and near.state != "busy" and near.tw.ruin == null:
		var tw: Dictionary = near.tw
		var lv: int = mini(D.TW.max, tw.lv + 1)
		var cx: float = tw.x
		var cy: float = tw.y - (D.TWH[tw.lv] if tw.lv else 12) - 3
		for o in opts:
			if not o.has("tw") or o.tw.i != tw.i or o.kind == "hub" or o.state == "max" or o.state == "busy":
				continue
			var Y: Dictionary = D.TY[o.get("ty", tw.ty if tw.lv else "g")]
			ga = (.75 if hold_opt != null and hold_opt.key == o.key else .5) * s.m.stillA
			var rr: float = D.SH.r[mini(D.SH.max, tw.sh + 1)] if o.has("shield") else D.SL.r[mini(D.SL.max, tw.au + 1)] if o.has("aura") else Y.rng[lv]
			var cl = "#5ad1e6" if o.has("shield") else "#c58aff" if o.has("aura") else Y.col
			px_circle(cx, cy, rr, cl, 3, 4, 0)
		ga = 1.0

# ---------- proyektil dan efek tempur ----------
func draw_combat() -> void:
	var m: Dictionary = s.m
	for b in s.beams:
		ga = qa(b.l / .4)
		line(b.x1, b.y1, b.x2, b.y2, b.c)
	ga = 1.0
	for t in s.towers:
		if t.ty != "laser" or t.beam <= 0 or t.tgt == null or tower_busy(t):
			continue
		var my: float = t.y - D.TWH[t.lv] - 4
		var sx: float = t.x + cos(t.ang) * 7
		var sy: float = my + sin(t.ang) * 7
		var bc = D.tier_col("laser", t.lv)
		line(sx, sy, t.tgt.x, t.tgt.y, bc.lerp(Color.WHITE, .4) if t.beam > 2.2 else bc)
		if t.lv >= 4:
			line(sx, sy - 1, t.tgt.x, t.tgt.y - 1, bc); line(sx, sy + 1, t.tgt.x, t.tgt.y + 1, bc)
		if t.lv >= 7:
			line(sx - 1, sy, t.tgt.x - 1, t.tgt.y, bc); line(sx + 1, sy, t.tgt.x + 1, t.tgt.y, bc)
		line(sx, sy, t.tgt.x, t.tgt.y, "#ffe0e8")
	for p in s.shells:
		var k: float = p.t / p.T
		var x: float = p.x0 + (p.x1 - p.x0) * k
		var y: float = p.y0 + (p.y1 - p.y0) * k - sin(PI * k) * p.h
		var sz: float = 4 + floorf(p.lv / 3.0)
		var hc = D.tier_col("mortar", p.lv)
		R(x - sz / 2, y - sz / 2, sz, sz, "#2a2c22"); R(x - sz / 2 + 1, y - sz / 2 + 1, sz - 2, sz - 2, hc)
		if p.lv >= 5:
			ga = .4
			R(x - sz, y - sz, sz * 2, sz * 2, hc)
			ga = 1.0
		if k > .6:
			ga = .5
			R(p.x1 - 3, p.y1, 6, 1, "#ff5a4a")
			ga = 1.0
	for p in s.missiles:
		var a = atan2(p.vy, p.vx)
		var ca = cos(a)
		var sn2 = sin(a)
		var tl: int = p.tlv
		var L: float = 3.0 if p.small else 5 + tl * .5
		var hc = D.tier_col("rocket", tl) if tl else Color("#ff5a4a")
		line(p.x - ca * L, p.y - sn2 * L, p.x, p.y, "#d0d6e2" if p.small else "#e6ecff")
		if tl >= 4:
			line(p.x - ca * L - sn2, p.y - sn2 * L + ca, p.x - sn2, p.y + ca, "#e6ecff")
		R(p.x - 1, p.y - 1, 2 + (1 if tl >= 7 else 0), 2 + (1 if tl >= 7 else 0), hc)
		R(p.x - ca * (L + 2) - 1, p.y - sn2 * (L + 2) - 1, 2 + (1 if tl >= 5 else 0), 2 + (1 if tl >= 5 else 0), "#ffd36b" if int(s.anim * 30) % 2 else hc)
	for p in s.nets:
		var r = rj(p.r)
		var nc = D.tier_col("net", p.lv)
		var i = -r
		while i <= r:
			R(p.x + i, p.y - r, 1, r * 2 + 1, nc); R(p.x - r, p.y + i, r * 2 + 1, 1, nc)
			i += 3
	for p in s.bul:
		R(p.x - 1, p.y - 1, 2, 2, p.get("c", "#ffe08a"))
	for r in s.rails:
		ga = qa(r.l / .3)
		line(r.x1, r.y1, r.x2, r.y2, "#5ad1e6")
		line(r.x1, r.y1, r.x2, r.y2, "#e6fbff")
	ga = 1.0
	for w in s.saws:
		var k = int(w.spin) % 2
		R(w.x - 3, w.y - 3, 6, 6, "#b9c2cc"); R(w.x - 4, w.y - 2, 8, 4, "#b9c2cc"); R(w.x - 1, w.y - 1, 2, 2, "#59606c")
		if k:
			R(w.x - 4, w.y - 4, 1, 1, "#ffffff"); R(w.x + 3, w.y + 3, 1, 1, "#ffffff")
		else:
			R(w.x + 3, w.y - 4, 1, 1, "#ffffff"); R(w.x - 4, w.y + 3, 1, 1, "#ffffff")
	for g in s.nades:
		R(g.x - 2, g.y - 2, 4, 4, "#4a5a3a"); R(g.x - 1, g.y - 1, 2, 2, "#ff5a4a" if (g.stuck != null and int(g.t * 14) % 2) else "#9dffb0")
	for b in s.buddies:
		var f = int(s.anim * 30) % 2
		var d: int = b.dir
		R(b.x - 3, b.y - 1, 7, 3, "#5a3a8a"); R(b.x - 2, b.y - 2, 5, 1, "#8a6ac8"); R(b.x - 5, b.y - 3, 4, 1, "#c9d6e6" if f else "#59606c"); R(b.x + 2, b.y - 3, 4, 1, "#59606c" if f else "#c9d6e6"); R(b.x + (1 if d > 0 else -2), b.y, 2, 1, "#c58aff")
	if s.wp.orbit:
		var n: int = int(D.PWD.orbit.n[s.wp.orbit])
		for i in n:
			var p = orbit_pos(i, n)
			R(p.x - 3, p.y - 2, 7, 5, "#8ff0ff"); R(p.x - 2, p.y - 3, 5, 7, "#8ff0ff"); R(p.x - 2, p.y - 2, 5, 5, "#e6ecff"); R(p.x - 1, p.y - 1, 2, 2, "#ffffff")
	for q in s.slash:
		if q.t < 0:
			continue
		var k: float = q.t / q.l
		var head = minf(1.0, k * 1.6)
		var n = maxi(8, int(rj(q.r * .9)))
		var span = 2.9
		for j in n + 1:
			var u = float(j) / n
			if u > head:
				break
			var an: float = q.a + q.sd * (-span / 2 + span * u)
			var age = head - u
			var fade: float = (1 - k * .7) * (.25 if age > .55 else .55 if age > .3 else 1.0)
			var th = maxi(1, int(rj(2 + 5 * sin(PI * u) * (1 - age))))
			ga = fade
			for b in th:
				var rr: float = q.r + 2 - b
				R(q.x + cos(an) * rr - 1, q.y + sin(an) * rr - 1, 2, 2, "#ffffff" if b <= 1 else "#bff4ff" if b < 3 else "#5ad1e6")
		ga = 1.0
		var an2: float = q.a + q.sd * (-span / 2 + span * head)
		var c1 = cos(an2)
		var s1 = sin(an2)
		line(q.x + c1 * (q.r - 12), q.y + s1 * (q.r - 12), q.x + c1 * (q.r + 4), q.y + s1 * (q.r + 4), "#ffffff")
		line(q.x + c1 * (q.r - 4), q.y + s1 * (q.r - 4), q.x + c1 * (q.r + 4), q.y + s1 * (q.r + 4), "#8ff0ff")
		R(q.x + c1 * (q.r + 4) - 1, q.y + s1 * (q.r + 4) - 1, 3, 3, "#ffffff")
	for q in s.slashMk:
		var k: float = q.t / q.l
		ga = 1 - k
		var L = 1 + k * .8
		line(q.x - q.dx * L, q.y - q.dy * L, q.x + q.dx * L, q.y + q.dy * L, "#ffffff")
		ga = (1 - k) * .6
		line(q.x - q.dx * L * .6, q.y - q.dy * L * .6 + 1, q.x + q.dx * L * .6, q.y + q.dy * L * .6 + 1, "#8ff0ff")
	ga = 1.0
	for d in s.drones:
		var y: float = d.y + rj(sin(d.ph * 3))
		if d.net > 0:
			var i = -6
			while i <= 6:
				R(d.x + i, y - 6, 1, 13, "#d8e0a0"); R(d.x - 6, y + i, 13, 1, "#d8e0a0")
				i += 3
		if d.burn > 0:
			var fh = maxi(3, int(rj(d.h * .5)))
			var tt = int(s.anim * 14 + d.ph * 3)
			for i in range(-1, 2):
				var hh2 = 2 + ((tt + i * 2) % 3 + 3) % 3 * maxi(1, fh / 3)
				R(d.x + i * d.w / 4 - 1, y - d.h / 2 - hh2, 3, hh2, "#ff5a1a"); R(d.x + i * d.w / 4, y - d.h / 2 - hh2 + 1, 1, maxf(1.0, hh2 - 2.0), "#ffd36b")
			if tt % 2:
				ga = .35
				R(d.x - d.w / 2, y - d.h / 2, d.w, d.h, "#ff7a2a")
				ga = 1.0
		if d.shock > 0:
			var sd2 = int(s.anim * 20 + d.ph * 7)
			for a in 3:
				var px: float = d.x + (_rg(sd2, a) - .5) * d.w * .6
				var py: float = y + (_rg(sd2, a + 5) - .5) * d.h * .6
				var ang = _rg(sd2, a + 9) * 6.283
				for j in 4:
					var nx: float = px + cos(ang + (_rg(sd2, a * 4 + j) - .5) * 1.8) * 5
					var ny: float = py + sin(ang + (_rg(sd2, a * 4 + j + 20) - .5) * 1.8) * 5
					line(px, py, nx, ny, "#e6fbff" if j % 2 else "#9ad8ff")
					px = nx
					py = ny
			if sd2 % 2:
				ga = .4
				R(d.x - d.w / 2 - 1, y - d.h / 2 - 1, d.w + 2, d.h + 2, "#c9a8ff")
				ga = 1.0
			for i in 3:
				var a: float = s.anim * 9 + i * 2.094
				R(d.x + cos(a) * (d.w / 2 + 1) - 1, y - d.h / 2 - 5 + sin(a) * 2, 2, 2, "#ffe08a" if i % 2 else "#e6fbff")
		if d.stun > 0 and int(s.anim * 12 + d.ph) % 2:
			R(d.x - d.w / 2 - 2, y - 3, 2, 1, "#9ad8ff"); R(d.x + d.w / 2, y + 1, 2, 1, "#9ad8ff"); R(d.x - 1, y - 7, 1, 2, "#e6fbff")

func _rg(sd: int, i: int) -> float:
	var v = sin((sd + i * 17.3) * 12.9898) * 43758.5453
	return v - floorf(v)

func draw_shots() -> void:
	for p in s.shots:
		var a: float = p.a
		var ca = cos(a)
		var sn2 = sin(a)
		line(p.x - ca * p.trail, p.y - sn2 * p.trail, p.x, p.y, p.col)
		draw_bullet(p)
	for p in s.eshots:
		var a = atan2(p.ty - p.y, p.tx - p.x)
		R(p.x - 1, p.y - 1, 2, 2, "#ff6a4a"); R(p.x - cos(a) * 3, p.y - sin(a) * 3, 1, 1, "#ffb08a")
	for p in s.slugs:
		var L = hyp(p.vx, p.vy)
		var ux: float = p.vx / L
		var uy: float = p.vy / L
		line(p.x - ux * 22, p.y - uy * 22, p.x, p.y, "#5ad1e6"); line(p.x - ux * 10, p.y - uy * 10, p.x, p.y, "#e6fbff")
		R(p.x - 1.5, p.y - 1.5, 3, 3, "#ffffff")

func draw_player_ranges() -> void:
	var m: Dictionary = s.m
	var A: float = m.stillA
	if A <= .02:
		return
	var cx: float = m.x
	var cy: float = m.y - 10
	var W2: Dictionary = D.WEAP[s.weap]
	var rings: Array = [[W2.r[s.mlv], MAINC[s.mlv]]]
	if s.wp.shot:
		rings.append([D.PWD.shot.rng[s.wp.shot], "#ffe08a"])
	if s.wp.mini:
		rings.append([D.PWD.mini.rng[s.wp.mini], "#ffb347"])
	if s.wp.field:
		rings.append([D.PWD.field.r[s.wp.field], "#9ad8ff"])
	if s.wp.katana:
		rings.append([D.PWD.katana.r[s.wp.katana], "#e6ecff"])
	for rc in rings:
		ga = .5 * A
		px_circle(cx, cy, rc[0], rc[1], 3, 5, s.anim * 8)
	ga = 1.0
