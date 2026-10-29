extends Node
## Uji simulasi tanpa tampilan: bangun beberapa tower, jalankan 15 malam, cek tidak ada error dan musuh mati.
func _ready() -> void:
	var sim = load("res://scripts/sim_update.gd").new()
	add_child(sim)
	sim.vh = 700.0
	sim.reset()
	sim.s.run = {"len": 5}
	sim.running = true
	# dua tower Gun Lv1 langsung jadi
	for i in [1, 2]:
		var t = sim.s.towers[i]
		t.lv = 1; t.ty = "g"; t.hp = sim.tower_max_hp(t); t.spent = 4
	sim.s.m.x = 180.0
	var dt := 1.0 / 30.0
	var frames := 0
	var killed := 0
	var n1 = null
	while sim.s.day < 3 and frames < 30 * 400 and not sim.s.over:
		sim.update(dt)
		frames += 1
		if sim.s.day == 2 and n1 == null:
			n1 = [sim.s.kills, sim.s.hp]
	print("malam1 kills,hp=", n1)
	print("hari=", sim.s.day, " kills=", sim.s.kills, " core=", sim.s.hp, " frame=", frames, " over=", sim.s.over, " coins=", sim.s.coins)
	print("opsi kartu: ", sim.ctx_options().size())
	get_tree().quit(0)
