# 🤝 Contributing to SynapseX (ADEIP)

Thank you for your interest in contributing to **SynapseX / ADEIP**! We welcome contributions of all kinds, whether it's fixing bugs, improving documentation, adding new features, or optimizing performance.

This guide provides a comprehensive, step-by-step walkthrough to get you from zero to submitting your first Pull Request (PR).

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Step 1: Fork the Repository](#step-1-fork-the-repository)
3. [Step 2: Clone Your Fork](#step-2-clone-your-fork)
4. [Step 3: Set Up Remotes (Upstream)](#step-3-set-up-remotes-upstream)
5. [Step 4: Set Up Local Development Environment](#step-4-set-up-local-development-environment)
   - [Backend Setup (FastAPI & Python)](#backend-setup)
   - [Frontend Setup (React & Vite)](#frontend-setup)
6. [Step 5: Run the Project Locally](#step-5-run-the-project-locally)
7. [Step 6: Create a New Branch](#step-6-create-a-new-branch)
8. [Step 7: Make Your Changes](#step-7-make-your-changes)
9. [Step 8: Stage and Commit Changes](#step-8-stage-and-commit-changes)
10. [Step 9: Keep Your Branch in Sync](#step-9-keep-your-branch-in-sync)
11. [Step 10: Push to GitHub](#step-10-push-to-github)
12. [Step 11: Create a Pull Request (PR)](#step-11-create-a-pull-request-pr)
13. [Coding Guidelines & Best Practices](#-coding-guidelines--best-practices)

---

## 🛠 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
- **Node.js (v18+) and npm**: [Download Node.js](https://nodejs.org/)
- **Code Editor**: [VS Code](https://code.visualstudio.com/) (recommended)

---

## Step 1: Fork the Repository

A fork is a personal copy of the project repository on your GitHub account.

1. Navigate to the main repository page on GitHub: `https://github.com/prajwal2430/SynapseX` (or the project's repository URL).
2. Click the **Fork** button at the top-right corner of the page.
3. Choose your personal GitHub account as the destination.
4. Click **Create fork**.

---

## Step 2: Clone Your Fork

Clone your forked repository to your local machine:

```bash
# Replace <YOUR-USERNAME> with your GitHub username
git clone https://github.com/<YOUR-USERNAME>/SynapseX.git

# Navigate into the project folder
cd SynapseX
```

---

## Step 3: Set Up Remotes (Upstream)

Configure an `upstream` remote pointing to the original repository. This allows you to easily sync future changes made to the main project.

```bash
# Add upstream remote (replace with original repo URL if different)
git remote add upstream https://github.com/prajwal2430/SynapseX.git

# Verify that both 'origin' (your fork) and 'upstream' (original) are configured
git remote -v
```

---

## Step 4: Set Up Local Development Environment

SynapseX consists of a **FastAPI backend** and a **React (Vite) frontend**.

### Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   - **Windows (PowerShell/CMD):**
     ```bash
     python -m venv venv
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     ```

3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   ```bash
   # Copy sample environment configuration
   cp .env.example .env
   ```
   *(On Windows CMD, run `copy .env.example .env`)*. Edit `.env` if you need custom database or API keys.

---

### Frontend Setup

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

---

## Step 5: Run the Project Locally

### Method A: One-Click Startup (Windows)
From the root directory `SynapseX/`, double-click or run:
```cmd
start.bat
```

### Method B: Manual Startup

**Terminal 1 — Backend:**
```bash
cd backend
# Make sure your virtual environment is active!
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Accessing the Applications
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Step 6: Create a New Branch

Never work directly on the `main` or `master` branch. Always create a dedicated branch for your change:

```bash
# Make sure you are on the latest main branch
git checkout main
git pull upstream main

# Create and switch to a new branch
git checkout -b <branch-type>/<short-description>
```

### Branch Naming Conventions:
- `feat/add-evidence-export` (for new features)
- `fix/timeline-date-parsing` (for bug fixes)
- `docs/update-contributing-guide` (for documentation)
- `refactor/clean-agent-logic` (for code refactoring)
- `test/add-auth-tests` (for test additions)

---

## Step 7: Make Your Changes

1. Write clean, readable, and well-documented code.
2. Follow existing code style and naming conventions.
3. Test your changes locally to ensure existing features are not broken:
   ```bash
   # In backend/ (with venv active)
   pytest

   # In frontend/
   npm run build
   ```

---

## Step 8: Stage and Commit Changes

Check your modified files and commit them with a clear, descriptive message:

```bash
# Check modified and untracked files
git status

# Stage specific files (or all changes)
git add <file1> <file2>
# Or stage all:
git add .

# Commit with a descriptive conventional commit message
git commit -m "feat(timeline): add filter by evidence type"
```

### Recommended Commit Message Format:
- `feat: ...` for a new feature
- `fix: ...` for a bug fix
- `docs: ...` for documentation changes
- `style: ...` for formatting, missing semicolons, etc.
- `refactor: ...` for refactoring production code
- `test: ...` for adding or modifying tests

---

## Step 9: Keep Your Branch in Sync

If changes were merged into the main repository while you were working, rebase your branch to keep it up to date:

```bash
# Fetch latest changes from the upstream repository
git fetch upstream

# Rebase your current branch on top of upstream main
git rebase upstream/main
```
*(If there are merge conflicts, resolve them, run `git add <resolved-files>`, and continue with `git rebase --continue`)*.

---

## Step 10: Push to GitHub

Push your branch to your forked repository (`origin`):

```bash
git push -u origin <your-branch-name>
```

*(If you rebased after a previous push to the branch, you may need `git push -u origin <your-branch-name> --force-with-lease`)*.

---

## Step 11: Create a Pull Request (PR)

1. Go to your repository on GitHub: `https://github.com/<YOUR-USERNAME>/SynapseX`.
2. You will see a banner: **"Compare & pull request"**. Click it!
   *(Or go to the **Pull requests** tab > **New pull request**)*.
3. Ensure the base repository is `prajwal2430/SynapseX` (`main`) and compare branch is your fork's branch.
4. Fill in the Pull Request template:
   - **Title**: Short summary of your change (e.g. `feat: implement CCTV frame extraction`)
   - **Description**: Explain what changes were made, why, and any testing steps.
   - **Linked Issues**: Reference any related issues (e.g., `Fixes #12`).
5. Click **Create pull request**.
6. Wait for maintainers to review your code. If changes are requested, simply make edits locally, commit, and push again—the PR will update automatically!

---

## 🌟 Coding Guidelines & Best Practices

- **Keep Pull Requests Focused**: Keep PRs small and focused on a single topic. Avoid combining unrelated fixes into one PR.
- **Python Code Style**: Follow PEP 8 guidelines. Keep type hints where applicable (`pydantic`, `FastAPI`).
- **Frontend Code Style**: Use functional React components and reusable UI components.
- **Do NOT Commit Sensitive Data**: Never commit `.env` files, credentials, secrets, or large raw binary datasets.

---

🎉 **Thank you for making SynapseX better! Happy coding!**
