extends Node
func _ready():
	var sc = load("res://scripts/draw_tower.gd")
	print("LOAD ", sc != null, " ", sc.can_instantiate() if sc else false)
	get_tree().quit()
