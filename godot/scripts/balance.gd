extends Node
## Data keseimbangan game (autoload "Balance"). Sumber: data/balance.json,
## hasil dump dari game HTML5 v1.23. Semua angka game dibaca dari sini.

const PATH := "res://data/balance.json"
var data: Dictionary = {}

func _ready() -> void:
	var f := FileAccess.open(PATH, FileAccess.READ)
	assert(f != null, "balance.json tidak ditemukan")
	data = JSON.parse_string(f.get_as_text())

## Nilai stat tower `stat` pada level `lv` (1..9).
func tower_stat(id: String, stat: String, lv: int) -> float:
	return float(data.tower.stats[id][stat][lv])

## Nilai senjata utama `id` pada level `lv` (1..5).
func weapon_dmg(id: String, lv: int) -> float:
	return float(data.senjata_utama[id].dmg[lv])

func night(n: int) -> Dictionary:
	return data.malam[clampi(n, 1, data.malam.size()) - 1]
