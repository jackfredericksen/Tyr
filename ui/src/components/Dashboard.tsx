import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '../store'
import type { Threat } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export function Dashboard() {
  const { analysisResult } = useAppStore()

  const threats = analysisResult?.threats || []

  // Calculate stats
  const stats = useMemo(() => {
    const critical = threats.filter(t => t.risk_level === 'Critical').length
    const high = threats.filter(t => t.risk_level === 'High').length
    const medium = threats.filter(t => t.risk_level === 'Medium').length
    const low = threats.filter(t => t.risk_level === 'Low').length

    const riskScore = analysisResult?.overall_risk_score || 0

    return { critical, high, medium, low, riskScore, total: threats.length }
  }, [threats, analysisResult])

  // Risk distribution pie chart
  const riskDistributionData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [stats.critical, stats.high, stats.medium, stats.low],
      backgroundColor: [
        'rgba(220, 38, 38, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderColor: [
        'rgb(220, 38, 38)',
        'rgb(249, 115, 22)',
        'rgb(234, 179, 8)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 2
    }]
  }

  // Category distribution bar chart
  const categoryData = useMemo(() => {
    const categories = threats.reduce((acc, threat) => {
      acc[threat.category] = (acc[threat.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(categories),
      datasets: [{
        label: 'Threats by Category',
        data: Object.values(categories),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }]
    }
  }, [threats])

  const exportToMarkdown = () => {
    if (!analysisResult) return

    let md = `# Security Threat Analysis Report\n\n`
    md += `**Generated**: ${new Date().toLocaleString()}\n\n`
    md += `## Summary\n\n`
    md += `- **Total Threats**: ${stats.total}\n`
    md += `- **Critical**: ${stats.critical}\n`
    md += `- **High**: ${stats.high}\n`
    md += `- **Medium**: ${stats.medium}\n`
    md += `- **Low**: ${stats.low}\n`
    md += `- **Risk Score**: ${stats.riskScore}/100\n\n`

    md += `## Threats\n\n`

    threats.forEach((threat, i) => {
      md += `### ${i + 1}. ${threat.title}\n\n`
      md += `- **Category**: ${threat.category}\n`
      md += `- **Risk Level**: ${threat.risk_level}\n`
      md += `- **Description**: ${threat.description}\n\n`

      if (threat.impact) {
        md += `**Impact**: ${threat.impact}\n\n`
      }

      if (threat.affected_components && threat.affected_components.length > 0) {
        md += `**Affected Components**:\n`
        threat.affected_components.forEach(c => md += `- ${c}\n`)
        md += `\n`
      }

      if (threat.attack_path && threat.attack_path.length > 0) {
        md += `**Attack Path**:\n`
        threat.attack_path.forEach((step, idx) => md += `${idx + 1}. ${step}\n`)
        md += `\n`
      }

      if (threat.mitigations && threat.mitigations.length > 0) {
        md += `**Mitigations**:\n\n`
        threat.mitigations.forEach(m => {
          md += `- **${m.title}** (Effort: ${m.effort}, Effectiveness: ${m.effectiveness})\n`
          md += `  ${m.description}\n\n`
        })
      }

      if (threat.educational_note) {
        md += `**Educational Note**: ${threat.educational_note}\n\n`
      }

      md += `---\n\n`
    })

    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      md += `## Recommendations\n\n`
      analysisResult.recommendations.forEach(rec => md += `- ${rec}\n`)
    }

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-analysis-${Date.now()}.md`
    a.click()

    // Cleanup: Revoke the URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  const getRiskLevelColor = (level: Threat['risk_level']) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
    return colors[level]
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No Analysis Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Upload files and run analysis to see the dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Threats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <ShieldExclamationIcon className="w-12 h-12 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-1">
                {stats.critical}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">High</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-500 mt-1">
                {stats.high}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Risk Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.riskScore}/100
              </p>
            </div>
            <ChartBarIcon className="w-12 h-12 text-gray-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={riskDistributionData} options={{ maintainAspectRatio: false }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Threats by Category
          </h3>
          <div className="h-64">
            <Bar data={categoryData} options={{ maintainAspectRatio: false }} />
          </div>
        </motion.div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToMarkdown}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Export to Markdown</span>
        </button>
      </div>

      {/* Threat List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Threats ({threats.length})
        </h3>

        <div className="space-y-3">
          {threats.map((threat, index) => (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {threat.title}
                  </h4>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(threat.risk_level)}`}>
                      {threat.risk_level}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {threat.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {threat.description}
              </p>

              {threat.impact && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Impact:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{threat.impact}</p>
                </div>
              )}

              {threat.mitigations && threat.mitigations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mitigations:</p>
                  <div className="space-y-2">
                    {threat.mitigations.map((mitigation, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {mitigation.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {mitigation.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Effort: {mitigation.effort}</span>
                          <span>Effectiveness: {mitigation.effectiveness}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
