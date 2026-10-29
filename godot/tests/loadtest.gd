extends Node
func _ready():
	var f = FontFile.new()
	f.load_dynamic_font("res://assets/fonts/pixelify-sans-latin-700-normal.woff2")
	print("FONT ", f.get_font_name(), " ", f.get_string_size("Menara Rongsok", HORIZONTAL_ALIGNMENT_LEFT, -1, 14))
	get_tree().quit()
