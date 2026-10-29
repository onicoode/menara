extends Node
func _ready():
	var m = load("res://scenes/main.tscn").instantiate()
	m.name = "Main"
	add_child(m)
	await get_tree().process_frame
	m.start(5)
	var g = m.g
	await get_tree().process_frame
	# sentuhan geser kanan
	var e = InputEventScreenTouch.new(); e.index = 0; e.pressed = true; e.position = Vector2(100, 300)
	Input.parse_input_event(e)
	await get_tree().process_frame
	var d = InputEventScreenDrag.new(); d.index = 0; d.position = Vector2(140, 300); d.relative = Vector2(40, 0)
	Input.parse_input_event(d)
	for i in 30:
		await get_tree().process_frame
	print("INPUT gk=", g.gk, " x=", g.s.m.x)
	var e2 = InputEventScreenTouch.new(); e2.index = 0; e2.pressed = false; e2.position = Vector2(140, 300)
	Input.parse_input_event(e2)
	await get_tree().process_frame
	print("INPUT after gk=", g.gk)
	# dev panel
	m.dev_panel.open()
	await get_tree().process_frame
	m.dev_panel.tab = "tower"; m.dev_panel.render()
	await get_tree().process_frame
	m.dev_panel.tab = "g"; m.dev_panel.render()
	m.dev_panel.close()
	print("DEV OK paused=", g.paused)
	m.pause()
	print("PAUSE overlay=", m.menus.overlay.visible)
	get_tree().quit()
