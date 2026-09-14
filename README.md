# DelphiTown v1

Town management game with animated citizens, built with React + TypeScript.

## Quick Start

### Prerequisites
- Node.js 20+ ([download](https://nodejs.org/))
- npm (comes with Node.js)
- Git

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd delphitown-work

# Install dependencies
npm install

# Start dev server (opens in browser at http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
src/
├── App.tsx              # Main application entry point
├── components/          # React components
│   ├── CharacterSheet.tsx       # Sprite rendering
│   ├── Citizen.tsx              # Individual worker display
│   ├── WorkerPanel.tsx          # Worker management panel
│   ├── Settings.tsx             # Game settings panel
│   ├── CharacterAnimationTest.tsx # Animation test harness
│   └── TownGrid.tsx             # Game world (v1.1 placeholder)
├── styles/              # Component stylesheets
├── types/               # TypeScript interfaces
│   └── game.ts          # Game state and entity types
├── constants/           # Game constants
│   └── colors.ts        # 23-color palette
├── utils/               # Utility functions
│   ├── AnimationPlayer.ts       # Animation state machine
│   └── CharacterColorMapper.ts  # Sprite color remapping
└── main.tsx             # React entry point
```

## Testing

### Manual Testing (Browser)
1. Run `npm run dev`
2. Navigate to `http://localhost:5173`
3. Use **CharacterAnimationTest** component to verify:
   - ✅ Sprite rendering at 32×32
   - ✅ All animation states (idle, walk, work, etc.)
   - ✅ 8-directional movement
   - ✅ Color preset selector
   - ✅ Animation speed controls
   - ✅ Citizens display in WorkerPanel
   - ✅ Settings controls work
   - ✅ Responsive layout on mobile
   - ✅ No console errors
   - ✅ Performance is smooth

### Automated Testing (CI/CD)
GitHub Actions automatically:
- Installs dependencies
- Runs TypeScript type checking
- Builds the project
- Uploads build artifacts

**Triggered on:**
- Every push to `main`, `master`, or `develop`
- Every pull request

**View results:**
- Go to [GitHub repo] → **Actions** tab
- See build status ✅/❌
- Download build artifacts

## Build & CI/CD

This project uses GitHub Actions for continuous integration:

```
You write code
    ↓
Push to GitHub
    ↓
GitHub Actions automatically:
  - npm install
  - npm run type-check
  - npm run build
    ↓
Results visible in GitHub Actions tab
  - ✅ Build passed or ❌ Failed
  - Build artifacts (.zip of dist/)
```

**Why CI/CD helps:**
- No npm registry blocked (GitHub's servers have unrestricted access)
- Automatic verification every push
- Confidence code compiles before merging
- Shareable build artifacts
- Works across all your devices

## Development Workflow

### Feature Development
```bash
# Create a branch for your feature
git checkout -b feature/new-feature

# Make changes, test locally
npm run dev

# Type check and build before committing
npm run type-check
npm run build

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create pull request on GitHub
# (optional: CI/CD will auto-test it)

# Merge when ready
```

### Git Commit Workflow
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add citizen animation state machine

- Implement 8-directional sprite animation
- Add animation state transitions
- Update character preview with new states"

# Push to GitHub
git push origin main
```

## Assets

All visual assets are locked for v1:
- **Mana Seed Farmer sprite** (sprite sheet system)
- **DelphiTown 23-color palette** (locked, no external colors)
- **RPG Essentials SFX** (audio assets)

Assets are stored in `/assets` directory with accompanying documentation.

## Version Roadmap

### ✅ v1 (Complete)
- Visual assets locked
- Animation system (8-directional, state machine)
- Character rendering (32×32 sprites)
- Component architecture
- Responsive UI layout
- TypeScript types & interfaces

### 📋 v1.1 (Planned)
- TownGrid canvas rendering
- Building system & placement
- AI citizen behavior (roles, tasks, rules)
- Pathfinding & movement
- Task assignment system
- Fog of war
- Minimap

### 📋 v2+ (Future)
- Save/load system
- Multiplayer
- Advanced AI
- Economic simulation
- Building progression
- Citizen relationships

## Troubleshooting

### npm install fails
- Ensure Node.js 20+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and try again: `rm -rf node_modules && npm install`

### Port 5173 already in use
- Change port: `npm run dev -- --port 5174`
- Or kill process using port 5173

### TypeScript errors
- Run type-check: `npm run type-check`
- Fix reported errors before building

### Build fails
- Check for TypeScript errors: `npm run type-check`
- Ensure all imports are correct
- Check console output for specific error

## Contributing

When adding new features:
1. Keep components modular and focused
2. Add TypeScript types for all props
3. Test responsiveness (mobile, tablet, desktop)
4. Update this README if structure changes
5. Commit with descriptive messages
6. Push to feature branch, create PR

## License

Personal project. All rights reserved.

## Contact

Ryan (MaskawiziAI@gmail.com)

---

**Last updated:** September 14, 2026
**Status:** Foundation locked, v1.1 development ready
