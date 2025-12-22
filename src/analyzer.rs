use anyhow::Result;
use crate::ai::{create_provider, AIProvider};
use crate::models::{AnalysisResult, InputType, Threat};

pub struct ThreatAnalyzer {
    provider: Box<dyn AIProvider>,
}

impl ThreatAnalyzer {
    pub fn new() -> Result<Self> {
        let provider = create_provider()?;
        println!("✅ Initialized AI provider: {}", provider.name());
        
        Ok(Self { provider })
    }
    
    pub async fn analyze(
        &self,
        content: &str,
        input_type: InputType,
        include_education: bool,
    ) -> Result<AnalysisResult> {
        // Call AI provider
        let response = self
            .provider
            .analyze_threats(content, input_type.as_str(), include_education)
            .await?;
            
        // Parse the JSON response
        let parsed = self.parse_response(&response)?;
        
        // Create analysis result
        let mut result = AnalysisResult::new(input_type, parsed.threats);
        
        if let Some(recommendations) = parsed.recommendations {
            result.add_recommendations(recommendations);
        }
        
        Ok(result)
    }
    
    pub async fn interactive_query(
        &self,
        query: &str,
        history: &[String],
    ) -> Result<String> {
        self.provider.interactive_query(query, history).await
    }
    
    fn parse_response(&self, response: &str) -> Result<ParsedResponse> {
        // Try to extract JSON from the response
        let json_str = if let Some(start) = response.find('{') {
            if let Some(end) = response.rfind('}') {
                &response[start..=end]
            } else {
                response
            }
        } else {
            response
        };
        
        // Parse JSON
        let parsed: ParsedResponse = serde_json::from_str(json_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse API response as JSON: {}. Response was: {}", e, json_str))?;
            
        Ok(parsed)
    }
}

#[derive(Debug, serde::Deserialize)]
struct ParsedResponse {
    threats: Vec<Threat>,
    recommendations: Option<Vec<String>>,
}
