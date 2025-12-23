import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentTextIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppStore } from '../store'
import type { ProjectFile } from '../types'

export function FileUpload() {
  const { currentProject, addFiles, removeFile } = useAppStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: ProjectFile[] = []

    for (const file of acceptedFiles) {
      try {
        const content = await file.text()
        const ext = file.name.split('.').pop()?.toLowerCase() || ''

        let type: ProjectFile['type'] = 'architecture'
        if (ext === 'tf' || ext === 'hcl') type = 'terraform'
        else if (ext === 'yaml' || ext === 'yml') type = 'kubernetes'
        else if (ext === 'json') type = 'api-spec'

        newFiles.push({
          name: file.name,
          content,
          type,
          size: file.size,
          lastModified: file.lastModified
        })
      } catch (error) {
        toast.error(`Failed to read file: ${file.name}`)
        console.error('File read error:', error)
      }
    }

    if (newFiles.length > 0) {
      addFiles(newFiles)
      toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`)
    }
  }, [addFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/yaml': ['.yaml', '.yml'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/x-terraform': ['.tf'],
      'text/x-hcl': ['.hcl']
    },
    multiple: true
  })

  const files = currentProject?.files || []

  const getFileIcon = (type: ProjectFile['type']) => {
    return <DocumentTextIcon className="w-5 h-5" />
  }

  const getFileTypeLabel = (type: ProjectFile['type']) => {
    const labels = {
      architecture: 'Architecture',
      terraform: 'Terraform',
      kubernetes: 'Kubernetes',
      'api-spec': 'API Spec'
    }
    return labels[type]
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 transition-all cursor-pointer
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <CloudArrowUpIcon className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />

          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500">
            Supported: .md, .tf, .yaml, .json, .hcl
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Files ({files.length})
            </h3>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                      {getFileIcon(file.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                          {getFileTypeLabel(file.type)}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      removeFile(file.name)
                      toast.success('File removed')
                    }}
                    className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
