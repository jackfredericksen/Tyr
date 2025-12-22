# 🖥️ Tyr Desktop App - Implementation Plan

## Why Desktop App?

Your Tyr CLI is great, but a desktop app offers:
- **Better UX**: Drag & drop files, visual reports, interactive charts
- **Easier for non-technical users**: No command line needed
- **Better visualization**: See threats in graphs, risk matrices, STRIDE diagrams
- **Settings UI**: Configure AI providers without editing `.env` files
- **History**: Save and revisit previous analyses
- **Export options**: One-click PDF/HTML/JSON exports
- **Real-time feedback**: Progress bars, streaming results

## Recommended: Tauri Framework

### Why Tauri?

| Feature | Tauri | Electron | Qt | egui |
|---------|-------|----------|----|----- |
| **Backend** | Your existing Rust ✅ | Node.js | C++/Python | Rust |
| **Frontend** | Modern web (React/Svelte) | Web tech | Qt Widgets | Immediate mode |
| **Binary Size** | ~3-5MB | ~50-120MB | ~20-40MB | ~5-10MB |
| **Memory** | Low (~50MB) | High (~150MB+) | Medium | Low |
| **Startup Time** | Fast | Slow | Medium | Very fast |
| **Security** | Excellent | Poor | Good | Excellent |
| **Learning Curve** | Medium | Easy | Hard | Medium |
| **Look & Feel** | Native | Web-like | Native | Custom |

**Winner: Tauri** - Use your existing Rust backend + modern web UI with minimal overhead.

## Architecture Design

```
Tyr Desktop
│
├── src-tauri/              # Rust backend (your existing code)
│   ├── src/
│   │   ├── main.rs         # Tauri entry point
│   │   ├── commands.rs     # Expose functions to frontend
│   │   ├── ai/             # Your existing AI modules
│   │   │   ├── mod.rs
│   │   │   ├── claude.rs
│   │   │   └── ollama.rs
│   │   ├── analyzer.rs     # Your existing analyzer
│   │   ├── models.rs       # Your existing models
│   │   ├── reporters.rs    # Your existing reporters
│   │   └── state.rs        # App state management
│   ├── Cargo.toml
│   └── tauri.conf.json     # Tauri configuration
│
├── src/                    # Frontend (React/TypeScript)
│   ├── components/
│   │   ├── FileUpload.tsx      # Drag & drop zone
│   │   ├── ThreatReport.tsx    # Display analysis results
│   │   ├── ThreatCard.tsx      # Individual threat component
│   │   ├── RiskChart.tsx       # Risk visualization (Chart.js)
│   │   ├── StrideMatrix.tsx    # STRIDE category breakdown
│   │   ├── Settings.tsx        # AI provider configuration
│   │   ├── History.tsx         # Past analyses
│   │   └── ExportMenu.tsx      # Export options
│   ├── pages/
│   │   ├── Home.tsx            # Landing page
│   │   ├── Analyze.tsx         # Main analysis page
│   │   ├── Interactive.tsx     # Chat interface
│   │   └── SettingsPage.tsx    # Settings page
│   ├── hooks/
│   │   ├── useAnalysis.ts      # Analysis state management
│   │   └── useTauri.ts         # Tauri command wrappers
│   ├── styles/
│   │   └── globals.css         # Tailwind + custom styles
│   ├── App.tsx
│   └── main.tsx
│
├── package.json            # Frontend dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Styling
└── vite.config.ts          # Build config
```

## Key Features to Implement

### 1. File Upload Interface
```typescript
// React component with drag & drop
<FileUploadZone
  onFileDrop={async (files) => {
    const content = await files[0].text();
    const result = await invoke('analyze_file', {
      content,
      inputType: 'architecture'
    });
    setThreats(result.threats);
  }}
/>
```

### 2. Tauri Commands (Rust ↔ Frontend Bridge)
```rust
// src-tauri/src/commands.rs
use tauri::State;
use crate::analyzer::ThreatAnalyzer;
use crate::models::{AnalysisResult, InputType};

#[tauri::command]
async fn analyze_file(
    content: String,
    input_type: String,
    include_education: bool,
    analyzer: State<'_, ThreatAnalyzer>,
) -> Result<AnalysisResult, String> {
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
    analyzer: State<'_, ThreatAnalyzer>,
) -> Result<String, String> {
    analyzer
        .interactive_query(&query, &history)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_ai_provider() -> String {
    std::env::var("AI_PROVIDER").unwrap_or_else(|_| "claude".to_string())
}

#[tauri::command]
fn set_ai_provider(provider: String) -> Result<(), String> {
    std::env::set_var("AI_PROVIDER", provider);
    Ok(())
}
```

### 3. Threat Visualization
```typescript
// RiskChart.tsx - Using Chart.js
import { Doughnut } from 'react-chartjs-2';

const RiskChart = ({ threats }) => {
  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        threats.filter(t => t.risk_level === 'Critical').length,
        threats.filter(t => t.risk_level === 'High').length,
        threats.filter(t => t.risk_level === 'Medium').length,
        threats.filter(t => t.risk_level === 'Low').length,
      ],
      backgroundColor: ['#DC2626', '#F59E0B', '#FCD34D', '#10B981'],
    }]
  };

  return <Doughnut data={data} />;
};
```

### 4. Settings Panel
```typescript
// Settings.tsx
const Settings = () => {
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');

  const saveSettings = async () => {
    await invoke('set_ai_provider', { provider });
    await invoke('set_api_key', { apiKey });
  };

  return (
    <div className="settings-panel">
      <h2>AI Provider</h2>
      <select value={provider} onChange={e => setProvider(e.target.value)}>
        <option value="claude">Claude (Cloud)</option>
        <option value="ollama">Ollama (Local)</option>
      </select>

      {provider === 'claude' && (
        <input
          type="password"
          placeholder="Anthropic API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
      )}

      {provider === 'ollama' && (
        <input
          type="text"
          placeholder="Ollama Model (e.g., llama3.1:8b)"
          value={ollamaModel}
          onChange={e => setOllamaModel(e.target.value)}
        />
      )}

      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
};
```

### 5. Interactive Chat Mode
```typescript
// Interactive.tsx
const InteractiveMode = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const history = messages.map(m => m.content);
    const response = await invoke('interactive_query', {
      query: input,
      history
    });

    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: response }
    ]);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        placeholder="Ask about security threats..."
      />
    </div>
  );
};
```

## Implementation Steps

### Phase 1: Setup (1-2 hours)
```bash
# Install Tauri CLI
cargo install tauri-cli

# Create Tauri app
cargo tauri init

# Install frontend dependencies
npm install react react-dom @vitejs/plugin-react
npm install -D tailwindcss postcss autoprefixer
npm install chart.js react-chartjs-2
npm install @tauri-apps/api
```

### Phase 2: Core Integration (2-3 hours)
1. Move existing Rust code to `src-tauri/src/`
2. Create Tauri commands in `commands.rs`
3. Wire up state management
4. Test basic invoke from frontend

### Phase 3: UI Components (3-4 hours)
1. File upload component with drag & drop
2. Threat report display
3. Risk visualization charts
4. Settings panel
5. Dark mode toggle

### Phase 4: Advanced Features (2-3 hours)
1. History/persistence (SQLite or JSON files)
2. Export to PDF/HTML/JSON
3. Progress indicators for long analyses
4. Interactive chat mode
5. Keyboard shortcuts

### Phase 5: Polish (1-2 hours)
1. Error handling and user feedback
2. Loading states
3. Animations and transitions
4. App icons and branding
5. Build and package

**Total Time: 9-14 hours** (for a complete desktop app)

## Tech Stack

### Backend (Rust)
- **tauri** - Desktop framework
- Your existing dependencies (tokio, reqwest, serde, etc.)

### Frontend (TypeScript + React)
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast!)
- **Tailwind CSS** - Styling
- **Chart.js** - Visualizations
- **React Chartjs 2** - React wrapper
- **@tauri-apps/api** - Tauri bindings

## Build Commands

```bash
# Development (hot reload)
npm run tauri dev

# Build for production
npm run tauri build

# Outputs:
# - Windows: .exe installer + .msi
# - macOS: .app + .dmg
# - Linux: .AppImage + .deb
```

## File Structure After Setup

```
Tyr/
├── src-tauri/
│   ├── icons/
│   ├── src/
│   ├── target/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── dist/           # Built frontend (auto-generated)
├── node_modules/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Benefits Over CLI

| Feature | CLI | Desktop App |
|---------|-----|-------------|
| File selection | Type path | Drag & drop |
| View results | Terminal text | Interactive charts |
| Configure settings | Edit .env | GUI settings panel |
| View history | Manual save | Built-in history |
| Export | Command flags | One-click export |
| Learning curve | Medium | Low |
| Accessibility | Command line | Point & click |

## Next Steps

Ready to build? Here's what we'll do:

1. **Initialize Tauri** - Set up the project structure
2. **Migrate Rust code** - Adapt your existing analyzer for Tauri
3. **Create UI** - Build React components
4. **Wire commands** - Connect frontend to Rust backend
5. **Add features** - Implement drag-drop, charts, settings
6. **Polish & package** - Build installers for Windows/Mac/Linux

**Want me to start implementing the Tauri desktop app?**

Just say "yes" and I'll:
- Set up the Tauri project
- Integrate your existing Rust code
- Create the React UI components
- Build a working desktop app

The result will be a professional desktop application that:
- ✅ Works on Windows, macOS, and Linux
- ✅ Has a modern, intuitive UI
- ✅ Uses your existing Rust backend
- ✅ Is small (~3-5MB) and fast
- ✅ Doesn't need command line knowledge

Let me know if you want to proceed! 🚀
