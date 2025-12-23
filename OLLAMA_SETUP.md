# 🦙 Ollama Setup for Tyr (Local LLM - 100% Free!)

## Why Ollama?

- ✅ **100% Free** - No API costs
- ✅ **100% Private** - All data stays on your machine
- ✅ **Works Offline** - No internet needed after setup
- ✅ **Fast** - Direct local inference
- ✅ **Multiple Models** - Choose based on your hardware

---

## Quick Setup (Windows)

### Step 1: Install Ollama

**Download and install:**
- Go to [https://ollama.com/download/windows](https://ollama.com/download/windows)
- Download the installer
- Run the installer (it will install Ollama as a Windows service)

**Or use winget:**
```powershell
winget install Ollama.Ollama
```

### Step 2: Verify Installation

```powershell
# Check Ollama is running
ollama --version

# Test the API
curl http://localhost:11434/api/tags
```

If you get a connection error, start Ollama:
```powershell
# Ollama should auto-start as a service
# If not, run:
ollama serve
```

### Step 3: Choose and Download a Model

**For Most Users (8GB+ RAM):**
```powershell
ollama pull llama3.1:8b
```
- Size: ~4.7GB download
- RAM needed: 8GB
- Speed: Fast
- Quality: Good

**For Powerful Systems (32GB+ RAM, GPU with 16GB+ VRAM):**
```powershell
ollama pull llama3.1:70b
```
- Size: ~40GB download
- RAM needed: 48GB (or 16GB VRAM GPU)
- Speed: Slower
- Quality: Excellent

**For Mid-Range Systems (16GB RAM):**
```powershell
ollama pull mixtral:8x7b
```
- Size: ~26GB download
- RAM needed: 16GB
- Speed: Medium
- Quality: Very good

**For CPU-Only Systems:**
```powershell
ollama pull llama3.1:8b
# Use with CPU - slower but works
```

### Step 4: Update Your .env File

Your `.env` already has Ollama configured! Just verify:

```env
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

**Change the model** if you downloaded a different one:
```env
# If you downloaded llama3.1:70b:
OLLAMA_MODEL=llama3.1:70b

# If you downloaded mixtral:
OLLAMA_MODEL=mixtral:8x7b
```

### Step 5: Build Tyr with Ollama Support

```powershell
cd "c:\Users\Admin\OneDrive\Documents\Work\jackfredericksen\Tyr"

# Build with Ollama feature
cargo build --release --features ollama

# Or build with both Claude and Ollama (switch with AI_PROVIDER)
cargo build --release --features both
```

### Step 6: Test It!

```powershell
# Run a test analysis
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md -f console
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║   ⚔️  TYR - AI THREAT MODELING ASSISTANT                   ║
║   Design-Time Security Analysis with AI                   ║
╚════════════════════════════════════════════════════════════╝

🔍 Starting threat analysis...
🤖 Using Ollama for local AI inference
✅ Initialized AI provider: Ollama (Local AI)
🤖 Analyzing with Ollama...

[Analysis results...]
```

---

## Quick Setup (Linux/macOS)

### Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Pull a Model

```bash
# Recommended for most systems
ollama pull llama3.1:8b
```

### Configure .env

```bash
echo "AI_PROVIDER=ollama" > .env
echo "OLLAMA_HOST=http://localhost:11434" >> .env
echo "OLLAMA_MODEL=llama3.1:8b" >> .env
```

### Build and Run

```bash
cargo build --release --features ollama
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

---

## Recommended Models by Hardware

### 🖥️ Your System Specs → Best Model

| RAM | GPU VRAM | CPU Cores | Recommended Model | Download Command |
|-----|----------|-----------|-------------------|------------------|
| 8GB | None | 4+ | llama3.1:8b | `ollama pull llama3.1:8b` |
| 16GB | None | 8+ | mixtral:8x7b | `ollama pull mixtral:8x7b` |
| 32GB | 8GB | 8+ | llama3.1:70b-q4 | `ollama pull llama3.1:70b-q4_K_M` |
| 32GB+ | 16GB+ | 8+ | llama3.1:70b | `ollama pull llama3.1:70b` |
| 64GB+ | 24GB+ | 16+ | llama3.1:70b | `ollama pull llama3.1:70b` |

### 🚀 Model Comparison

| Model | Size | Quality | Speed | Best For |
|-------|------|---------|-------|----------|
| llama3.1:8b | 4.7GB | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | Most users, fast results |
| mixtral:8x7b | 26GB | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | Mid-range systems |
| llama3.1:70b | 40GB | ⭐⭐⭐⭐⭐ | ⚡⚡ | Best quality, slow |
| codellama:34b | 19GB | ⭐⭐⭐⭐ | ⚡⚡⚡ | Infrastructure code |

---

## Common Issues & Solutions

### Issue: "Failed to connect to Ollama"

**Check if Ollama is running:**
```powershell
curl http://localhost:11434/api/tags
```

**If not running, start it:**
```powershell
ollama serve
```

**On Windows, check the service:**
```powershell
Get-Service Ollama
# Should show "Running"

# If stopped, start it:
Start-Service Ollama
```

---

### Issue: "Model not found"

**List installed models:**
```powershell
ollama list
```

**Pull the model specified in your .env:**
```powershell
# If your .env says llama3.1:8b
ollama pull llama3.1:8b
```

---

### Issue: "Out of memory" or Very Slow

**Use a smaller model:**
```powershell
# Switch to smaller model
ollama pull llama3.1:8b

# Update .env
# Change OLLAMA_MODEL=llama3.1:8b
```

**Or use quantized versions (smaller, slightly lower quality):**
```powershell
ollama pull llama3.1:8b-q4_K_M
```

---

### Issue: Analysis takes too long

**Model speed comparison (on 16-core CPU with 32GB RAM):**

| Model | Time per Analysis |
|-------|-------------------|
| llama3.1:8b | ~30 seconds |
| mixtral:8x7b | ~2 minutes |
| llama3.1:70b | ~10 minutes |

**Solutions:**
1. Use smaller model (`llama3.1:8b`)
2. Use GPU acceleration (if you have NVIDIA GPU)
3. Use quantized models (faster, slightly lower quality)

---

## GPU Acceleration (NVIDIA)

If you have an NVIDIA GPU, Ollama will automatically use it!

**Verify GPU is being used:**
```powershell
# While running an analysis, check GPU usage
nvidia-smi

# You should see "ollama" using GPU memory
```

**If GPU is not being used:**
1. Make sure you have CUDA installed
2. Reinstall Ollama
3. Check Ollama logs: `ollama logs`

---

## Switching Between Models

You can have multiple models installed and switch easily:

```powershell
# Install multiple models
ollama pull llama3.1:8b
ollama pull llama3.1:70b

# Use 8B for quick scans
echo "OLLAMA_MODEL=llama3.1:8b" > .env
.\target\release\tyr.exe scan -d examples/

# Use 70B for detailed analysis
echo "OLLAMA_MODEL=llama3.1:70b" > .env
.\target\release\tyr.exe analyze -i critical-system.md
```

---

## Ollama Commands Cheat Sheet

```powershell
# List installed models
ollama list

# Pull a new model
ollama pull llama3.1:8b

# Remove a model (free up space)
ollama rm llama3.1:70b

# Check Ollama version
ollama --version

# View running models
ollama ps

# Stop Ollama service
Stop-Service Ollama

# Start Ollama service
Start-Service Ollama

# Test Ollama API
curl http://localhost:11434/api/tags
```

---

## Performance Tips

### 1. Close Other Apps
Ollama uses a lot of RAM/GPU. Close:
- Web browsers with many tabs
- Other AI tools
- Heavy applications

### 2. Use SSD Storage
Models load faster from SSD vs HDD.

### 3. Use Quantized Models
```powershell
# Smaller files, faster, slightly lower quality
ollama pull llama3.1:8b-q4_K_M
ollama pull llama3.1:70b-q4_K_M
```

### 4. Batch Processing
```powershell
# Analyze multiple files at once (reuses loaded model)
.\target\release\tyr.exe scan -d examples/ -f html -o report.html
```

---

## Cost Comparison

### Ollama (Local)
- **Setup**: Free
- **Model download**: Free (but uses ~5-40GB disk space)
- **Per analysis**: $0.00
- **100 analyses**: $0.00
- **1000 analyses**: $0.00
- **Privacy**: 100% local ✅

### Claude API (Cloud)
- **Setup**: Free
- **Per analysis**: ~$0.05
- **100 analyses**: ~$5.00
- **1000 analyses**: ~$50.00
- **Privacy**: Data sent to Anthropic ⚠️

**Ollama saves you money after just 1 analysis!**

---

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull a model (`ollama pull llama3.1:8b`)
3. ✅ Verify `.env` has `AI_PROVIDER=ollama`
4. ✅ Build: `cargo build --release --features ollama`
5. ✅ Run: `.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md`

**That's it! You're now running 100% free, 100% private AI threat modeling!** 🎉

---

## Want Both Claude and Ollama?

Build with both features:
```powershell
cargo build --release --features both
```

Then switch in `.env`:
```env
# Use Ollama (free, local)
AI_PROVIDER=ollama

# Or use Claude (paid, cloud)
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key
```

---

**Questions?** Check:
- [README.md](README.md) - Full documentation
- [USAGE.md](USAGE.md) - Usage examples
- Ollama docs: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
