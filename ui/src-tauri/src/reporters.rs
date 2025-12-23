use anyhow::Result;
use colored::*;
use crate::models::{AnalysisResult, RiskLevel, StrideCategory};

pub struct ConsoleReporter;

impl ConsoleReporter {
    pub fn new() -> Self {
        Self
    }
    
    pub fn generate(&self, result: &AnalysisResult, risk_threshold: &str) -> Result<()> {
        let threshold = RiskLevel::from_string(risk_threshold);
        
        println!("\n{}", "═══════════════════════════════════════════════════".bright_cyan());
        println!("{}", "       THREAT ANALYSIS REPORT".bright_cyan().bold());
        println!("{}", "═══════════════════════════════════════════════════".bright_cyan());
        
        // Summary
        self.print_summary(result);
        
        // Threats
        println!("\n{}", "🎯 IDENTIFIED THREATS".bright_yellow().bold());
        println!("{}", "─────────────────────────────────────────────────────".yellow());
        
        let mut filtered_threats: Vec<_> = result
            .threats
            .iter()
            .filter(|t| t.risk_level >= threshold)
            .collect();
            
        filtered_threats.sort_by(|a, b| b.risk_level.cmp(&a.risk_level));
        
        if filtered_threats.is_empty() {
            println!("{}", "No threats found above the specified threshold.".green());
        }
        
        for (i, threat) in filtered_threats.iter().enumerate() {
            self.print_threat(threat, i + 1);
        }
        
        // Recommendations
        if !result.recommendations.is_empty() {
            println!("\n{}", "💡 RECOMMENDATIONS".bright_blue().bold());
            println!("{}", "─────────────────────────────────────────────────────".blue());
            for (i, rec) in result.recommendations.iter().enumerate() {
                println!("  {}. {}", (i + 1).to_string().bright_blue(), rec);
            }
        }
        
        println!("\n{}", "═══════════════════════════════════════════════════".bright_cyan());
        
        Ok(())
    }
    
    fn print_summary(&self, result: &AnalysisResult) {
        let summary = &result.summary;
        
        println!("\n{}", "📊 SUMMARY".bright_green().bold());
        println!("  Total Threats: {}", summary.total_threats.to_string().bright_white().bold());
        println!("  Overall Risk Score: {}/100", 
            format!("{:.1}", summary.overall_risk_score)
                .color(self.get_score_color(summary.overall_risk_score))
                .bold()
        );
        
        println!("\n  {} By Risk Level:", "📈".to_string());
        println!("    {} Critical: {}", "🔴", summary.by_risk_level.critical.to_string().bright_red().bold());
        println!("    {} High:     {}", "🟠", summary.by_risk_level.high.to_string().red().bold());
        println!("    {} Medium:   {}", "🟡", summary.by_risk_level.medium.to_string().yellow().bold());
        println!("    {} Low:      {}", "🟢", summary.by_risk_level.low.to_string().green().bold());
        
        println!("\n  {} By STRIDE Category:", "🎯".to_string());
        println!("    {} Spoofing:              {}", StrideCategory::Spoofing.icon(), summary.by_stride_category.spoofing);
        println!("    {} Tampering:             {}", StrideCategory::Tampering.icon(), summary.by_stride_category.tampering);
        println!("    {} Repudiation:           {}", StrideCategory::Repudiation.icon(), summary.by_stride_category.repudiation);
        println!("    {} Information Disclosure: {}", StrideCategory::InformationDisclosure.icon(), summary.by_stride_category.information_disclosure);
        println!("    {} Denial of Service:     {}", StrideCategory::DenialOfService.icon(), summary.by_stride_category.denial_of_service);
        println!("    {} Elevation of Privilege: {}", StrideCategory::ElevationOfPrivilege.icon(), summary.by_stride_category.elevation_of_privilege);
    }
    
    fn print_threat(&self, threat: &crate::models::Threat, index: usize) {
        let risk_color = match threat.risk_level {
            RiskLevel::Critical => "bright red",
            RiskLevel::High => "red",
            RiskLevel::Medium => "yellow",
            RiskLevel::Low => "green",
        };
        
        println!("\n{} {} [{}] {}",
            format!("[{}]", index).bright_white().bold(),
            threat.category.icon(),
            threat.risk_level.as_str().color(risk_color).bold(),
            threat.title.bright_white().bold()
        );
        
        println!("  {} {}", "Category:".bright_cyan(), format!("{:?}", threat.category).cyan());
        println!("  {} {}", "ID:".bright_cyan(), threat.id.cyan());
        
        println!("\n  {} {}", "Description:".bright_yellow(), threat.description);
        
        if !threat.attack_path.is_empty() {
            println!("\n  {} Attack Path:", "🎯".to_string().bright_red());
            for (i, step) in threat.attack_path.iter().enumerate() {
                println!("    {}. {}", i + 1, step);
            }
        }
        
        println!("\n  {} {}", "Impact:".bright_red().bold(), threat.impact);
        
        if !threat.affected_components.is_empty() {
            println!("\n  {} Affected Components:", "⚙️".to_string());
            for comp in &threat.affected_components {
                println!("    • {}", comp);
            }
        }
        
        if !threat.mitigations.is_empty() {
            println!("\n  {} Mitigations:", "🛡️".to_string().bright_green());
            for (i, mitigation) in threat.mitigations.iter().enumerate() {
                println!("    {}. {} (Effort: {}, Effectiveness: {})",
                    i + 1,
                    mitigation.title.green(),
                    mitigation.effort,
                    mitigation.effectiveness
                );
                println!("       {}", mitigation.description.bright_black());
            }
        }
        
        if let Some(ref note) = threat.educational_note {
            println!("\n  {} Educational Note:", "📚".to_string().bright_blue());
            println!("    {}", note.bright_black());
        }
        
        println!("{}", "  ─────────────────────────────────────────────────".bright_black());
    }
    
    fn get_score_color(&self, score: f32) -> &str {
        if score >= 75.0 {
            "bright red"
        } else if score >= 50.0 {
            "yellow"
        } else if score >= 25.0 {
            "bright blue"
        } else {
            "green"
        }
    }
}

pub struct JsonReporter;

impl JsonReporter {
    pub fn new() -> Self {
        Self
    }
    
    pub fn generate(&self, result: &AnalysisResult) -> Result<String> {
        let json = serde_json::to_string_pretty(result)?;
        Ok(json)
    }
}

pub struct HtmlReporter;

impl HtmlReporter {
    pub fn new() -> Self {
        Self
    }
    
    pub fn generate(&self, result: &AnalysisResult) -> Result<String> {
        let html = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Threat Analysis Report - {}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #e0e0e0;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid rgba(100, 200, 255, 0.3);
        }}
        
        .header h1 {{
            font-size: 2.5rem;
            color: #64c8ff;
            margin-bottom: 0.5rem;
            text-shadow: 0 0 20px rgba(100, 200, 255, 0.5);
        }}
        
        .header .timestamp {{
            color: #888;
            font-size: 0.9rem;
        }}
        
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }}
        
        .summary-card {{
            background: linear-gradient(135deg, rgba(100, 200, 255, 0.1) 0%, rgba(100, 200, 255, 0.05) 100%);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(100, 200, 255, 0.2);
        }}
        
        .summary-card h3 {{
            font-size: 0.9rem;
            color: #64c8ff;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .summary-card .value {{
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
        }}
        
        .risk-score {{
            font-size: 3rem !important;
        }}
        
        .risk-critical {{ color: #ff4444; }}
        .risk-high {{ color: #ff8844; }}
        .risk-medium {{ color: #ffbb44; }}
        .risk-low {{ color: #44ff88; }}
        
        .threats {{
            margin-top: 2rem;
        }}
        
        .threat-card {{
            background: rgba(255, 255, 255, 0.03);
            margin-bottom: 2rem;
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .threat-card:hover {{
            transform: translateX(5px);
            box-shadow: -5px 5px 20px rgba(0, 0, 0, 0.3);
        }}
        
        .threat-card.critical {{ border-left-color: #ff4444; }}
        .threat-card.high {{ border-left-color: #ff8844; }}
        .threat-card.medium {{ border-left-color: #ffbb44; }}
        .threat-card.low {{ border-left-color: #44ff88; }}
        
        .threat-header {{
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 1rem;
        }}
        
        .threat-title {{
            font-size: 1.4rem;
            color: #fff;
            margin-bottom: 0.5rem;
        }}
        
        .threat-meta {{
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: #888;
        }}
        
        .badge {{
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }}
        
        .badge.critical {{ background: #ff4444; color: #000; }}
        .badge.high {{ background: #ff8844; color: #000; }}
        .badge.medium {{ background: #ffbb44; color: #000; }}
        .badge.low {{ background: #44ff88; color: #000; }}
        
        .threat-description {{
            margin: 1rem 0;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            line-height: 1.8;
        }}
        
        .attack-path {{
            margin: 1.5rem 0;
        }}
        
        .attack-path h4 {{
            color: #ff6666;
            margin-bottom: 1rem;
            font-size: 1rem;
        }}
        
        .attack-step {{
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: rgba(255, 100, 100, 0.1);
            border-left: 3px solid #ff6666;
            border-radius: 4px;
        }}
        
        .mitigations {{
            margin-top: 1.5rem;
        }}
        
        .mitigations h4 {{
            color: #44ff88;
            margin-bottom: 1rem;
            font-size: 1rem;
        }}
        
        .mitigation {{
            padding: 1rem;
            margin-bottom: 0.75rem;
            background: rgba(100, 255, 150, 0.05);
            border-left: 3px solid #44ff88;
            border-radius: 4px;
        }}
        
        .mitigation-title {{
            font-weight: bold;
            color: #44ff88;
            margin-bottom: 0.5rem;
        }}
        
        .mitigation-meta {{
            font-size: 0.85rem;
            color: #888;
            margin-top: 0.5rem;
        }}
        
        .educational-note {{
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(100, 200, 255, 0.1);
            border-left: 3px solid #64c8ff;
            border-radius: 4px;
        }}
        
        .educational-note h4 {{
            color: #64c8ff;
            margin-bottom: 0.5rem;
        }}
        
        .recommendations {{
            margin-top: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(100, 200, 255, 0.1) 0%, rgba(100, 200, 255, 0.05) 100%);
            border-radius: 12px;
            border: 1px solid rgba(100, 200, 255, 0.2);
        }}
        
        .recommendations h2 {{
            color: #64c8ff;
            margin-bottom: 1rem;
        }}
        
        .recommendations ul {{
            list-style: none;
            padding-left: 0;
        }}
        
        .recommendations li {{
            padding: 0.75rem 0;
            padding-left: 1.5rem;
            position: relative;
        }}
        
        .recommendations li:before {{
            content: "→";
            position: absolute;
            left: 0;
            color: #64c8ff;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 1.5rem;
            }}
            
            .header h1 {{
                font-size: 1.8rem;
            }}
            
            .summary {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Threat Analysis Report</h1>
            <p class="timestamp">Generated: {}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Overall Risk Score</h3>
                <div class="value risk-score {}">{:.1}/100</div>
            </div>
            <div class="summary-card">
                <h3>Total Threats</h3>
                <div class="value">{}</div>
            </div>
            <div class="summary-card">
                <h3>Critical Risks</h3>
                <div class="value risk-critical">{}</div>
            </div>
            <div class="summary-card">
                <h3>High Risks</h3>
                <div class="value risk-high">{}</div>
            </div>
        </div>
        
        <div class="threats">
            <h2 style="color: #64c8ff; margin-bottom: 2rem;">🎯 Identified Threats</h2>
            {}
        </div>
        
        {}
    </div>
</body>
</html>"#,
            result.timestamp,
            result.timestamp,
            self.get_risk_class(result.summary.overall_risk_score),
            result.summary.overall_risk_score,
            result.summary.total_threats,
            result.summary.by_risk_level.critical,
            result.summary.by_risk_level.high,
            self.generate_threat_cards(result),
            self.generate_recommendations(result)
        );
        
        Ok(html)
    }
    
    fn get_risk_class(&self, score: f32) -> &str {
        if score >= 75.0 {
            "risk-critical"
        } else if score >= 50.0 {
            "risk-high"
        } else if score >= 25.0 {
            "risk-medium"
        } else {
            "risk-low"
        }
    }
    
    fn generate_threat_cards(&self, result: &AnalysisResult) -> String {
        let mut html = String::new();
        
        for threat in &result.threats {
            let risk_class = threat.risk_level.as_str().to_lowercase();
            
            html.push_str(&format!(r#"
            <div class="threat-card {}">
                <div class="threat-header">
                    <div>
                        <div class="threat-title">{}</div>
                        <div class="threat-meta">
                            <span>ID: {}</span>
                            <span>Category: {:?}</span>
                        </div>
                    </div>
                    <span class="badge {}">{}</span>
                </div>
                
                <div class="threat-description">
                    {}
                </div>
                
                <div style="margin: 1rem 0; padding: 0.75rem; background: rgba(255, 100, 100, 0.1); border-radius: 6px;">
                    <strong style="color: #ff6666;">Impact:</strong> {}
                </div>
                
                {}"#,
                risk_class,
                threat.title,
                threat.id,
                threat.category,
                risk_class,
                threat.risk_level.as_str(),
                threat.description,
                threat.impact,
                self.generate_attack_path(&threat.attack_path)
            ));
            
            html.push_str(&self.generate_mitigations(&threat.mitigations));
            
            if let Some(ref note) = threat.educational_note {
                html.push_str(&format!(r#"
                <div class="educational-note">
                    <h4>📚 Educational Note</h4>
                    <p>{}</p>
                </div>"#, note));
            }
            
            html.push_str("</div>");
        }
        
        html
    }
    
    fn generate_attack_path(&self, steps: &[String]) -> String {
        if steps.is_empty() {
            return String::new();
        }
        
        let mut html = String::from(r#"<div class="attack-path"><h4>🎯 Attack Path</h4>"#);
        
        for (i, step) in steps.iter().enumerate() {
            html.push_str(&format!(r#"<div class="attack-step">{}. {}</div>"#, i + 1, step));
        }
        
        html.push_str("</div>");
        html
    }
    
    fn generate_mitigations(&self, mitigations: &[crate::models::Mitigation]) -> String {
        if mitigations.is_empty() {
            return String::new();
        }
        
        let mut html = String::from(r#"<div class="mitigations"><h4>🛡️ Mitigations</h4>"#);
        
        for mitigation in mitigations {
            html.push_str(&format!(r#"
            <div class="mitigation">
                <div class="mitigation-title">{}</div>
                <div>{}</div>
                <div class="mitigation-meta">Effort: {} | Effectiveness: {}</div>
            </div>"#,
                mitigation.title,
                mitigation.description,
                mitigation.effort,
                mitigation.effectiveness
            ));
        }
        
        html.push_str("</div>");
        html
    }
    
    fn generate_recommendations(&self, result: &AnalysisResult) -> String {
        if result.recommendations.is_empty() {
            return String::new();
        }
        
        let mut html = String::from(r#"<div class="recommendations"><h2>💡 Recommendations</h2><ul>"#);
        
        for rec in &result.recommendations {
            html.push_str(&format!("<li>{}</li>", rec));
        }
        
        html.push_str("</ul></div>");
        html
    }
}
