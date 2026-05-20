# ============================================================
# Internal Developer Platform - Windows PowerShell Setup Script
# ============================================================
# Run this from PowerShell in the project folder:
#   .\START-HERE.ps1
# ============================================================

param(
    [switch]$SkipInstall,
    [switch]$Production,
    [switch]$Build
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$text)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$text)
    Write-Host ">> $text" -ForegroundColor Green
}

function Write-Warning2 {
    param([string]$text)
    Write-Host "!! $text" -ForegroundColor Yellow
}

function Write-Error2 {
    param([string]$text)
    Write-Host "ERROR: $text" -ForegroundColor Red
}

function Test-Command {
    param([string]$cmd)
    return $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

# ---- Banner ----
Write-Host ""
Write-Host "  ___  ___  ___ " -ForegroundColor Magenta
Write-Host " |_ _||   \| _ \" -ForegroundColor Magenta  
Write-Host "  | | | |) |  _/" -ForegroundColor Magenta
Write-Host " |___||___/|_|  " -ForegroundColor Magenta
Write-Host ""
Write-Host "  Internal Developer Platform" -ForegroundColor White
Write-Host "  Production-Ready Setup Script" -ForegroundColor Gray
Write-Host ""

# ---- Check Node.js ----
Write-Header "Checking Prerequisites"

if (-not (Test-Command "node")) {
    Write-Error2 "Node.js is not installed!"
    Write-Host ""
    Write-Host "Please install Node.js (v18 or later) from:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/en/download" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing, re-run this script." -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node --version).TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
Write-Step "Node.js $nodeVersion found"

if ($nodeMajor -lt 18) {
    Write-Error2 "Node.js 18+ is required. You have $nodeVersion"
    Write-Host "Please upgrade at https://nodejs.org/en/download" -ForegroundColor Yellow
    exit 1
}

# ---- Check/Install pnpm ----
if (-not (Test-Command "pnpm")) {
    Write-Step "Installing pnpm package manager..."
    npm install -g pnpm@10.4.1
    if ($LASTEXITCODE -ne 0) {
        Write-Error2 "Failed to install pnpm"
        exit 1
    }
    Write-Step "pnpm installed successfully"
} else {
    $pnpmVersion = pnpm --version
    Write-Step "pnpm $pnpmVersion found"
}

# ---- Check .env file ----
Write-Header "Environment Configuration"

if (-not (Test-Path ".env")) {
    Write-Step "Creating .env file from template..."
    Copy-Item ".env.example" ".env"
    Write-Warning2 "A default .env was created. Review it if needed."
    Write-Host "  Location: $(Get-Location)\.env" -ForegroundColor Gray
} else {
    Write-Step ".env file exists"
}

# ---- Install Dependencies ----
if (-not $SkipInstall) {
    Write-Header "Installing Dependencies"
    Write-Step "Running pnpm install (this may take 1-2 minutes on first run)..."
    pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Error2 "pnpm install failed"
        exit 1
    }
    Write-Step "Dependencies installed"
}

# ---- Build (Production) ----
if ($Build -or $Production) {
    Write-Header "Building for Production"
    Write-Step "Building client (Vite)..."
    
    $env:NODE_ENV = "production"
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Error2 "Build failed"
        exit 1
    }
    Write-Step "Build complete -> dist/"
}

# ---- Start the App ----
Write-Header "Starting Internal Developer Platform"

if ($Production) {
    Write-Step "Starting in PRODUCTION mode..."
    Write-Host ""
    Write-Host "  The server will start at: http://localhost:5174" -ForegroundColor Cyan
    Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    $env:NODE_ENV = "production"
    node dist/index.js
} else {
    Write-Step "Starting in DEVELOPMENT mode..."
    Write-Host ""
    Write-Host "  +--------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "  |  App URL:  http://localhost:5174                 |" -ForegroundColor Cyan
    Write-Host "  |  Login:    Click 'Enter Platform' on the page   |" -ForegroundColor Cyan
    Write-Host "  |            (no account needed for local dev!)   |" -ForegroundColor Cyan
    Write-Host "  +--------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Hot reload is enabled - changes reflect instantly" -ForegroundColor Gray
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    $env:NODE_ENV = "development"
    pnpm dev
}
