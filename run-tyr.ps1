# Tyr - AI Threat Modeling Assistant
# Quick Run Script for PowerShell

param(
    [Parameter(Mandatory=$false)]
    [string]$InputFile,

    [Parameter(Mandatory=$false)]
    [string]$Format = "console",

    [Parameter(Mandatory=$false)]
    [string]$OutputFile,

    [Parameter(Mandatory=$false)]
    [string]$Type = "architecture"
)

# Set environment variables for Ollama
$env:OLLAMA_MODEL = "llama3.1:8b"
$env:AI_PROVIDER = "ollama"
$env:OLLAMA_HOST = "http://localhost:11434"

$TYR = ".\target\release\tyr.exe"

# Check if tyr is built
if (-not (Test-Path $TYR)) {
    Write-Host "❌ Tyr not found. Building..." -ForegroundColor Yellow
    cargo build --release --features ollama
}

# Display banner
Write-Host ""
Write-Host "⚔️  TYR - AI THREAT MODELING ASSISTANT" -ForegroundColor Cyan
Write-Host "Using Ollama (Local AI) - Model: llama3.1:8b" -ForegroundColor Green
Write-Host ""

# If no input file, show usage
if ([string]::IsNullOrEmpty($InputFile)) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\run-tyr.ps1 <input-file> [options]"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\run-tyr.ps1 examples\ecommerce-architecture.md"
    Write-Host "  .\run-tyr.ps1 examples\insecure-infrastructure.tf -Format html -OutputFile report.html"
    Write-Host "  .\run-tyr.ps1 examples\insecure-k8s.yaml -Type kubernetes -Format json"
    Write-Host ""
    Write-Host "Available Formats:" -ForegroundColor Cyan
    Write-Host "  console  - Colored terminal output (default)"
    Write-Host "  html     - HTML report file"
    Write-Host "  json     - JSON output for automation"
    Write-Host ""
    Write-Host "Available Types:" -ForegroundColor Cyan
    Write-Host "  architecture  - System architecture (default)"
    Write-Host "  terraform     - Terraform/IaC files"
    Write-Host "  kubernetes    - Kubernetes manifests"
    Write-Host ""
    exit 0
}

# Check if input file exists
if (-not (Test-Path $InputFile)) {
    Write-Host "❌ File not found: $InputFile" -ForegroundColor Red
    exit 1
}

# Build command
$cmd = "& '$TYR' analyze -i '$InputFile' -t $Type -f $Format"

if (-not [string]::IsNullOrEmpty($OutputFile)) {
    $cmd += " -o '$OutputFile'"
}

# Run analysis
Write-Host "🔍 Analyzing: $InputFile" -ForegroundColor Cyan
Write-Host ""

Invoke-Expression $cmd

# Show completion message
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Analysis complete!" -ForegroundColor Green

    if (-not [string]::IsNullOrEmpty($OutputFile)) {
        Write-Host "📄 Report saved to: $OutputFile" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "❌ Analysis failed. Check the error messages above." -ForegroundColor Red
}
