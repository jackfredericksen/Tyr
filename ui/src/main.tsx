import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add error boundary
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">Error Loading App</h1>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">
${e.error?.stack || e.message || 'Unknown error'}
      </pre>
    </div>
  `
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})

try {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Root element not found')
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  console.error('Failed to mount React:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">Failed to Mount App</h1>
      <pre style="background: #f5f5f5; padding: 10px;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
    </div>
  `
}
