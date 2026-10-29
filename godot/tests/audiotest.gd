extends Node
func _ready():
	var t0 = Time.get_ticks_msec()
	var a = get_node("/root/Audio")
	while not a.ready_audio:
		await get_tree().process_frame
		if Time.get_ticks_msec() - t0 > 120000:
			break
	print("AUDIO ready=", a.ready_audio, " ms=", Time.get_ticks_msec() - t0, " sfx=", a.streams.size(), " music=", a.music.size())
	a.set_mode(2, 0.0)
	a.sfx("click"); a.sfx("blast"); a.thrust(true); a.charge(.5)
	for i in 30:
		await get_tree().process_frame
	print("AUDIO PLAY OK")
	get_tree().quit()
