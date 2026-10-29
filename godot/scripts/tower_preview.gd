extends Control
## Pratinjau tower di katalog: menggambar tower sungguhan lewat fungsi gambar game.
var g
var ty := "g"
var lv := 3
var t := 0.0
var fake: Dictionary = {}

func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	clip_contents = true

func _process(dt: float) -> void:
	if is_visible_in_tree():
		t += dt
		queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(0, 0, size.x, size.y), Color("#2a2438"))
	for i in 6:
		draw_rect(Rect2(0, i * 20, size.x, 21), [Color("#2a2438"), Color("#33283a"), Color("#3d2c3c"), Color("#4a3140"), Color("#583a42"), Color("#6a4646")][i])
	var gy = size.y - 26
	draw_rect(Rect2(0, gy, size.x, 26), Color("#403b3a"))
	draw_rect(Rect2(0, gy, size.x, 2), Color("#6a625c"))
	if g == null or g.s.is_empty():
		return
	var tw = g.mk_tower(0, 100.0, 100.0, 0, 0)
	tw.ty = ty
	tw.lv = lv
	tw.hp = g.tower_max_hp(tw)
	tw.ang = -PI / 2 + sin(t * .7) * .6
	tw.cd = 2.0
	var oldt = g.s.towers
	var old_cam = g.cam_y
	var old_ci = g.ci
	var old_ga = g.ga
	g.s.towers = [tw]
	g.cam_y = 0.0
	g.ci = self
	g.ga = 1.0
	var sc = 1.5
	draw_set_transform(Vector2(size.x / 2 - 100 * sc, gy - 100 * sc), 0, Vector2(sc, sc))
	g.draw_towers()
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	g.s.towers = oldt
	g.cam_y = old_cam
	g.ci = old_ci
	g.ga = old_ga
