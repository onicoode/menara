extends Node
## Cek data.gd == balance.json (dump dari game HTML5). Jalankan: godot --headless --path godot res://tests/selftest.tscn
func _ready() -> void:
	var D = get_node("/root/D")
	var B = get_node("/root/Balance").data
	var bad := 0
	for id in B.tower.stats:
		for k in B.tower.stats[id]:
			var a = B.tower.stats[id][k]
			var b = D.TY[id][k]
			if a is Array:
				for i in a.size():
					if absf(float(a[i]) - float(b[i])) > 1e-6:
						print("BEDA tower ", id, ".", k, "[", i, "] ", a[i], " vs ", b[i]); bad += 1
	for id in B.senjata_utama:
		for k in B.senjata_utama[id]:
			var a = B.senjata_utama[id][k]
			if a is Array:
				for i in a.size():
					if absf(float(a[i]) - float(D.WEAP[id][k][i])) > 1e-6:
						print("BEDA weap ", id, ".", k, "[", i, "]"); bad += 1
	for id in B.senjata_pasif:
		for k in B.senjata_pasif[id]:
			var a = B.senjata_pasif[id][k]
			if a is Array:
				for i in a.size():
					if absf(float(a[i]) - float(D.PWD[id][k][i])) > 1e-6:
						print("BEDA pwd ", id, ".", k, "[", i, "]"); bad += 1
	for i in B.malam.size():
		var w = D.wave_info(i + 1)
		for k in ["n", "hpm", "spm", "dmm", "hv"]:
			if absf(float(B.malam[i][k]) - float(w[k])) > 1e-6:
				print("BEDA malam ", i + 1, " ", k, " ", B.malam[i][k], " vs ", w[k]); bad += 1
		if B.malam[i].boss != w.boss:
			print("BEDA boss ", i + 1); bad += 1
	print("SELFTEST ", "OK" if bad == 0 else "GAGAL %d" % bad)
	get_tree().quit(1 if bad else 0)
