@echo off
echo ========================================
echo LinkedIn Bot Setup Script (Windows)
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo.

echo ========================================
echo Installing Backend Dependencies...
echo ========================================
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend installation failed
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

echo ========================================
echo Installing Frontend Dependencies...
echo ========================================
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend installation failed
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

echo ========================================
echo Setting up environment files...
echo ========================================
cd ..

REM Backend .env
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo [OK] Created backend\.env (please edit with your credentials)
) else (
    echo [WARNING] backend\.env already exists
)

REM Frontend .env.local
if not exist frontend\.env.local (
    copy frontend\.env.local.example frontend\.env.local
    echo [OK] Created frontend\.env.local
) else (
    echo [WARNING] frontend\.env.local already exists
)
echo.

echo ========================================
echo Setting up database...
echo ========================================
cd backend

REM Generate Prisma client
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Prisma generate failed
    pause
    exit /b 1
)
echo [OK] Prisma client generated
echo.

REM Run migrations
echo Running database migrations...
call npx prisma migrate dev --name init
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database migration failed. Make sure PostgreSQL is running and DATABASE_URL is correct.
) else (
    echo [OK] Database migrations completed
)

cd ..
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Edit backend\.env with your credentials:
echo    - OPENAI_API_KEY
echo    - LINKEDIN_EMAIL and LINKEDIN_PASSWORD
echo    - DATABASE_URL (if not using default)
echo.
echo 2. Start the backend:
echo    cd backend
echo    npm run dev
echo.
echo 3. Start the frontend (in a new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open http://localhost:3000 in your browser
echo.
echo 5. Go to Settings and test your connections
echo.
echo Happy automating!
echo.
pause
