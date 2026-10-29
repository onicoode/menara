extends Node
## Autoload "Ic": ikon piksel 16x16 dari data/icons.json (diekspor dari mkIcon() di JS).
var _data: Dictionary = {}
var _tex: Dictionary = {}

func _ready() -> void:
	var f = FileAccess.open("res://data/icons.json", FileAccess.READ)
	if f:
		_data = JSON.parse_string(f.get_as_text())

func tex(name: String) -> Texture2D:
	if _tex.has(name):
		return _tex[name]
	var img = Image.create_empty(16, 16, false, Image.FORMAT_RGBA8)
	if _data.has(name):
		for r in _data[name]:
			var c = Color(r[4]) if str(r[4]).begins_with("#") else _rgba(str(r[4]))
			img.fill_rect(Rect2i(int(r[0]), int(r[1]), int(r[2]), int(r[3])), c)
	else:
		push_warning("ikon tidak ada: " + name)
	var t = ImageTexture.create_from_image(img)
	_tex[name] = t
	return t

func _rgba(s: String) -> Color:
	if s.begins_with("rgba("):
		var p = s.substr(5, s.length() - 6).split(",")
		return Color(float(p[0]) / 255.0, float(p[1]) / 255.0, float(p[2]) / 255.0, float(p[3]))
	return Color(s)
