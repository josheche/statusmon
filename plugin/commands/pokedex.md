---
name: pokedex
description: Browse your Pokedex of all Pokemon you've encountered and trained
---

Read the file at ~/.statusmon/pokedex.json to get the user's complete Pokedex history.
Also read ~/.statusmon/trainer.json for their current companion.

Render a formatted Pokedex showing:

1. **Current companion** at the top — name, level, type, XP progress
2. **Past Pokemon** as a numbered list, each showing:
   - Original species → final species reached (if evolved)
   - Type emoji + types
   - Max level achieved
   - Date range (encountered → released)
   - Sessions trained

Use type emojis: 🔥 fire, 💧 water, 🌿 grass, ⚡ electric, ❄️ ice, 🥊 fighting, ☠️ poison, 🌍 ground, 🪽 flying, 🔮 psychic, 🐛 bug, 🪨 rock, 👻 ghost, 🐉 dragon, 🌑 dark, ⚙️ steel, 🧚 fairy, ⬜ normal

Keep it concise — one line per past Pokemon. Show total count at the bottom.
