# Database Setup Script for Voice Platform
# This PowerShell script executes the complete database setup

param(
    [string]$ConnectionString = "",
    [string]$DatabaseName = "",
    [string]$SchemaFile = "complete_database_setup.sql"
)

Write-Host "=== Voice Platform Database Setup ===" -ForegroundColor Green
Write-Host "Setting up database tables and seeding initial data..." -ForegroundColor Yellow

# Check if psql is available
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "Error: psql command not found. Please ensure PostgreSQL client tools are installed." -ForegroundColor Red
    Write-Host "You can download PostgreSQL from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Validate input parameters
if ([string]::IsNullOrEmpty($ConnectionString)) {
    Write-Host "Please provide a database connection string." -ForegroundColor Red
    Write-Host "Example usage:" -ForegroundColor Yellow
    Write-Host ".\setup_database.ps1 -ConnectionString 'postgresql://username:password@host:port/database'" -ForegroundColor Cyan
    exit 1
}

if ([string]::IsNullOrEmpty($DatabaseName)) {
    Write-Host "Please provide a database name." -ForegroundColor Red
    Write-Host "Example usage:" -ForegroundColor Yellow
    Write-Host ".\setup_database.ps1 -ConnectionString 'postgresql://username:password@host:port/database' -DatabaseName 'voice_platform'" -ForegroundColor Cyan
    exit 1
}

# Check if SQL file exists
if (!(Test-Path $SchemaFile)) {
    Write-Host "Error: SQL file '$SchemaFile' not found." -ForegroundColor Red
    exit 1
}

Write-Host "Connection String: $ConnectionString" -ForegroundColor Cyan
Write-Host "Database Name: $DatabaseName" -ForegroundColor Cyan
Write-Host "Schema File: $SchemaFile" -ForegroundColor Cyan
Write-Host ""

# Execute the SQL file
Write-Host "Executing database setup..." -ForegroundColor Yellow
try {
    $result = psql "$ConnectionString" -f "$SchemaFile" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host "Your Voice Platform database is ready to use." -ForegroundColor Green
        
        # Show summary
        Write-Host ""
        Write-Host "=== Setup Summary ===" -ForegroundColor Green
        Write-Host "Tables created:" -ForegroundColor Yellow
        Write-Host "  • users (with demographic fields)" -ForegroundColor White
        Write-Host "  • recordings" -ForegroundColor White
        Write-Host "  • reviews" -ForegroundColor White
        
        Write-Host ""
        Write-Host "Sample users created:" -ForegroundColor Yellow
        Write-Host "  • admin@commonvoice.org (admin)" -ForegroundColor White
        Write-Host "  • reviewer@example.com (reviewer)" -ForegroundColor White
        Write-Host "  • pending@example.com (pending reviewer)" -ForegroundColor White
        Write-Host "  • contributor@example.com (contributor)" -ForegroundColor White
        Write-Host "  • alice@example.com (contributor)" -ForegroundColor White
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Update your application's database connection settings" -ForegroundColor White
        Write-Host "  2. Test the login functionality" -ForegroundColor White
        Write-Host "  3. Begin using the Voice Platform application" -ForegroundColor White
        
    } else {
        Write-Host "❌ Database setup failed!" -ForegroundColor Red
        Write-Host "Error details:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Failed to execute database setup!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup completed at: $(Get-Date)" -ForegroundColor Cyan
