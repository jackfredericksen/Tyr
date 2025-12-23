use serde::{Deserialize, Serialize};
use std::path::Path;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InputType {
    Architecture,
    Terraform,
    Kubernetes,
    ApiSpec,
    SystemDescription,
}

impl InputType {
    pub fn from_string(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "architecture" | "arch" => Ok(InputType::Architecture),
            "terraform" | "tf" => Ok(InputType::Terraform),
            "kubernetes" | "k8s" | "kube" => Ok(InputType::Kubernetes),
            "api" | "api-spec" | "openapi" => Ok(InputType::ApiSpec),
            "system" | "description" => Ok(InputType::SystemDescription),
            _ => anyhow::bail!("Unknown input type: {}", s),
        }
    }
    
    pub fn from_file_extension(path: &Path) -> Result<Self> {
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
            
        match ext {
            "tf" => Ok(InputType::Terraform),
            "yaml" | "yml" => {
                // Check if it's a Kubernetes manifest
                let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if filename.contains("deployment") || filename.contains("service") {
                    Ok(InputType::Kubernetes)
                } else {
                    Ok(InputType::SystemDescription)
                }
            }
            "json" => Ok(InputType::ApiSpec),
            _ => Ok(InputType::SystemDescription),
        }
    }
    
    pub fn as_str(&self) -> &str {
        match self {
            InputType::Architecture => "architecture diagram",
            InputType::Terraform => "Terraform configuration",
            InputType::Kubernetes => "Kubernetes manifest",
            InputType::ApiSpec => "API specification",
            InputType::SystemDescription => "system description",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum StrideCategory {
    Spoofing,
    Tampering,
    Repudiation,
    InformationDisclosure,
    DenialOfService,
    ElevationOfPrivilege,
}

impl StrideCategory {
    pub fn all() -> Vec<Self> {
        vec![
            Self::Spoofing,
            Self::Tampering,
            Self::Repudiation,
            Self::InformationDisclosure,
            Self::DenialOfService,
            Self::ElevationOfPrivilege,
        ]
    }
    
    pub fn description(&self) -> &str {
        match self {
            Self::Spoofing => "Pretending to be something or someone other than yourself",
            Self::Tampering => "Modifying data or code",
            Self::Repudiation => "Claiming you didn't do something or denying actions",
            Self::InformationDisclosure => "Exposing information to unauthorized individuals",
            Self::DenialOfService => "Denying or degrading service to users",
            Self::ElevationOfPrivilege => "Gaining capabilities without proper authorization",
        }
    }
    
    pub fn icon(&self) -> &str {
        match self {
            Self::Spoofing => "👤",
            Self::Tampering => "⚠️",
            Self::Repudiation => "📝",
            Self::InformationDisclosure => "🔓",
            Self::DenialOfService => "🚫",
            Self::ElevationOfPrivilege => "🔐",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "critical" => RiskLevel::Critical,
            "high" => RiskLevel::High,
            "medium" => RiskLevel::Medium,
            _ => RiskLevel::Low,
        }
    }
    
    pub fn color_code(&self) -> &str {
        match self {
            RiskLevel::Critical => "\x1b[91m", // Bright red
            RiskLevel::High => "\x1b[31m",     // Red
            RiskLevel::Medium => "\x1b[33m",   // Yellow
            RiskLevel::Low => "\x1b[32m",      // Green
        }
    }
    
    pub fn as_str(&self) -> &str {
        match self {
            RiskLevel::Critical => "CRITICAL",
            RiskLevel::High => "HIGH",
            RiskLevel::Medium => "MEDIUM",
            RiskLevel::Low => "LOW",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Threat {
    pub id: String,
    pub title: String,
    pub category: StrideCategory,
    pub risk_level: RiskLevel,
    pub description: String,
    pub attack_path: Vec<String>,
    pub impact: String,
    pub affected_components: Vec<String>,
    pub mitigations: Vec<Mitigation>,
    pub educational_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mitigation {
    pub title: String,
    pub description: String,
    pub effort: String, // "Low", "Medium", "High"
    pub effectiveness: String, // "Partial", "High", "Complete"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub input_type: InputType,
    pub threats: Vec<Threat>,
    pub summary: AnalysisSummary,
    pub recommendations: Vec<String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisSummary {
    pub total_threats: usize,
    pub by_risk_level: RiskBreakdown,
    pub by_stride_category: CategoryBreakdown,
    pub overall_risk_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskBreakdown {
    pub critical: usize,
    pub high: usize,
    pub medium: usize,
    pub low: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryBreakdown {
    pub spoofing: usize,
    pub tampering: usize,
    pub repudiation: usize,
    pub information_disclosure: usize,
    pub denial_of_service: usize,
    pub elevation_of_privilege: usize,
}

impl AnalysisResult {
    pub fn new(input_type: InputType, threats: Vec<Threat>) -> Self {
        let summary = AnalysisSummary::from_threats(&threats);
        let timestamp = chrono::Utc::now().to_rfc3339();
        
        Self {
            input_type,
            threats,
            summary,
            recommendations: Vec::new(),
            timestamp,
        }
    }
    
    pub fn add_recommendations(&mut self, recommendations: Vec<String>) {
        self.recommendations = recommendations;
    }
}

impl AnalysisSummary {
    pub fn from_threats(threats: &[Threat]) -> Self {
        let mut by_risk_level = RiskBreakdown {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };
        
        let mut by_stride_category = CategoryBreakdown {
            spoofing: 0,
            tampering: 0,
            repudiation: 0,
            information_disclosure: 0,
            denial_of_service: 0,
            elevation_of_privilege: 0,
        };
        
        for threat in threats {
            match threat.risk_level {
                RiskLevel::Critical => by_risk_level.critical += 1,
                RiskLevel::High => by_risk_level.high += 1,
                RiskLevel::Medium => by_risk_level.medium += 1,
                RiskLevel::Low => by_risk_level.low += 1,
            }
            
            match threat.category {
                StrideCategory::Spoofing => by_stride_category.spoofing += 1,
                StrideCategory::Tampering => by_stride_category.tampering += 1,
                StrideCategory::Repudiation => by_stride_category.repudiation += 1,
                StrideCategory::InformationDisclosure => by_stride_category.information_disclosure += 1,
                StrideCategory::DenialOfService => by_stride_category.denial_of_service += 1,
                StrideCategory::ElevationOfPrivilege => by_stride_category.elevation_of_privilege += 1,
            }
        }
        
        // Calculate overall risk score (0-100)
        let total = threats.len() as f32;
        let overall_risk_score = if total > 0.0 {
            let weighted_sum = (by_risk_level.critical as f32 * 10.0)
                + (by_risk_level.high as f32 * 7.0)
                + (by_risk_level.medium as f32 * 4.0)
                + (by_risk_level.low as f32 * 1.0);
            (weighted_sum / total).min(10.0) * 10.0
        } else {
            0.0
        };
        
        Self {
            total_threats: threats.len(),
            by_risk_level,
            by_stride_category,
            overall_risk_score,
        }
    }
}
