# ⚡ Tyr Quick Start (Fixed Version)

## The Problem You Had

The `quickstart.sh` script wasn't properly exporting the `ANTHROPIC_API_KEY` to the child process on Windows/Git Bash, causing the **401 Unauthorized error**.

## ✅ The Fix

I've added automatic `.env` file support! Now you can:

### Step 1: Create a `.env` File

```bash
cd "c:\Users\Admin\OneDrive\Documents\Work\jackfredericksen\Tyr"

# Copy the example
cp .env.example .env

# Edit the .env file
notepad .env
```

### Step 2: Add Your API Key to `.env`

Open `.env` and add your key:

```env
# Tyr Configuration
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

**Save and close the file.**

### Step 3: Build and Run

```bash
# Build (one time only)
cargo build --release --features claude

# Run analysis - API key is auto-loaded from .env!
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

**That's it!** No need to export environment variables manually.

---

## Alternative: Use Environment Variables Directly

If you don't want to use a `.env` file:

### Windows PowerShell

```powershell
# Set API key
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"

# Build and run
cargo build --release --features claude
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md -f console
```

### Git Bash / Linux / macOS

```bash
# Set API key
export ANTHROPIC_API_KEY='sk-ant-your-key-here'

# Build and run
cargo build --release --features claude
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

---

## Testing the Fix

### 1. Verify API Key is Loaded

```bash
# This should NOT give a 401 error anymore
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

### 2. Expected Output

You should see:

```
╔════════════════════════════════════════════════════════════╗
║   ⚔️  TYR - AI THREAT MODELING ASSISTANT                   ║
║   Design-Time Security Analysis with AI                   ║
╚════════════════════════════════════════════════════════════╝

🔍 Starting threat analysis...
🤖 Using Claude API for threat analysis
✅ Initialized AI provider: Claude (Anthropic API)
🤖 Analyzing with Claude AI...

[Threat analysis results appear here]
```

### 3. If You Still Get 401 Error

```bash
# Verify the .env file exists
ls -la .env

# Check its contents (make sure API key is there)
cat .env

# Verify the key starts with sk-ant-
grep ANTHROPIC_API_KEY .env
```

---

## Full Example Commands

### Analyze Architecture
```bash
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

### Analyze Terraform (HTML Report)
```bash
./target/release/tyr analyze -i examples/insecure-infrastructure.tf -t terraform -f html -o terraform-report.html
```

### Analyze Kubernetes (JSON Output)
```bash
./target/release/tyr analyze -i examples/insecure-k8s.yaml -t kubernetes -f json -o k8s-threats.json
```

### Batch Scan All Examples
```bash
./target/release/tyr scan -d examples/ -f console
```

### Interactive Mode
```bash
./target/release/tyr interactive --context examples/ecommerce-architecture.md
```

---

## Free Alternative: Ollama (No API Key Needed!)

Want to avoid API costs? Use Ollama (runs AI locally on your machine):

```bash
# 1. Run the setup script
./setup-ollama.sh

# 2. Edit .env file
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_HOST=http://localhost:11434

# 3. Build with Ollama support
cargo build --release --features ollama

# 4. Run analysis (completely free!)
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

---

## What Changed?

### Added Files
- ✅ `examples/` directory with sanitized example files
- ✅ [USAGE.md](USAGE.md) - Complete usage guide
- ✅ [FIXED.md](FIXED.md) - What was fixed and why
- ✅ [DESKTOP_APP_PLAN.md](DESKTOP_APP_PLAN.md) - Desktop app conversion plan

### Modified Files
- ✅ `.gitignore` - Enhanced secret protection, allows `examples/`
- ✅ `Cargo.toml` - Added `dotenv` dependency
- ✅ `src/main.rs` - Auto-loads `.env` file
- ✅ `.env.example` - Updated instructions
- ✅ `quickstart.sh` - Improved error handling

### Security Improvements
- ✅ `.env` files are in `.gitignore` (won't be committed)
- ✅ Blocks any file with "secret", "password", "credentials" in name
- ✅ Example files use only fake placeholders
- ✅ API key now hidden when typing (using `-s` flag)

---

## Build Warnings (Safe to Ignore)

You'll see these warnings - they're harmless:

```
warning: field `block_type` is never read
warning: associated items `all` and `description` are never used
warning: method `color_code` is never used
```

These are unused helper methods that don't affect functionality.

---

## Getting Help

- **Full Documentation**: See [README.md](README.md)
- **Usage Guide**: See [USAGE.md](USAGE.md)
- **Example Files**: See [examples/README.md](examples/README.md)
- **Desktop App**: See [DESKTOP_APP_PLAN.md](DESKTOP_APP_PLAN.md)

---

## Summary

**Before**: `quickstart.sh` → 401 Unauthorized ❌
**After**: Create `.env` file → Everything works ✅

The API key is now automatically loaded from `.env` on every run!

**Ready to convert to a desktop app?** See [DESKTOP_APP_PLAN.md](DESKTOP_APP_PLAN.md) for the full plan.
