# Assets

Place **`goblin.png`** here so the path is:

**`assets/goblin.png`** (next to `index.html` in the project root).

The game loads it in **`BootScene`** and **`GameScene.preload()`** as texture key **`goblin`**.

## Enemy images

Place PNGs in **`assets/`** (paths relative to `index.html`). If a file fails to load, that enemy falls back to the colored rectangle placeholder.

| File | Texture key | Enemy |
|------|-------------|--------|
| `rat.png` | `enemy_rat` | Giant Rat |
| `skeleton.png` | `enemy_skeleton` | Skeleton |
| `orc.png` | `enemy_orc` | Orc Grunt |
| `darkElf.png` | `enemy_dark_elf` | Dark Elf |
| `troll.png` | `enemy_troll` | Troll |
| `shadowKnight.png` | `enemy_shadow_knight` | Shadow Knight |
| `necromancer.png` | `enemy_necromancer` | Necromancer |
| `dragon.png` | `enemy_dragon` | Dragon |

## If images do not appear

Many browsers **block loading local images** when you open `index.html` via **`file://`**.

Run a small static server from the project folder, then open **`http://localhost:...`**:

```bash
npx --yes serve .
# or: python -m http.server 8080
```

Then open the URL it prints (e.g. `http://localhost:3000`).
