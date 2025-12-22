#!/bin/bash

set -e

echo "🛡️  AI Tyr - AI Threat Modeling Assistant - Quick Start"
echo "=============================================="
echo ""

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

echo "✅ Rust toolchain found"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "⚠️  ANTHROPIC_API_KEY not set!"
    echo ""
    read -sp "Enter your Anthropic API key: " api_key
    echo ""
    export ANTHROPIC_API_KEY="$api_key"
    echo ""
    echo "💡 Add this to your ~/.bashrc or ~/.zshrc to make it permanent:"
    echo "   export ANTHROPIC_API_KEY='sk-ant-...'"
    echo ""
fi

# Verify API key is actually set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ API key is empty. Please set ANTHROPIC_API_KEY environment variable."
    exit 1
fi

echo "✅ API key configured (${#ANTHROPIC_API_KEY} characters)"
echo ""

# Build the project
echo "🔨 Building project..."
cargo build --release

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# Run example analysis
echo "🚀 Running example analysis..."
echo ""

./target/release/tyr analyze \
    --input examples/ecommerce-architecture.md \
    --input-type architecture \
    --format console \
    --risk-threshold medium

echo ""
echo "✅ Analysis complete!"
echo ""
echo "📚 Try these next steps:"
echo "  1. Analyze Terraform: ./target/release/tyr analyze -i examples/insecure-infrastructure.tf -f html"
echo "  2. Analyze Kubernetes: ./target/release/tyr analyze -i examples/insecure-k8s.yaml -f html"
echo "  3. Interactive mode: ./target/release/tyr interactive"
echo "  4. Scan directory: ./target/release/tyr scan -d examples -f console"
echo ""
echo "📖 Full documentation: cat README.md"
