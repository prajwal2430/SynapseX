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
echo  [1/4] Starting Docker Infrastructure (MongoDB, Redis, Neo4j, MinIO)...
cd /d "%~dp0infrastructure"
start cmd /k "title SynapseX Infrastructure && color 0E && docker compose up -d mongodb redis neo4j minio minio-init && echo. && echo  Infrastructure containers started. && echo  Waiting for health checks... && timeout /t 10 /nobreak >nul && docker compose ps && pause"

:: ──────────────────────────────────────────────────────────────────
:: 2. API — NestJS Enterprise Core Backend (Port 3001)
:: ──────────────────────────────────────────────────────────────────
echo  [2/4] Starting Core API (NestJS) on port 3001...
cd /d "%~dp0api"
start cmd /k "title SynapseX Core API (NestJS) && color 0D && if not exist "node_modules" (echo Installing API dependencies... && npm install) && npm run start:dev"

:: ──────────────────────────────────────────────────────────────────
:: 3. AI Service — FastAPI + LangGraph (Port 8001)
:: ──────────────────────────────────────────────────────────────────
echo  [3/4] Starting AI Service (FastAPI + LangGraph) on port 8001...
cd /d "%~dp0ai-service"
start cmd /k "title SynapseX AI Service (FastAPI) && color 0C && (if exist ".venv\Scripts\activate.bat" (call .venv\Scripts\activate.bat) else if exist "venv\Scripts\activate.bat" (call venv\Scripts\activate.bat)) && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"

:: ──────────────────────────────────────────────────────────────────
:: 4. Client — React 19 + Vite Frontend (Port 5173)
:: ──────────────────────────────────────────────────────────────────
echo  [4/4] Starting Client (React + Vite) on port 5173...
cd /d "%~dp0client"
start cmd /k "title SynapseX Client (React) && color 0A && if not exist "node_modules" (echo Installing Client dependencies... && npm install) && npm run dev"

:: ──────────────────────────────────────────────────────────────────
:: Wait and open browser
:: ──────────────────────────────────────────────────────────────────
timeout /t 6 /nobreak >nul
start http://localhost:5173

echo.
echo  ================================================================
echo   All target services launched successfully!
echo  ================================================================
echo.
echo   Infrastructure:
echo     MongoDB ........... localhost:27017
echo     Redis ............. localhost:6379
echo     Neo4j Browser ..... http://localhost:7474
echo     MinIO Console ..... http://localhost:9001
echo.
echo   Application Services:
echo     API (NestJS) ...... http://localhost:3001/api/v1
echo     API Swagger ....... http://localhost:3001/api/docs
echo     API Health ........ http://localhost:3001/api/health
echo     AI Service ........ http://127.0.0.1:8001
echo     AI Service Docs ... http://127.0.0.1:8001/docs
echo     AI Service Health . http://127.0.0.1:8001/api/v1/health
echo.
echo   Frontend:
echo     Client (Vite) ..... http://localhost:5173
echo.
echo  ================================================================
echo   Note: Legacy services ('backend' and 'frontend') have been retired.
echo   Close the terminal windows to stop individual services.
echo   Run 'docker compose down' in /infrastructure to stop infra.
echo  ================================================================
echo.
pause

