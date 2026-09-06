@echo off
title SynapseX — Dev Launcher
color 0A
echo.
echo  ================================================================
echo   SynapseX — Full-Stack Development Launcher
echo   Autonomous Digital Evidence Intelligence Platform
echo  ================================================================
echo.

:: ──────────────────────────────────────────────────────────────────
:: 1. Docker Infrastructure (MongoDB, Redis, Neo4j, MinIO)
:: ──────────────────────────────────────────────────────────────────
echo  [1/5] Starting Docker Infrastructure (MongoDB, Redis, Neo4j, MinIO)...
cd /d "%~dp0infrastructure"
start cmd /k "title SynapseX Infrastructure && color 0E && docker compose up -d mongodb redis neo4j minio minio-init && echo. && echo  Infrastructure containers started. && echo  Waiting for health checks... && timeout /t 10 /nobreak >nul && docker compose ps && pause"

:: ──────────────────────────────────────────────────────────────────
:: 2. Backend — Legacy FastAPI + Uvicorn (Port 8000)
:: ──────────────────────────────────────────────────────────────────
echo  [2/5] Starting Backend (FastAPI + Uvicorn) on port 8000...
cd /d "%~dp0backend"
start cmd /k "title SynapseX Backend (FastAPI) && color 0B && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: ──────────────────────────────────────────────────────────────────
:: 3. API — NestJS Enterprise API (Port 3001)
:: ──────────────────────────────────────────────────────────────────
echo  [3/5] Starting API (NestJS) on port 3001...
cd /d "%~dp0api"
start cmd /k "title SynapseX API (NestJS) && color 0D && npm run start:dev"

:: ──────────────────────────────────────────────────────────────────
:: 4. AI Service — FastAPI + LangGraph (Port 8001)
:: ──────────────────────────────────────────────────────────────────
echo  [4/5] Starting AI Service (FastAPI + LangGraph) on port 8001...
cd /d "%~dp0ai-service"
start cmd /k "title SynapseX AI Service && color 0C && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"

:: ──────────────────────────────────────────────────────────────────
:: 5. Frontend — React + Vite (Port 5173)
:: ──────────────────────────────────────────────────────────────────
echo  [5/5] Starting Frontend (React + Vite) on port 5173...
cd /d "%~dp0frontend"
start cmd /k "title SynapseX Frontend && color 0A && npm run dev"

:: ──────────────────────────────────────────────────────────────────
:: Wait and open browser
:: ──────────────────────────────────────────────────────────────────
timeout /t 6 /nobreak >nul
start http://localhost:5173

echo.
echo  ================================================================
echo   All services launched successfully!
echo  ================================================================
echo.
echo   Infrastructure:
echo     MongoDB ........... localhost:27017
echo     Redis ............. localhost:6379
echo     Neo4j Browser ..... http://localhost:7474
echo     MinIO Console ..... http://localhost:9001
echo.
echo   Backend Services:
echo     Backend (FastAPI) . http://127.0.0.1:8000
echo     Backend Docs ...... http://127.0.0.1:8000/docs
echo     API (NestJS) ...... http://localhost:3001
echo     API Swagger ....... http://localhost:3001/api/docs
echo     AI Service ........ http://127.0.0.1:8001
echo     AI Service Docs ... http://127.0.0.1:8001/docs
echo.
echo   Frontend:
echo     Frontend (Vite) ... http://localhost:5173
echo.
echo  ================================================================
echo   Close the terminal windows to stop individual services.
echo   Run 'docker compose down' in /infrastructure to stop infra.
echo  ================================================================
echo.
pause
