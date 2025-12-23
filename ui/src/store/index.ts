import { create } from 'zustand'
import type { Project, ProjectFile, AnalysisResult, ChatMessage, AppSettings, ViewType } from '../types'

interface AppState {
  // Current view
  currentView: ViewType
  setCurrentView: (view: ViewType) => void

  // Projects
  projects: Project[]
  currentProject: Project | null
  createProject: (name: string) => void
  loadProject: (id: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Files
  addFiles: (files: ProjectFile[]) => void
  removeFile: (fileName: string) => void
  clearFiles: () => void

  // Analysis
  analysisResult: AnalysisResult | null
  setAnalysisResult: (result: AnalysisResult | null) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void

  // Settings
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void

  // UI state
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // View state
  currentView: 'upload',
  setCurrentView: (view) => set({ currentView: view }),

  // Projects state
  projects: [],
  currentProject: null,

  createProject: (name) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      files: get().currentProject?.files || [],
      analysis: get().analysisResult || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    }
    set((state) => ({
      projects: [...state.projects, newProject],
      currentProject: newProject
    }))
  },

  loadProject: (id) => {
    const project = get().projects.find(p => p.id === id)
    if (project) {
      set({
        currentProject: project,
        analysisResult: project.analysis || null,
        chatMessages: []
      })
    }
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      ),
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, ...updates, updatedAt: Date.now() }
        : state.currentProject
    }))
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject
    }))
  },

  // Files management
  addFiles: (files) => {
    set((state) => {
      const currentFiles = state.currentProject?.files || []
      const newFiles = [...currentFiles, ...files]

      if (state.currentProject) {
        return {
          currentProject: {
            ...state.currentProject,
            files: newFiles,
            updatedAt: Date.now()
          }
        }
      }

      // Create temporary project if none exists
      const tempProject: Project = {
        id: `temp-${Date.now()}`,
        name: 'Unsaved Project',
        files: newFiles,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      return { currentProject: tempProject }
    })
  },

  removeFile: (fileName) => {
    set((state) => {
      if (!state.currentProject) return state

      return {
        currentProject: {
          ...state.currentProject,
          files: state.currentProject.files.filter(f => f.name !== fileName),
          updatedAt: Date.now()
        }
      }
    })
  },

  clearFiles: () => {
    set((state) => {
      if (!state.currentProject) return state

      return {
        currentProject: {
          ...state.currentProject,
          files: [],
          updatedAt: Date.now()
        }
      }
    })
  },

  // Analysis state
  analysisResult: null,
  setAnalysisResult: (result) => {
    set((state) => {
      if (state.currentProject) {
        return {
          analysisResult: result,
          currentProject: {
            ...state.currentProject,
            analysis: result || undefined,
            updatedAt: Date.now()
          }
        }
      }
      return { analysisResult: result }
    })
  },

  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  // Chat state
  chatMessages: [],
  addChatMessage: (message) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, message]
    }))
  },
  clearChat: () => set({ chatMessages: [] }),

  // Settings state
  settings: {
    theme: 'system',
    aiProvider: 'ollama',
    ollamaModel: 'llama3.1:8b',
    autoSave: true
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }))
  },

  // UI state
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
}))
