# ⚔️ Tyr - Quick Start Guide

## What is Tyr?

**Tyr** is an AI-powered threat modeling assistant that analyzes your system architectures, infrastructure code, and configurations to identify security vulnerabilities **before deployment**.

Named after the Norse god of war and justice, Tyr brings strategic security analysis to your development workflow.

## 🚀 Installation

### Step 1: Extract the Archive

```bash
tar -xzf tyr-complete.tar.gz
cd tyr
```

### Step 2: Choose Your AI Provider

#### Option A: Local AI with Ollama (Recommended - FREE!)

```bash
# One-command setup
./setup-ollama.sh
```

This will:
1. Install Ollama (if needed)
2. Download the llama3.1:8b model (~4GB)
3. Build Tyr with Ollama support
4. Run a demo analysis

**Benefits:**
- ✅ Completely free (no API costs)
- ✅ 100% private (data never leaves your machine)
- ✅ Works offline
- ✅ Perfect for sensitive/proprietary code

**Requirements:**
- 8GB+ RAM for 8B models
- 48GB+ RAM for 70B models (better quality)
- GPU recommended but optional

#### Option B: Cloud AI with Claude

```bash
# Get your API key from https://console.anthropic.com/
export ANTHROPIC_API_KEY='your-api-key-here'

# Build with Claude support
cargo build --release --features claude

# Set provider
export AI_PROVIDER=claude
```

**Benefits:**
- ✅ Excellent analysis quality
- ✅ Fast and consistent
- ✅ No hardware requirements

**Requirements:**
- Internet connection
- Anthropic API key
- Pay-per-use (~$0.01-0.10 per analysis)

## 📖 Basic Usage

### Analyze an Architecture

```bash
# Analyze a system architecture description
tyr analyze -i examples/ecommerce-architecture.md -f console
```

### Analyze Infrastructure Code

```bash
# Analyze Terraform configuration
tyr analyze -i examples/insecure-infrastructure.tf -f html -o report.html

# Analyze Kubernetes manifests
tyr analyze -i examples/insecure-k8s.yaml -f json -o threats.json
```

### Interactive Mode

```bash
# Start interactive session
tyr interactive --context examples/ecommerce-architecture.md

# Ask questions:
tyr> What are the top 3 security risks?
tyr> How do I secure the database connections?
tyr> Explain the SQL injection threat in detail
```

### Batch Scanning

```bash
# Scan all files in a directory
tyr scan -d ./infrastructure --pattern "*.tf" -f html -o report.html
```

## 🎯 Common Use Cases

### 1. Pre-Deployment Security Check

```bash
# Check infrastructure before deploying
tyr analyze -i production.tf -r critical

# Only show critical and high risks
# Exit code 1 if critical threats found (CI/CD integration)
```

### 2. Architecture Review

```bash
# Generate HTML report for team review
tyr analyze -i new-microservice.md -f html -o review.html
open review.html
```

### 3. Security Audit

```bash
# Scan entire codebase
tyr scan -d ./infrastructure -f json -o security-audit.json

# Process results with jq
jq '.summary.by_risk_level' security-audit.json
```

### 4. Learning Security

```bash
# Interactive learning mode
tyr interactive

# Ask general questions:
tyr> What is STRIDE methodology?
tyr> How do I prevent SQL injection?
tyr> What are common Kubernetes security issues?
```

## 📊 Output Formats

### Console (Default)
Beautiful colored output in your terminal
```bash
tyr analyze -i system.md -f console
```

### JSON (CI/CD Integration)
Machine-readable for automated processing
```bash
tyr analyze -i system.md -f json -o threats.json
```

### HTML (Reports)
Professional reports for stakeholders
```bash
tyr analyze -i system.md -f html -o report.html
```

## 🤖 Switching AI Providers

```bash
# Use Ollama (local)
export AI_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
tyr analyze -i system.md

# Use Claude (cloud)
export AI_PROVIDER=claude
export ANTHROPIC_API_KEY=sk-ant-...
tyr analyze -i system.md
```

## ⚡ Performance Tips

### For Ollama Users

**Best Quality:**
```bash
ollama pull llama3.1:70b  # Requires powerful GPU
export OLLAMA_MODEL=llama3.1:70b
```

**Fastest:**
```bash
ollama pull llama3.1:8b  # Works on most systems
export OLLAMA_MODEL=llama3.1:8b
```

**For Code Analysis:**
```bash
ollama pull codellama:34b  # Specialized for infrastructure code
export OLLAMA_MODEL=codellama:34b
```

### Speed Up Analysis

```bash
# Use quantized models
ollama pull llama3.1:8b-q4_K_M

# Process multiple files in parallel
tyr scan -d ./infra --pattern "*.tf"
```

## 🔐 Privacy & Security

### Local AI (Ollama)
- All analysis happens on your machine
- No data sent to external servers
- Perfect for:
  - Proprietary code
  - Classified systems
  - Compliance requirements (HIPAA, SOC2, etc.)
  - Air-gapped environments

### Cloud AI (Claude)
- Data sent to Anthropic's API
- Subject to Anthropic's privacy policy
- Great for:
  - Public projects
  - Fast analysis
  - No local hardware constraints

## 📚 Example Session

```bash
# Extract and setup
tar -xzf tyr-complete.tar.gz
cd tyr
./setup-ollama.sh

# Analyze your first file
tyr analyze -i examples/ecommerce-architecture.md

# Output:
╔════════════════════════════════════════════════════════════╗
║   ⚔️  TYR - AI THREAT MODELING ASSISTANT                   ║
║   Design-Time Security Analysis with AI                   ║
╚════════════════════════════════════════════════════════════╝

🔍 Starting threat analysis...
🤖 Analyzing with local AI model...

═══════════════════════════════════════════════════
       THREAT ANALYSIS REPORT
═══════════════════════════════════════════════════

📊 SUMMARY
  Total Threats: 8
  Overall Risk Score: 76.5/100

  📈 By Risk Level:
    🔴 Critical: 2
    🟠 High:     3
    🟡 Medium:   2
    🟢 Low:      1

🎯 IDENTIFIED THREATS
[1] 🔓 [CRITICAL] SQL Injection via Direct Database Access
  ...
```

## 🆘 Troubleshooting

### "Failed to connect to Ollama"
```bash
# Start Ollama server
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### "Model not found"
```bash
# List installed models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

### "Cargo not found"
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Slow Analysis
- Use smaller models (8B instead of 70B)
- Use quantized versions (q4_K_M)
- Enable GPU acceleration
- Close other applications

## 🎓 Next Steps

1. **Read the full README.md** for comprehensive documentation
2. **Check examples/** folder for sample files to analyze
3. **Try USAGE_EXAMPLES.md** for advanced scenarios
4. **Review LOCAL_AI_INTEGRATION_GUIDE.md** for detailed setup options

## 🤝 Getting Help

- Check the **README.md** for detailed documentation
- Review **USAGE_EXAMPLES.md** for real-world examples
- Use interactive mode to ask security questions
- Open issues on GitHub for bugs or feature requests

## 📝 Summary

**Tyr gives you:**
- ⚔️ Strategic security analysis before deployment
- 🤖 Choice of local (free, private) or cloud AI
- 🎯 STRIDE-based threat modeling
- 📊 Professional reports in multiple formats
- 💬 Interactive learning mode
- 📁 Batch scanning capabilities

**Get started now:**
```bash
./setup-ollama.sh
tyr analyze -i examples/ecommerce-architecture.md
```

---

*"In war, strategy and strength are one."* - Tyr

Built with ⚔️ by developers, for developers who take security seriously.
