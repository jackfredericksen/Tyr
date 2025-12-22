# ⚔️ Tyr - AI Threat Modeling Assistant

> **Tyr** - Named after the Norse god of war and justice, bringing strategic insight to your security battles.

A powerful Rust-based CLI tool that performs comprehensive threat modeling on your system architectures, infrastructure code, and API specifications **before** they're deployed. Supports **both cloud-based (Claude) and local AI (Ollama)** for complete flexibility!

```
████████╗██╗   ██╗██████╗ 
╚══██╔══╝╚██╗ ██╔╝██╔══██╗
   ██║    ╚████╔╝ ██████╔╝
   ██║     ╚██╔╝  ██╔══██╗
   ██║      ██║   ██║  ██║
   ╚═╝      ╚═╝   ╚═╝  ╚═╝
   
AI-Powered Security Analysis
```

## 🎯 Key Features

- 🤖 **Dual AI Support**: Choose between Claude API (cloud) or Ollama (local)
- 🏗️ **Multi-Format Analysis**: Architecture diagrams, Terraform, Kubernetes, API specs
- 🎯 **STRIDE Methodology**: Industry-standard threat categorization
- 📊 **Risk Scoring**: Automatic severity classification with 0-100 risk scores
- 🛡️ **Actionable Mitigations**: Specific fixes with effort/effectiveness ratings
- 📚 **Educational**: Real-world context and examples for every threat
- 📝 **Multiple Output Formats**: Console (colored), JSON (CI/CD), HTML (reports)
- 💬 **Interactive Mode**: Conversational threat modeling
- 📁 **Batch Scanning**: Analyze entire directories

## ⚡ Quick Start

### Option 1: Local AI with Ollama (Recommended - No API costs!)

```bash
# One-command setup (installs Ollama, downloads model, builds project)
./setup-ollama.sh

# Or manual setup:
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull a model
ollama pull llama3.1:8b  # Fast, works on most systems
# OR
ollama pull llama3.1:70b  # Best quality (requires powerful GPU)

# 3. Build and run
cargo build --release --features ollama
export AI_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

### Option 2: Cloud AI with Claude API

```bash
# 1. Get API key from https://console.anthropic.com/
export ANTHROPIC_API_KEY='your-api-key-here'

# 2. Build and run
cargo build --release --features claude
export AI_PROVIDER=claude
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

## 📋 Prerequisites

### For Local AI (Ollama)
- Rust 1.70+
- Ollama installed (automatically set up with `setup-ollama.sh`)
- 8GB+ RAM (for 8B models) or 48GB+ RAM (for 70B models)
- GPU recommended but not required

### For Cloud AI (Claude)
- Rust 1.70+
- Anthropic API key

## 🔧 Installation

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd tyr

# Build with Ollama support (local AI)
cargo build --release --features ollama

# OR build with Claude support (cloud AI)
cargo build --release --features claude

# OR build with both (switch via AI_PROVIDER env var)
cargo build --release --features both

# The binary will be at target/release/tyr
```

### Configuration

Create a `.env` file or set environment variables:

```bash
# Choose your AI provider
export AI_PROVIDER=ollama  # or "claude"

# For Ollama (local)
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=llama3.1:70b

# For Claude (cloud)
export ANTHROPIC_API_KEY=your-api-key-here
```

See `.env.example` for full configuration options.

## 📖 Usage

### Basic Analysis

```bash
# Analyze architecture (auto-detects AI provider from env)
tyr analyze -i examples/ecommerce-architecture.md -f console

# Analyze Terraform
tyr analyze -i examples/insecure-infrastructure.tf -f html -o report.html

# Analyze Kubernetes
tyr analyze -i examples/insecure-k8s.yaml -f json -o threats.json
```

### Interactive Mode

```bash
tyr interactive --context examples/ecommerce-architecture.md

# Then ask questions like:
# - "What are the top 3 risks?"
# - "How do I secure the database connections?"
# - "Explain the spoofing threats in detail"
```

### Batch Scanning

```bash
# Scan all Terraform files
tyr scan -d ./infrastructure --pattern "*.tf" -f html -o report.html

# Scan all Kubernetes manifests
tyr scan -d ./k8s --pattern "*.yaml" -f console
```

## 🤖 AI Provider Comparison

| Feature | Ollama (Local) | Claude (Cloud) |
|---------|----------------|----------------|
| **Cost** | Free | Pay-per-use |
| **Privacy** | 100% local | Data sent to API |
| **Speed** | Depends on hardware | Fast & consistent |
| **Quality** | Very good (70B models) | Excellent |
| **Setup** | Requires download (~4-40GB) | Just API key |
| **Offline** | ✅ Works offline | ❌ Needs internet |
| **GPU** | Recommended | Not needed |

### Recommended Models for Ollama

**Best Quality** (requires powerful GPU with 48GB+ VRAM):
- `llama3.1:70b` - Excellent threat analysis
- `mixtral:8x22b` - Great reasoning

**Balanced** (works on most modern systems with 16GB+ RAM):
- `llama3.1:8b` - Fast and capable
- `mixtral:8x7b` - Good quality
- `codellama:34b` - Great for infrastructure code

**CPU-Friendly** (slower but works without GPU):
- `llama3.1:8b` with CPU
- `mistral:7b`

### Switching Between Providers

```bash
# Use Ollama
export AI_PROVIDER=ollama
tyr analyze -i system.md

# Switch to Claude
export AI_PROVIDER=claude
tyr analyze -i system.md
```

## 📊 Example Output

```
╔════════════════════════════════════════════════════════════╗
║   ⚔️  TYR - AI THREAT MODELING ASSISTANT                   ║
║   Design-Time Security Analysis with AI                   ║
╚════════════════════════════════════════════════════════════╝

🤖 Using Ollama for local AI inference
✅ Initialized AI provider: Ollama (Local AI)
🔍 Starting threat analysis...

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
─────────────────────────────────────────────────────

[1] 🔓 [CRITICAL] SQL Injection via Direct Database Access
  Category: Tampering
  ID: T001

  Description: Services have direct database access with root credentials,
  allowing SQL injection attacks to compromise the entire database...
```

## 🎓 Why "Tyr"?

In Norse mythology, **Tyr** is the god of war, justice, and honor - known for his:
- **Strategic thinking** - Just like security analysis requires foresight
- **Sacrifice for the greater good** - Analyzing threats before they become real attacks
- **Justice and order** - Bringing structure to chaotic security landscapes
- **Courage in the face of danger** - Confronting vulnerabilities head-on

Tyr helps you **strategically identify threats** before they strike, bringing **order to security chaos** with **AI-powered analysis**.

## 🔐 Privacy & Security

### Local AI (Ollama)
- ✅ All data stays on your machine
- ✅ No external API calls
- ✅ Works completely offline
- ✅ Perfect for sensitive/proprietary architectures

### Cloud AI (Claude)
- Data sent to Anthropic's API
- Subject to Anthropic's privacy policy
- Requires internet connection
- May not be suitable for highly sensitive data

## 🚀 Performance Tips

### Ollama Performance
```bash
# Use quantized models for speed
ollama pull llama3.1:8b-q4_K_M  # 4-bit quantization

# Or full precision for quality
ollama pull llama3.1:70b  # Full precision (large download)

# Check GPU usage
ollama list
nvidia-smi  # Monitor GPU usage
```

### Batch Processing
```bash
# Process multiple files efficiently
tyr scan -d ./infrastructure -f json -o all-threats.json
```

## 📁 Project Structure

```
tyr/
├── src/
│   ├── main.rs           # CLI interface
│   ├── ai/
│   │   ├── mod.rs        # AI provider abstraction
│   │   ├── claude.rs     # Claude API implementation
│   │   └── ollama.rs     # Ollama implementation
│   ├── models.rs         # Data structures
│   ├── analyzer.rs       # Analysis orchestration
│   └── reporters.rs      # Output formatting
├── examples/             # Sample files
├── Cargo.toml           # Dependencies & features
├── setup-ollama.sh      # Ollama quick setup
└── .env.example         # Configuration template
```

## 🛠️ Development

### Building with Specific Features

```bash
# Ollama only
cargo build --release --features ollama

# Claude only
cargo build --release --features claude

# Both (switch with AI_PROVIDER)
cargo build --release --features both

# Run tests
cargo test
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional AI providers (GPT-4, Gemini, local models)
- Fine-tuned models specifically for threat modeling
- Custom threat frameworks beyond STRIDE
- VS Code extension
- GitHub Action for PR comments

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/claude) for cloud AI
- [Ollama](https://ollama.ai/) for local AI inference
- [OWASP](https://owasp.org/) for threat modeling guidance
- Microsoft for the STRIDE methodology
- Norse mythology for the perfect name

## 🐛 Troubleshooting

### Ollama Issues

**"Failed to connect to Ollama"**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

**"Model not found"**
```bash
# List installed models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

**Slow performance**
- Use smaller models (8B instead of 70B)
- Enable GPU acceleration
- Use quantized models (Q4_K_M variants)

### Claude Issues

**"ANTHROPIC_API_KEY not set"**
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

**"Rate limit exceeded"**
- Wait a moment and retry
- Upgrade your Anthropic API plan

## 📚 Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [STRIDE Threat Modeling](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LOCAL_AI_INTEGRATION_GUIDE.md](LOCAL_AI_INTEGRATION_GUIDE.md) - Detailed guide for local AI setup

---

**Built with ⚔️ using Rust 🦀, Claude API 🤖, and Ollama 🦙**

*"In war, strategy and strength are one."* - Tyr

Get started with local AI in minutes - no cloud dependencies, no API costs, complete privacy!
