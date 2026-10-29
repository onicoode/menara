class_name UK
## Pembantu UI: gaya piksel, tombol, chip, label.

const BG := Color("#0d0f19")
const FG := Color("#ece8dc")
const MUTED := Color("#8f97b5")
const GOLD := Color("#ffc75a")
const CYAN := Color("#8ff0ff")

static var font_b: Font
static var font_m: Font

static func fonts() -> void:
	if font_b != null:
		return
	font_b = FontFile.new()
	font_b.load_dynamic_font("res://assets/fonts/pixelify-sans-latin-700-normal.woff2")
	font_b.antialiasing = TextServer.FONT_ANTIALIASING_NONE
	font_m = FontFile.new()
	font_m.load_dynamic_font("res://assets/fonts/pixelify-sans-latin-500-normal.woff2")
	font_m.antialiasing = TextServer.FONT_ANTIALIASING_NONE

static func theme() -> Theme:
	fonts()
	var t = Theme.new()
	t.default_font = font_b
	t.default_font_size = 13
	t.set_color("font_color", "Label", FG)
	return t

static func sb(bg: Color, border: Color, bw := 2, bottom := 4, pad := 4) -> StyleBoxFlat:
	var s = StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(bw)
	s.border_width_bottom = bottom
	s.set_corner_radius_all(0)
	s.content_margin_left = pad + 2
	s.content_margin_right = pad + 2
	s.content_margin_top = pad
	s.content_margin_bottom = pad + 1
	s.anti_aliasing = false
	return s

static func lbl(text: String, size := 13, col := FG, align := HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l = Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.horizontal_alignment = align
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

static func ico(name: String, size := 18) -> TextureRect:
	var r = TextureRect.new()
	r.texture = Ic.tex(name)
	r.custom_minimum_size = Vector2(size, size)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func hbox(sep := 4) -> HBoxContainer:
	var h = HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return h

static func vbox(sep := 4) -> VBoxContainer:
	var v = VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return v

## tombol dengan ikon dan teks. kind: "n" biasa, "gold", "red", "dim"
static func btn(icon: String, text := "", kind := "n", min_size := Vector2.ZERO, isize := 20) -> Button:
	var b = Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = min_size
	var cols = {"n": [Color("#222a46"), Color("#3c4670")], "gold": [Color("#5a3e12"), Color("#ffc75a")],
		"red": [Color("#4a1a1a"), Color("#c84a3a")], "dim": [Color("#161b2e"), Color("#2e3658")]}[kind]
	b.add_theme_stylebox_override("normal", sb(cols[0], cols[1]))
	b.add_theme_stylebox_override("hover", sb(cols[0].lightened(.08), cols[1]))
	b.add_theme_stylebox_override("pressed", sb(cols[0].darkened(.2), cols[1], 2, 2))
	b.add_theme_stylebox_override("disabled", sb(Color("#14172a"), Color("#232842")))
	var h = hbox(6)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if icon != "":
		h.add_child(ico(icon, isize))
	if text != "":
		h.add_child(lbl(text, 14, FG))
	b.add_child(h)
	return b

static func set_btn_text(b: Button, idx: int, text: String) -> void:
	var h = b.get_child(0)
	var n = h.get_child(idx)
	if n is Label:
		n.text = text

static func chip(icon: String, w := 0.0) -> PanelContainer:
	var p = PanelContainer.new()
	p.add_theme_stylebox_override("panel", sb(Color("#161b2e"), Color("#2e3658"), 2, 3, 2))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h = hbox(5)
	h.add_child(ico(icon, 18))
	p.add_child(h)
	return p

static func fmt(v: float) -> String:
	var r = snappedf(v, .1)
	var s = str(r)
	if s.ends_with(".0"):
		s = s.substr(0, s.length() - 2)
	return s.replace(".", ",")
