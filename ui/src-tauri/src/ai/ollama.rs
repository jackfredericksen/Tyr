use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use crate::ai::AIProvider;

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Serialize)]
struct OllamaOptions {
    temperature: f32,
    top_p: f32,
    num_predict: i32,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

pub struct OllamaProvider {
    client: Client,
    base_url: String,
    model: String,
}

impl OllamaProvider {
    pub fn new() -> Result<Self> {
        let base_url = env::var("OLLAMA_HOST")
            .unwrap_or_else(|_| "http://localhost:11434".to_string());
        
        let model = env::var("OLLAMA_MODEL")
            .unwrap_or_else(|_| "llama3.1:70b".to_string());
        
        println!("📡 Connecting to Ollama at: {}", base_url);
        println!("🤖 Using model: {}", model);
        
        Ok(Self {
            client: Client::new(),
            base_url,
            model,
        })
    }
    
    async fn generate(&self, prompt: &str, temperature: f32) -> Result<String> {
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
            options: OllamaOptions {
                temperature,
                top_p: 0.9,
                num_predict: 4096,
            },
        };
        
        let response = self.client
            .post(&format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to connect to Ollama. Is it running? Error: {}", e))?;
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            anyhow::bail!("Ollama request failed with status {}: {}", status, error_text);
        }
        
        let ollama_response: OllamaResponse = response.json().await?;
        
        Ok(ollama_response.response)
    }
    
    fn build_system_prompt(&self, include_education: bool) -> String {
        let base = r#"You are an expert security architect and threat modeling specialist. Your role is to analyze system architectures, infrastructure code, and API specifications to identify security threats using the STRIDE methodology.

STRIDE Categories:
- Spoofing: Identity theft, authentication bypass
- Tampering: Data modification, code injection
- Repudiation: Denying actions, lack of audit trails
- Information Disclosure: Data leaks, unauthorized access
- Denial of Service: Resource exhaustion, availability attacks
- Elevation of Privilege: Unauthorized access escalation

For each threat you identify, provide:

1. **Threat Title**: Clear, concise name
2. **STRIDE Category**: Which category it falls under
3. **Risk Level**: CRITICAL, HIGH, MEDIUM, or LOW
4. **Description**: What the threat is and why it matters
5. **Attack Path**: Step-by-step how an attacker could exploit this
6. **Impact**: What damage could result
7. **Affected Components**: Which parts of the system are vulnerable
8. **Mitigations**: Specific countermeasures (with effort and effectiveness ratings)

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:
{
  "threats": [
    {
      "id": "T001",
      "title": "...",
      "category": "Spoofing|Tampering|Repudiation|InformationDisclosure|DenialOfService|ElevationOfPrivilege",
      "risk_level": "Critical|High|Medium|Low",
      "description": "...",
      "attack_path": ["step1", "step2", ...],
      "impact": "...",
      "affected_components": ["component1", ...],
      "mitigations": [
        {
          "title": "...",
          "description": "...",
          "effort": "Low|Medium|High",
          "effectiveness": "Partial|High|Complete"
        }
      ]"#;

        let education_addon = r#",
      "educational_note": "Detailed explanation of why this threat matters in real-world scenarios, including examples and common mistakes"
    }
  ],
  "recommendations": ["overall recommendation 1", ...]
}"#;

        let closing = r#"
    }
  ],
  "recommendations": ["overall recommendation 1", ...]
}

IMPORTANT RULES:
1. Respond with ONLY the JSON object, no markdown code blocks, no explanations
2. Do not include ```json or ``` markers
3. Ensure all JSON is valid and properly formatted
4. Be thorough but focus on realistic, high-impact threats
5. Prioritize vulnerabilities that are commonly exploited or have severe consequences"#;

        if include_education {
            format!("{}{}{}", base, education_addon, closing)
        } else {
            format!("{}{}", base, closing)
        }
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
        
        println!("🔍 Analyzing with local AI model...");
        
        // Use lower temperature for more focused, consistent output
        let response = self.generate(&full_prompt, 0.3).await?;
        
        // Try to extract JSON if model wrapped it in markdown
        let cleaned = if response.contains("```json") {
            response
                .split("```json")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(&response)
                .trim()
        } else if response.contains("```") {
            response
                .split("```")
                .nth(1)
                .unwrap_or(&response)
                .trim()
        } else {
            response.trim()
        };
        
        Ok(cleaned.to_string())
    }
    
    async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String> {
        let system_prompt = r#"You are a security expert helping with threat modeling. Provide clear, actionable security advice.

When discussing threats:
- Be specific and practical
- Reference STRIDE categories where relevant
- Suggest concrete mitigations
- Explain in plain language
- Use real-world examples when helpful"#;
        
        // Build conversation context
        let mut conversation = String::new();
        for (i, msg) in history.iter().enumerate() {
            let role = if i % 2 == 0 { "User" } else { "Assistant" };
            conversation.push_str(&format!("{}: {}\n\n", role, msg));
        }
        conversation.push_str(&format!("User: {}\n\nAssistant:", query));
        
        let full_prompt = format!("{}\n\n{}", system_prompt, conversation);
        
        // Use higher temperature for more conversational responses
        self.generate(&full_prompt, 0.7).await
    }
    
    fn name(&self) -> &str {
        "Ollama (Local AI)"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_prompt_building() {
        let provider = OllamaProvider {
            client: Client::new(),
            base_url: "http://localhost:11434".to_string(),
            model: "llama3.1:70b".to_string(),
        };
        
        let prompt = provider.build_system_prompt(true);
        assert!(prompt.contains("STRIDE"));
        assert!(prompt.contains("educational_note"));
        
        let prompt_no_edu = provider.build_system_prompt(false);
        assert!(!prompt_no_edu.contains("educational_note"));
    }
}
