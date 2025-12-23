import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'

interface Threat {
  id: string
  title: string
  risk_level: string
  description: string
  category: string
}

interface AnalysisResult {
  threats: Threat[]
  overall_risk_score: number
}

function App() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('Loading...')

  useState(() => {
    invoke<string>('initialize_analyzer')
      .then(msg => setProvider(msg))
      .catch(err => setError(`Failed to initialize: ${err}`))
  })

  const analyzeContent = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze')
      return
    }

    setLoading(true)
    setError('')

    try {
      const analysis = await invoke<AnalysisResult>('analyze_content', {
        content,
        inputType: 'architecture',
        includeEducation: true
      })
      setResult(analysis)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return '#fee'
      case 'high': return '#ffd'
      case 'medium': return '#ffe'
      default: return '#efe'
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#1e40af' }}>⚔️ Tyr - AI Threat Modeling Assistant</h1>
        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>{provider}</p>
      </header>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
          Architecture / Infrastructure Code
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your system architecture description, Terraform code, Kubernetes manifests, or API specifications here..."
          style={{
            width: '100%',
            height: '250px',
            padding: '12px',
            fontSize: '14px',
            fontFamily: 'ui-monospace, monospace',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            resize: 'vertical'
          }}
        />
      </div>

      <button
        onClick={analyzeContent}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: loading ? '#94a3b8' : '#2563eb',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
        onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
      >
        {loading ? '🔍 Analyzing...' : '🚀 Analyze for Threats'}
      </button>

      {error && (
        <div style={{
          color: '#dc2626',
          backgroundColor: '#fee2e2',
          padding: '12px',
          marginTop: '20px',
          borderRadius: '6px',
          border: '1px solid #fca5a5'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px' }}>
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 10px 0' }}>
              📊 Analysis Summary
            </h2>
            <p style={{ margin: '5px 0', fontSize: '18px' }}>
              <strong>Total Threats Found:</strong> {result.threats.length}
            </p>
            {result.overall_risk_score !== undefined && (
              <p style={{ margin: '5px 0', fontSize: '18px' }}>
                <strong>Overall Risk Score:</strong> {result.overall_risk_score}/100
              </p>
            )}
          </div>

          <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>
            🎯 Identified Threats
          </h2>

          {result.threats.length === 0 ? (
            <p style={{ color: '#10b981', fontSize: '16px' }}>
              ✅ No major threats identified! Your architecture looks secure.
            </p>
          ) : (
            result.threats.map((threat, index) => (
              <div
                key={threat.id}
                style={{
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  marginBottom: '15px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    [{index + 1}] {threat.title}
                  </span>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getRiskColor(threat.risk_level),
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {threat.risk_level.toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3'
                    }}
                  >
                    {threat.category}
                  </span>
                </div>
                <p style={{
                  marginTop: '12px',
                  color: '#475569',
                  lineHeight: '1.6'
                }}>
                  {threat.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <footer style={{
        marginTop: '50px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0',
        color: '#64748b',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        <p>Tyr Desktop - AI-Powered Threat Modeling Assistant</p>
        <p style={{ fontSize: '12px', marginTop: '5px' }}>
          Using local AI for 100% private security analysis
        </p>
      </footer>
    </div>
  )
}

export default App
