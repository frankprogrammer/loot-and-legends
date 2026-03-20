# LOOT & LEGENDS — Cursor Build Prompt

## PROJECT OVERVIEW

Build a complete, playable 2D mobile game called **LOOT & LEGENDS** using **Phaser 3.90.0** running on HTML5 Canvas. The game is a portrait-orientation slot machine RPG battler. The player is a goblin warlord spinning a fantasy war drum slot machine — each spin is a combat turn against waves of increasingly difficult fantasy enemies. **The entire game takes place on a single screen.** The slot machine IS the combat system. No menus, no navigation, no inventory. One screen, one loop: spin to fight, survive as long as you can.

---

## TECH STACK

- **Framework**: Phaser 3.90.0 (load via CDN: `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`)
- **Rendering**: HTML5 Canvas (WebGL with Canvas fallback)
- **Language**: Vanilla JavaScript (no TypeScript, no bundler — keep it simple and portable)
- **Art Assets**: All game art should be AI-generated PNG assets (I will generate these separately and drop them into an `/assets` folder). For initial development, use colored rectangle placeholders with text labels so the game is fully playable before art is integrated.
- **Audio**: Use Web Audio API via Phaser's built-in sound manager. Placeholder silence is fine — I will add sound files later.
- **Target**: Portrait orientation, 390×844 logical resolution (iPhone 14 ratio), scaled to fit any screen using Phaser's `Scale.FIT` mode.

---

## GAME DESIGN DOCUMENT

### Design Philosophy: ONE SCREEN, ZERO FRICTION

This is a snackable game. The player should be fighting within 3 seconds of opening it. Everything happens on a single screen — the battle scene on top, the slot machine on the bottom. There are only **2 game states**:

1. **BATTLE state** — the core spin-to-fight loop (this IS the game)
2. **GAME OVER state** — overlay showing wave survived, stats, and a shareable result card

There are NO secondary screens, NO menus, NO character select, NO upgrade trees. The game loads and you are immediately in combat. Tap SPIN to play.

### Core Loop (every 5–8 seconds)

1. Player taps the **SPIN** button
2. The 3-reel slot machine spins with staggered stops (left → middle → right)
3. Reels land on combat symbols
4. **Match evaluation** determines the action and its power
5. The action plays out in the battle scene above (goblin attacks, defends, heals, or takes damage)
6. Damage is applied to the appropriate HP bar
7. If the enemy's HP hits 0: death animation → next enemy walks in (wave counter increments)
8. If the player's HP hits 0: death animation → Game Over card appears
9. If both survive: SPIN button re-enables, loop repeats

### Session Structure

- Player has a single **HP bar** (starts at 100 HP)
- There is **no energy system, no spin limit** — you spin until you die
- Each enemy killed advances the **wave counter**
- Enemies get progressively harder (more HP, more damage)
- A typical run lasts **1–3 minutes** depending on luck
- On death: Game Over card with stats → tap PLAY AGAIN for instant restart
- **No persistent progression.** Every run starts fresh at Wave 1 with 100 HP. Pure arcade.

---

## SLOT MACHINE DESIGN

### The Reels

3 reels, each containing the same 5 symbol types with different weights. Reels spin vertically (symbols scroll top to bottom). Each reel shows 3 rows but only the **center row** is the active result. The rows above and below are visible but dimmed — this creates the classic slot machine peek effect.

### Symbol Types

| Symbol    | ID         | Color     | Base Effect                          |
|-----------|------------|-----------|--------------------------------------|
| Sword     | `sword`    | #C0392B   | Deal damage to enemy                 |
| Shield    | `shield`   | #2980B9   | Block/reduce the next incoming hit   |
| Fireball  | `fireball` | #E67E22   | Deal heavy damage to enemy           |
| Potion    | `potion`   | #27AE60   | Heal the player                      |
| Skull     | `skull`    | #7F8C8D   | Enemy attacks the player             |

### Reel Strip Layout (per reel)

Each reel contains 12 positions. The distribution controls the odds:

```
Reel 1: sword, sword, sword, shield, shield, fireball, fireball, potion, potion, skull, skull, skull
Reel 2: sword, sword, sword, shield, shield, fireball, fireball, potion, potion, skull, skull, skull
Reel 3: sword, sword, sword, shield, shield, fireball, potion, potion, skull, skull, skull, skull
```

This gives roughly:
- Sword: ~25% per reel
- Shield: ~17% per reel
- Fireball: ~14% per reel (rarer on reel 3)
- Potion: ~17% per reel
- Skull: ~25% per reel (slightly higher on reel 3 for tension)

### Match Evaluation Rules

After all 3 reels stop, evaluate the center row:

**3 of a Kind (JACKPOT):**
- 3× Sword: **CRITICAL STRIKE** — Deal 5× base sword damage. Massive slash animation.
- 3× Shield: **FORTRESS** — Full block + reflect damage back at enemy.
- 3× Fireball: **INFERNO** — Screen-clearing nuke. Deals 5× fireball damage. Instant kill on most non-boss enemies.
- 3× Potion: **FULL RESTORE** — Heal to full HP. Green explosion of particles.
- 3× Skull: **CATASTROPHE** — Enemy deals 3× damage to you. Screen shakes violently.

**2 of a Kind:**
- 2× Sword + anything: **STRONG ATTACK** — Deal 2× base sword damage.
- 2× Shield + anything: **STURDY BLOCK** — Block the next hit entirely.
- 2× Fireball + anything: **FIRE BLAST** — Deal 2× fireball damage.
- 2× Potion + anything: **BIG HEAL** — Heal 2× base potion amount.
- 2× Skull + anything: **ENEMY ASSAULT** — Enemy deals 1.5× damage to you.

**Priority rule for 2-of-a-kind**: If there are two different pairs possible (impossible with 3 reels, but for clarity), prioritize the pair. If no pair exists, fall through to "No Match."

**No Match (all 3 different):**
- The **leftmost reel's symbol** determines the action, but at **0.5× power** (weakest version).
- This means the action always happens — no "nothing" turns — but it's feeble.

### Combat Values (base numbers, scaled by wave)

| Action        | Match Level | Effect Value                |
|---------------|-------------|-----------------------------|
| Sword         | No match    | 5 damage                    |
| Sword         | 2 match     | 15 damage                   |
| Sword         | 3 match     | 40 damage (CRITICAL STRIKE) |
| Shield        | No match    | Block 25% of next hit       |
| Shield        | 2 match     | Block 100% of next hit      |
| Shield        | 3 match     | Block + reflect 50% back    |
| Fireball      | No match    | 8 damage                    |
| Fireball      | 2 match     | 25 damage                   |
| Fireball      | 3 match     | 60 damage (INFERNO)         |
| Potion        | No match    | Heal 5 HP                   |
| Potion        | 2 match     | Heal 15 HP                  |
| Potion        | 3 match     | Heal to full (FULL RESTORE) |
| Skull         | No match    | Enemy deals base damage     |
| Skull         | 2 match     | Enemy deals 1.5× damage     |
| Skull         | 3 match     | Enemy deals 3× damage       |

### Shield Mechanic Detail

- When you roll a shield result, a **shield buff icon** appears next to your HP bar
- The shield persists until the **next time the enemy would deal damage to you** (either from a skull roll or an enemy auto-attack)
- When hit while shielded: the shield absorbs the damage (percentage based on match level), then the shield icon disappears
- Shields do NOT stack — a new shield roll replaces the existing one
- Visual: a glowing blue bubble around your goblin while shield is active

---

## ENEMY SYSTEM

### Wave Progression

Enemies appear one at a time. Kill one, the next walks in from the right side of the screen. The wave counter increments.

### Enemy Roster (8 enemy types)

| Wave    | Enemy          | HP   | Damage | Speed     | Visual                          |
|---------|----------------|------|--------|-----------|---------------------------------|
| 1       | Giant Rat      | 20   | 5      | Normal    | Fat brown rat, beady red eyes   |
| 2–3     | Skeleton       | 35   | 8      | Normal    | Bone warrior with rusty sword   |
| 4–5     | Orc Grunt      | 55   | 12     | Normal    | Green orc, leather armor, axe   |
| 6–7     | Dark Elf       | 45   | 18     | Fast      | Slender, purple skin, dual daggers |
| 8–9     | Troll          | 90   | 15     | Slow      | Huge, gray skin, club           |
| 10–11   | Shadow Knight  | 75   | 22     | Normal    | Black armor, glowing red visor  |
| 12–14   | Necromancer    | 60   | 28     | Normal    | Robed, green magic, staff       |
| 15+     | Dragon         | 120  | 35     | Slow      | Red dragon, fire breath         |

### Scaling After Wave 15

Once all enemy types have been introduced, they repeat in random order with **scaling multipliers**:
- Every wave after 15: enemy HP += 10%, enemy damage += 5%
- This creates an infinite difficulty ramp — eventually the player WILL die

### Enemy Behavior

Enemies do NOT have their own turn. They only attack when **you roll skulls.** This keeps the pacing 100% player-driven — you control the tempo by tapping SPIN. The enemy just stands there menacingly until the reels tell it to attack.

**Exception — Enemy "Speed" trait:**
- **Normal**: No special behavior.
- **Fast** (Dark Elf): If you roll a skull result, the enemy attacks BEFORE your shield can activate. Fast enemies bypass shield buffs on skull rolls only.
- **Slow** (Troll, Dragon): Skull results deal 75% of listed damage (they're slower to swing).

### Enemy Entry Animation

When a new enemy appears:
- Previous enemy plays death animation (collapse, fade to smoke)
- Brief 0.5s pause
- New enemy slides in from the right side of the screen
- Enemy name + HP bar fade in above them
- A brief "WAVE X" text flashes in the center of the battle area, scales up then fades (0.8s)

### Enemy Idle Animation

All enemies have a subtle idle animation while waiting:
- Slight breathing motion (scale oscillation: 1.0 → 1.02 → 1.0, looping, 2s period)
- Occasional blink or weapon shift (randomized every 3–5 seconds)
- This is achieved with simple Phaser tweens, not sprite sheet animation

---

## SINGLE SCREEN LAYOUT

Everything fits on one portrait screen. The screen is conceptually divided into two halves: the **battle scene** (top) and the **slot machine** (bottom).

```
┌─────────────────────────────┐
│         WAVE 7              │  ← Wave counter (top center, bold)
│  ♥♥♥♥♥♥♥░░░  🛡            │  ← Player HP bar (left) + shield icon (if active)
│                             │
│                             │
│    🧌          👹           │  ← Battle scene: Goblin (left) vs Enemy (right)
│   GOBLIN      ORC GRUNT     │     Both have idle animations
│                             │
│              ♥♥♥♥♥♥░░░░     │  ← Enemy HP bar (right-aligned, above enemy)
│              Orc Grunt       │  ← Enemy name
│─────────────────────────────│  ← Visual divider (stone/wood texture)
│                             │
│  ┌───────┬───────┬───────┐  │
│  │  ⚔️   │  🛡️   │  💀   │  │  ← Slot reels (3 columns, 3 visible rows each)
│  │ ──── │ ──── │ ──── │  │     Center row highlighted as active
│  │  🔥   │  🔥   │  💚   │  │     ← CENTER ROW = RESULT
│  │ ──── │ ──── │ ──── │  │
│  │  💚   │  ⚔️   │  ⚔️   │  │
│  └───────┴───────┴───────┘  │
│                             │
│     [ ⚔️ S P I N ⚔️ ]      │  ← Big spin button
│                             │
│  BEST: Wave 12              │  ← Best wave record (small, subtle)
└─────────────────────────────┘
```

### Layout Zones (exact positioning)

| Zone              | Y Position  | Height  | Content                                        |
|-------------------|-------------|---------|------------------------------------------------|
| Wave counter      | 20–55       | 35px    | "WAVE 7" bold text, centered                  |
| Player HP bar     | 55–85       | 30px    | HP bar (left side), shield icon (right of bar) |
| Battle scene      | 85–400      | 315px   | Goblin sprite (left), Enemy sprite (right), enemy HP bar + name |
| Divider           | 400–415     | 15px    | Decorative stone/wood divider line             |
| Slot machine      | 415–670     | 255px   | 3 reels with 3 visible rows each, payline indicator |
| Spin button       | 680–770     | 90px    | Large SPIN button, centered                    |
| Best score        | 775–800     | 25px    | "BEST: Wave X" small text, centered            |
| Bottom padding    | 800–844     | 44px    | Safe area                                      |

---

## BATTLE SCENE DETAILS

### Player Goblin (left side)

- Positioned at roughly x:100, y:260 (center of battle zone)
- Faces right
- Placeholder: green rounded rectangle (60×80px) with "GOBLIN" text and a simple face (two dot eyes, jagged mouth)
- Idle: subtle breathing tween (scaleY oscillates 1.0–1.03, 1.5s loop)
- **Attack animation (sword)**: Quick lunge forward (x += 40 over 150ms), slash effect (white arc), snap back
- **Attack animation (fireball)**: Arm raises, fireball projectile spawns and flies across to enemy
- **Block animation (shield)**: Hunches down, blue shield circle appears around goblin
- **Heal animation (potion)**: Green particles float upward from goblin, brief green glow
- **Take damage animation**: Flash red (tint), knockback (x -= 20, bounce back), screen shake if heavy hit

### Enemy (right side)

- Positioned at roughly x:290, y:260
- Faces left
- Placeholder: colored rounded rectangle sized by enemy type (rat = small, troll = large) with enemy name text
- Idle: same breathing tween as goblin
- **Take damage animation**: Flash white, knockback (x += 20, bounce back), damage number floats up in red
- **Attack animation**: Quick lunge toward goblin (x -= 40 over 200ms), impact effect, snap back
- **Death animation**: Flash white 3 times, collapse (scaleY → 0 over 300ms), fade to smoke particles, then gone

### HP Bars

**Player HP bar:**
- Positioned top-left of battle scene (x:20, y:60)
- Width: 180px, Height: 18px
- Background: dark gray (#333)
- Fill: gradient from red (#E74C3C) when low to green (#2ECC71) when high
- Shows current/max as text inside bar: "67/100"
- When damage taken: bar shakes briefly, fill decreases with a smooth tween (not instant)
- When HP < 25%: bar pulses red

**Enemy HP bar:**
- Positioned above the enemy sprite, right-aligned
- Width: 150px, Height: 14px
- Background: dark gray
- Fill: solid red (#E74C3C)
- Enemy name text below the bar in small white text
- Damage numbers float up from the enemy when hit (red text, "-15", floats up and fades over 0.8s)

### Shield Buff Icon

- Small blue shield icon (20×20px) positioned just to the right of the player HP bar
- Only visible when a shield buff is active
- Pulses gently (alpha oscillates 0.7–1.0)
- When shield absorbs a hit: icon shatters (scale up + fade out rapidly) and disappears

### Floating Combat Text

All combat results display floating text in the battle scene:
- **Damage dealt to enemy**: Red text, "-15", floats up from enemy position
- **Damage taken by player**: Red text, "-8", floats up from goblin position
- **Healing**: Green text, "+15", floats up from goblin position
- **Shield block**: Blue text, "BLOCKED!", floats up from goblin position
- **Critical/Jackpot**: Large gold text, "CRITICAL!" or "INFERNO!" or "CATASTROPHE!", center screen, scale bounce
- All floating text: starts at 1.2x scale, moves up 60px over 0.8s, fades out over the same duration

---

## SLOT MACHINE DETAILS

### Visual Design

The slot machine occupies the bottom half of the screen. It should feel like a chunky fantasy artifact — a war drum or wooden contraption with metal rivets.

- **Frame**: Rounded rectangle with a thick border. Placeholder color: dark wood brown (#4A3728) with a lighter inner border (#8B7355).
- **Reels**: 3 columns, each showing 3 rows of symbols. The center row is the **payline** — highlighted with a glowing border or brighter background.
- **Payline indicator**: A horizontal line or arrow markers on the left and right edges pointing at the center row.
- **Reel background**: Darker parchment (#3D2B1F) behind each reel column.

### Reel Dimensions

- Total reel area: ~330×200px, centered horizontally
- Each reel column: ~100px wide with 10px gaps between them
- Each symbol cell: ~100×60px
- Symbols are centered within their cells

### Spin Animation

When the player taps SPIN:

1. **All 3 reels start spinning simultaneously** — symbols scroll downward rapidly
2. The spin uses a blur/speed effect (symbols move fast enough to appear streaky)
3. **Staggered stops**: 
   - Reel 1 (left) stops after **0.8s**
   - Reel 2 (middle) stops after **1.2s** 
   - Reel 3 (right) stops after **1.6s**
4. Each reel stop uses an overshoot bounce ease — the reel scrolls slightly past the landing position, then bounces back
5. A **click/thunk** sound plays on each reel stop
6. After all 3 reels stop: **0.3s pause**, then the payline flashes to highlight the result
7. If 2-of-a-kind or 3-of-a-kind: the matching symbols pulse/glow for 0.5s before the action fires
8. The combat action then plays out in the battle scene above

### Spin Implementation

Each reel is a vertically scrolling container of symbol sprites/graphics. To animate:
- Create a container with enough symbols to fill the visible area plus buffer
- On spin: tween the container's Y position downward at high speed
- Use modular wrapping — when a symbol scrolls off the bottom, reposition it at the top
- On stop: calculate the target Y position for the predetermined result, tween to it with overshoot ease
- The result for each reel is pre-calculated before the animation starts (the spin is cosmetic, the outcome is already decided by LootTable)

### Symbol Placeholders

Until real art is provided, each symbol is a colored circle (50px diameter) with an icon/text inside:
- Sword: Red circle, "⚔" text
- Shield: Blue circle, "🛡" text
- Fireball: Orange circle, "🔥" text
- Potion: Green circle, "💚" text
- Skull: Gray circle, "💀" text

When real art is added, these swap to PNG sprites by changing texture keys only.

---

## SPIN BUTTON

- Large rounded rectangle: 280×70px, centered at bottom of slot machine area
- Color: deep crimson (#8B0000) with a subtle gradient (lighter at top for a convex/3D look)
- Text: "⚔ SPIN ⚔" in bold cream/gold text
- Border: 3px solid darker red (#5C0000)

### Button States

| State           | Appearance                         | Behavior                    |
|-----------------|------------------------------------|-----------------------------|
| Ready           | Full color, slight pulsing glow    | Tap to spin                 |
| Spinning        | Grayed out (#666), "..." text      | Not tappable                |
| Action playing  | Grayed out, no text change         | Not tappable                |
| Game Over       | Hidden (result card covers it)     | Not visible                 |

### Button Feedback

- On tap: scale to 0.93 for 80ms, then bounce back to 1.0 with slight overshoot
- When returning to Ready state after an action resolves: brief gold flash on the button border to signal "your turn"

---

## GAME OVER RESULT CARD

When the player's HP reaches 0:

### Death Sequence

1. Goblin plays death animation: flash red 3 times, collapse (scaleY → 0), poof smoke
2. Screen dims (dark overlay fades in, 60% black opacity, over 0.5s)
3. Brief 0.5s pause for dramatic effect
4. Result card scales up from 0 with a bounce ease (0.4s)

### Result Card Layout

```
┌───────────────────────────────┐
│                               │
│       ⚔ LOOT & LEGENDS ⚔     │  ← Game title (stylized)
│       ═══════════════════     │
│                               │
│         WAVE  14              │  ← How far they got (LARGE, hero text)
│                               │
│     ★ NEW RECORD! ★           │  ← Only if they beat their best
│                               │
│    ─────────────────────      │
│    Total Damage: 1,247        │  ← Sum of all damage dealt
│    Enemies Slain: 13          │  ← Total kills
│    Best Hit: INFERNO (60)     │  ← Highest single action
│    ─────────────────────      │
│                               │
│    ┌───────────────────────┐  │
│    │    [ FIGHT AGAIN ]    │  │  ← Restart button
│    └───────────────────────┘  │
│                               │
│       LOOT & LEGENDS          │  ← Small watermark/branding
└───────────────────────────────┘
```

### Result Card Details

- **Wave number** is the visual hero — biggest text on the card, gold color (#FFD700)
- **NEW RECORD** only appears if wave > stored best. Animated: gold text pulse, subtle sparkle particles.
- **Stats section**: clean, left-aligned, monospaced feel. Muted text color.
  - Total Damage: sum of all damage dealt to enemies during the run
  - Enemies Slain: count of enemies killed (wave - 1, since they died during the current wave)
  - Best Hit: the single highest-damage action name and value (e.g., "CRITICAL STRIKE (40)")
- **FIGHT AGAIN** button: Same style as SPIN button. Tapping it dismisses the overlay instantly and resets the game to Wave 1, full HP, first enemy.
- The card should be **screenshot-friendly**: bold, high-contrast, looks good as a vertical crop for Instagram Stories.

### Title Rank System

The result card also shows a **rank title** based on wave reached:

| Waves   | Title              |
|---------|--------------------|
| 1–3     | Tavern Brawler     |
| 4–7     | Goblin Grunt       |
| 8–11    | Battle Captain     |
| 12–15   | Warlord            |
| 16–20   | Champion           |
| 21+     | LEGENDARY          |

The title appears below the wave number in a complementary color. "LEGENDARY" uses gold with a glow effect.

---

## TECHNICAL ARCHITECTURE

### File Structure

```
/loot-and-legends/
├── index.html              # Single entry point, loads Phaser from CDN
├── js/
│   ├── config.js           # Phaser game config + global constants
│   ├── data/
│   │   ├── symbols.js      # Symbol definitions, reel strips, match rules
│   │   └── enemies.js      # Enemy roster, stats, wave assignments
│   ├── scenes/
│   │   ├── BootScene.js    # Preload assets, show loading bar
│   │   └── GameScene.js    # THE game — everything lives here
│   ├── objects/
│   │   ├── SlotMachine.js      # 3-reel slot machine: spin, stop, evaluate
│   │   ├── Reel.js             # Single reel: symbol strip, spin animation, stop logic
│   │   ├── BattleScene.js      # Battle area: goblin, enemy, HP bars, combat animations
│   │   ├── Goblin.js           # Player character: animations, HP, shield state
│   │   ├── Enemy.js            # Enemy: stats, animations, HP bar, entry/death
│   │   ├── CombatResolver.js   # Takes match result → determines action, calculates damage
│   │   ├── FloatingText.js     # Damage/heal numbers that float up and fade
│   │   └── ResultCard.js       # Game over overlay with stats
│   └── managers/
│       ├── SessionState.js     # Current run: HP, wave, shield, stats tracking
│       └── LootTable.js        # Reel result generation (pre-calculated per spin)
├── assets/
│   ├── characters/     # Goblin + enemy PNGs (I will add later)
│   ├── symbols/        # Slot symbol PNGs (I will add later)
│   ├── ui/             # Buttons, frames, HP bar elements
│   ├── fx/             # Particle textures (spark, smoke, coin)
│   └── audio/          # Sound effects (I will add later)
└── style.css           # Minimal: full-bleed canvas, no scroll, bg color
```

### Phaser Config

```javascript
const config = {
    type: Phaser.AUTO,
    width: 390,
    height: 844,
    parent: 'game-container',
    backgroundColor: '#1A0E0A',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, GameScene]
};
```

### State Management

**SessionState.js** tracks the current run only:
- `playerHP` (integer, starts at 100, max 100)
- `playerMaxHP` (integer, 100)
- `shieldActive` (boolean, false)
- `shieldPower` (float, 0–1, percentage of damage blocked)
- `currentWave` (integer, starts at 1)
- `currentEnemy` (object reference)
- `totalDamageDealt` (integer, for result card)
- `enemiesSlain` (integer, for result card)
- `bestHit` (object: { name, value }, tracks highest single action)
- `isGameOver` (boolean)

**Persisted in localStorage:**
- `lootlegends_best_wave` (integer, all-time best wave reached)

That's it. Minimal persistence. The game is a pure arcade run.

### Key Class Responsibilities

**LootTable.js:**
- `roll()` → returns an array of 3 symbol IDs (one per reel), pre-calculated using the reel strip weights
- The spin animation in SlotMachine.js is purely cosmetic — the result is known before the reels start moving

**CombatResolver.js:**
- `resolve(symbols[3])` → evaluates match type (3-of-a-kind, 2-of-a-kind, no match)
- Returns an action object: `{ type: 'sword'|'shield'|'fireball'|'potion'|'skull', matchLevel: 0|1|2, value: number, name: string }`
- `matchLevel`: 0 = no match, 1 = 2-of-a-kind, 2 = 3-of-a-kind (jackpot)

**SlotMachine.js:**
- Manages 3 Reel instances
- `spin()` method: gets result from LootTable, tells each Reel to animate to the target symbol, fires callback when all reels stopped
- Handles staggered stop timing

**BattleScene.js:**
- Contains the Goblin and Enemy instances
- `executeAction(action)` method: takes the CombatResolver output and plays the appropriate animation sequence
- Manages combat text, damage application, and enemy transitions

### Placeholder Art Strategy

Until real PNGs are provided, generate all visuals programmatically:
- **Goblin**: Green rounded rectangle (60×80px) with dot eyes, jagged mouth line, and "GOBLIN" label
- **Enemies**: Colored rounded rectangles sized by type (rat=small/brown, troll=large/gray, dragon=large/red) with name labels
- **Slot symbols**: Colored circles (50px) with emoji text inside
- **Slot frame**: Dark brown rounded rect with lighter border
- **HP bars**: Simple filled rectangles with text overlay
- **Buttons**: Rounded rects with text labels
- **Particles**: Small colored circles (4–8px) for combat effects

The code should be structured so that swapping in real PNGs later requires ONLY changing the asset loading in BootScene and the texture keys — no gameplay logic changes. Specifically:
- Characters use `this.add.sprite(x, y, 'goblin')` or fall back to a generated texture
- Symbols use texture keys like `'symbol_sword'`, `'symbol_shield'`, etc.
- A `PLACEHOLDER_MODE` constant in config.js controls whether to use generated textures or loaded PNGs

---

## ANIMATION & FX DETAILS

### Combat Action Sequences

Each combat action is a choreographed animation sequence. The SPIN button stays disabled until the full sequence completes.

**SWORD (player attacks):**
```
1. Goblin lunges forward (x += 50, 120ms, ease: 'Power2')
2. Slash effect: white arc sprite appears at enemy position, fades over 200ms
3. Enemy flashes white (tint), knockback (x += 15, 80ms, bounce back)
4. Damage number floats up from enemy ("-15" in red)
5. Enemy HP bar decreases (smooth tween, 300ms)
6. Goblin returns to original position (150ms, ease: 'Back.easeOut')
Total sequence: ~600ms
```

**FIREBALL (ranged attack):**
```
1. Goblin raises arm (slight scaleX increase for 150ms)
2. Fireball projectile spawns at goblin's hand position
3. Fireball travels in an arc to enemy position (400ms, with particle trail)
4. On impact: orange explosion particle burst (10 particles, 300ms)
5. Enemy flashes orange, knockback
6. Damage number floats up
7. Enemy HP bar decreases
Total sequence: ~800ms
```

**SHIELD (defensive):**
```
1. Goblin hunches slightly (scaleY to 0.95, 100ms)
2. Blue circle/bubble appears around goblin (scales from 0 to 1, 200ms)
3. "SHIELDED!" text floats up in blue
4. Shield buff icon appears next to HP bar
5. Blue bubble settles to subtle pulse (stays until used or replaced)
Total sequence: ~400ms
```

**POTION (heal):**
```
1. Goblin glows green briefly (tint, 200ms)
2. Green particles float upward from goblin (8 particles, rise and fade over 600ms)
3. Heal number floats up ("+15" in green)
4. Player HP bar increases (smooth tween, 300ms)
5. If HP was < 25%, the red pulse on the HP bar stops
Total sequence: ~600ms
```

**SKULL (enemy attacks you):**
```
1. Enemy lunges forward (x -= 50, 150ms)
2. Impact effect at goblin position (red burst)
3. Goblin flashes red (tint), knockback (x -= 15, bounce back)
4. Damage number floats up from goblin ("-8" in red)
5. If shield was active: "BLOCKED!" appears in blue, shield icon shatters, damage reduced
6. Player HP bar decreases (smooth tween, 300ms)
7. Enemy returns to position
8. If player HP <= 0: trigger death sequence instead of continuing
Total sequence: ~700ms
```

### Jackpot (3-of-a-Kind) Special FX

On top of the base animation, jackpots add spectacle:

**Any 3-of-a-kind:**
- Before the action plays: 0.3s pause while matching symbols pulse gold
- Large text appears center-screen with the action name ("CRITICAL STRIKE!", "INFERNO!", etc.)
- Text slams in at 2x scale, bounces to 1x over 300ms
- Background briefly tints the action's color (red for sword, orange for fireball, etc.) at 20% opacity

**3× Fireball (INFERNO) specifically:**
- Screen fills with orange particle rain (20 particles falling from top)
- Fireball is 3× size of normal
- Camera shake on impact (5px, 300ms)
- Enemy HP bar drains rapidly with a sizzle effect

**3× Skull (CATASTROPHE) specifically:**
- Screen flashes red
- Enemy grows momentarily (scale 1.3x) before attacking
- Camera shake (8px, 400ms)
- Goblin knockback is 2× distance
- "CATASTROPHE!" text in blood red

### Enemy Death Sequence

```
1. Enemy flashes white rapidly (3 times, 100ms each)
2. Enemy scaleY tweens to 0 over 300ms (collapse)
3. Smoke particle poof (6 gray particles, burst outward, fade over 400ms)
4. Small gold coin particles fly toward the wave counter area (cosmetic, 3–4 coins)
5. Wave counter increments with a scale pulse
6. 0.5s pause
7. "WAVE X" text flashes in center of battle area (scale up from 0, hold 0.3s, fade out 0.3s)
8. New enemy slides in from right edge of screen to its battle position (300ms, ease: 'Power2')
9. Enemy HP bar + name fade in (200ms)
10. SPIN button re-enables with a gold flash
```

---

## COLOR PALETTE

| Role                 | Hex       | Usage                                      |
|----------------------|-----------|--------------------------------------------|
| Background           | #1A0E0A   | Dark dungeon brown/black                   |
| Battle BG            | #2D1F15   | Slightly lighter, battle scene area        |
| Slot Machine Frame   | #4A3728   | Dark wood brown for slot frame             |
| Slot Machine Inner   | #3D2B1F   | Darker parchment behind reels              |
| Payline Highlight    | #FFD700   | Gold glow on the active result row         |
| Primary Text         | #F5E6D3   | Warm cream for main text                   |
| Secondary Text       | #8B7355   | Muted brown for labels                     |
| Sword Red            | #C0392B   | Sword symbol + damage actions              |
| Shield Blue          | #2980B9   | Shield symbol + block actions              |
| Fireball Orange      | #E67E22   | Fireball symbol + fire actions             |
| Potion Green         | #27AE60   | Potion symbol + heal actions               |
| Skull Gray           | #7F8C8D   | Skull symbol + enemy attack indicator      |
| HP Bar Green         | #2ECC71   | Player HP when healthy                     |
| HP Bar Red           | #E74C3C   | Player HP when low / enemy HP bar          |
| Gold Accent          | #FFD700   | Jackpots, wave counter, rank text          |
| Spin Button          | #8B0000   | Deep crimson for the spin button           |
| Overlay Dark         | #000000   | Game over overlay (60% opacity)            |

---

## IMPLEMENTATION ORDER

Build in this sequence so the game is playable at every step:

### Phase 1 — Skeleton
1. Set up `index.html` with Phaser CDN, `style.css`, and `config.js`
2. Create `BootScene` with a loading bar
3. Create `GameScene` with colored rectangles marking each layout zone (battle area, slot area, button area)
4. Verify it runs in browser at correct portrait dimensions with the dark dungeon background

### Phase 2 — Slot Machine
5. Build `symbols.js` data (symbol definitions, reel strips)
6. Build `LootTable.js` (weighted random roll for 3 reels)
7. Build `Reel.js` — single vertical scrolling reel with symbol cells, spin and stop animations
8. Build `SlotMachine.js` — manages 3 Reels, staggered stops, evaluates matches
9. Build `CombatResolver.js` — takes 3 symbols, returns action object
10. Wire SPIN button: tap → reels spin → reels stop → match result logged to console
11. Test: verify staggered stops, overshoot bounce, and correct match evaluation

### Phase 3 — Battle Scene
12. Build `Goblin.js` — placeholder sprite with idle breathing tween, HP tracking
13. Build `Enemy.js` — placeholder sprite with idle tween, HP bar, name label
14. Build `enemies.js` data (roster, stats, wave assignments)
15. Build `BattleScene.js` — contains goblin and enemy, manages combat animations
16. Build `FloatingText.js` — reusable floating damage/heal/block text
17. Wire slot result → combat action → battle animation → HP updates
18. Test: full spin → fight loop working with placeholder art

### Phase 4 — Game Flow
19. Build `SessionState.js` — HP, wave, shield state, stats tracking
20. Implement enemy death → next enemy entry sequence
21. Implement wave counter + scaling difficulty after wave 15
22. Implement shield buff system (persist between spins, break on skull)
23. Implement player death → game over trigger
24. Build `ResultCard.js` — overlay with wave, stats, rank title
25. Implement FIGHT AGAIN → full reset to wave 1

### Phase 5 — Juice & FX
26. Add jackpot (3-of-a-kind) special effects: screen flash, large text slam, particles
27. Add fireball projectile with particle trail
28. Add enemy death smoke poof + coin particles
29. Add HP bar animations (smooth decrease, red pulse when low)
30. Add shield shatter animation when block is consumed
31. Add CATASTROPHE screen shake for 3× skull
32. Add button press feedback (scale down on tap)
33. Add sound effect hooks (placeholder-ready)

### Phase 6 — Polish
34. Add best wave tracking in localStorage + NEW RECORD badge
35. Add portrait lock (show "rotate device" message in landscape)
36. Final pass on animation timings and easing curves
37. Ensure all placeholder art has clean swap points for real PNGs
38. Performance check — ensure 60fps with particles active on mobile
39. Test on mobile browsers (Safari iOS, Chrome Android)

---

## CRITICAL CONSTRAINTS

- **ONE SCREEN.** There is only GameScene. No navigation, no tabs, no menus, no secondary views. Everything the player sees and interacts with lives on one screen.
- **No server required.** Everything runs client-side. Open `index.html` in a browser and play.
- **No npm / no bundler.** Use script tags and load JS files directly. This must work by simply opening the HTML file or serving from any static file server.
- **Portrait only.** Lock to portrait. If the viewport is landscape, show a "Please rotate your device" message.
- **Touch-first.** All interactions must work with tap. Mouse click is fine as fallback but design for touch.
- **Performance.** Target 60fps on mid-range mobile. Keep particle counts reasonable (max 20 simultaneous). Use object pooling for floating text and particles.
- **Asset-swap ready.** All placeholder art must be replaceable with PNGs by changing only the BootScene preload and texture key references — no gameplay logic changes. Use a `PLACEHOLDER_MODE` flag.
- **No persistent progression.** Every run starts fresh. No upgrades, no unlocks, no inventory. Just wave-chasing.
- **Deterministic results.** The slot outcome is calculated BEFORE the spin animation plays. The animation is cosmetic. This prevents any timing exploits and keeps the code clean.

---

## WHAT SUCCESS LOOKS LIKE

When this build is complete, I should be able to:
1. Open `index.html` on my phone and be in combat within 3 seconds
2. See the battle scene (goblin vs enemy) on top, slot machine on bottom — all on one screen
3. Tap SPIN and watch 3 reels spin with staggered stops and satisfying bounce
4. See the match result trigger a combat animation — my goblin slashes, casts fire, blocks, heals, or takes a hit
5. Watch enemy HP drain with floating damage numbers, and see enemies die and get replaced by harder ones
6. Feel the tension when skulls appear — especially when I'm low HP
7. Experience a spectacular INFERNO (3× fireball) or dread a CATASTROPHE (3× skull)
8. Die eventually, see a clean result card with my wave count and stats
9. Tap FIGHT AGAIN and be instantly back in combat
10. Screenshot my "Wave 18 — LEGENDARY" result card and want to share it
