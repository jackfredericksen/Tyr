pub mod claude;

#[cfg(feature = "ollama")]
pub mod ollama;

use async_trait::async_trait;
use anyhow::Result;

/// Trait for AI providers that can perform threat analysis
#[async_trait]
pub trait AIProvider: Send + Sync {
    /// Analyze content for security threats
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String>;
    
    /// Handle interactive queries with conversation history
    async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String>;
    
    /// Get the name of the provider
    fn name(&self) -> &str;
}

/// Create an AI provider based on feature flags and environment
pub fn create_provider() -> Result<Box<dyn AIProvider>> {
    // Check environment variable first
    let provider = std::env::var("AI_PROVIDER").unwrap_or_else(|_| {
        #[cfg(feature = "ollama")]
        return "ollama".to_string();
        
        #[cfg(not(feature = "ollama"))]
        return "claude".to_string();
    });
    
    match provider.to_lowercase().as_str() {
        #[cfg(feature = "ollama")]
        "ollama" => {
            println!("🤖 Using Ollama for local AI inference");
            Ok(Box::new(ollama::OllamaProvider::new()?))
        }
        
        #[cfg(feature = "claude")]
        "claude" => {
            println!("🤖 Using Claude API for threat analysis");
            Ok(Box::new(claude::ClaudeProvider::new()?))
        }
        
        _ => {
            anyhow::bail!(
                "Unknown AI provider: {}. Available: {}",
                provider,
                get_available_providers()
            )
        }
    }
}

fn get_available_providers() -> String {
    let mut providers = Vec::new();
    
    #[cfg(feature = "claude")]
    providers.push("claude");
    
    #[cfg(feature = "ollama")]
    providers.push("ollama");
    
    providers.join(", ")
}
