use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::*;
use std::path::PathBuf;

mod ai;
mod models;
mod analyzer;
mod reporters;

use analyzer::ThreatAnalyzer;
use models::{InputType, AnalysisResult};
use reporters::{ConsoleReporter, JsonReporter, HtmlReporter};

#[derive(Parser)]
#[command(name = "tyr")]
#[command(about = "Tyr - AI-powered threat modeling assistant for design-time security analysis", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze a system for security threats
    Analyze {
        /// Input file (architecture diagram description, Terraform, K8s manifest, etc.)
        #[arg(short, long)]
        input: PathBuf,

        /// Type of input: architecture, terraform, kubernetes, api-spec
        #[arg(short = 't', long, default_value = "architecture")]
        input_type: String,

        /// Output format: console, json, html
        #[arg(short = 'f', long, default_value = "console")]
        format: String,

        /// Output file path (optional, defaults to stdout for console/json)
        #[arg(short, long)]
        output: Option<PathBuf>,

        /// Risk threshold: low, medium, high, critical
        #[arg(short, long, default_value = "medium")]
        risk_threshold: String,

        /// Include educational explanations
        #[arg(short, long, default_value = "true")]
        explain: bool,
    },

    /// Analyze a directory of infrastructure files
    Scan {
        /// Directory to scan
        #[arg(short, long)]
        directory: PathBuf,

        /// File patterns to include (e.g., *.tf, *.yaml)
        #[arg(short, long)]
        pattern: Option<String>,

        /// Output format: console, json, html
        #[arg(short = 'f', long, default_value = "console")]
        format: String,

        /// Output file path
        #[arg(short, long)]
        output: Option<PathBuf>,
    },

    /// Interactive mode for iterative threat modeling
    Interactive {
        /// Initial context file (optional)
        #[arg(short, long)]
        context: Option<PathBuf>,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    print_banner();
    
    let cli = Cli::parse();

    match cli.command {
        Commands::Analyze {
            input,
            input_type,
            format,
            output,
            risk_threshold,
            explain,
        } => {
            handle_analyze(input, input_type, format, output, risk_threshold, explain).await?;
        }
        Commands::Scan {
            directory,
            pattern,
            format,
            output,
        } => {
            handle_scan(directory, pattern, format, output).await?;
        }
        Commands::Interactive { context } => {
            handle_interactive(context).await?;
        }
    }

    Ok(())
}

async fn handle_analyze(
    input: PathBuf,
    input_type: String,
    format: String,
    output: Option<PathBuf>,
    risk_threshold: String,
    explain: bool,
) -> Result<()> {
    println!("{}", "🔍 Starting threat analysis...".cyan().bold());
    
    // Read input file
    let content = std::fs::read_to_string(&input)?;
    
    // Determine input type
    let input_type = InputType::from_string(&input_type)?;
    
    // Create analyzer
    let analyzer = ThreatAnalyzer::new()?;
    
    // Perform analysis
    println!("{}", "🤖 Analyzing with Claude AI...".yellow());
    let result = analyzer.analyze(&content, input_type, explain).await?;
    
    // Generate report
    match format.as_str() {
        "console" => {
            let reporter = ConsoleReporter::new();
            reporter.generate(&result, &risk_threshold)?;
        }
        "json" => {
            let reporter = JsonReporter::new();
            let json_output = reporter.generate(&result)?;
            if let Some(output_path) = output {
                std::fs::write(output_path, json_output)?;
                println!("{}", "✅ Report written to file".green().bold());
            } else {
                println!("{}", json_output);
            }
        }
        "html" => {
            let reporter = HtmlReporter::new();
            let html_output = reporter.generate(&result)?;
            let output_path = output.unwrap_or_else(|| PathBuf::from("threat_report.html"));
            std::fs::write(&output_path, html_output)?;
            println!(
                "{}",
                format!("✅ HTML report written to {}", output_path.display())
                    .green()
                    .bold()
            );
        }
        _ => {
            anyhow::bail!("Unsupported format: {}", format);
        }
    }
    
    Ok(())
}

async fn handle_scan(
    directory: PathBuf,
    pattern: Option<String>,
    format: String,
    output: Option<PathBuf>,
) -> Result<()> {
    println!("{}", "📁 Scanning directory for security issues...".cyan().bold());
    
    use walkdir::WalkDir;
    
    let mut files = Vec::new();
    
    for entry in WalkDir::new(&directory)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            
            // Check pattern if provided
            if let Some(ref pat) = pattern {
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if !filename.contains(pat) {
                        continue;
                    }
                }
            }
            
            // Detect file type
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                match ext {
                    "tf" | "yaml" | "yml" | "json" => {
                        files.push(path.to_path_buf());
                    }
                    _ => continue,
                }
            }
        }
    }
    
    println!("{}", format!("Found {} files to analyze", files.len()).yellow());
    
    let analyzer = ThreatAnalyzer::new()?;
    let mut all_results = Vec::new();
    
    for file_path in files {
        println!("{}", format!("  Analyzing: {}", file_path.display()).cyan());
        
        let content = std::fs::read_to_string(&file_path)?;
        let input_type = InputType::from_file_extension(&file_path)?;
        
        match analyzer.analyze(&content, input_type, true).await {
            Ok(result) => all_results.push(result),
            Err(e) => eprintln!("  {} {}", "⚠️  Error:".yellow(), e),
        }
    }
    
    // Aggregate and report
    println!("\n{}", "📊 Analysis Complete".green().bold());
    println!("{}", format!("Total files analyzed: {}", all_results.len()));
    
    Ok(())
}

async fn handle_interactive(context: Option<PathBuf>) -> Result<()> {
    println!("{}", "💬 Interactive Threat Modeling Mode".cyan().bold());
    println!("{}", "Type 'exit' to quit, 'help' for commands\n".yellow());
    
    let analyzer = ThreatAnalyzer::new()?;
    let mut conversation_history = Vec::new();
    
    // Load context if provided
    if let Some(context_path) = context {
        let content = std::fs::read_to_string(&context_path)?;
        conversation_history.push(content);
        println!("{}", "✅ Context loaded".green());
    }
    
    loop {
        use std::io::{self, Write};
        
        print!("{}", "tyr> ".bright_blue().bold());
        io::stdout().flush()?;
        
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let input = input.trim();
        
        match input {
            "exit" | "quit" => break,
            "help" => {
                print_help();
                continue;
            }
            "clear" => {
                conversation_history.clear();
                println!("{}", "✅ Conversation history cleared".green());
                continue;
            }
            "" => continue,
            _ => {
                // Process the input
                println!("{}", "🤖 Analyzing...".yellow());
                
                match analyzer.interactive_query(input, &conversation_history).await {
                    Ok(response) => {
                        println!("\n{}", response);
                        conversation_history.push(input.to_string());
                        conversation_history.push(response);
                    }
                    Err(e) => {
                        eprintln!("{} {}", "❌ Error:".red(), e);
                    }
                }
            }
        }
        
        println!();
    }
    
    Ok(())
}

fn print_banner() {
    let banner = r#"
╔════════════════════════════════════════════════════════════╗
║   ⚔️  TYR - AI THREAT MODELING ASSISTANT                   ║
║   Design-Time Security Analysis with AI                   ║
╚════════════════════════════════════════════════════════════╝
    "#;
    
    println!("{}", banner.bright_cyan());
}

fn print_help() {
    println!("{}", "Available commands:".bright_yellow().bold());
    println!("  {} - Describe your system architecture", "describe".green());
    println!("  {} - Paste infrastructure code", "paste".green());
    println!("  {} - Ask specific security questions", "question".green());
    println!("  {} - Clear conversation history", "clear".yellow());
    println!("  {} - Exit interactive mode", "exit".red());
}
