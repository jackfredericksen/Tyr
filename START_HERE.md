# 🚀 START HERE - Tyr with Ollama (Local LLM)

## ✅ You're All Set!

Everything is configured to use **Ollama (local LLM)** - completely free and private!

---

## Quick Start

### Option 1: Use PowerShell (Recommended for Windows)

```powershell
cd "c:\Users\Admin\OneDrive\Documents\Work\jackfredericksen\Tyr"

# Set the model explicitly (to override any cached values)
$env:OLLAMA_MODEL = "llama3.1:8b"
$env:AI_PROVIDER = "ollama"

# Run analysis
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md -f console
```

### Option 2: Use Git Bash

```bash
cd "c:\Users\Admin\OneDrive\Documents\Work\jackfredericksen\Tyr"

# Set environment variables
export OLLAMA_MODEL=llama3.1:8b
export AI_PROVIDER=ollama

# Run analysis
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

---

## If You Get "model not found" Error

The `.env` file might not be loading properly in your environment. **Solution**: Set the environment variable explicitly:

**PowerShell:**
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md
```

**Git Bash:**
```bash
OLLAMA_MODEL=llama3.1:8b ./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

---

## All Commands

### Analyze Architecture
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md -f console
```

### Analyze Terraform (HTML Report)
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe analyze -i examples\insecure-infrastructure.tf -t terraform -f html -o report.html
```

### Analyze Kubernetes (JSON)
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe analyze -i examples\insecure-k8s.yaml -t kubernetes -f json -o threats.json
```

### Batch Scan All Examples
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe scan -d examples\ -f console
```

### Interactive Mode
```powershell
$env:OLLAMA_MODEL = "llama3.1:8b"
.\target\release\tyr.exe interactive --context examples\ecommerce-architecture.md
```

---

## Performance Notes

### llama3.1:8b (What You Have)
- ✅ Fast (~30-60 seconds per analysis)
- ✅ Works on most systems (8GB+ RAM)
- ✅ Good quality results
- ✅ **Recommended for most users**

### Want Better Quality?

If you have a powerful system (32GB+ RAM or GPU with 16GB+ VRAM):

```powershell
# Download the 70B model (40GB download)
ollama pull llama3.1:70b

# Use it
$env:OLLAMA_MODEL = "llama3.1:70b"
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md
```

---

## Troubleshooting

### "Failed to connect to Ollama"

**Check if Ollama is running:**
```powershell
curl http://localhost:11434/api/tags
```

**If not running:**
```powershell
# Ollama runs as a Windows service
Get-Service Ollama

# Start it if stopped
Start-Service Ollama
```

### "Model not found"

**List your models:**
```powershell
ollama list
```

**Make sure you have llama3.1:8b:**
```powershell
ollama pull llama3.1:8b
```

### Analysis is Slow

- Close other heavy applications
- Use SSD storage (if possible)
- Stick with `llama3.1:8b` model
- Consider upgrading RAM if you have less than 16GB

---

## What's Different from Cloud AI?

| Feature | Ollama (You) | Claude API |
|---------|--------------|------------|
| **Cost** | $0.00 forever | ~$0.05 per analysis |
| **Privacy** | 100% local | Sent to Anthropic |
| **Speed** | 30-60 sec | 5-10 sec |
| **Quality** | Very Good | Excellent |
| **Offline** | ✅ Works offline | ❌ Needs internet |
| **Setup** | One-time install | API key needed |

**You made the right choice!** Local LLMs give you unlimited free analyses with complete privacy.

---

## Next Steps

1. ✅ Run your first analysis (see commands above)
2. ✅ Try all three example files
3. ✅ Use interactive mode to ask questions
4. 📖 Read [USAGE.md](USAGE.md) for advanced features
5. 🖥️ Read [DESKTOP_APP_PLAN.md](DESKTOP_APP_PLAN.md) if you want a GUI

---

## Quick Reference Card

**Save this as a PowerShell script** (`run-tyr.ps1`):

```powershell
# Tyr Quick Run Script
$env:OLLAMA_MODEL = "llama3.1:8b"
$env:AI_PROVIDER = "ollama"

$TYR = ".\target\release\tyr.exe"

# Usage: .\run-tyr.ps1 <file-path>
if ($args.Count -gt 0) {
    & $TYR analyze -i $args[0] -f console
} else {
    Write-Host "Usage: .\run-tyr.ps1 <file-path>"
    Write-Host "Example: .\run-tyr.ps1 examples\ecommerce-architecture.md"
}
```

Then use it like:
```powershell
.\run-tyr.ps1 examples\ecommerce-architecture.md
```

---

**Everything is working! Just set `OLLAMA_MODEL=llama3.1:8b` before running.** 🎉
