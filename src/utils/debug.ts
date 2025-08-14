// Debug utility to help troubleshoot issues
export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, data)
  }
}

export const debugError = (message: string, error?: any) => {
  if (import.meta.env.DEV) {
    console.error(`[ERROR] ${message}`, error)
  }
}

// Check Firebase configuration
export const checkFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    debugError('Missing Firebase environment variables:', missing)
    return false
  }
  
  debugLog('Firebase configuration loaded successfully')
  return true
}