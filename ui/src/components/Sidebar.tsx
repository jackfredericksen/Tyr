import { motion } from 'framer-motion'
import {
  CloudArrowUpIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '../store'
import type { ViewType } from '../types'

interface NavItem {
  id: ViewType
  label: string
  icon: typeof CloudArrowUpIcon
}

const navItems: NavItem[] = [
  { id: 'upload', label: 'Files', icon: CloudArrowUpIcon },
  { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
  { id: 'projects', label: 'Projects', icon: FolderIcon },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
]

export function Sidebar() {
  const { currentView, setCurrentView, isSidebarOpen, toggleSidebar, analysisResult } = useAppStore()

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <XMarkIcon className="w-6 h-6 text-gray-900 dark:text-white" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-gray-900 dark:text-white" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -280,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center space-x-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tyr</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Threat Analyzer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            const isDisabled = (item.id === 'dashboard' || item.id === 'chat') && !analysisResult

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!isDisabled) {
                    setCurrentView(item.id)
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      toggleSidebar()
                    }
                  }
                }}
                disabled={isDisabled}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDisabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isDisabled && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                    Locked
                  </span>
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>Powered by AI</p>
            <p className="mt-1">v0.1.0</p>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
