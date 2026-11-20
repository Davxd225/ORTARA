import {
  ArrowRight,
  Clock3,
  House,
  PackageOpen,
  Pencil,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import CustomerNameDialog from '../components/CustomerNameDialog.jsx'
import StoreBusinessDetails from '../components/StoreBusinessDetails.jsx'
import StoreSocialLinks from '../components/StoreSocialLinks.jsx'
import {
  readCustomerProfile,
  readOrderHistory,
  saveCustomerProfile,
} from '../customerData.js'
import '../storefront.css'

const currentYear = new Date().getFullYear()
const priceFormatter = new Intl.NumberFormat('fr-CI', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('fr-CI', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatOrderDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date indisponible'
    : dateFormatter.format(date)
}

function ClientProfile() {
  const [customerProfile, setCustomerProfile] = useState(readCustomerProfile)
  const [orderHistory] = useState(readOrderHistory)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const customer = customerProfile.customer

  function updateProfile(customerDetails) {
    const savedCustomer = {
      firstName: customerDetails.firstName.trim(),
      lastName: customerDetails.lastName.trim(),
    }
    const warning = saveCustomerProfile(savedCustomer)

    setCustomerProfile({ customer: savedCustomer, warning })
    setDialogOpen(false)
    setNotice(warning || 'Votre profil a été mis à jour.')
  }

  return (
    <main className="storefront store-client-profile-page" id="accueil">
      <header className="store-header">
        <Link className="store-brand" to="/" aria-label="ORTARA, accueil">
          <BrandLogo className="brand-logo store-brand-logo" />
        </Link>

        <nav className="store-desktop-nav" aria-label="Navigation principale">
          <Link to="/">Accueil</Link>
          <Link to="/boutique">Boutique</Link>
          <Link className="is-current" to="/profil">
            Mon profil
          </Link>
        </nav>

        <div className="store-header-actions">
          <Link
            className="store-profile-button"
            to="/profil"
            aria-current="page"
          >
            <UserRound aria-hidden="true" size={18} />
            <span>{customer ? `Bonjour ${customer.firstName}` : 'Mon profil'}</span>
          </Link>
        </div>
      </header>

      <div className="store-profile-content">
        <section className="store-profile-intro">
          <p className="store-eyebrow">Votre espace ORTARA</p>
          <h1>Mon profil</h1>
          <p>Consultez vos informations et retrouvez vos commandes passées via WhatsApp.</p>
        </section>

        {(customerProfile.warning || orderHistory.warning) && (
          <p className="store-storage-warning" role="status">
            {[customerProfile.warning, orderHistory.warning]
              .filter(Boolean)
              .join(' ')}
          </p>
        )}
        {notice && (
          <p className="store-profile-notice" role="status">
            {notice}
          </p>
        )}

        {customer ? (
          <section
            className="store-profile-card"
            aria-labelledby="profile-details-title"
          >
            <span className="store-profile-card-icon">
              <UserRound aria-hidden="true" size={24} />
            </span>
            <div className="store-profile-card-details">
              <p className="store-eyebrow">Mes informations</p>
              <h2 id="profile-details-title">
                {customer.firstName} {customer.lastName}
              </h2>
              <p>Votre nom sera repris dans vos prochains messages WhatsApp.</p>
            </div>
            <button
              className="store-profile-edit"
              type="button"
              onClick={() => setDialogOpen(true)}
            >
              <Pencil aria-hidden="true" size={15} />
              Modifier
            </button>
          </section>
        ) : (
          <section className="store-profile-empty">
            <span className="store-profile-card-icon">
              <UserRound aria-hidden="true" size={24} />
            </span>
            <div>
              <h2>Votre profil sera créé à votre première commande.</h2>
              <p>
                Votre prénom et votre nom seront demandés avant l’ouverture de
                WhatsApp.
              </p>
            </div>
            <Link className="store-primary-button" to="/boutique">
              Parcourir la boutique
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </section>
        )}

        <section className="store-order-history" aria-labelledby="orders-title">
          <div className="store-profile-section-heading">
            <div>
              <p className="store-eyebrow">Votre activité</p>
              <h2 id="orders-title">Mes commandes passées</h2>
            </div>
            <Link className="store-inline-link" to="/boutique">
              Nouvelle commande <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>

          <p className="store-profile-disclaimer" role="note">
            Cet historique est conservé sur cet appareil. La boutique confirme
            vos commandes directement sur WhatsApp; le site ne peut pas vérifier
            l’envoi ni la confirmation.
          </p>

          {orderHistory.orders.length === 0 ? (
            <div className="store-empty-state store-empty-compact">
              <span className="store-empty-icon">
                <PackageOpen aria-hidden="true" size={26} />
              </span>
              <h3>Aucune commande passée pour le moment.</h3>
              <p>Vos commandes lancées via WhatsApp apparaîtront ici.</p>
              <Link className="store-inline-link" to="/boutique">
                Voir les catégories <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
          ) : (
            <div className="store-order-history-list">
              {orderHistory.orders.map((order) => (
                <article className="store-order-history-card" key={order.id}>
                  <span className="store-order-history-icon">
                    <ShoppingBag aria-hidden="true" size={21} />
                  </span>
                  <div className="store-order-history-details">
                    <div className="store-order-history-title">
                      <h3>{order.productName}</h3>
                      <span className="store-order-history-status">
                        À confirmer sur WhatsApp
                      </span>
                    </div>
                    {order.category && <p>{order.category}</p>}
                    <time dateTime={order.createdAt}>
                      <Clock3 aria-hidden="true" size={13} />
                      {formatOrderDate(order.createdAt)}
                    </time>
                    <p>
                      Quantité : {order.quantity} ×{' '}
                      {priceFormatter.format(order.unitPrice)}
                    </p>
                  </div>
                  <strong className="store-order-history-total">
                    {priceFormatter.format(order.total)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="store-footer">
        <Link className="store-brand store-footer-brand" to="/">
          <BrandLogo className="brand-logo store-footer-logo" />
        </Link>
        <p>
          Le paiement et la livraison sont convenus directement avec la
          boutique.
        </p>
        <div className="store-footer-links">
          <StoreBusinessDetails />
          <StoreSocialLinks />
          <Link className="store-owner-link" to="/admin/login">
            Espace propriétaire
          </Link>
        </div>
        <span className="store-copyright">© {currentYear} ORTARA</span>
      </footer>

      <nav className="store-mobile-dock" aria-label="Navigation mobile">
        <Link to="/">
          <House aria-hidden="true" size={19} />
          <span>Accueil</span>
        </Link>
        <Link to="/boutique">
          <ShoppingBag aria-hidden="true" size={19} />
          <span>Boutique</span>
        </Link>
        <Link className="is-current" to="/profil" aria-current="page">
          <UserRound aria-hidden="true" size={19} />
          <span>Mon profil</span>
        </Link>
      </nav>

      {dialogOpen && (
        <CustomerNameDialog
          initialCustomer={customer}
          orderPending={false}
          storageWarning={customerProfile.warning}
          onClose={() => setDialogOpen(false)}
          onSubmit={updateProfile}
        />
      )}
    </main>
  )
}

export default ClientProfile
