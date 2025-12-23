import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { invoke } from '@tauri-apps/api/core'
import toast from 'react-hot-toast'
import { useAppStore } from '../store'
import type { ChatMessage } from '../types'

export function ChatPanel() {
  const { chatMessages, addChatMessage, analysisResult } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    addChatMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      // Build context from analysis if available
      const history = chatMessages.map(msg => msg.content)

      const response = await invoke<string>('interactive_query', {
        query: input,
        history
      })

      // Only update state if component is still mounted
      if (!isMountedRef.current) return

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }

      addChatMessage(assistantMessage)
    } catch (error) {
      console.error('Chat error:', error)

      // Only update state if component is still mounted
      if (!isMountedRef.current) return

      toast.error('Failed to get AI response')

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      }

      addChatMessage(errorMessage)
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No Analysis Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Run an analysis first to start chatting about threats
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ask Tyr About Security
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discuss threats, ask for mitigation advice, or request clarifications
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Start a conversation by asking a question about your security analysis.</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">Example questions:</p>
              <p>"How do I fix the SQL injection vulnerability?"</p>
              <p>"What's the most critical threat I should address first?"</p>
              <p>"Explain the authentication bypass issue"</p>
            </div>
          </div>
        )}

        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Tyr is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your security analysis..."
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
