import { auth } from '../services/firebase'
import { debugLog, debugError } from './debug'

export class FirestoreDebugger {
  private static instance: FirestoreDebugger
  private authStateHistory: Array<{
    timestamp: number
    user: any
    token: string | null
    ready: boolean
  }> = []

  static getInstance(): FirestoreDebugger {
    if (!FirestoreDebugger.instance) {
      FirestoreDebugger.instance = new FirestoreDebugger()
    }
    return FirestoreDebugger.instance
  }

  async logAuthState(context: string) {
    const user = auth.currentUser
    let token = null
    let ready = false

    try {
      if (user) {
        token = await user.getIdToken()
        ready = true
      }
    } catch (error) {
      debugError(`Auth token error in ${context}:`, error)
    }

    const authState = {
      timestamp: Date.now(),
      user: user ? {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      } : null,
      token: token ? token.substring(0, 20) + '...' : null,
      ready
    }

    this.authStateHistory.push(authState)
    
    debugLog(`🔍 Auth State [${context}]:`, {
      hasUser: !!user,
      hasToken: !!token,
      ready,
      timestamp: new Date().toISOString()
    })

    return authState
  }

  logFirestoreOperation(operation: string, userId: string, error?: any) {
    const logData = {
      operation,
      userId,
      timestamp: Date.now(),
      error: error ? {
        code: error.code,
        message: error.message
      } : null
    }

    if (error) {
      debugError(`🔥 Firestore Error [${operation}]:`, logData)
    } else {
      debugLog(`✅ Firestore Success [${operation}]:`, logData)
    }

    return logData
  }

  getDebugReport() {
    return {
      authHistory: this.authStateHistory,
      currentAuth: {
        user: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        } : null,
        timestamp: Date.now()
      }
    }
  }

  async waitForAuthReady(maxWait = 5000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWait) {
      const user = auth.currentUser
      if (user) {
        try {
          await user.getIdToken()
          debugLog('🎉 Auth is ready!', { uid: user.uid, waitTime: Date.now() - startTime })
          return true
        } catch (error) {
          debugLog('⏳ Auth token not ready yet...', { waitTime: Date.now() - startTime })
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    debugError('❌ Auth timeout after ' + maxWait + 'ms')
    return false
  }
}

export const firestoreDebugger = FirestoreDebugger.getInstance()