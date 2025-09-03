/**
 * Cleanup Manager - Centralized cleanup utilities
 * Helps prevent memory leaks by managing cleanup operations
 */

export type CleanupFunction = () => void

class CleanupManager {
  private cleanupFunctions = new Set<CleanupFunction>()
  private timers = new Set<NodeJS.Timeout>()
  private intervals = new Set<NodeJS.Timeout>()
  private eventListeners = new Map<EventTarget, Map<string, EventListener>>()
  private firebaseUnsubscribers = new Set<() => void>()

  /**
   * Register a cleanup function
   */
  registerCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.add(cleanup)
  }

  /**
   * Unregister a cleanup function
   */
  unregisterCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.delete(cleanup)
  }

  /**
   * Register a timer for automatic cleanup
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback()
      this.timers.delete(timer)
    }, delay)
    
    this.timers.add(timer)
    return timer
  }

  /**
   * Register an interval for automatic cleanup
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)
    return interval
  }

  /**
   * Clear a specific timer
   */
  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer)
    this.timers.delete(timer)
  }

  /**
   * Clear a specific interval
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }

  /**
   * Register an event listener for automatic cleanup
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options)
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map())
    }
    
    this.eventListeners.get(target)!.set(type, listener)
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(target: EventTarget, type: string): void {
    const targetListeners = this.eventListeners.get(target)
    if (targetListeners) {
      const listener = targetListeners.get(type)
      if (listener) {
        target.removeEventListener(type, listener)
        targetListeners.delete(type)
        
        if (targetListeners.size === 0) {
          this.eventListeners.delete(target)
        }
      }
    }
  }

  /**
   * Register a Firebase unsubscriber
   */
  registerFirebaseUnsubscriber(unsubscribe: () => void): void {
    this.firebaseUnsubscribers.add(unsubscribe)
  }

  /**
   * Unregister a Firebase unsubscriber
   */
  unregisterFirebaseUnsubscriber(unsubscribe: () => void): void {
    this.firebaseUnsubscribers.delete(unsubscribe)
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()

    // Remove all event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener)
      })
    })
    this.eventListeners.clear()

    // Call Firebase unsubscribers
    this.firebaseUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe()
      } catch (error) {
        console.warn('Error during Firebase unsubscribe:', error)
      }
    })
    this.firebaseUnsubscribers.clear()

    // Call all cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    })
    this.cleanupFunctions.clear()

    console.log('CleanupManager: All resources cleaned up')
  }

  /**
   * Get cleanup statistics
   */
  getStats(): {
    timers: number
    intervals: number
    eventListeners: number
    firebaseUnsubscribers: number
    cleanupFunctions: number
  } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce(
        (total, listeners) => total + listeners.size,
        0
      ),
      firebaseUnsubscribers: this.firebaseUnsubscribers.size,
      cleanupFunctions: this.cleanupFunctions.size
    }
  }
}

// Create singleton instance
export const cleanupManager = new CleanupManager()

/**
 * React hook for automatic cleanup management
 */
export const useCleanup = () => {
  const cleanupRef = React.useRef(new CleanupManager())

  React.useEffect(() => {
    const cleanup = cleanupRef.current

    return () => {
      cleanup.cleanup()
    }
  }, [])

  return {
    registerCleanup: cleanupRef.current.registerCleanup.bind(cleanupRef.current),
    setTimeout: cleanupRef.current.setTimeout.bind(cleanupRef.current),
    setInterval: cleanupRef.current.setInterval.bind(cleanupRef.current),
    addEventListener: cleanupRef.current.addEventListener.bind(cleanupRef.current),
    registerFirebaseUnsubscriber: cleanupRef.current.registerFirebaseUnsubscriber.bind(cleanupRef.current),
    getStats: cleanupRef.current.getStats.bind(cleanupRef.current)
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupManager.cleanup()
  })
}

// Import React for the hook
import React from 'react'