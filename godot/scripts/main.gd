extends Node2D

func _ready() -> void:
	print("Gun Lv1 dmg=", Balance.tower_stat("g", "dmg", 1), " Lv9=", Balance.tower_stat("g", "dmg", 9))
	print("Malam 1: ", Balance.night(1))
	if "--selftest" in OS.get_cmdline_user_args():
		get_tree().quit()
