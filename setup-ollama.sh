#!/bin/bash

set -e

echo "🛡️  AI Tyr - AI Threat Modeling Assistant - Ollama Setup"
echo "================================================"
echo ""

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

echo "✅ Rust toolchain found"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "📥 Ollama not found. Installing..."
    echo ""
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Detected macOS. Please download Ollama from https://ollama.ai/download"
        echo "Or install via Homebrew: brew install ollama"
        exit 1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo "Please install Ollama from https://ollama.ai/download"
        exit 1
    fi
fi

echo "✅ Ollama installed"
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "🚀 Starting Ollama server..."
    ollama serve > /dev/null 2>&1 &
    sleep 2
fi

echo "✅ Ollama server running"
echo ""

# Pull recommended model
echo "📥 Checking for AI models..."
if ! ollama list | grep -q "llama3.1"; then
    echo ""
    echo "Downloading recommended model (this may take a while)..."
    echo "Model: llama3.1:8b (faster, works on most systems)"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    
    ollama pull llama3.1:8b
    
    echo ""
    echo "✅ Model downloaded!"
    echo ""
    echo "💡 For better quality (requires powerful GPU), you can also install:"
    echo "   ollama pull llama3.1:70b"
else
    echo "✅ Llama model already installed"
fi

echo ""

# Set environment variables
export AI_PROVIDER=ollama
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=llama3.1:8b

echo "🔧 Environment configured:"
echo "   AI_PROVIDER=$AI_PROVIDER"
echo "   OLLAMA_HOST=$OLLAMA_HOST"
echo "   OLLAMA_MODEL=$OLLAMA_MODEL"
echo ""

# Build the project with Ollama feature
echo "🔨 Building project with Ollama support..."
cargo build --release --features ollama

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# Run example analysis
echo "🚀 Running example analysis with local AI..."
echo ""

./target/release/tyr analyze \
    --input examples/ecommerce-architecture.md \
    --input-type architecture \
    --format console \
    --risk-threshold medium

echo ""
echo "✅ Analysis complete!"
echo ""
echo "🎉 Success! Your AI Threat Modeler is now running with local AI (no cloud API needed)"
echo ""
echo "📚 Next steps:"
echo "  1. Analyze Terraform: ./target/release/tyr analyze -i examples/insecure-infrastructure.tf -f html"
echo "  2. Analyze Kubernetes: ./target/release/tyr analyze -i examples/insecure-k8s.yaml -f html"
echo "  3. Interactive mode: ./target/release/tyr interactive"
echo "  4. Try the 70B model for better quality: export OLLAMA_MODEL=llama3.1:70b"
echo ""
echo "💡 To make environment variables permanent, add them to your ~/.bashrc or ~/.zshrc:"
echo "   export AI_PROVIDER=ollama"
echo "   export OLLAMA_MODEL=llama3.1:8b"
