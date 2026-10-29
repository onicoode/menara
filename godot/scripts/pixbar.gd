extends Control
## Bar piksel bersegmen untuk HUD.
var v := 0.0
var col := Color("#8ff0ff")
var col2 := Color("#3fb6d0")
var blink := false
func _init() -> void:
	custom_minimum_size = Vector2(54, 10)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
func _process(_d: float) -> void:
	if blink:
		queue_redraw()
func _draw() -> void:
	draw_rect(Rect2(0, 0, size.x, size.y), Color("#2e3658"))
	draw_rect(Rect2(2, 2, size.x - 4, size.y - 4), Color("#0a0d18"))
	var w := (size.x - 4) * clampf(v, 0.0, 1.0)
	if blink and int(Time.get_ticks_msec() / 250) % 2 == 0:
		return
	var x := 0.0
	while x < w:
		var sw := minf(4.0, w - x)
		draw_rect(Rect2(2 + x, 2, sw, size.y - 4), col)
		if x + 4 < w:
			draw_rect(Rect2(2 + x + 4, 2, 1, size.y - 4), col2)
		x += 5
