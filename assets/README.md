# DelphiTown v1 — Asset Library

**Locked visual and audio references for DelphiTown v1 development**

---

## Directory Structure

```
assets/
├── characters/
│   └── mana-seed-farmer/              ← Locked character sprite system
│       ├── _supporting files/
│       │   ├── farmer base animation guide.png
│       │   ├── farmer base cell reference.png
│       │   └── Mana Seed color ramps.png
│       ├── farmer base sheets/
│       │   ├── 01body/                ← Base human body
│       │   ├── 13hair/                ← Hair variations
│       │   ├── 14head/                ← Headwear (hats, hoods)
│       │   ├── 05shrt/                ← Shirts (+ female variant)
│       │   ├── 04lwr1/                ← Pants/shorts
│       │   └── ... (13 more layer types)
│       └── farmer base effects/       ← Weapons, tools, effects
│
├── audio/
│   └── rpg-sfx/                       ← Locked sound effect library
│       ├── 10_UI_Menu_SFX/            ← UI interactions (hover, confirm, etc.)
│       ├── 12_Player_Movement_SFX/    ← Footsteps, jumps, landing
│       ├── 10_Battle_SFX/             ← Combat sounds
│       ├── 8_Atk_Magic_SFX/           ← Magic/attack effects
│       └── 8_Buffs_Heals_SFX/         ← Buff/heal sounds
│
└── references/
    └── town-examples/                 ← Visual composition references
        ├── Pixel 16 v2 village free.png
        ├── tiles and items.png
        ├── interior and furniture example.bmp
        ├── town example barn hey farm.bmp
        └── town example.bmp
```

---

## Character Sprites — Mana Seed Farmer System

**Source:** Mana Seed Farmer Sprite Free Sample by Seliel  
**License:** Free to use; full pack available for purchase  
**Format:** PNG sprite sheets, 64×64 pixel cells  
**Display Size:** 32×32 pixels (scaled for DelphiTown grid)

### Key Features
- **Modular layers:** 16 distinct body part slots (body → clothing → hair → accessories)
- **Animation frames:** 200+ frames across walk, run, idle, work, and emote animations
- **8-directional:** Full directional movement (up, down, left, right, diagonals)
- **Color customization:** Ramp-based palette system for skin tone, hair color, clothing colors
- **Runtime flexibility:** All layers can be swapped independently

### Animation Library Included (Free Sample)
- **Walk cycles:** 8 directions, 4 frames each
- **Run cycles:** 8 directions, 4 frames each
- **Idle poses:** Standing, sleep, sitting
- **Work animations:** Fishing, digging, planting, chopping, climbing
- **Emotes:** Happy, sad, dizzy, surprised, thinking

### DelphiTown Color Mapping
Characters use locked 23-color palette via runtime color remapping:
- Skin tones: Mapped to mediumBrown → richBrown → darkBrown
- Hair colors: Mapped to charcoal → darkGray → stone
- Clothing: Mapped to DelphiTown palette via ramp substitution

**Relevant Components:**
- `src/utils/AnimationPlayer.ts` — Frame sequencing
- `src/utils/CharacterColorMapper.ts` — Palette remapping
- `src/components/CharacterSheet.tsx` — Sprite renderer

---

## Audio — RPG Essentials Free Sounds

**Source:** RPG Essentials Free Sounds library  
**License:** Free to use  
**Format:** WAV files, professional quality  
**Categories:** 40+ organized sound effects

### UI Menu Sounds (10_UI_Menu_SFX/)
Used for interface feedback:
- `001_Hover_01.wav` — Menu hover effect
- `013_Confirm_03.wav` — Selection/confirmation (primary action)
- `029_Decline_09.wav` — Rejection/back action
- `033_Denied_03.wav` — Invalid action feedback
- `051_use_item_01.wav` — Item use/activation
- `070_Equip_10.wav` — Equipment equipped
- `071_Unequip_01.wav` — Equipment removed
- `079_Buy_sell_01.wav` — Transaction complete
- `092_Pause_04.wav` — Game paused
- `098_Unpause_04.wav` — Game resumed

**v1 Integration:** Ready to connect to Settings panel, Dashboard buttons, WorkerPanel interactions

### Player Movement Sounds (12_Player_Movement_SFX/)
For worker/NPC footsteps and interactions:
- `03_Step_grass_03.wav` — Footstep on grass (primary for town)
- `08_Step_rock_02.wav` — Footstep on stone
- `12_Step_wood_03.wav` — Footstep on wooden floor
- `14_Step_water_02.wav` — Footstep in water
- `26_Swim_Submerged_02.wav` — Swimming motion
- `30_Jump_03.wav` — Character jump
- `42_Cling_climb_03.wav` — Climbing/climbing action
- `45_Landing_01.wav` — Landing from jump
- `52_Dive_02.wav` — Diving motion
- `56_Attack_03.wav` — Generic attack action
- `61_Hit_03.wav` — Impact/getting hit
- `88_Teleport_02.wav` — Teleportation effect

**v1 Integration:** Footsteps when workers move; expansion for future task actions

### Other Categories (Future Phases)
- **Battle SFX:** Combat interactions (v2+)
- **Magic SFX:** Attack effects (v2+)
- **Buffs/Heals:** Status effects (v2+)

---

## Town Visual References

**Source:** Community pixel art examples  
**Format:** PNG + BMP  
**Purpose:** Composition and design inspiration (NOT direct copies)

### Files
- **Pixel 16 v2 village free.png** — Complete village tileset with buildings, terrain, NPCs
- **tiles and items.png** — Furniture and decoration library
- **town example*.bmp** — Full town layout compositions (3 variations)

### Usage
- Reference for building proportions and placement
- Terrain tile variety (grass, water, stones)
- Furniture scale and arrangement
- Overall town composition balance

**Note:** DelphiTown uses locked 23-color palette; these are visual references only, not direct asset reuse.

---

## v1 Asset Checklist

**Locked & Ready for Implementation:**
- ✅ Character sprites (Mana Seed Farmer system)
- ✅ Character animations (walk, run, idle, work)
- ✅ UI sound effects (10 menu sounds)
- ✅ Movement sounds (footsteps, jumps, landing)
- ✅ Color palette mapping system
- ✅ Visual composition references

**Phase 2 (v1.1+):**
- Audio integration (SoundManager component)
- Task-specific animation sounds (dig, chop, fish)
- Combat/battle sounds
- Ambient sounds (wind, birds, water)
- Music loop (not included in free sample pack)

**Phase 3 (v2):**
- Full Mana Seed asset pack (purchase)
- Additional character customization options
- Expanded animation library
- Advanced magic/combat effects

---

## License & Attribution

### Mana Seed Farmer Sprite System
- **Creator:** Seliel (https://selieltheshaper.weebly.com/)
- **License:** Free sample; full pack available for purchase
- **Attribution:** Required in game/docs
- **Community:** https://selieltheshaper.weebly.com/discord.html

### RPG Essentials Free Sounds
- **Source:** Freesound.org / RPG Essentials pack
- **License:** Creative Commons (check individual files for restrictions)
- **Attribution:** Recommended in game/docs

### DelphiTown Visual Bible
- **Color Palette:** Custom, locked for v1
- **Composition:** Inspired by Secret of Mana, Terranigma, Stardew Valley

---

## Next Steps

1. **Component Integration:**
   - Update `Citizen.tsx` to use CharacterSheet
   - Add audio manager for UI sounds
   - Connect Settings panel to sound effects

2. **Animation Testing:**
   - Test CharacterSheet rendering at 32×32
   - Verify walk/run cycles
   - Test color preset switching

3. **Sound Integration:**
   - Hook UI sounds to button clicks
   - Test audio volume/playback

4. **First Commit:**
   - Lock visual references in git
   - Document asset usage
   - Create asset import guide for team

---

**Last Updated:** 2026-09-14  
**Version:** v1 Foundation  
**Status:** Ready for component integration ✅
