@echo off
REM Mozilla Sentences Population Script for Voice Platform
REM This batch script populates the database with sentences from Mozilla Common Voice API

echo ===============================================
echo    Voice Platform Mozilla Sentences Population
echo ===============================================
echo.

REM Check command line arguments
if "%1"=="" (
    echo Usage: populate_sentences.bat [command] [language] [max_sentences]
    echo.
    echo Commands:
    echo   mozilla  - Populate from Mozilla Common Voice API
    echo   curated  - Populate curated fallback sentences
    echo   all      - Populate both Mozilla and curated sentences
    echo   stats    - Show sentence statistics
    echo.
    echo Examples:
    echo   populate_sentences.bat all luo 1000
    echo   populate_sentences.bat mozilla en 500
    echo   populate_sentences.bat curated
    echo   populate_sentences.bat stats
    echo.
    pause
    exit /b 0
).

set COMMAND=%1
set LANGUAGE=%2
set MAX_SENTENCES=%3

if "%LANGUAGE%"=="" set LANGUAGE=luo
if "%MAX_SENTENCES%"=="" set MAX_SENTENCES=1000

echo Command: %COMMAND%
echo Language: %LANGUAGE%
echo Max Sentences: %MAX_SENTENCES%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the project root directory
    echo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
)

REM Check if population script exists
if not exist "populate_mozilla_sentences.js" (
    echo ERROR: populate_mozilla_sentences.js not found
    echo Please ensure the Mozilla population script is in the current directory
    echo.
    pause
    exit /b 1
)

REM Check environment variables
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ERROR: NEXT_PUBLIC_SUPABASE_URL environment variable not set
    echo Please set your Supabase URL:
    echo   set NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    echo.
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set
    echo Please set your Supabase service role key:
    echo   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    echo.
    pause
    exit /b 1
)

echo Environment check passed. Starting sentence population...
echo.

REM Execute the Node.js population script
echo Executing sentence population...
node populate_mozilla_sentences.js %COMMAND% %LANGUAGE% %MAX_SENTENCES%

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    Sentence Population Completed Successfully!
    echo ===============================================
    echo.
    echo Command executed: %COMMAND%
    echo Language: %LANGUAGE%
    echo Max sentences: %MAX_SENTENCES%
    echo.
    echo Next steps:
    echo   1. Verify sentences in your application
    echo   2. Test the speak page to ensure sentences load
    echo   3. Check database for sentence statistics
    echo.
) else (
    echo.
    echo ===============================================
    echo    Sentence Population Failed!
    echo ===============================================
    echo.
    echo Please check the error messages above and try again
    echo Make sure your Supabase credentials are correct
    echo.
)

echo Script completed at: %date% %time%
echo.
pause
