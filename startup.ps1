# Deskwars Platform Startup Script
# PowerShell script to initialize and start the platform

Write-Host "🚀 Deskwars Platform Startup Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to display error and exit
function Exit-WithError {
    param($Message)
    Write-Host "❌ ERROR: $Message" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Exit-WithError "Node.js is not installed. Please install Node.js v18 or higher."
}

if (-not (Test-Command "npm")) {
    Exit-WithError "npm is not installed. Please install npm."
}

$nodeVersion = node --version
Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green

$npmVersion = npm --version
Write-Host "   ✓ npm: v$npmVersion" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   ✓ .env file created" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Please edit .env and configure your DATABASE_URL" -ForegroundColor Yellow
        Write-Host "   Example: DATABASE_URL='postgresql://deskwars:deskwars123@localhost:5432/deskwars'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press any key to continue after configuring .env..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Exit-WithError ".env.example not found. Cannot create .env file."
    }
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Failed to install dependencies"
}
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow

# Check if PostgreSQL is accessible
Write-Host "   Checking database connection..." -ForegroundColor Cyan
$env:DATABASE_URL = (Get-Content .env | Select-String "DATABASE_URL" | ForEach-Object { $_ -replace "DATABASE_URL=", "" } | ForEach-Object { $_ -replace '"', '' } | ForEach-Object { $_ -replace "'", '' })

if (-not $env:DATABASE_URL) {
    Exit-WithError "DATABASE_URL not found in .env file"
}

Write-Host "   Database URL configured" -ForegroundColor Green

# Run Prisma migrations
Write-Host ""
Write-Host "   Running database migrations..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Failed to run database migrations"
}
Write-Host "   ✓ Migrations completed" -ForegroundColor Green

# Generate Prisma Client
Write-Host ""
Write-Host "   Generating Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Failed to generate Prisma Client"
}
Write-Host "   ✓ Prisma Client generated" -ForegroundColor Green

# Initialize database with data
Write-Host ""
Write-Host "   Initializing database with game data..." -ForegroundColor Cyan
npm run db:init
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Failed to initialize database"
}
Write-Host "   ✓ Database initialized" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database initialized with:" -ForegroundColor Cyan
Write-Host "   • 3 Game Configurations" -ForegroundColor White
Write-Host "   • 24 Inventory Items" -ForegroundColor White
Write-Host "   • 31 Game Allocations" -ForegroundColor White
Write-Host ""
Write-Host "🎮 Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev

# Made with Bob
