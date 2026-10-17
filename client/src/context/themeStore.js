let ownerActive = false

function readGlobalDark() {
  try {
    const saved = localStorage.getItem('theme')
    return saved ? JSON.parse(saved) : false
  } catch {
    return false
  }
}

export function readOwnerTheme() {
  return localStorage.getItem('ownerTheme') === 'dark' ? 'dark' : 'light'
}

export function applyTheme() {
  if (typeof document === 'undefined') return
  const dark = ownerActive ? readOwnerTheme() === 'dark' : readGlobalDark()
  document.documentElement.classList.toggle('dark', dark)
}

export function setOwnerThemeActive(active) {
  ownerActive = active
  applyTheme()
}

export function isOwnerThemeActive() {
  return ownerActive
}
