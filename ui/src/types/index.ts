// TypeScript interfaces for the entire application

export interface Threat {
  id: string
  title: string
  category: string
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  impact?: string
  attack_path?: string[]
  affected_components?: string[]
  mitigations?: Mitigation[]
  educational_note?: string
}

export interface Mitigation {
  title: string
  description: string
  effort: 'Low' | 'Medium' | 'High'
  effectiveness: 'Partial' | 'High' | 'Complete'
}

export interface AnalysisResult {
  threats: Threat[]
  overall_risk_score?: number
  recommendations?: string[]
}

export interface ProjectFile {
  name: string
  content: string
  type: 'architecture' | 'terraform' | 'kubernetes' | 'api-spec'
  size: number
  lastModified: number
}

export interface Project {
  id: string
  name: string
  files: ProjectFile[]
  analysis?: AnalysisResult
  createdAt: number
  updatedAt: number
  tags?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  aiProvider: 'ollama' | 'claude'
  ollamaModel: string
  anthropicKey?: string
  autoSave: boolean
}

export type ViewType = 'upload' | 'dashboard' | 'chat' | 'projects' | 'settings'
