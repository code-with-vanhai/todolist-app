/**
 * CSS Optimization Utilities
 * Provides tools for CSS performance optimization
 */

/**
 * Critical CSS classes that should always be included
 */
export const criticalCSSClasses = [
  // Layout
  'flex', 'block', 'inline-block', 'grid', 'hidden',
  // Positioning
  'relative', 'absolute', 'fixed', 'sticky',
  // Spacing
  'p-4', 'p-6', 'p-8', 'm-4', 'm-6', 'm-8',
  'px-4', 'py-4', 'mx-auto',
  // Colors
  'bg-white', 'bg-gray-100', 'bg-gray-800', 'bg-blue-500',
  'text-gray-900', 'text-gray-600', 'text-white',
  // Typography
  'text-sm', 'text-base', 'text-lg', 'text-xl',
  'font-medium', 'font-semibold', 'font-bold',
  // Borders
  'border', 'border-gray-200', 'border-gray-300',
  'rounded', 'rounded-lg', 'rounded-full',
  // Shadows
  'shadow', 'shadow-lg', 'shadow-xl',
  // Dark mode
  'dark:bg-gray-800', 'dark:text-white', 'dark:border-gray-600'
]

/**
 * Get used CSS classes from the DOM
 */
export const getUsedCSSClasses = (): Set<string> => {
  const usedClasses = new Set<string>()
  
  // Get all elements with class attributes
  const elements = document.querySelectorAll('[class]')
  
  elements.forEach(element => {
    const classList = element.className.split(' ')
    classList.forEach(className => {
      if (className.trim()) {
        usedClasses.add(className.trim())
      }
    })
  })
  
  return usedClasses
}

/**
 * Analyze CSS usage and provide optimization suggestions
 */
export const analyzeCSSUsage = (): {
  totalClasses: number
  usedClasses: number
  unusedClasses: string[]
  utilizationRate: number
  suggestions: string[]
} => {
  const usedClasses = getUsedCSSClasses()
  const allTailwindClasses = [
    ...criticalCSSClasses,
    // Add more comprehensive class list here if needed
  ]
  
  const unusedClasses = allTailwindClasses.filter(
    className => !usedClasses.has(className)
  )
  
  const utilizationRate = (usedClasses.size / allTailwindClasses.length) * 100
  
  const suggestions: string[] = []
  
  if (utilizationRate < 50) {
    suggestions.push('Consider using a more aggressive CSS purging strategy')
  }
  
  if (unusedClasses.length > 20) {
    suggestions.push('Many unused classes detected - review and remove unused styles')
  }
  
  if (usedClasses.size > 200) {
    suggestions.push('Consider splitting CSS into critical and non-critical parts')
  }
  
  return {
    totalClasses: allTailwindClasses.length,
    usedClasses: usedClasses.size,
    unusedClasses,
    utilizationRate: Math.round(utilizationRate),
    suggestions
  }
}

/**
 * Preload critical CSS
 */
export const preloadCriticalCSS = (cssUrl: string): void => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = cssUrl
  link.onload = () => {
    link.rel = 'stylesheet'
  }
  document.head.appendChild(link)
}

/**
 * Load non-critical CSS asynchronously
 */
export const loadNonCriticalCSS = (cssUrl: string): void => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  link.media = 'print'
  link.onload = () => {
    link.media = 'all'
  }
  document.head.appendChild(link)
}

/**
 * Monitor CSS performance
 */
export const monitorCSSPerformance = (): {
  cssLoadTime: number
  cssSize: number
  renderBlockingCSS: number
} => {
  const cssResources = performance.getEntriesByType('resource')
    .filter(entry => entry.name.endsWith('.css')) as PerformanceResourceTiming[]
  
  const cssLoadTime = cssResources.reduce((max, entry) => 
    Math.max(max, entry.responseEnd - entry.startTime), 0
  )
  
  const cssSize = cssResources.reduce((total, entry) => 
    total + (entry.transferSize || 0), 0
  )
  
  const renderBlockingCSS = cssResources.filter(entry => 
    (entry as any).renderBlockingStatus === 'blocking'
  ).length
  
  return {
    cssLoadTime: Math.round(cssLoadTime),
    cssSize: Math.round(cssSize / 1024), // KB
    renderBlockingCSS
  }
}

/**
 * CSS optimization recommendations
 */
export const getCSSOptimizationRecommendations = (): string[] => {
  const performance = monitorCSSPerformance()
  const usage = analyzeCSSUsage()
  const recommendations: string[] = []
  
  if (performance.cssLoadTime > 100) {
    recommendations.push('CSS load time is high - consider splitting or compressing CSS')
  }
  
  if (performance.cssSize > 50) {
    recommendations.push('CSS bundle is large - enable purging and minification')
  }
  
  if (performance.renderBlockingCSS > 2) {
    recommendations.push('Too many render-blocking CSS files - consider inlining critical CSS')
  }
  
  if (usage.utilizationRate < 60) {
    recommendations.push('Low CSS utilization - remove unused styles')
  }
  
  return recommendations
}

// Development-only CSS analysis
if (process.env.NODE_ENV === 'development') {
  // Auto-analyze CSS usage after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const analysis = analyzeCSSUsage()
      const performance = monitorCSSPerformance()
      
      console.group('🎨 CSS Performance Analysis')
      console.log('CSS Usage:', analysis)
      console.log('CSS Performance:', performance)
      console.log('Recommendations:', getCSSOptimizationRecommendations())
      console.groupEnd()
    }, 1000)
  })
  
  // Expose to window for debugging
  ;(window as any).cssOptimization = {
    analyzeCSSUsage,
    monitorCSSPerformance,
    getCSSOptimizationRecommendations
  }
}