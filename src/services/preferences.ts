import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export type ThemeMode = 'light' | 'dark'

export interface UserPreferences {
  theme?: ThemeMode
  updatedAt?: any
}

class PreferencesService {
  private prefDocRef(userId: string) {
    return doc(db, 'users', userId, 'settings', 'preferences')
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const ref = this.prefDocRef(userId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as UserPreferences
  }

  subscribe(userId: string, callback: (prefs: UserPreferences | null) => void) {
    const ref = this.prefDocRef(userId)
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return callback(null)
      callback(snap.data() as UserPreferences)
    })
  }

  async setTheme(userId: string, theme: ThemeMode) {
    const ref = this.prefDocRef(userId)
    await setDoc(ref, { theme, updatedAt: serverTimestamp() }, { merge: true })
    return { error: null }
  }
}

export const preferencesService = new PreferencesService()
