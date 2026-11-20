import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api.js'
import {
  DEFAULT_STORE_SETTINGS,
  StoreSettingsContext,
} from './storeSettings.js'

function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS)
  const hasLocalUpdate = useRef(false)
  const updateSettings = useCallback((nextSettings) => {
    hasLocalUpdate.current = true
    setSettings(nextSettings)
  }, [])

  useEffect(() => {
    let active = true
    api
      .get('/settings/public')
      .then(({ data }) => {
        if (active && !hasLocalUpdate.current) {
          setSettings({ ...DEFAULT_STORE_SETTINGS, ...data })
        }
      })
      .catch((error) => {
        if (active) {
          console.error('Impossible de charger les coordonnées de la boutique.', error)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ settings, setSettings: updateSettings }),
    [settings, updateSettings],
  )

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export default StoreSettingsProvider
