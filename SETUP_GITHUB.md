# Setting Up GitHub + CI/CD for DelphiTown

Complete step-by-step guide to create your GitHub repository and enable automated CI/CD.

## Step 1: Create GitHub Account (if needed)

1. Go to [github.com](https://github.com)
2. Click **Sign up**
3. Enter email: `MaskawiziAI@gmail.com` (or your preferred email)
4. Create username and password
5. Verify email

## Step 2: Create a New Repository

1. Log into GitHub
2. Click **+** icon (top right) → **New repository**
3. Fill in:
   - **Repository name:** `delphitown-v1` (or preferred name)
   - **Description:** "Town management game with animated citizens - React + TypeScript"
   - **Visibility:** 
     - `Private` if you want only you to see it
     - `Public` if you're comfortable sharing code
   - **Initialize repository:** Leave unchecked (we already have code locally)
4. Click **Create repository**

## Step 3: Add Remote & Push Local Code

You'll see a page with instructions. Follow this instead (easier):

```bash
# Navigate to your project folder
cd /home/claude/delphitown-work

# Add GitHub as remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (GitHub default)
git branch -M main

# Push all code to GitHub
git push -u origin main
```

**Example:**
```bash
# If your GitHub username is "ryan-collectibles" and repo is "delphitown-v1"
git remote add origin https://github.com/ryan-collectibles/delphitown-v1.git
git branch -M main
git push -u origin main
```

**First push may ask for authentication:**
- GitHub will prompt you to sign in
- Follow the browser prompts
- Or use a Personal Access Token (advanced option)

## Step 4: Verify CI/CD is Running

1. Go to your GitHub repository page
2. Click **Actions** tab (top menu)
3. You should see a workflow running or completed:
   - 🟡 Yellow = Currently building
   - ✅ Green = Build passed
   - ❌ Red = Build failed

If you see it, CI/CD is working! 🎉

## Step 5: Ongoing Workflow

From now on, every time you push code:

```bash
# Make changes locally
npm run dev
# ... test and verify ...

# Stage and commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin main
```

**GitHub Actions automatically:**
- ✅ Installs dependencies
- ✅ Runs type-check
- ✅ Builds the project
- ✅ Reports results (visible in Actions tab)

---

## Troubleshooting

### "fatal: remote origin already exists"
```bash
# Remove the old remote first
git remote remove origin

# Then add again
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### "authentication failed"
GitHub changed how authentication works. Use Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click **Generate new token (classic)**
3. Give it a name: "DelphiTown"
4. Check: `repo` (full control of repositories)
5. Click **Generate token**
6. Copy the token
7. When git asks for password, paste the token (not your password)

### Build shows ❌ Red
Click on the failed workflow to see error details:
1. Go to **Actions** tab
2. Click the failed build
3. Scroll down to see error message
4. Fix locally, commit, push again

### Can't see Actions tab
- Make sure you're logged in to GitHub
- Repository may still be initializing (wait 1-2 minutes)
- Refresh the page

---

## What Happens Next?

Every push triggers:
1. **GitHub Actions** downloads your code
2. Runs `npm install` (their servers have unrestricted npm access)
3. Runs `npm run type-check` (catches TypeScript errors)
4. Runs `npm run build` (builds to `/dist`)
5. Reports ✅ or ❌
6. Stores build artifacts for 30 days

**You get:**
- ✅ Automatic verification every push
- ✅ Confidence code compiles
- ✅ No npm registry blocked (GitHub servers work fine)
- ✅ Shareable artifacts
- ✅ Professional development setup

---

## For Future Apps

Once this is set up, creating another app (GTA6 tools, collectibles tracker, etc.) is easy:

1. Create new repo on GitHub
2. Copy this `.github/workflows/build.yml` to the new project
3. Update `package.json` with new app details
4. Push and CI/CD automatically works

**Same workflow for every project** = consistent, scalable development.

---

## Helpful GitHub Links

- [GitHub Docs: Creating a Repository](https://docs.github.com/en/get-started/quickstart/create-a-repo)
- [GitHub Docs: Pushing Commits](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Need help?** Message me with:
- Screenshot of the error
- Output of `git status`
- GitHub Actions build log (if applicable)

I'll help you debug.
