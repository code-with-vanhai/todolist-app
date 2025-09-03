/**
 * Memory Monitoring Utilities
 * Provides tools for monitoring and preventing memory leaks
 */

import React from 'react'

export interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface MemoryThresholds {
  warning: number // MB
  critical: number // MB
}

class MemoryMonitor {
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private memoryHistory: MemoryStats[] = []
  private maxHistorySize = 100
  private thresholds: MemoryThresholds = {
    warning: 100, // 100MB
    critical: 200  // 200MB
  }
  private callbacks: {
    onWarning?: (stats: MemoryStats) => void
    onCritical?: (stats: MemoryStats) => void
    onUpdate?: (stats: MemoryStats) => void
  } = {}

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('Memory monitoring is already running')
      return
    }

    if (!this.isMemoryAPISupported()) {
      console.warn('Memory API not supported in this browser')
      return
    }

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, intervalMs)

    console.log('Memory monitoring started')
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('Memory monitoring stopped')
  }

  /**
   * Get current memory stats
   */
  getCurrentMemoryStats(): MemoryStats | null {
    if (!this.isMemoryAPISupported()) {
      return null
    }

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsageMB(): number {
    const stats = this.getCurrentMemoryStats()
    return stats ? Math.round(stats.usedJSHeapSize / 1024 / 1024) : 0
  }

  /**
   * Check if memory usage exceeds thresholds
   */
  private checkMemoryUsage(): void {
    const stats = this.getCurrentMemoryStats()
    if (!stats) return

    // Add to history
    this.memoryHistory.push(stats)
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift()
    }

    const usageMB = Math.round(stats.usedJSHeapSize / 1024 / 1024)

    // Check thresholds
    if (usageMB >= this.thresholds.critical) {
      console.error(`🚨 Critical memory usage: ${usageMB}MB`)
      this.callbacks.onCritical?.(stats)
    } else if (usageMB >= this.thresholds.warning) {
      console.warn(`⚠️ High memory usage: ${usageMB}MB`)
      this.callbacks.onWarning?.(stats)
    }

    this.callbacks.onUpdate?.(stats)
  }

  /**
   * Set memory thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Set monitoring callbacks
   */
  setCallbacks(callbacks: {
    onWarning?: (stats: MemoryStats) => void
    onCritical?: (stats: MemoryStats) => void
    onUpdate?: (stats: MemoryStats) => void
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Get memory history
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory]
  }

  /**
   * Calculate memory trend
   */
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 5) return 'stable'

    const recent = this.memoryHistory.slice(-5)
    const first = recent[0].usedJSHeapSize
    const last = recent[recent.length - 1].usedJSHeapSize
    const diff = last - first
    const threshold = first * 0.1 // 10% change threshold

    if (diff > threshold) return 'increasing'
    if (diff < -threshold) return 'decreasing'
    return 'stable'
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if ((window as any).gc) {
      (window as any).gc()
      console.log('Forced garbage collection')
    } else {
      console.warn('Garbage collection not available')
    }
  }

  /**
   * Check if Memory API is supported
   */
  private isMemoryAPISupported(): boolean {
    return !!(performance as any).memory
  }

  /**
   * Get memory leak detection report
   */
  getLeakDetectionReport(): {
    suspiciousGrowth: boolean
    averageUsage: number
    peakUsage: number
    trend: string
  } {
    if (this.memoryHistory.length < 10) {
      return {
        suspiciousGrowth: false,
        averageUsage: 0,
        peakUsage: 0,
        trend: 'insufficient-data'
      }
    }

    const usages = this.memoryHistory.map(stat => stat.usedJSHeapSize / 1024 / 1024)
    const averageUsage = usages.reduce((sum, usage) => sum + usage, 0) / usages.length
    const peakUsage = Math.max(...usages)
    const trend = this.getMemoryTrend()

    // Detect suspicious growth (consistent increase over time)
    const firstHalf = usages.slice(0, Math.floor(usages.length / 2))
    const secondHalf = usages.slice(Math.floor(usages.length / 2))
    const firstAvg = firstHalf.reduce((sum, usage) => sum + usage, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, usage) => sum + usage, 0) / secondHalf.length
    const suspiciousGrowth = secondAvg > firstAvg * 1.5 // 50% increase

    return {
      suspiciousGrowth,
      averageUsage: Math.round(averageUsage),
      peakUsage: Math.round(peakUsage),
      trend
    }
  }
}

// Create singleton instance
export const memoryMonitor = new MemoryMonitor()

/**
 * Hook for React components to monitor memory
 */
export const useMemoryMonitor = (enabled: boolean = false) => {
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    const updateStats = (stats: MemoryStats) => {
      setMemoryStats(stats)
    }

    memoryMonitor.setCallbacks({ onUpdate: updateStats })
    memoryMonitor.startMonitoring()

    return () => {
      memoryMonitor.stopMonitoring()
    }
  }, [enabled])

  return {
    memoryStats,
    currentUsageMB: memoryMonitor.getMemoryUsageMB(),
    trend: memoryMonitor.getMemoryTrend(),
    forceGC: memoryMonitor.forceGC
  }
}

// Development-only memory debugging
if (process.env.NODE_ENV === 'development') {
  // Auto-start monitoring in development
  memoryMonitor.setCallbacks({
    onWarning: (stats) => {
      console.warn('Memory warning:', {
        usageMB: Math.round(stats.usedJSHeapSize / 1024 / 1024),
        trend: memoryMonitor.getMemoryTrend()
      })
    },
    onCritical: (stats) => {
      console.error('Critical memory usage:', {
        usageMB: Math.round(stats.usedJSHeapSize / 1024 / 1024),
        report: memoryMonitor.getLeakDetectionReport()
      })
    }
  })

  // Expose to window for debugging
  ;(window as any).memoryMonitor = memoryMonitor
}