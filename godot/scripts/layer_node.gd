extends Node2D
## Satu lapisan kanvas permainan; menggambar lewat fungsi milik game.
var g
var mode := "world"
func _draw() -> void:
	if g == null or g.s.is_empty():
		return
	match mode:
		"world": g.render_world(self)
		"glow": g.render_glow(self)
		"top": g.render_top(self)
		"arrows": g.render_arrows(self)
