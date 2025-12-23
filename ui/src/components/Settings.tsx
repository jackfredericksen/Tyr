import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Cog6ToothIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { invoke } from '@tauri-apps/api/core'
import toast from 'react-hot-toast'
import { useAppStore } from '../store'

export function Settings() {
  const { settings, updateSettings } = useAppStore()
  const [aiProvider, setAiProvider] = useState<'ollama' | 'claude'>('ollama')
  const [ollamaModel, setOllamaModel] = useState('llama3.1:8b')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [loading, setLoading] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    loadSettings()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadSettings = async () => {
    try {
      const provider = await invoke<string>('get_ai_provider')
      if (!isMountedRef.current) return
      setAiProvider(provider as 'ollama' | 'claude')

      const model = await invoke<string>('get_ollama_model')
      if (!isMountedRef.current) return
      setOllamaModel(model)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveAiProvider = async (provider: 'ollama' | 'claude') => {
    if (!isMountedRef.current) return
    setLoading(true)
    try {
      await invoke('set_ai_provider', { provider })
      if (!isMountedRef.current) return
      setAiProvider(provider)
      updateSettings({ aiProvider: provider })
      toast.success(`AI provider set to ${provider}`)
    } catch (error) {
      console.error('Failed to save AI provider:', error)
      if (isMountedRef.current) {
        toast.error('Failed to save AI provider')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const saveOllamaModel = async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    try {
      await invoke('set_ollama_model', { model: ollamaModel })
      if (!isMountedRef.current) return
      updateSettings({ ollamaModel })
      toast.success('Ollama model updated')
    } catch (error) {
      console.error('Failed to save Ollama model:', error)
      if (isMountedRef.current) {
        toast.error('Failed to save Ollama model')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const saveAnthropicKey = async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    try {
      await invoke('set_anthropic_key', { key: anthropicKey })
      if (!isMountedRef.current) return
      updateSettings({ anthropicKey })
      toast.success('Anthropic API key saved')
    } catch (error) {
      console.error('Failed to save Anthropic key:', error)
      if (isMountedRef.current) {
        toast.error('Failed to save Anthropic key')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const themes: Array<{ id: 'light' | 'dark' | 'system'; label: string; icon: typeof SunIcon }> = [
    { id: 'light', label: 'Light', icon: SunIcon },
    { id: 'dark', label: 'Dark', icon: MoonIcon },
    { id: 'system', label: 'System', icon: ComputerDesktopIcon }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className="w-8 h-8 text-gray-900 dark:text-white" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure your Tyr experience
          </p>
        </div>
      </div>

      {/* AI Provider Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          AI Provider
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => saveAiProvider('ollama')}
              disabled={loading}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 transition-all
                ${aiProvider === 'ollama'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Ollama</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Free, local AI (100% private)
                </p>
              </div>
            </button>

            <button
              onClick={() => saveAiProvider('claude')}
              disabled={loading}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 transition-all
                ${aiProvider === 'claude'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Claude</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cloud AI (requires API key)
                </p>
              </div>
            </button>
          </div>

          {aiProvider === 'ollama' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ollama Model
                </span>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.1:8b"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                onClick={saveOllamaModel}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Save Model
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Make sure Ollama is running and the model is downloaded
              </p>
            </motion.div>
          )}

          {aiProvider === 'claude' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Anthropic API Key
                </span>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                onClick={saveAnthropicKey}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Save API Key
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get your API key from console.anthropic.com
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Theme Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appearance
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => {
            const Icon = theme.icon
            const isActive = settings.theme === theme.id

            return (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`
                  flex flex-col items-center space-y-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${isActive
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {theme.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Auto-save Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto-save Projects
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically save analysis results to project workspace
            </p>
          </div>
          <button
            onClick={() => updateSettings({ autoSave: !settings.autoSave })}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.autoSave ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          About Tyr
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          AI-powered threat modeling assistant that helps security teams identify and mitigate
          security threats in their architecture, infrastructure, and code.
        </p>
        <div className="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <p>Version: 0.1.0</p>
          <p>Built with Rust + React + Tauri</p>
        </div>
      </motion.div>
    </div>
  )
}
