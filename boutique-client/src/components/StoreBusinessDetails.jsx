import { Clock3, MapPin } from 'lucide-react'
import { useStoreSettings } from '../storeSettings.js'

function StoreBusinessDetails() {
  const { settings } = useStoreSettings()
  const address = settings.address.trim()
  const serviceHours = settings.serviceHours.trim()

  if (!address && !serviceHours) return null

  return (
    <div className="store-business-details" aria-label="Informations de la boutique">
      {address && (
        <p>
          <MapPin aria-hidden="true" size={15} />
          <span>{address}</span>
        </p>
      )}
      {serviceHours && (
        <p>
          <Clock3 aria-hidden="true" size={15} />
          <span>{serviceHours}</span>
        </p>
      )}
    </div>
  )
}

export default StoreBusinessDetails
