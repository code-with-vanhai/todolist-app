import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { preferencesService, ThemeMode } from '../../services/preferences'

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState<boolean>(false)
  const { user } = useAuthStore()

  // Initialize from DOM/localStorage and subscribe to Firestore if logged in
  useEffect(() => {
    const root = document.documentElement
    const hasDarkClass = root.classList.contains('dark')
    setIsDark(hasDarkClass)

    if (!user) return
    const unsub = preferencesService.subscribe(user.uid, (prefs) => {
      const theme = prefs?.theme as ThemeMode | undefined
      if (!theme) return
      const shouldDark = theme === 'dark'
      root.classList.toggle('dark', shouldDark)
      setIsDark(shouldDark)
      try { localStorage.setItem('theme', shouldDark ? 'dark' : 'light') } catch {}
    })
    return () => { unsub && unsub() }
  }, [user])

  const toggleTheme = async () => {
    const root = document.documentElement
    const nowDark = !isDark
    root.classList.toggle('dark', nowDark)
    setIsDark(nowDark)
    try { localStorage.setItem('theme', nowDark ? 'dark' : 'light') } catch {}

    // Persist to Firestore if user logged in
    if (user) {
      try {
        await preferencesService.setTheme(user.uid, nowDark ? 'dark' : 'light')
      } catch (e) {
        // non-blocking
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  )
}

export default ThemeToggle
