extends Node
func _ready():
	var m = load("res://scenes/main.tscn").instantiate()
	add_child(m)
	await get_tree().process_frame
	m.start_run(5)
	m.s.coins = 60
	var tys = ["g", "mortar", "tesla", "laser", "rocket", "f"]
	for i in 6:
		var t = m.s.towers[i]
		t.ty = tys[i]
		t.lv = 3 + i % 3
		t.hp = m.tower_max_hp(t)
	m.s.t = 52.0
	m.s.m.x = 120.0
	for i in 400:
		await get_tree().process_frame
		if i == 80:
			for k in 6:
				m.spawn_drone("s")
	var img = get_viewport().get_texture().get_image()
	img.save_png("res://tests/shot2.png")
	print("RENDER OK day=", m.s.day, " t=", m.s.t, " drones=", m.s.drones.size())
	get_tree().quit()
