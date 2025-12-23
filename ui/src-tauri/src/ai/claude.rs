use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use crate::ai::AIProvider;

const API_ENDPOINT: &str = "https://api.anthropic.com/v1/messages";
const MODEL: &str = "claude-sonnet-4-20250514";

#[derive(Debug, Serialize)]
struct ApiRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<Message>,
    system: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    content: Vec<ContentBlock>,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    block_type: String,
    text: Option<String>,
}

pub struct ClaudeProvider {
    client: Client,
    api_key: String,
}

impl ClaudeProvider {
    pub fn new() -> Result<Self> {
        let api_key = env::var("ANTHROPIC_API_KEY")
            .map_err(|_| anyhow::anyhow!("ANTHROPIC_API_KEY environment variable not set"))?;
            
        Ok(Self {
            client: Client::new(),
            api_key,
        })
    }
    
    async fn send_message(
        &self,
        messages: Vec<Message>,
        system_prompt: Option<String>,
    ) -> Result<String> {
        let request = ApiRequest {
            model: MODEL.to_string(),
            max_tokens: 4096,
            messages,
            system: system_prompt,
        };
        
        let response = self
            .client
            .post(API_ENDPOINT)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            anyhow::bail!("API request failed with status {}: {}", status, error_text);
        }
        
        let api_response: ApiResponse = response.json().await?;
        
        // Extract text from content blocks
        let text = api_response
            .content
            .iter()
            .filter_map(|block| block.text.clone())
            .collect::<Vec<_>>()
            .join("\n");
            
        Ok(text)
    }
    
    fn build_system_prompt(&self, include_education: bool) -> String {
        let base_prompt = r#"You are an expert security architect and threat modeling specialist. Your role is to analyze system architectures, infrastructure code, and API specifications to identify security threats using the STRIDE methodology.

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

Format your response as JSON with this structure:
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
  ]
}

Be thorough but focus on realistic, high-impact threats. Prioritize vulnerabilities that are commonly exploited or have severe consequences."#;

        if include_education {
            format!("{}{}{}", base_prompt, education_addon, closing)
        } else {
            format!(
                "{}{}{}",
                base_prompt,
                r#"
    }
  ],"#,
                closing
            )
        }
    }
}

#[async_trait]
impl AIProvider for ClaudeProvider {
    async fn analyze_threats(
        &self,
        content: &str,
        input_type: &str,
        include_education: bool,
    ) -> Result<String> {
        let system_prompt = self.build_system_prompt(include_education);
        
        let user_message = format!(
            "Analyze the following {} for security threats:\n\n{}",
            input_type, content
        );
        
        let messages = vec![Message {
            role: "user".to_string(),
            content: user_message,
        }];
        
        self.send_message(messages, Some(system_prompt)).await
    }
    
    async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String> {
        let mut messages = Vec::new();
        
        // Add conversation history
        for (i, msg) in history.iter().enumerate() {
            let role = if i % 2 == 0 { "user" } else { "assistant" };
            messages.push(Message {
                role: role.to_string(),
                content: msg.clone(),
            });
        }
        
        // Add current query
        messages.push(Message {
            role: "user".to_string(),
            content: query.to_string(),
        });
        
        let system_prompt = self.build_system_prompt(true);
        self.send_message(messages, Some(system_prompt)).await
    }
    
    fn name(&self) -> &str {
        "Claude (Anthropic API)"
    }
}
