# 🚀 How to Use Tyr

## Quick Start (Recommended)

### Option 1: Set API Key First (Most Reliable)

**Windows (PowerShell)**
```powershell
# Set the API key
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"

# Build the project
cargo build --release --features claude

# Run analysis
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md -f console
```

**Windows (Git Bash / MINGW)**
```bash
# Set the API key
export ANTHROPIC_API_KEY='sk-ant-your-key-here'

# Build the project
cargo build --release --features claude

# Run analysis
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

**Linux/macOS**
```bash
# Set the API key
export ANTHROPIC_API_KEY='sk-ant-your-key-here'

# Build the project
cargo build --release --features claude

# Run analysis
./target/release/tyr analyze -i examples/ecommerce-architecture.md -f console
```

---

### Option 2: Use .env File (Best for Development)

Create a `.env` file in the Tyr directory:

```bash
# .env file
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
AI_PROVIDER=claude
```

**Note**: The current Rust code doesn't auto-load `.env` files. You'll need to either:

1. **Install dotenv support** (I can add this for you)
2. **Manually source the .env file**:
   ```bash
   # Load .env into environment
   export $(cat .env | xargs)

   # Then run tyr
   ./target/release/tyr analyze -i examples/ecommerce-architecture.md
   ```

---

### Option 3: One-liner (Set API key inline)

**Linux/macOS/Git Bash**
```bash
ANTHROPIC_API_KEY='sk-ant-your-key' ./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

**Windows PowerShell**
```powershell
$env:ANTHROPIC_API_KEY='sk-ant-your-key'; .\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md
```

---

## Make API Key Permanent

### Windows (PowerShell - Current Session)
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
```

### Windows (PowerShell - Permanent)
```powershell
# Add to your PowerShell profile
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-your-key-here", "User")

# Or edit your profile
notepad $PROFILE
# Add this line:
# $env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
```

### Linux/macOS (Bash)
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Git Bash on Windows
```bash
# Add to ~/.bashrc
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

---

## All Available Commands

### Analyze a Single File

```bash
# Architecture analysis
tyr analyze -i examples/ecommerce-architecture.md -f console

# Terraform analysis with HTML output
tyr analyze -i examples/insecure-infrastructure.tf -t terraform -f html -o terraform-report.html

# Kubernetes analysis with JSON output
tyr analyze -i examples/insecure-k8s.yaml -t kubernetes -f json -o k8s-threats.json

# With custom risk threshold (only show high/critical)
tyr analyze -i examples/ecommerce-architecture.md -f console --risk-threshold high
```

### Batch Scan Directory

```bash
# Scan all files in examples directory
tyr scan -d examples/ -f console

# Scan only Terraform files
tyr scan -d ./infrastructure --pattern "*.tf" -f html -o infrastructure-report.html

# Scan only Kubernetes YAML files
tyr scan -d ./k8s --pattern "*.yaml" -f console
```

### Interactive Mode

```bash
# Start interactive mode
tyr interactive

# With context file
tyr interactive --context examples/ecommerce-architecture.md

# Then ask questions like:
# - "What are the top 3 critical threats?"
# - "How do I secure the database connections?"
# - "Explain the spoofing threats in detail"
# - "What STRIDE categories are most prevalent?"
```

---

## Using Ollama (Free Local AI)

### Setup Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1:8b  # Fast (4GB download)
# OR
ollama pull llama3.1:70b  # Better quality (40GB download, needs powerful GPU)

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### Build with Ollama Support

```bash
# Build with Ollama feature
cargo build --release --features ollama

# Set environment variables
export AI_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
export OLLAMA_HOST=http://localhost:11434

# Run analysis
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

### Build with Both Claude and Ollama

```bash
# Build with both providers
cargo build --release --features both

# Switch between providers using AI_PROVIDER env var
export AI_PROVIDER=claude  # Use Claude
export AI_PROVIDER=ollama  # Use Ollama
```

---

## Output Formats

### Console Output (Default)
```bash
tyr analyze -i examples/ecommerce-architecture.md -f console
# Outputs colorful, formatted text to terminal
```

### JSON Output (For CI/CD)
```bash
tyr analyze -i examples/ecommerce-architecture.md -f json -o threats.json
# Outputs structured JSON for automation
```

### HTML Report (For Sharing)
```bash
tyr analyze -i examples/ecommerce-architecture.md -f html -o report.html
# Creates standalone HTML report you can open in browser
```

---

## Common Issues

### Issue: "ANTHROPIC_API_KEY environment variable not set"

**Solution**: Set the API key before running:
```bash
export ANTHROPIC_API_KEY='sk-ant-your-key-here'
```

### Issue: "API request failed with status 401 Unauthorized"

**Possible causes**:
1. API key not set correctly
2. API key is invalid/expired
3. Environment variable not exported to child process

**Solution**:
```bash
# Verify the key is set
echo $ANTHROPIC_API_KEY

# If empty, set it:
export ANTHROPIC_API_KEY='sk-ant-your-key-here'

# Verify it's exported
env | grep ANTHROPIC
```

### Issue: Windows quickstart.sh doesn't work

**Solution**: Use PowerShell or set the API key manually:

**PowerShell**:
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key"
cargo build --release --features claude
.\target\release\tyr.exe analyze -i examples\ecommerce-architecture.md
```

**Git Bash**:
```bash
export ANTHROPIC_API_KEY='sk-ant-your-key'
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

### Issue: "Failed to connect to Ollama"

**Solution**:
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags

# Check your model is installed
ollama list
```

---

## Example Workflow

### Full Analysis Pipeline

```bash
# 1. Set API key
export ANTHROPIC_API_KEY='sk-ant-your-key-here'

# 2. Build the project
cargo build --release --features claude

# 3. Analyze architecture
./target/release/tyr analyze \
  -i examples/ecommerce-architecture.md \
  -f html \
  -o architecture-threats.html

# 4. Analyze Terraform
./target/release/tyr analyze \
  -i examples/insecure-infrastructure.tf \
  -t terraform \
  -f html \
  -o terraform-threats.html

# 5. Analyze Kubernetes
./target/release/tyr analyze \
  -i examples/insecure-k8s.yaml \
  -t kubernetes \
  -f html \
  -o k8s-threats.html

# 6. Open reports in browser
# Windows
start architecture-threats.html
# macOS
open architecture-threats.html
# Linux
xdg-open architecture-threats.html
```

---

## Getting Your Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys" in settings
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. **Important**: Save it securely - you can't view it again!

### API Pricing (as of 2024)

Claude Sonnet 4:
- Input: $3 per million tokens
- Output: $15 per million tokens

Typical threat analysis uses:
- ~2,000 input tokens (architecture description)
- ~3,000 output tokens (threat report)
- **Cost**: ~$0.05 per analysis

**Free tier**: $5 credit for new accounts (≈100 analyses)

---

## Pro Tips

### 1. Use Ollama for Free Unlimited Analyses
```bash
# One-time setup
./setup-ollama.sh

# Then use forever, completely free
AI_PROVIDER=ollama ./target/release/tyr analyze -i yourfile.md
```

### 2. Create Aliases for Common Commands
```bash
# Add to ~/.bashrc or ~/.zshrc
alias tyr-analyze='ANTHROPIC_API_KEY=$CLAUDE_KEY ./target/release/tyr analyze'
alias tyr-scan='ANTHROPIC_API_KEY=$CLAUDE_KEY ./target/release/tyr scan'

# Then use:
tyr-analyze -i somefile.tf -f html
```

### 3. Use Batch Mode for CI/CD
```bash
# In your CI/CD pipeline
export ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}
./target/release/tyr scan -d ./infrastructure -f json -o threats.json

# Fail build if critical threats found
if grep -q '"risk_level": "Critical"' threats.json; then
  echo "❌ Critical security threats found!"
  exit 1
fi
```

### 4. Interactive Mode for Learning
```bash
# Load your architecture as context
./target/release/tyr interactive --context path/to/your/architecture.md

# Then explore:
tyr> What are the authentication vulnerabilities?
tyr> How do I implement defense in depth?
tyr> What's the most critical threat to fix first?
```

---

**Need help?** Check:
- [README.md](README.md) - Full documentation
- [examples/README.md](examples/README.md) - Example file documentation
- [DESKTOP_APP_PLAN.md](DESKTOP_APP_PLAN.md) - Desktop app conversion plan
- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)
