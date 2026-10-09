import { useEffect, useState } from 'react'

const getPreferredTheme = () => {
  const savedTheme = window.localStorage.getItem('theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getPreferredTheme)

  useEffect(() => {
    const root = document.documentElement
    const savedTheme = window.localStorage.getItem('theme')
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')

    if (savedTheme) {
      root.dataset.theme = savedTheme
    } else {
      root.removeAttribute('data-theme')
    }

    const syncSystemTheme = (event) => {
      if (!window.localStorage.getItem('theme')) {
        setTheme(event.matches ? 'dark' : 'light')
      }
    }

    colorScheme.addEventListener('change', syncSystemTheme)
    return () => colorScheme.removeEventListener('change', syncSystemTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem('theme', nextTheme)
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  )
}

export default ThemeToggle
