# 🥔 土豆幸存者 (Potato Survivor)

A 2D top-down zombie survival game built with **Phaser 3 + TypeScript + Vite 5**.

You are a potato fighting off endless waves of zombies. Buy weapons, collect materials, trigger evolutions, defeat bosses, and survive as long as you can.

## Quick Start

```bash
npm install
npm run dev     # start dev server
npm run build   # production build → dist/
```

## Gameplay

- **WASD** — Move
- **Auto-fire** — All weapons fire automatically at the nearest enemy
- **R** — Reload current weapon
- **Q** — Switch HUD focus (which weapon's ammo is highlighted)
- **F** — Character ability
- **G** — Grenade
- **1 / 2** — Activate powers
- **ESC** — Pause / stats overlay
- **Shop** — Between waves, buy weapons, items, mods, and powers

### Waves

30 waves, a boss every 5 waves. Enemies get faster, tankier, and more varied as waves progress:

| Enemy | Behavior |
|---|---|
| Normal | Walks toward player |
| Fast | High speed, low HP |
| Tank | High HP, slow |
| Ranged | Fires projectiles from a distance |
| Charger | Charges at high speed every 1.5–3s |
| Exploder | Explodes on death, damaging nearby enemies and player |
| Healer | Heals nearby injured allies |
| Invisible | Transparent when far, visible when close |

### Weapons

Both ranged and melee weapons. Dual-wield up to 2 weapons that fire simultaneously.

Duplicate a weapon in the shop to upgrade it (+15% damage, +8% fire rate, +bullet count every 2 levels).

| Weapon | Type | Description |
|---|---|---|
| 手枪 (Pistol) | Ranged | Balanced starter, 3-round burst |
| 霰弹枪 (Shotgun) | Ranged | 8 pellets, short range |
| 冲锋枪 (SMG) | Ranged | Fast fire rate, low damage |
| 步枪 (Rifle) | Ranged | Long range, high damage |
| 激光枪 (Laser) | Ranged | High fire rate, penetrates 3 enemies |
| 冰冻枪 (Freeze) | Ranged | Slows enemies on hit |
| 砍刀 (Machete) | Melee | Fast melee, short range |
| 撬棍 (Crowbar) | Melee | Wide swing, high damage |

### Evolutions

Combine a weapon + shop item to create an upgraded version:

| Recipe | Result |
|---|---|
| 手枪 + 消音器 | 无声手枪 |
| 霰弹枪 + 红点瞄准 | 精确霰弹枪 |
| 步枪 + 穿甲弹 | 狙击步枪 |
| 撬棍 + 幸运草 | 幸运撬棍 |
| 砍刀 + 折叠枪托 | 战术砍刀 |
| 激光枪 + 咖啡 | 激光炮 |
| 冰冻枪 + 幸运草 | 暴风雪 |

### Items & Mods

- **Items** — Permanent passives (coffee for fire rate, shield for armor, shoes for speed, etc.)
- **Mods** — Weapon attachments (silencer, extended mag, red dot, etc.)
- **Consumables** — Health packs, adrenaline, grenades

### Powers

Unlockable abilities with cooldowns:

| Power | Effect |
|---|---|
| 念力波 (Telekinetic Wave) | Knockback + damage |
| 丧尸控制 (Zombie Control) | Convert an enemy to fight for you |
| 精神风暴 (Psychic Storm) | Aura of continuous damage |
| 预知 (Precognition) | Dodge all attacks |
| 重力场 (Gravity Field) | Pull enemies in + damage |
| 生命汲取 (Life Drain) | Drain HP from enemies |

## Characters

5 characters with unique passives and abilities. 2 locked — unlock by meeting in-game milestones:

| Character | Passive | Unlock |
|---|---|---|
| 土豆勇士 (Potato Warrior) | +10% HP | Default |
| 游侠 (Ranger) | +10% speed | Default |
| 机械师 (Mechanic) | +10% fire rate | Default |
| 狙击手 (Sniper) | +1 crit per level | 100 kills |
| 幸运者 (Lucky) | +5% dodge | 200 materials in one run |
| 坦克 (Tank) | +1 armor per 5 levels | Reach wave 10 |
| 狂战士 (Berserker) | +3% damage per kill | Reach wave 20 |

## Meta-Progression

Earn **gene points** from each run (based on materials collected and wave reached). Spend them on permanent upgrades:

- HP (+10/level, 10 levels)
- Armor (+1/level, 5 levels)
- Speed (+5/level, 10 levels)
- Damage (+5%/level, 10 levels)
- Dodge (+1%/level, 5 levels)
- HP Regen (1 level, 3 HP/s)

Persisted in browser localStorage.

## Project Structure

```
src/
├── config.ts              # All game config (weapons, enemies, waves, items, evolutions)
├── types.ts               # Shared TypeScript types
├── main.ts                # Phaser game bootstrap
├── entities/
│   ├── Player.ts          # Player state, weapons, abilities
│   ├── EnemyManager.ts    # Enemy pool, spawning, AI behaviors
│   └── ProjectileManager.ts  # Bullet pool and collision
├── scenes/
│   ├── BootScene.ts       # Asset generation
│   ├── TitleScene.ts      # Title screen + meta-progression
│   ├── CharacterSelectScene.ts  # Character selection
│   └── GameScene.ts       # Core game loop (waves, combat, shop)
├── ui/
│   ├── HUD.ts             # In-game HUD
│   ├── ShopUI.ts          # Between-wave shop
│   ├── LevelUpUI.ts       # Level-up reward selection
│   ├── GameOverUI.ts      # Death screen
│   ├── VictoryUI.ts       # Victory screen
│   ├── SettingsUI.ts      # Settings panel
│   └── Tutorial.ts        # First-time tutorial overlay
└── utils/
    ├── MetaProgress.ts    # Gene points, upgrades, character unlocks
    ├── Achievements.ts    # Achievement tracking
    ├── AudioManager.ts    # Audio management
    ├── EffectsManager.ts  # Visual effects
    └── Settings.ts        # Settings persistence
```

## Tech Stack

- [Phaser 3](https://phaser.io/) — Game framework
- [TypeScript](https://www.typescriptlang.org/) — Language
- [Vite 5](https://vitejs.dev/) — Build tool