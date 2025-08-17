import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import app from './firebase'

export const initAppCheck = () => {
  // Chỉ chạy khi có reCAPTCHA Site Key
  if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      })
      console.log('🔒 App Check initialized successfully')
    } catch (error) {
      console.warn('⚠️ App Check initialization failed:', error)
    }
  } else {
    console.log('ℹ️ App Check skipped - no reCAPTCHA key provided')
  }
}