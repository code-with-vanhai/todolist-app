/**
 * Performance Monitoring System
 * Tracks Web Vitals and application performance metrics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

export interface PerformanceMetrics {
  // Core Web Vitals
  cls?: number // Cumulative Layout Shift
  fid?: number // First Input Delay
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  ttfb?: number // Time to First Byte
  
  // Custom metrics
  bundleSize?: number
  memoryUsage?: number
  renderTime?: number
  navigationTiming?: PerformanceNavigationTiming
  timestamp: number
}

export interface PerformanceThresholds {
  cls: { good: number; poor: number }
  fid: { good: number; poor: number }
  fcp: { good: number; poor: number }
  lcp: { good: number; poor: number }
  ttfb: { good: number; poor: number }
}

// Web Vitals thresholds (Google recommendations)
export const defaultThresholds: PerformanceThresholds = {
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 },
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  ttfb: { good: 800, poor: 1800 }
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = { timestamp: Date.now() }
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = []
  private isInitialized = false

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized) return
    
    this.isInitialized = true
    this.collectWebVitals()
    this.collectCustomMetrics()
    
    console.log('Performance monitoring initialized')
  }

  /**
   * Collect Core Web Vitals
   */
  private collectWebVitals(): void {
    onCLS((metric: any) => {
      this.metrics.cls = metric.value
      this.notifyCallbacks()
      console.log('CLS:', metric.value)
    })

    onINP((metric: any) => {
      this.metrics.fid = metric.value
      this.notifyCallbacks()
      console.log('INP:', metric.value)
    })

    onFCP((metric: any) => {
      this.metrics.fcp = metric.value
      this.notifyCallbacks()
      console.log('FCP:', metric.value)
    })

    onLCP((metric: any) => {
      this.metrics.lcp = metric.value
      this.notifyCallbacks()
      console.log('LCP:', metric.value)
    })

    onTTFB((metric: any) => {
      this.metrics.ttfb = metric.value
      this.notifyCallbacks()
      console.log('TTFB:', metric.value)
    })
  }

  /**
   * Collect custom performance metrics
   */
  private collectCustomMetrics(): void {
    // Navigation timing
    if (performance.getEntriesByType) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        this.metrics.navigationTiming = navTiming
        this.metrics.renderTime = navTiming.loadEventEnd - navTiming.fetchStart
      }
    }

    // Memory usage
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize
    }

    // Bundle size estimation
    this.estimateBundleSize()
  }

  /**
   * Estimate bundle size from resource timing
   */
  private estimateBundleSize(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let totalSize = 0

    resources.forEach(resource => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0
      }
    })

    this.metrics.bundleSize = totalSize
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance score based on Web Vitals
   */
  getPerformanceScore(): {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    details: Record<string, { value: number; score: number; status: 'good' | 'needs-improvement' | 'poor' }>
  } {
    const details: Record<string, { value: number; score: number; status: 'good' | 'needs-improvement' | 'poor' }> = {}
    let totalScore = 0
    let metricCount = 0

    // Score each metric
    Object.entries(defaultThresholds).forEach(([key, thresholds]) => {
      const value = (this.metrics as any)[key] as number
      if (value !== undefined) {
        let score = 100
        let status: 'good' | 'needs-improvement' | 'poor' = 'good'

        if (value > thresholds.poor) {
          score = 0
          status = 'poor'
        } else if (value > thresholds.good) {
          score = 50
          status = 'needs-improvement'
        }

        details[key] = { value, score, status }
        totalScore += score
        metricCount++
      }
    })

    const averageScore = metricCount > 0 ? totalScore / metricCount : 0
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'

    if (averageScore >= 90) grade = 'A'
    else if (averageScore >= 80) grade = 'B'
    else if (averageScore >= 70) grade = 'C'
    else if (averageScore >= 60) grade = 'D'

    return { score: Math.round(averageScore), grade, details }
  }

  /**
   * Add callback for metric updates
   */
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.push(callback)
  }

  /**
   * Remove callback
   */
  removeCallback(callback: (metrics: PerformanceMetrics) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics)
      } catch (error) {
        console.error('Performance callback error:', error)
      }
    })
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(metrics: PerformanceMetrics = this.metrics): void {
    // Google Analytics 4 example
    if (typeof (window as any).gtag !== 'undefined') {
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          (window as any).gtag('event', 'web_vitals', {
            metric_name: key,
            metric_value: Math.round(value),
            custom_parameter: 'performance_monitoring'
          })
        }
      })
    }

    // Custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error)
      })
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: string
    metrics: PerformanceMetrics
    score: ReturnType<PerformanceMonitor['getPerformanceScore']>
    recommendations: string[]
  } {
    const score = this.getPerformanceScore()
    const recommendations: string[] = []

    // Generate recommendations based on metrics
    const scoreDetails = score.details
    if (scoreDetails.lcp?.status === 'poor') {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing images')
    }
    if (scoreDetails.fid?.status === 'poor') {
      recommendations.push('Improve Interaction to Next Paint by reducing JavaScript execution time')
    }
    if (scoreDetails.cls?.status === 'poor') {
      recommendations.push('Fix Cumulative Layout Shift by setting dimensions for images and ads')
    }
    if (scoreDetails.fcp?.status === 'poor') {
      recommendations.push('Improve First Contentful Paint by optimizing critical rendering path')
    }

    return {
      summary: `Performance Grade: ${score.grade} (${score.score}/100)`,
      metrics: this.metrics,
      score,
      recommendations
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    performanceMonitor.init()
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init()
    })
  }
}

// Development debugging
if (process.env.NODE_ENV === 'development') {
  // Expose to window for debugging
  ;(window as any).performanceMonitor = performanceMonitor
  
  // Auto-generate report after 5 seconds
  setTimeout(() => {
    const report = performanceMonitor.generateReport()
    console.group('📊 Performance Report')
    console.log(report.summary)
    console.log('Metrics:', report.metrics)
    console.log('Score Details:', report.score.details)
    if (report.recommendations.length > 0) {
      console.log('Recommendations:', report.recommendations)
    }
    console.groupEnd()
  }, 5000)
}