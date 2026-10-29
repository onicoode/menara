extends Node
func _ready():
	var m = load("res://scenes/main.tscn").instantiate()
	m.name = "Main"
	add_child(m)
	await get_tree().process_frame
	m.start(10)
	var g = m.g
	var errs = 0
	var frames = 0
	var built = 0
	while frames < 40000 and not g.s.over and frames < 2600:
		g.s.coins = maxi(g.s.coins, 30)
		# pindah ke slot bergilir dan bangun/upgrade apa saja
		var tw = g.s.towers[(frames / 400) % 6]
		g.s.m.x = tw.x
		g.s.m.y = g.GW
		g.s.m.st = "g"
		if frames % 20 == 0:
			for o in g.ctx_options():
				if o.state == "ok" and (o.kind == "tbuild" or o.kind == "tup" or o.kind == "hub" or o.kind == "page"):
					g.complete_hold(o)
					built += 1
					break
		g.update(0.05)
		if frames % 200 == 0:
			await get_tree().process_frame
		frames += 1
	print("PLAY OK frames=", frames, " day=", g.s.day, " over=", g.s.over, " built=", built, " kills=", g.s.kills)
	g.save_run()
	var ok = g.load_run()
	print("LOAD ", ok, " day=", g.s.day, " towers=", g.s.towers.size())
	for i in 200:
		g.paused = false
		await get_tree().process_frame
	print("AFTER LOAD day=", g.s.day, " t=", g.s.t)
	get_tree().quit()
