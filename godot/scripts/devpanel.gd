extends Control
var g
var app
func setup(game, a) -> void:
	g = game
	app = a
	visible = false
func open() -> void:
	visible = true
func toggle() -> void:
	visible = not visible
