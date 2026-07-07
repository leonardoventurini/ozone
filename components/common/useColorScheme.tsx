import { useCallback, useEffect, useState } from 'react'

/** Browser theme values supported by the Ozone UI. */
export type ColorScheme = 'light' | 'dark'

const COLOR_SCHEME_STORAGE_KEY = 'theme'
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const getStoredTheme = (): ColorScheme | null => {
  if (typeof window === 'undefined') return null

  try {
    const theme = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    return theme === 'dark' || theme === 'light' ? theme : null
  } catch {
    return null
  }
}

const setStoredTheme = (theme: ColorScheme): void => {
  try {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures so the in-memory document theme still updates.
  }
}

const applyColorScheme = (theme: ColorScheme): ColorScheme => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  return theme
}

/** Read the browser's persisted or system dark-mode preference. */
export const isDarkModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false

  const storedTheme = getStoredTheme()
  if (storedTheme) return storedTheme === 'dark'

  return window.matchMedia?.(DARK_MODE_MEDIA_QUERY).matches ?? false
}

/** Apply the current browser theme preference to the document root. */
export const applyColorSchemePreference = (): ColorScheme => {
  return applyColorScheme(isDarkModeEnabled() ? 'dark' : 'light')
}

/** Keep React state and the document root in sync with the browser theme. */
export const useColorScheme = (): {
  theme: ColorScheme
  toggleTheme: () => void
} => {
  const [theme, setTheme] = useState<ColorScheme>('light')

  const updateTheme = useCallback(() => {
    setTheme(applyColorSchemePreference())
  }, [])

  useEffect(() => {
    updateTheme()
  }, [updateTheme])

  return {
    theme,
    toggleTheme: () => {
      const nextTheme = isDarkModeEnabled() ? 'light' : 'dark'
      setStoredTheme(nextTheme)
      setTheme(applyColorScheme(nextTheme))
    },
  }
}
