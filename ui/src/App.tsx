import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { SunIcon, MoonIcon, PlayIcon } from '@heroicons/react/24/outline'
import { Sidebar } from './components/Sidebar'
import { FileUpload } from './components/FileUpload'
import { Dashboard } from './components/Dashboard'
import { ChatPanel } from './components/ChatPanel'
import { ProjectList } from './components/ProjectList'
import { Settings } from './components/Settings'
import { useAppStore } from './store'
import type { AnalysisResult } from './types'
import toast from 'react-hot-toast'

function App() {
  const {
    currentView,
    currentProject,
    setAnalysisResult,
    isAnalyzing,
    setIsAnalyzing,
    settings,
    updateSettings
  } = useAppStore()

  const [darkMode, setDarkMode] = useState(false)
  const isMountedRef = useRef(true)

  // Initialize theme and listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches)
      setDarkMode(isDark)

      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Initial update
    updateTheme()

    // Listen for system theme changes
    const handleChange = () => {
      if (settings.theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.theme])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Run analysis
  const runAnalysis = async () => {
    if (!currentProject || currentProject.files.length === 0) {
      toast.error('Please add files first')
      return
    }

    if (!isMountedRef.current) return
    setIsAnalyzing(true)
    const toastId = toast.loading('Analyzing your architecture...')

    try {
      // Combine all files
      const combinedContent = currentProject.files
        .map((f) => `=== ${f.name} (${f.type}) ===\n${f.content}\n`)
        .join('\n\n')

      // Call Tauri command
      const result = await invoke<AnalysisResult>('analyze_content', {
        content: combinedContent,
        inputType: 'architecture',
        includeEducation: true
      })

      // Only update state if component is still mounted
      if (!isMountedRef.current) return

      setAnalysisResult(result)
      toast.success('Analysis complete!', { id: toastId })
    } catch (error) {
      console.error('Analysis error:', error)
      if (isMountedRef.current) {
        toast.error(`Analysis failed: ${error}`, { id: toastId })
      }
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false)
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = darkMode ? 'light' : 'dark'
    setDarkMode(!darkMode)
    updateSettings({ theme: newTheme })
  }

  const getViewContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upload Files
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Add your architecture diagrams, infrastructure code, or API specs
                </p>
              </div>

              {currentProject && currentProject.files.length > 0 && (
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:shadow-none"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Run Analysis</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <FileUpload />
          </div>
        )

      case 'dashboard':
        return <Dashboard />

      case 'chat':
        return <ChatPanel />

      case 'projects':
        return <ProjectList />

      case 'settings':
        return <Settings />

      default:
        return null
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white lg:hidden">
                  Tyr
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Toggle theme"
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </button>

                {/* User Info */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {getViewContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#1f2937' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff'
            }
          }
        }}
      />
    </div>
  )
}

export default App
