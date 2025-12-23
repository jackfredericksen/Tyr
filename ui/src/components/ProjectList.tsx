import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAppStore } from '../store'

export function ProjectList() {
  const { projects, currentProject, createProject, loadProject, deleteProject } = useAppStore()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name')
      return
    }

    createProject(newProjectName)
    setNewProjectName('')
    setShowNewProjectModal(false)
    toast.success('Project created')
  }

  const handleLoadProject = (id: string) => {
    loadProject(id)
    toast.success('Project loaded')
  }

  const handleDeleteProject = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProject(id)
      toast.success('Project deleted')
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-red-600 dark:text-red-500'
    if (score >= 60) return 'text-orange-600 dark:text-orange-500'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-500'
    return 'text-green-600 dark:text-green-500'
  }

  const getRiskLabel = (score?: number) => {
    if (!score) return 'Unknown'
    if (score >= 80) return 'High Risk'
    if (score >= 60) return 'Medium-High'
    if (score >= 40) return 'Medium'
    return 'Low Risk'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderOpenIcon className="w-8 h-8 text-gray-900 dark:text-white" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage and access your saved analyses
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Current Project */}
      {currentProject && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 rounded-lg p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentProject.name}
                </h3>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                  Current
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Files</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentProject.files.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Threats</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentProject.analysis?.threats.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Risk Score</p>
                  <p className={`font-semibold ${getRiskScoreColor(currentProject.analysis?.overall_risk_score)}`}>
                    {currentProject.analysis?.overall_risk_score || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Updated</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(currentProject.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Projects Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first project to start organizing your security analyses
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((project, index) => {
              const isCurrentProject = currentProject?.id === project.id
              const threatCount = project.analysis?.threats.length || 0
              const riskScore = project.analysis?.overall_risk_score

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all
                    ${isCurrentProject
                      ? 'border-blue-600 ring-2 ring-blue-600/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <FolderIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Files:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {project.files.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Threats:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {threatCount}
                      </span>
                    </div>
                    {riskScore !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Risk:</span>
                        <span className={`font-medium ${getRiskScoreColor(riskScore)}`}>
                          {getRiskLabel(riskScore)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {!isCurrentProject && (
                    <button
                      onClick={() => handleLoadProject(project.id)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                      <span>Open Project</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}

                  {isCurrentProject && (
                    <div className="w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-center rounded-lg text-sm font-medium">
                      Currently Active
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProjectModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Create New Project
                </h3>

                <label className="block mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Name
                  </span>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    placeholder="E-Commerce Platform Security"
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </label>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
