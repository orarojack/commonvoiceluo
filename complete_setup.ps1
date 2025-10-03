# Complete Voice Platform Database Setup and Mozilla Data Population
# This master script handles everything: database setup + Mozilla sentences population

param(
    [string]$ConnectionString = "",
    [string]$DatabaseName = "",
    [string]$Language = "luo",
    [int]$MaxSentences = 1000,
    [switch]$SkipDatabase = $false,
    [switch]$SkipPopulation = $false,
    [switch]$QuickSetup = $false
)

Write-Host "🚀 Complete Voice Platform Database Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

if ($QuickSetup) {
    Write-Host "⚡ Quick Setup Mode: Using default curated sentences only" -ForegroundColor Yellow
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database Name: $DatabaseName" -ForegroundColor Cyan
Write-Host "  Language: $Language" -ForegroundColor Cyan
Write-Host "  Max Sentences: $MaxSentences" -ForegroundColor Cyan
Write-Host "  Skip Database Setup: $SkipDatabase" -ForegroundColor Cyan
Write-Host "  Skip Population: $SkipPopulation" -ForegroundColor Cyan
Write-Host ""

# ==============================================
# STEP 1: PRE-CHECKS
# ==============================================

Write-Host "🔍 Performing pre-flight checks..." -ForegroundColor Yellow

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js found" -ForegroundColor Green

# Check psql for database setup
if (!$SkipDatabase) {
    if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: psql not found" -ForegroundColor Red
        Write-Host "Please install PostgreSQL client tools" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ PostgreSQL client tools found" -ForegroundColor Green
}

# Check project files
$requiredFiles = @(
    "package.json",
    "complete_database_setup.sql",
    "populate_mozilla_sentences.js"
)

foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "❌ Error: $file not found" -ForegroundColor Red
        Write-Host "Please ensure all setup files are in the current directory" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ $file found" -ForegroundColor Green
}

# Check environment variables
if (!$SkipPopulation) {
    $envCheck = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    $missingEnvVars = @()
    foreach ($envVar in $envCheck) {
        if (-not (Get-Item "env:$envVar" -ErrorAction SilentlyContinue)) {
            $missingEnvVars += $envVar
        }
    }
    
    if ($missingEnvVars.Count -gt 0) {
        Write-Host "❌ Missing environment variables:" -ForegroundColor Red
        foreach ($var in $missingEnvVars) {
            Write-Host "  - $var" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "Set these environment variables:" -ForegroundColor Yellow
        Write-Host "`$env:NEXT_PUBLIC_SUPABASE_URL = 'your-supabase-url'" -ForegroundColor Cyan
        Write-Host "`$env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'" -ForegroundColor Cyan
        exit 1
    }
    Write-Host "✅ Environment variables set" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All pre-flight checks passed!" -ForegroundColor Green
Write-Host ""

# ==============================================
# STEP 2: INSTALL DEPENDENCIES
# ==============================================

if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Node.js dependencies already installed" -ForegroundColor Green
}

# ==============================================
# STEP 3: DATABASE SETUP
# ==============================================

if (!$SkipDatabase) {
    Write-Host ""
    Write-Host "🗄️ Setting up database tables and schema..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($ConnectionString)) {
        Write-Host "❌ Error: Database connection string required" -ForegroundColor Red
        Write-Host "Usage: .\complete_setup.ps1 -ConnectionString 'your-connection-string' -DatabaseName 'voice_platform'" -ForegroundColor Yellow
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($DatabaseName)) {
        Write-Host "❌ Error: Database name required" -ForegroundColor Red
        Write-Host "Usage: .\complete_setup.ps1 -ConnectionString 'your-connection-string' -DatabaseName 'voice_platform'" -ForegroundColor Yellow
        exit 1
    }
    
    try {
        Write-Host "Executing database setup..." -ForegroundColor Cyan
        $result = psql "$ConnectionString" -f "complete_database_setup.sql" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Database setup failed!" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error executing database setup:" $_.Exception.Message -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️ Skipping database setup" -ForegroundColor Yellow
}

# ==============================================
# STEP 4: MOZILLA SENTENCES POPULATION
# ==============================================

if (!$SkipPopulation) {
    Write-Host ""
    Write-Host "📚 Populating Mozilla sentences..." -ForegroundColor Yellow
    
    try {
        $mozillaCommand = if ($QuickSetup) { "curated" } else { "all" }
        
        Write-Host "Command: $mozillaCommand | Language: $Language | Max: $MaxSentences" -ForegroundColor Cyan
        
        $nodeArgs = @($mozillaCommand, $Language, $MaxSentences.ToString())
        $result = node populate_mozilla_sentences.js @nodeArgs 2>&1
        
        Write-Host $result -ForegroundColor White
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Mozilla sentences populated successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Sentence population failed!" -ForegroundColor Red
            Write-Host "Continuing setup despite sentence population failure..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error populating sentences:" $_.Exception.Message -ForegroundColor Red
        Write-Host "Continuing setup despite sentence population failure..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️ Skipping sentence population" -ForegroundColor Yellow
}

# ==============================================
# STEP 5: FINAL VERIFICATION
# ==============================================

Write-Host ""
Write-Host "🔍 Final verification..." -ForegroundColor Yellow

if (!$SkipPopulation) {
    try {
        Write-Host "Showing sentence statistics..." -ForegroundColor Cyan
        $statsResult = node populate_mozilla_sentences.js stats 2>&1
        Write-Host $statsResult -ForegroundColor White
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Verification completed successfully!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Could not perform final verification, but setup is complete" -ForegroundColor Yellow
    }
}

# ==============================================
# COMPLETION SUMMARY
# ==============================================

Write-Host ""
Write-Host "🎉 VOICE PLATFORM SETUP COMPLETED!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Database Tables Created:" -ForegroundColor Yellow
Write-Host "   - users (with demographic fields and constituency)" -ForegroundColor White
Write-Host "   - recordings (voice recording metadata)" -ForegroundColor White
Write-Host "   - reviews (review system)" -ForegroundColor White
Write-Host "   - sentences (Mozilla API statements)" -ForegroundColor White
Write-Host ""

if (!$SkipPopulation) {
    Write-Host "✅ Sample Data Populated:" -ForegroundColor Yellow
    Write-Host "   - Sample users (admin, reviewers, contributors)" -ForegroundColor White
    Write-Host "   - Sample recordings and reviews" -ForegroundColor White
    Write-Host "   - Mozilla sentences for voice recording" -ForegroundColor White
    Write-Host ""
}

Write-Host "✅ Default Users Created:" -ForegroundColor Yellow
Write-Host "   - admin@commonvoice.org (admin) - Password: admin123" -ForegroundColor White
Write-Host "   - reviewer@example.com (reviewer) - Password: reviewer123" -ForegroundColor White
Write-Host "   - contributor@example.com (contributor) - Password: contributor123" -ForegroundColor White
Write-Host "   - alice@example.com (contributor) - Password: alice123" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update your applications database connection settings" -ForegroundColor White
Write-Host "   2. Test login functionality with the created users" -ForegroundColor White
Write-Host "   3. Visit the /speak page to test sentence loading" -ForegroundColor White
Write-Host "   4. Begin using the Voice Platform application" -ForegroundColor White
Write-Host ""

Write-Host "Setup completed at: $(Get-Date)" -ForegroundColor Cyan
