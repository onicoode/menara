extends Node
func _ready():
	var m = load("res://scenes/main.tscn").instantiate()
	m.name = "Main"
	add_child(m)
	for i in 30:
		await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png("res://tests/s_home.png")
	m.menus.show_hangar(false)
	for i in 10:
		await get_tree().process_frame
	m.menus.hg_sel = "katana"
	m.menus.hg_desc.visible = true
	m.menus.hangar_sync()
	for i in 10:
		await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png("res://tests/s_hangar.png")
	m.menus.show_towers()
	for i in 10:
		await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png("res://tests/s_tower.png")
	m.start(5)
	m.g.s.coins = 60
	m.g.s.m.x = 120.0
	for i in 60:
		await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png("res://tests/s_play.png")
	print("RENDER OK")
	get_tree().quit()
