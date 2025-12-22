# Integrating Local AI Models - Implementation Guide

This guide shows you how to replace the Claude API with a local AI model for the threat modeling assistant.

## Architecture Overview

### Current: Cloud-based (Anthropic API)
```
User Input → API Client → Anthropic API → Claude → Response
```

### New: Local AI
```
User Input → Model Interface → Local LLM → Response
```

## Option 1: Ollama (Recommended - Easiest)

Ollama provides a simple API for running models locally.

### Setup Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a capable model for security analysis
ollama pull llama3.1:70b  # Best quality
# OR
ollama pull llama3.1:8b   # Faster, less accurate
# OR  
ollama pull codellama:34b # Good for code analysis
# OR
ollama pull mixtral:8x7b  # Good balance
```

### Modified Cargo.toml

```toml
[dependencies]
# ... existing dependencies ...

# For Ollama integration
ollama-rs = "0.2"

[features]
default = ["ollama"]
ollama = []
claude = []  # Keep Claude as optional
```

### New file: src/ai/mod.rs

```rust
pub mod ollama;
pub mod claude;

use async_trait::async_trait;
use anyhow::Result;

#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String>;
    
    async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String>;
}

pub fn create_provider() -> Result<Box<dyn AIProvider>> {
    #[cfg(feature = "ollama")]
    {
        Ok(Box::new(ollama::OllamaProvider::new()?))
    }
    
    #[cfg(feature = "claude")]
    {
        Ok(Box::new(claude::ClaudeProvider::new()?))
    }
}
```

### New file: src/ai/ollama.rs

```rust
use async_trait::async_trait;
use anyhow::Result;
use ollama_rs::{
    generation::completion::request::GenerationRequest,
    Ollama,
};
use std::env;
use crate::ai::AIProvider;

pub struct OllamaProvider {
    client: Ollama,
    model: String,
}

impl OllamaProvider {
    pub fn new() -> Result<Self> {
        let host = env::var("OLLAMA_HOST")
            .unwrap_or_else(|_| "http://localhost:11434".to_string());
        
        let model = env::var("OLLAMA_MODEL")
            .unwrap_or_else(|_| "llama3.1:70b".to_string());
        
        let client = Ollama::new(host, 11434);
        
        Ok(Self { client, model })
    }
    
    fn build_system_prompt(&self, include_education: bool) -> String {
        let base = r#"You are an expert security architect and threat modeling specialist. 
Your role is to analyze system architectures, infrastructure code, and API specifications 
to identify security threats using the STRIDE methodology.

STRIDE Categories:
- Spoofing: Identity theft, authentication bypass
- Tampering: Data modification, code injection
- Repudiation: Denying actions, lack of audit trails
- Information Disclosure: Data leaks, unauthorized access
- Denial of Service: Resource exhaustion, availability attacks
- Elevation of Privilege: Unauthorized access escalation

For each threat, provide a JSON response with this EXACT structure:
{
  "threats": [
    {
      "id": "T001",
      "title": "Clear threat name",
      "category": "Spoofing|Tampering|Repudiation|InformationDisclosure|DenialOfService|ElevationOfPrivilege",
      "risk_level": "Critical|High|Medium|Low",
      "description": "Detailed description",
      "attack_path": ["step1", "step2", "step3"],
      "impact": "What damage could result",
      "affected_components": ["component1", "component2"],
      "mitigations": [
        {
          "title": "Mitigation name",
          "description": "How to implement",
          "effort": "Low|Medium|High",
          "effectiveness": "Partial|High|Complete"
        }
      ]"#;

        let education = if include_education {
            r#",
      "educational_note": "Why this matters with real-world examples"
    }
  ],
  "recommendations": ["overall recommendation 1", "recommendation 2"]
}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object."#
        } else {
            r#"
    }
  ],
  "recommendations": ["overall recommendation 1", "recommendation 2"]
}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object."#
        };

        format!("{}{}", base, education)
    }
}

#[async_trait]
impl AIProvider for OllamaProvider {
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String> {
        let system_prompt = self.build_system_prompt(include_education);
        
        let user_prompt = format!(
            "Analyze the following {} for security threats:\n\n{}",
            input_type, content
        );
        
        let full_prompt = format!("{}\n\n{}", system_prompt, user_prompt);
        
        let request = GenerationRequest::new(self.model.clone(), full_prompt)
            .temperature(0.3)  // Lower temperature for more focused output
            .top_p(0.9);
        
        let response = self.client.generate(request).await?;
        
        Ok(response.response)
    }
    
    async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String> {
        let system_prompt = "You are a security expert helping with threat modeling. \
                           Provide clear, actionable security advice.";
        
        // Build conversation context
        let mut conversation = String::new();
        for (i, msg) in history.iter().enumerate() {
            let role = if i % 2 == 0 { "User" } else { "Assistant" };
            conversation.push_str(&format!("{}: {}\n\n", role, msg));
        }
        conversation.push_str(&format!("User: {}\n\nAssistant:", query));
        
        let full_prompt = format!("{}\n\n{}", system_prompt, conversation);
        
        let request = GenerationRequest::new(self.model.clone(), full_prompt)
            .temperature(0.7);
        
        let response = self.client.generate(request).await?;
        
        Ok(response.response)
    }
}
```

### Modified src/analyzer.rs

```rust
use anyhow::Result;
use crate::ai::{create_provider, AIProvider};
use crate::models::{AnalysisResult, InputType};

pub struct ThreatAnalyzer {
    provider: Box<dyn AIProvider>,
}

impl ThreatAnalyzer {
    pub fn new() -> Result<Self> {
        Ok(Self {
            provider: create_provider()?,
        })
    }
    
    pub async fn analyze(
        &self,
        content: &str,
        input_type: InputType,
        include_education: bool,
    ) -> Result<AnalysisResult> {
        let response = self
            .provider
            .analyze_threats(content, input_type.as_str(), include_education)
            .await?;
            
        let parsed = self.parse_response(&response)?;
        
        let mut result = AnalysisResult::new(input_type, parsed.threats);
        
        if let Some(recommendations) = parsed.recommendations {
            result.add_recommendations(recommendations);
        }
        
        Ok(result)
    }
    
    // ... rest of implementation
}
```

### Usage

```bash
# Start Ollama server (if not already running)
ollama serve

# Run the threat modeler
OLLAMA_MODEL=llama3.1:70b cargo run --features ollama -- analyze -i examples/ecommerce-architecture.md
```

---

## Option 2: llama.cpp (More Control)

For maximum control and performance optimization.

### Setup

```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build
make

# Download a model (GGUF format)
# Example: Llama 3.1 70B
wget https://huggingface.co/TheBloke/Llama-3.1-70B-Instruct-GGUF/resolve/main/llama-3.1-70b-instruct.Q4_K_M.gguf
```

### Cargo.toml

```toml
[dependencies]
# ... existing ...
llm = "0.1"  # Rust bindings for llama.cpp
```

### src/ai/llama_cpp.rs

```rust
use async_trait::async_trait;
use anyhow::Result;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::io::Write;
use crate::ai::AIProvider;

pub struct LlamaCppProvider {
    binary_path: PathBuf,
    model_path: PathBuf,
}

impl LlamaCppProvider {
    pub fn new() -> Result<Self> {
        let binary_path = PathBuf::from(
            std::env::var("LLAMA_CPP_PATH")
                .unwrap_or_else(|_| "./llama.cpp/main".to_string())
        );
        
        let model_path = PathBuf::from(
            std::env::var("LLAMA_MODEL_PATH")?
        );
        
        Ok(Self { binary_path, model_path })
    }
    
    async fn generate(&self, prompt: &str) -> Result<String> {
        let mut child = Command::new(&self.binary_path)
            .arg("-m").arg(&self.model_path)
            .arg("-n").arg("4096")  // Max tokens
            .arg("--temp").arg("0.3")
            .arg("-p").arg(prompt)
            .arg("--no-display-prompt")
            .stdout(Stdio::piped())
            .spawn()?;
        
        let output = child.wait_with_output()?;
        
        Ok(String::from_utf8(output.stdout)?)
    }
}

#[async_trait]
impl AIProvider for LlamaCppProvider {
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String> {
        // Similar to Ollama implementation
        let prompt = self.build_prompt(content, input_type, include_education);
        self.generate(&prompt).await
    }
    
    async fn interactive_query(&self, query: &str, history: &[String]) -> Result<String> {
        let prompt = self.build_interactive_prompt(query, history);
        self.generate(&prompt).await
    }
}
```

---

## Option 3: Custom Fine-tuned Model

For best results, fine-tune a model specifically for threat modeling.

### Training Data Format

Create training examples in JSONL format:

```jsonl
{"prompt": "Analyze this Terraform:\nresource \"aws_security_group\" \"allow_all\" {\n  ingress {\n    from_port = 0\n    to_port = 65535\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}", "completion": "{\"threats\": [{\"id\": \"T001\", \"title\": \"Unrestricted Inbound Access\", \"category\": \"DenialOfService\", ...}]}"}
```

### Fine-tuning Script (Python)

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from datasets import load_dataset

# Load base model
model_name = "meta-llama/Llama-3.1-70B-Instruct"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load training data
dataset = load_dataset("json", data_files="threat_modeling_training.jsonl")

# Training configuration
training_args = TrainingArguments(
    output_dir="./threat-model-llama",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
)

trainer.train()
model.save_pretrained("./threat-model-llama-final")
```

---

## Option 4: vLLM Server (Production-Ready)

For high-performance inference serving.

### Setup vLLM

```bash
pip install vllm

# Start server
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --dtype auto
```

### Cargo.toml

```toml
[dependencies]
# Use standard HTTP client - vLLM provides OpenAI-compatible API
reqwest = { version = "0.11", features = ["json"] }
```

### src/ai/vllm.rs

```rust
use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::ai::AIProvider;

#[derive(Serialize)]
struct VLLMRequest {
    model: String,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Deserialize)]
struct VLLMResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    text: String,
}

pub struct VLLMProvider {
    client: Client,
    base_url: String,
    model: String,
}

impl VLLMProvider {
    pub fn new() -> Result<Self> {
        let base_url = std::env::var("VLLM_URL")
            .unwrap_or_else(|_| "http://localhost:8000".to_string());
        
        let model = std::env::var("VLLM_MODEL")
            .unwrap_or_else(|_| "meta-llama/Llama-3.1-70B-Instruct".to_string());
        
        Ok(Self {
            client: Client::new(),
            base_url,
            model,
        })
    }
}

#[async_trait]
impl AIProvider for VLLMProvider {
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String> {
        let prompt = self.build_prompt(content, input_type, include_education);
        
        let request = VLLMRequest {
            model: self.model.clone(),
            prompt,
            max_tokens: 4096,
            temperature: 0.3,
        };
        
        let response = self.client
            .post(&format!("{}/v1/completions", self.base_url))
            .json(&request)
            .send()
            .await?
            .json::<VLLMResponse>()
            .await?;
        
        Ok(response.choices[0].text.clone())
    }
    
    async fn interactive_query(&self, query: &str, history: &[String]) -> Result<String> {
        // Similar implementation
        todo!()
    }
}
```

---

## Comparison Matrix

| Solution | Ease of Setup | Performance | Quality | Cost | GPU Required |
|----------|--------------|-------------|---------|------|--------------|
| **Ollama** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Optional |
| **llama.cpp** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Optional |
| **Fine-tuned** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Training cost | Yes |
| **vLLM** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Yes |
| **Claude API** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Pay-per-use | No |

---

## Recommended Models for Security Analysis

### Best Quality (70B+ parameters)
- **Llama 3.1 70B Instruct** - Best all-around
- **Mixtral 8x22B** - Great reasoning
- **Qwen 72B** - Strong on code

### Best Performance/Quality Balance (30-40B)
- **CodeLlama 34B** - Excellent for infrastructure code
- **Mixtral 8x7B** - Fast and capable

### Fastest (8B parameters)
- **Llama 3.1 8B** - Surprisingly good
- **Mistral 7B** - Fast responses

---

## Configuration File

Create `config.toml`:

```toml
[ai]
provider = "ollama"  # or "claude", "vllm", "llama_cpp"

[ollama]
host = "http://localhost:11434"
model = "llama3.1:70b"

[vllm]
url = "http://localhost:8000"
model = "meta-llama/Llama-3.1-70B-Instruct"

[llama_cpp]
binary_path = "./llama.cpp/main"
model_path = "./models/llama-3.1-70b-instruct.Q4_K_M.gguf"
```

---

## Performance Optimization Tips

### 1. Quantization
Use quantized models for faster inference:
- **Q4_K_M**: Good balance (4-bit)
- **Q5_K_M**: Better quality (5-bit)
- **Q8_0**: Best quality (8-bit)

### 2. Batching
Process multiple files in parallel:

```rust
use futures::stream::{self, StreamExt};

async fn analyze_batch(files: Vec<PathBuf>) -> Result<Vec<AnalysisResult>> {
    stream::iter(files)
        .map(|file| async move {
            analyzer.analyze_file(file).await
        })
        .buffer_unordered(4)  // Process 4 concurrently
        .collect()
        .await
}
```

### 3. Caching
Cache analysis results:

```rust
use std::collections::HashMap;
use sha2::{Sha256, Digest};

struct CachedAnalyzer {
    cache: HashMap<String, AnalysisResult>,
}

impl CachedAnalyzer {
    fn get_cache_key(&self, content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content);
        format!("{:x}", hasher.finalize())
    }
}
```

---

## Complete Example: Switching to Ollama

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull model
ollama pull llama3.1:70b

# 3. Update Cargo.toml
# Add ollama-rs dependency

# 4. Run
OLLAMA_MODEL=llama3.1:70b cargo run --features ollama -- \
  analyze -i examples/ecommerce-architecture.md
```

That's it! You now have a fully local threat modeling system with no external API dependencies.
