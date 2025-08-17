import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import { getFirebaseErrorMessage } from '../utils/errorHandler'

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (error: any) {
    const friendlyError = getFirebaseErrorMessage(error)
    return { user: null, error: friendlyError }
  }
}

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName?: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName })
    }
    
    return { user: result.user, error: null }
  } catch (error: any) {
    const friendlyError = getFirebaseErrorMessage(error)
    return { user: null, error: friendlyError }
  }
}

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, error: null }
  } catch (error: any) {
    const friendlyError = getFirebaseErrorMessage(error)
    return { user: null, error: friendlyError }
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    const friendlyError = getFirebaseErrorMessage(error)
    return { error: friendlyError }
  }
}