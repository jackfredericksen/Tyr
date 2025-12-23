// Tyr Desktop - Tauri Application
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod ai;
mod models;
mod analyzer;
mod reporters;

use analyzer::ThreatAnalyzer;
use models::{AnalysisResult, InputType};

#[tauri::command]
async fn initialize_analyzer() -> Result<String, String> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();

    match ThreatAnalyzer::new() {
        Ok(analyzer) => {
            Ok(format!("Initialized: {}", analyzer.provider_name()))
        }
        Err(e) => Err(format!("Failed to initialize analyzer: {}", e)),
    }
}

#[tauri::command]
async fn analyze_content(
    content: String,
    input_type: String,
    include_education: bool,
) -> Result<AnalysisResult, String> {
    // Load .env
    dotenv::dotenv().ok();

    let analyzer = ThreatAnalyzer::new()
        .map_err(|e| format!("Failed to create analyzer: {}", e))?;

    let input_type = InputType::from_string(&input_type)
        .map_err(|e| e.to_string())?;

    analyzer
        .analyze(&content, input_type, include_education)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn interactive_query(
    query: String,
    history: Vec<String>,
) -> Result<String, String> {
    // Load .env
    dotenv::dotenv().ok();

    let analyzer = ThreatAnalyzer::new()
        .map_err(|e| format!("Failed to create analyzer: {}", e))?;

    analyzer
        .interactive_query(&query, &history)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_ai_provider() -> String {
    dotenv::dotenv().ok();
    std::env::var("AI_PROVIDER").unwrap_or_else(|_| "ollama".to_string())
}

#[tauri::command]
fn get_ollama_model() -> String {
    dotenv::dotenv().ok();
    std::env::var("OLLAMA_MODEL").unwrap_or_else(|_| "llama3.1:8b".to_string())
}

#[tauri::command]
fn set_ai_provider(provider: String) -> Result<(), String> {
    std::env::set_var("AI_PROVIDER", provider);
    Ok(())
}

#[tauri::command]
fn set_ollama_model(model: String) -> Result<(), String> {
    std::env::set_var("OLLAMA_MODEL", model);
    Ok(())
}

#[tauri::command]
fn set_anthropic_key(key: String) -> Result<(), String> {
    std::env::set_var("ANTHROPIC_API_KEY", key);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            initialize_analyzer,
            analyze_content,
            interactive_query,
            get_ai_provider,
            get_ollama_model,
            set_ai_provider,
            set_ollama_model,
            set_anthropic_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
