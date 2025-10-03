# PowerShell script to fix and populate Mozilla sentences

Write-Host "🔧 Mozilla Sentences Population Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Step 1: Fix sentences table constraints" -ForegroundColor Yellow
Write-Host "Please run this SQL in your Supabase dashboard:" -ForegroundColor White
Write-Host ""
Write-Host "-- Fix sentences table field size" -ForegroundColor Gray
Write-Host "ALTER TABLE sentences ALTER COLUMN mozilla_id TYPE VARCHAR(255);" -ForegroundColor Gray
Write-Host "ALTER TABLE sentences ALTER COLUMN bucket TYPE VARCHAR(255);" -ForegroundColor Gray
Write-Host "ALTER TABLE sentences ALTER COLUMN hash TYPE VARCHAR(255);" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Copy the SQL above and run it in Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""

$userInput = Read-Host "Press Enter when you've run the SQL fix, or type 'skip' to continue"

if ($userInput -ne "skip") {
    Write-Host ""
    Write-Host "📥 Step 2: Populating Mozilla sentences..." -ForegroundColor Green
    
    # Try different commands to populate sentences
    try {
        Write-Host "🚀 Fetching 200 Luo sentences from Mozilla API..." -ForegroundColor Cyan
        node populate_mozilla_sentences.js mozilla luo 200
        
        Write-Host ""
        Write-Host "🌍 Adding 100 English sentences too..." -ForegroundColor Cyan  
        node populate_mozilla_sentences.js mozilla en 100
    }
    catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Let's try manual execution..." -ForegroundColor Yellow
        
        # Manual commands
        Write-Host "Try running these commands one by one:" -ForegroundColor White
        Write-Host "  node populate_mozilla_sentences.js mozilla luo 200" -ForegroundColor Gray
        Write-Host "  node populate_mozilla_sentences.js mozilla en 100" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Mozilla sentences population completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 To verify, run this SQL in Supabase:" -ForegroundColor Cyan
Write-Host "SELECT language_code, COUNT(*) as count FROM sentences GROUP BY language_code;" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Your Voice Platform now has fresh Mozilla sentences!" -ForegroundColor Cyan
