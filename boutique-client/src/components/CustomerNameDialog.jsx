import { ArrowRight, UserRound, X } from 'lucide-react'
import { useState } from 'react'

function CustomerNameDialog({
  initialCustomer,
  orderPending,
  storageWarning,
  onClose,
  onSubmit,
}) {
  const [firstName, setFirstName] = useState(initialCustomer?.firstName || '')
  const [lastName, setLastName] = useState(initialCustomer?.lastName || '')
  const isNewCustomer = !initialCustomer

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim() })
  }

  return (
    <div
      className="store-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <section
        className="store-name-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-dialog-title"
        aria-describedby="customer-dialog-description"
      >
        <button
          className="store-dialog-close"
          type="button"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </button>
        <span className="store-dialog-icon">
          <UserRound aria-hidden="true" size={24} />
        </span>
        <p className="store-eyebrow">
          {isNewCustomer ? 'Première commande' : 'Votre profil client'}
        </p>
        <h2 id="customer-dialog-title">
          {isNewCustomer ? 'Comment vous appeler ?' : 'Vos coordonnées'}
        </h2>
        <p id="customer-dialog-description" className="store-dialog-copy">
          {isNewCustomer
            ? 'Indiquez votre prénom et votre nom. Ils seront ajoutés à votre message WhatsApp.'
            : 'Votre nom sera repris automatiquement dans vos prochains messages de commande.'}
        </p>

        <form className="store-name-form" onSubmit={handleSubmit}>
          <label>
            Prénom
            <input
              autoComplete="given-name"
              autoFocus
              maxLength={50}
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label>
            Nom
            <input
              autoComplete="family-name"
              maxLength={50}
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
          {storageWarning && (
            <p className="store-storage-warning" role="status">
              {storageWarning}
            </p>
          )}
          <button className="store-primary-button" type="submit">
            <span>
              {orderPending
                ? 'Enregistrer et continuer'
                : 'Enregistrer mon nom'}
            </span>
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </form>

        {isNewCustomer && (
          <p className="store-dialog-note">
            Aucun mot de passe à créer. Votre nom est mémorisé sur cet appareil
            pour simplifier vos prochaines commandes.
          </p>
        )}
      </section>
    </div>
  )
}

export default CustomerNameDialog
