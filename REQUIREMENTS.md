# 📋 SynapseX (ADEIP) — System Requirements & Setup Guide

This document specifies the exact **system prerequisites**, **environment configurations**, and a **step-by-step setup guide** to run SynapseX (ADEIP) on any machine without errors.

---

## 🖥️ System & Hardware Prerequisites

| Requirement | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, Ubuntu 20.04+, macOS 12+ | Windows 11 / Ubuntu 22.04 LTS / macOS Sonoma |
| **Python** | Python **3.10, 3.11, or 3.12** | Python **3.11** |
| **Node.js & npm** | Node.js **v18.x** or higher, npm **v9.x+** | Node.js **v20.x LTS**, npm **v10.x** |
| **Git** | Git **2.30+** | Git **Latest** |
| **RAM** | 8 GB | 16 GB |
| **Disk Space** | 2 GB free space | 5 GB free space |

---

## ⚠️ Why the "Dashboard API Error" Happened on Other Laptops

If your laptop shows the dashboard properly but **another laptop shows "Dashboard API Error (500 Internal Server Error)"**, the reason is:

> **The other laptop is running outdated backend code.**
> In earlier versions, `case_service.py` tried to read a non-existent database field (`f.confidence_tier`), which caused an unhandled 500 error when loading case telemetry.
> 
> **Fix**: The main repository must be pushed to GitHub (`git push origin main`), and the other laptop must pull the latest commits (`git pull origin main`).

---

## 🚀 Complete Step-by-Step Setup Guide (For New Devices)

Follow these exact steps to set up and run the project from scratch on any new machine.

### Step 1: Clone / Pull the Latest Repository Code

```bash
# On the new laptop, clone the repository
git clone https://github.com/prajwal2430/SynapseX.git
cd SynapseX

# If already cloned, ensure all latest fixes are pulled:
git pull origin main
```

---

### Step 2: Backend Setup (FastAPI & Python)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   - **Windows:**
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
   - **Windows (Command Prompt):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Upgrade `pip` and install all required Python packages:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. Create the environment file:
   - **Windows:**
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```

---

### Step 3: Frontend Setup (React & Vite)

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install all Node dependencies:
   ```bash
   npm install
   ```

---

### Step 4: Run the Application

#### Option A: 1-Click Launch (Windows)
From the project root directory `SynapseX/`, double-click or run:
```cmd
start.bat
```

#### Option B: Manual Terminal Execution (All Platforms)

- **Terminal 1 (Backend):**
  ```bash
  cd backend
  # Make sure virtual environment is active (venv)
  python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```

- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🌐 Verified Service URLs & Default Credentials

| Component | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main Investigator Interface |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Core FastAPI Services |
| **Swagger API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Interactive API Testing |
| **ReDoc Documentation** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Clean API Specifications |

### Default Login Accounts (Auto-Seeded on First Run)
- **Role**: Lead Investigator / Admin
- **Email**: `admin@adeip.internal`
- **Password**: `Investigator@2026!`

---

## 🛠️ Common Errors & Troubleshooting

### 1. `Dashboard API Error: An internal server error occurred (500)`
- **Cause**: Outdated `backend/app/services/case_service.py` or `frontend/src/pages/Timeline.jsx`.
- **Solution**:
  1. On your machine: Run `git push origin main`.
  2. On the other laptop: Run `git pull origin main`.
  3. Restart the backend server.

---

### 2. `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled` (Windows PowerShell)
- **Cause**: Windows PowerShell default script execution policy.
- **Solution**: Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
  *Or run npm commands via Command Prompt (`cmd.exe /c npm run dev`).*

---

### 3. `Port 8000 or 5173 is already in use`
- **Cause**: A previous Uvicorn or Vite process is still running in the background.
- **Solution (Windows)**:
  ```powershell
  # Find and kill process on port 8000
  netstat -ano | findstr :8000
  taskkill /PID <PID> /F

  # Find and kill process on port 5173
  netstat -ano | findstr :5173
  taskkill /PID <PID> /F
  ```
- **Solution (macOS / Linux)**:
  ```bash
  kill -9 $(lsof -t -i:8000)
  kill -9 $(lsof -t -i:5173)
  ```

---

### 4. `Unable to connect to the ADEIP server` (Frontend Network Error)
- **Cause**: The backend FastAPI server is not started or running on a different port.
- **Solution**: Ensure `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` is running in `backend/` without errors.

---

### 5. `Database Tables Missing or Integrity Errors`
- **Cause**: Corrupted local SQLite database.
- **Solution**:
  ```bash
  # In backend/ directory:
  # The database tables are automatically verified and re-created upon server startup.
  # If needed, delete the local `adeip.db` and restart uvicorn to re-seed fresh tables.
  ```

---

## ✅ Verification Checklist

Before sharing the project with team members or contributors, ensure:
1. `git status` shows all changes are committed and pushed to GitHub.
2. `pytest tests/` in `backend/` passes 100% of tests.
3. `npm run build` in `frontend/` compiles with zero errors.
4. `http://localhost:5173` loads the Dashboard, Investigations, Evidence, and Timeline tabs without blank screens or 500 errors.
