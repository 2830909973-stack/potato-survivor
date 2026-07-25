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
| 手枪 (Pistol) | Ranged | Balanced starter |
| 霰弹枪 (Shotgun) | Ranged | 5 pellets, short range |
| 冲锋枪 (SMG) | Ranged | Fast fire rate, low damage |
| 步枪 (Rifle) | Ranged | Long range, high damage |
| 狙击枪 (Sniper) | Ranged | High damage, 1 penetrate |
| 火箭筒 (Rocket) | Ranged | Splash damage 80 radius |
| 消防斧 (Fire Axe) | Melee | Slow but heavy |
| 砍刀 (Machete) | Melee | Fast melee, short range |
| 撬棍 (Crowbar) | Melee | Wide swing, high damage |
| 激光枪 (Laser) | Ranged | High fire rate, penetrates 3 enemies |
| 冰冻枪 (Freeze) | Ranged | Slows enemies on hit |

### Evolutions

Combine a weapon + shop item to create an upgraded version:

| Recipe | Result |
|---|---|---|
| 手枪 + 医疗包 | 医疗手枪 (Medical Pistol) — Heals on hit |
| 霰弹枪 + 铁盾 | 爆炸护盾 (Blast Shield) — Splash damage |
| 冲锋枪 + 咖啡 | 加特林 (Gatling) — Fast fire rate, 3 bullets |
| 步枪 + 折叠枪托 | 突击步枪 (Assault Rifle) — Balanced upgrade |
| 狙击枪 + 幸运草 | 死神之眼 (Death Eye) — Penetrates 3 enemies |
| 火箭筒 + 铁盾 | 爆破护盾 (Bomb Shield) — Bigger splash |
| 消防斧 + 跑鞋 | 旋风斩 (Whirlwind) — Wide range melee |
| 撬棍 + 幸运草 | 幸运撬棍 (Lucky Crowbar) — Higher damage |
| 砍刀 + 折叠枪托 | 战术砍刀 (Tactical Machete) — Fast melee |
| 激光枪 + 咖啡 | 激光炮 (Laser Cannon) — Penetrates 5, 2 bullets |
| 冰冻枪 + 幸运草 | 暴风雪 (Blizzard) — 3 bullets, splash slow |

### Items & Mods

- **Items** — Permanent passives (咖啡 fire rate +10%, 铁盾 armor +2, 跑鞋 speed +20, 幸运草 XP +15%, 折叠枪托 speed +15, 能量电池 laser ammo +50%, 冷却液 freeze fire rate +20%)
- **Mods** — Weapon attachments (消音器 damage +15%, 扩容弹匣 ammo +50%, 红点瞄准 range +15% spread -30%, 稳定枪托 fire rate +10%, 穿甲弹 damage +10%, 快速换弹 reload -25%, 补偿器 spread -40%, 高倍镜 range +30% fire rate -10%, 空尖弹 damage +20% range -10%)
- **Consumables** — Health packs, adrenaline (15s speed+fire rate +20%), grenades (3 per purchase)

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

7 characters with unique passives and abilities. 3 default, 4 locked — unlock by meeting in-game milestones:

| Character | Passive | Ability | Unlock |
|---|---|---|---|
| 雇佣兵 (Mercenary) | Damage +10% | 精准射击 (6s guaranteed crit) | Default |
| 特种兵 (Specialist) | Reload -20% | 速射 (4s fire rate x2) | Default |
| 消防员 (Fireman) | Armor +2 | 火焰盾 (3s invincible + burn) | Default |
| 狙击手 (Sniper) | Range +50 | 锁定 (5s enemies take +50% dmg) | 100 kills |
| 幸运儿 (Lucky) | +1 upgrade choice | 聚宝 (5s double drops) | 200 materials in one run |
| 重装兵 (Tank) | Armor +1 | 铁壁 (5s armor +10) | Reach wave 10 |
| 疯子 (Berserker) | +15% speed | 狂暴 (4s +80% fire rate +50% speed) | Reach wave 20 |

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