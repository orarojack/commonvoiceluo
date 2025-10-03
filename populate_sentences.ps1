# Mozilla Sentences Population Script for Voice Platform
# This PowerShell script populates the database with sentences from Mozilla Common Voice API

param(
    [string]$ConnectionString = "",
    [string]$DatabaseName = "",
    [ValidateSet("mozilla", "curated", "all", "stats")]
    [string]$Command = "all",
    [string]$Language = "luo",
    [int]$MaxSentences = 1000
)

Write-Host "=== Voice Platform Mozilla Sentences Population ===" -ForegroundColor Green
Write-Host "Command: $Command" -ForegroundColor Cyan
Write-Host "Language: $Language" -ForegroundColor Cyan
Write-Host "Max Sentences: $MaxSentences" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js not found. Please ensure Node.js is installed." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if package.json exists and dependencies are installed
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
    } catch {
        Write-Host "Error: Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

# Check if Environment variables are set
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
    Write-Host "Error: Missing environment variables:" -ForegroundColor Red
    foreach ($var in $missingEnvVars) {
        Write-Host "  - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please set these environment variables:" -ForegroundColor Yellow
    Write-Host "`$env:NEXT_PUBLIC_SUPABASE_URL = 'your-supabase-url'" -ForegroundColor Cyan
    Write-Host "`$env:SUPABASE_SERVICE_ROLE_KEY = 'his-service-role-key'" -ForegroundColor Cyan
    exit 1
}

# Check if populate script exists
if (!(Test-Path "populate_mozilla_sentences.js")) {
    Write-Host "Error: populate_mozilla_sentences.js not found." -ForegroundColor Red
    Write-Host "Please ensure the Mozilla population script is in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Environment check passed. Starting sentence population..." -ForegroundColor Green
Write-Host ""

try {
    # Execute the Node.js population script
    Write-Host "Executing sentence population..." -ForegroundColor Yellow
    
    $nodeArgs = @($Command, $Language, $MaxSentences.ToString())
    $result = node populate_mozilla_sentences.js @nodeArgs 2>&1
    
    Write-Host $result -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sentence population completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== Summary ===" -ForegroundColor Green
        Write-Host "Command executed: $Command" -ForegroundColor Yellow
        Write-Host "Language: $Language" -ForegroundColor Yellow
        Write-Host "Max sentences: $MaxSentences" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Verify sentences in your application" -ForegroundColor White
        Write-Host "  2. Test the speak page to ensure sentences load" -ForegroundColor White
        Write-Host "  3. Check database for sentence statistics" -ForegroundColor White
    } else {
        Write-Host "❌ Sentence population failed!" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "❌ Failed to execute sentence population!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Script completed at: $(Get-Date)" -ForegroundColor Cyan
