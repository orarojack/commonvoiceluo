@echo off
REM Database Setup Batch Script for Voice Platform
REM Run this script to set up your database with all necessary tables and data

echo ===============================================
echo    Voice Platform Database Setup
echo ===============================================
echo.

REM Check if connection string is provided
if "%1"=="" (
    echo ERROR: Please provide database connection details
    echo.
    echo Usage: setup_database.bat "your-connection-string" "database-name"
    echo.
    echo Example:
    echo   setup_database.bat "postgresql://user:pass@localhost:5432/dbname" "voice_platform"
    echo.
    echo OR
    echo.
    echo   setup_database.bat "postgresql://user:pass@host:5432/database" "voice_platform"
    echo.
    pause
    exit /b 1
)

REM Check if database name is provided
if "%2"=="" (
    echo ERROR: Please provide database name
    echo.
    echo Usage: setup_database.bat "your-connection-string" "database-name"
    echo.
    echo Example:
    echo   setup_database.bat "postgresql://user:pass@localhost:5432/dbname" "voice_platform"
    echo.
    pause
    exit /b 1
)

set CONNECTION_STRING=%1
set DATABASE_NAME=%2

echo Connection: %CONNECTION_STRING%
echo Database: %DATABASE_NAME%
echo Schema File: complete_database_setup.sql
echo.

REM Check if psql is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: psql command not found
    echo Please ensure PostgreSQL client tools are installed
    echo Download from: https://www.postgresql.org/download/
    echo.
    pause
    exit /b 1
)

REM Check if SQL file exists
if not exist "complete_database_setup.sql" (
    echo ERROR: complete_database_setup.sql file not found
    echo Please ensure the SQL setup file is in the same directory
    echo.
    pause
    exit /b 1
)

echo Executing database setup...
echo.

REM Execute the SQL file
psql "%CONNECTION_STRING%" -f "complete_database_setup.sql"

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    Database Setup Completed Successfully!
    echo ===============================================
    echo.
    echo Tables created:
    echo   - users (with demographic fields and constituency)
    echo   - recordings
    echo   - reviews
    echo.
    echo Sample users created:
    echo   - admin@commonvoice.org (admin user)
    echo   - reviewer@example.com (active reviewer)
    echo   - pending@example.com (pending reviewer)
    echo   - contributor@example.com (contributor)
    echo   - alice@example.com (contributor)
    echo.
    echo Sample recordings and reviews have been created for testing
    echo.
    echo Next steps:
    echo   1. Update your application's database connection settings
    echo   2. Test login functionality with the created users
    echo   3. Begin using the Voice Platform application
    echo.
) else (
    echo.
    echo ===============================================
    echo    Database Setup Failed!
    echo ===============================================
    echo.
    echo Please check your connection string and try again
    echo Make sure you have permission to create tables
    echo and your PostgreSQL server is running
    echo.
)

echo Setup completed at: %date% %time%
echo.
pause
