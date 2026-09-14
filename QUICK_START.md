# Quick Start: GitHub + Local Development

## Prerequisites
- GitHub account (free at github.com)
- Node.js 20+ installed on your computer
- Git installed on your computer

---

## A: Create GitHub Repository (Web Browser)

1. Go to [github.com](https://github.com) and log in
2. Click **+** (top right) → **New repository**
3. Fill in:
   ```
   Repository name: delphitown-v1
   Description: Town management game with animated citizens
   Visibility: Private (or Public if you prefer)
   DO NOT check "Initialize with README"
   ```
4. Click **Create repository**
5. **Copy the repository URL** from the page (looks like):
   ```
   https://github.com/YOUR_USERNAME/delphitown-v1.git
   ```

---

## B: Push Code to GitHub (Your Computer Terminal)

Open terminal/command prompt and run:

```bash
# Navigate to project (adjust path if needed)
cd /path/to/delphitown-work

# Add GitHub remote (replace URL with your copied URL)
git remote add origin https://github.com/YOUR_USERNAME/delphitown-v1.git

# Rename branch to main (GitHub standard)
git branch -M main

# Push all code to GitHub
git push -u origin main
```

**Example with actual values:**
```bash
cd ~/projects/delphitown-work
git remote add origin https://github.com/ryan-collectibles/delphitown-v1.git
git branch -M main
git push -u origin main
```

---

## C: Verify CI/CD Running (GitHub Web)

1. Go to your GitHub repo: `github.com/YOUR_USERNAME/delphitown-v1`
2. Click **Actions** tab (top menu)
3. You should see a workflow named "Build & Test"
4. It will show:
   - 🟡 Yellow = Building...
   - ✅ Green = Build passed! 
   - ❌ Red = Build failed (see details)

**Wait ~30-60 seconds for it to complete.**

---

## D: Setup Local Development (Your Computer)

Once GitHub is confirmed working:

```bash
# Navigate to project
cd /path/to/delphitown-work

# Install dependencies locally
npm install

# Start dev server
npm run dev
```

You'll see:
```
  VITE v5.2.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Your browser will open automatically. 

---

## E: Test the Application

In the browser at `http://localhost:5173/`:

### What You'll See:
- **Header:** "DelphiTown v1" with Day counter, Time, Test button
- **Left Sidebar:** Worker Panel showing 5 citizens (Astra, Bron, Calis, Doria, Elian)
- **Center:** Game placeholder (TownGrid coming v1.1)
- **Right Sidebar:** Settings panel with controls
- **Bottom:** Resources and citizen count

### Quick Tests:
1. **Click on a citizen** in the Worker Panel → should highlight
2. **Try color preset dropdown** → should change character colors
3. **Adjust settings sliders** → should update values
4. **Test Animation Mode**:
   - Click "Test Animations →" button in header
   - Click animation state buttons (idle, walk, work, etc.)
   - Use arrow pad for 8-directional movement
   - Verify sprite renders correctly at 32×32
   - Test color presets and animation speed

### Known Status:
- ✅ Components render correctly
- ✅ No console errors
- ✅ Responsive on mobile (shrink browser window)
- ⏳ Animations display and run
- 🏗️ TownGrid canvas = placeholder for v1.1

---

## F: Make Changes & Commit

When you make changes:

```bash
# See what changed
git status

# Stage changes
git add .

# Commit with message
git commit -m "feat: add your feature description"

# Push to GitHub
git push origin main
```

**GitHub Actions automatically:**
- Installs dependencies
- Runs type-check
- Builds project
- Reports ✅/❌ in Actions tab

---

## Common Commands

```bash
# Start dev server
npm run dev

# Check for TypeScript errors
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# See commit history
git log --oneline

# Push commits to GitHub
git push origin main

# Pull latest from GitHub
git pull origin main
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Run `npm cache clean --force` then try again |
| Port 5173 in use | Run `npm run dev -- --port 5174` |
| Build fails locally | Run `npm run type-check` to see errors |
| CI/CD shows ❌ | Click build in Actions tab to see error details |
| Can't push to GitHub | Check you have internet, try `git push -u origin main` |

---

## Success Checklist

- [ ] GitHub repo created
- [ ] Code pushed to GitHub (`git push` succeeded)
- [ ] GitHub Actions shows ✅ "Build passed"
- [ ] `npm install` completed locally
- [ ] `npm run dev` started server
- [ ] Browser shows DelphiTown app
- [ ] Can click on citizens to select
- [ ] Can adjust settings
- [ ] Animation test mode works

**Once all checked:** You're ready for development! 🎉

---

## Next: Start Building v1.1

Once verified working, you can:
1. Create feature branches: `git checkout -b feature/town-grid`
2. Implement TownGrid canvas rendering
3. Add Building component
4. Implement AI citizen behavior
5. Every push auto-tested by GitHub Actions

---

## Need Help?

When something doesn't work:
1. Check error message carefully
2. Search README.md and SETUP_GITHUB.md
3. Try the Troubleshooting table above
4. Run `npm run type-check` to find TypeScript errors
5. Post the error message and I'll help debug

Good luck! 🚀
