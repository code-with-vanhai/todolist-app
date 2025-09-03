import React, { useState, useEffect } from 'react'
import { performanceMonitor, PerformanceMetrics } from '../../utils/performanceMonitor'
import { memoryMonitor } from '../../utils/memoryMonitor'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ timestamp: Date.now() })
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [performanceScore, setPerformanceScore] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      const currentMetrics = performanceMonitor.getMetrics()
      const currentMemory = memoryMonitor.getMemoryUsageMB()
      const score = performanceMonitor.getPerformanceScore()

      setMetrics(currentMetrics)
      setMemoryUsage(currentMemory)
      setPerformanceScore(score)
    }, 2000)

    // Initial load
    setMetrics(performanceMonitor.getMetrics())
    setMemoryUsage(memoryMonitor.getMemoryUsageMB())
    setPerformanceScore(performanceMonitor.getPerformanceScore())

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 Performance Dashboard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Performance Score */}
          {performanceScore && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Overall Performance Score
              </h3>
              <div className="flex items-center space-x-4">
                <div className={`text-3xl font-bold ${getScoreColor(performanceScore.score)}`}>
                  {performanceScore.grade}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-300">
                  {performanceScore.score}/100
                </div>
              </div>
            </div>
          )}

          {/* Core Web Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">LCP</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">Largest Contentful Paint</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'Measuring...'}
              </p>
              {performanceScore?.details.lcp && (
                <p className={`text-sm ${getStatusColor(performanceScore.details.lcp.status)}`}>
                  {performanceScore.details.lcp.status}
                </p>
              )}
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100">FID</h4>
              <p className="text-sm text-green-700 dark:text-green-300">First Input Delay</p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">
                {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'Measuring...'}
              </p>
              {performanceScore?.details.fid && (
                <p className={`text-sm ${getStatusColor(performanceScore.details.fid.status)}`}>
                  {performanceScore.details.fid.status}
                </p>
              )}
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">CLS</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">Cumulative Layout Shift</p>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {metrics.cls ? metrics.cls.toFixed(3) : 'Measuring...'}
              </p>
              {performanceScore?.details.cls && (
                <p className={`text-sm ${getStatusColor(performanceScore.details.cls.status)}`}>
                  {performanceScore.details.cls.status}
                </p>
              )}
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">FCP</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">First Contentful Paint</p>
              <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'Measuring...'}
              </p>
              {performanceScore?.details.fcp && (
                <p className={`text-sm ${getStatusColor(performanceScore.details.fcp.status)}`}>
                  {performanceScore.details.fcp.status}
                </p>
              )}
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-100">TTFB</h4>
              <p className="text-sm text-red-700 dark:text-red-300">Time to First Byte</p>
              <p className="text-lg font-bold text-red-900 dark:text-red-100">
                {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'Measuring...'}
              </p>
              {performanceScore?.details.ttfb && (
                <p className={`text-sm ${getStatusColor(performanceScore.details.ttfb.status)}`}>
                  {performanceScore.details.ttfb.status}
                </p>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Memory</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Current Usage</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {memoryUsage}MB
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {memoryUsage > 100 ? 'High' : memoryUsage > 50 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bundle Size</h4>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {metrics.bundleSize ? formatBytes(metrics.bundleSize) : 'Calculating...'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Render Time</h4>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {metrics.renderTime ? `${Math.round(metrics.renderTime)}ms` : 'Calculating...'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {performanceScore && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Performance Recommendations
              </h4>
              {performanceScore.score >= 90 ? (
                <p className="text-green-700 dark:text-green-300">
                  🎉 Excellent performance! Your app is well optimized.
                </p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(performanceScore.details).map(([metric, data]: [string, any]) => {
                    if (data.status === 'poor') {
                      return (
                        <p key={metric} className="text-red-700 dark:text-red-300 text-sm">
                          • Improve {metric.toUpperCase()}: Currently {data.value.toFixed(metric === 'cls' ? 3 : 0)}{metric === 'cls' ? '' : 'ms'}
                        </p>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => {
                const report = performanceMonitor.generateReport()
                console.log('Performance Report:', report)
                alert('Performance report logged to console')
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate Report
            </button>
            <button
              onClick={() => {
                if ((window as any).gc) {
                  (window as any).gc()
                  alert('Garbage collection forced')
                } else {
                  alert('Garbage collection not available')
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Force GC
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard