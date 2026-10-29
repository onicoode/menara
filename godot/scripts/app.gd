extends Node
## Akar aplikasi: merangkai game, HUD, menu, dev panel dan alur layar.
var g
var hud
var menus
var dev_panel
var ui: CanvasLayer
var ended := false

func _ready() -> void:
	UK.fonts()
	get_tree().set_auto_accept_quit(false)
	get_window().min_size = Vector2i(180, 320)
	g = load("res://scripts/game.gd").new()
	g.name = "Game"
	add_child(g)
	ui = CanvasLayer.new()
	ui.layer = 10
	add_child(ui)
	var root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = UK.theme()
	ui.add_child(root)
	hud = load("res://scripts/hud.gd").new()
	root.add_child(hud)
	hud.setup(g)
	menus = load("res://scripts/menus.gd").new()
	root.add_child(menus)
	menus.setup(g)
	dev_panel = load("res://scripts/devpanel.gd").new()
	dev_panel.name = "DevPanel"
	root.add_child(dev_panel)
	dev_panel.setup(g, self)
	g.ui_over = hud.over_ui
	g.game_over.connect(_on_over)
	g.game_won.connect(_on_win)
	g.run_ended.connect(_on_run_ended)
	hud.pause_pressed.connect(pause)
	menus.start_run.connect(start)
	menus.continue_run.connect(_continue)
	menus.resume_game.connect(func(): g.paused = false)
	menus.surrender.connect(func(): g.surrender())
	menus.save_exit.connect(_save_exit)
	menus.quit_game.connect(func(): _quit())
	g.say_msg.connect(func(_t): pass)
	var a = get_node_or_null("/root/Audio")
	if a:
		a.apply_settings()
	menus.show_home()

func start(len: int) -> void:
	menus.show_screen("")
	ended = false
	g.start_run(len)

func _continue() -> void:
	menus.show_screen("")
	ended = false
	if g.load_run():
		menus.show_pause()
	else:
		menus.show_home()

func pause() -> void:
	if not g.running or g.s.over or g.paused or g.demo:
		return
	g.paused = true
	g.clear_input()
	g.save_run()
	menus.show_pause()

func _save_exit() -> void:
	if g.s.over:
		return
	g.save_run()
	g.paused = false
	g.running = false
	g.clear_input()
	menus.show_home()

func _on_over() -> void:
	if ended or g.demo:
		return
	ended = true
	g.sfx("over")
	g.on_over_event()

func _on_win() -> void:
	if ended or g.demo:
		return
	ended = true
	g.on_win_event()

func _process(_dt: float) -> void:
	if g == null or g.s.is_empty():
		return
	var a = get_node_or_null("/root/Audio")
	if a == null:
		return
	var playing: bool = g.running and not g.paused and not g.s.over and not g.demo
	var m = 1 if playing else (2 if menus.cur != "" else 0)
	a.set_mode(m, D.darkness(g.s.t) if playing else 0.0)

func _on_run_ended(kind: String, nights: int, earn: int, bonus: int) -> void:
	g.clear_input()
	menus.show_result(kind, nights, earn, bonus)

func _quit() -> void:
	g.save_run()
	get_tree().quit()

func _notification(what: int) -> void:
	match what:
		NOTIFICATION_WM_CLOSE_REQUEST:
			_quit()
		NOTIFICATION_WM_GO_BACK_REQUEST:
			_back()
		NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_WM_WINDOW_FOCUS_OUT:
			if g != null and g.running and not g.paused and not g.s.over:
				pause()
			elif g != null:
				g.save_run()

func _back() -> void:
	if g.running and not g.paused and not g.s.over:
		pause()
	elif menus.overlay.visible:
		pass
	elif menus.cur == "home":
		menus.show_screen("bye")
	elif menus.cur == "sett":
		menus.get_node_or_null("x")
		if menus.settings_back.is_valid():
			var f = menus.settings_back
			menus.settings_back = Callable()
			menus.show_screen("")
			f.call()
		else:
			menus.show_home()
	elif menus.cur == "tw":
		menus.show_screen("hg")
		menus.hangar_sync()
	elif menus.cur == "run":
		menus.show_screen("hg")
		menus.hangar_sync()
	else:
		menus.show_home()

func _unhandled_key_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo:
		if e.keycode == KEY_QUOTELEFT or e.keycode == KEY_F2:
			dev_panel.toggle()
		elif e.keycode == KEY_ESCAPE:
			_back()
