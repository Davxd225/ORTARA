import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flower2,
  Gem,
  House,
  PackageOpen,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Tags,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, getErrorMessage } from '../api.js'
import { getCategorySlug } from '../categorySlug.js'
import { applyBestPromotion } from '../promotionPricing.js'
import BrandLogo from '../components/BrandLogo.jsx'
import CustomerNameDialog from '../components/CustomerNameDialog.jsx'
import ProductCard from '../components/ProductCard.jsx'
import StoreBusinessDetails from '../components/StoreBusinessDetails.jsx'
import StoreSocialLinks from '../components/StoreSocialLinks.jsx'
import {
  readCustomerProfile,
  saveCustomerProfile as persistCustomerProfile,
  saveOrderHistoryEntry,
} from '../customerData.js'
import {
  DEFAULT_STORE_SETTINGS,
  useStoreSettings,
} from '../storeSettings.js'
import '../storefront.css'

const currentYear = new Date().getFullYear()
const priceFormatter = new Intl.NumberFormat('fr-CI', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

function renderCategoryFallbackIcon(category, isAllProducts) {
  if (isAllProducts) {
    return <Tag aria-hidden="true" size={22} strokeWidth={1.6} />
  }

  const normalizedCategory = category.toLocaleLowerCase('fr')
  if (/parfum|beaute|soin|cosmet/.test(normalizedCategory)) {
    return <Sparkles aria-hidden="true" size={22} strokeWidth={1.6} />
  }
  if (/bijou|accessoir|collier|bracelet/.test(normalizedCategory)) {
    return <Gem aria-hidden="true" size={22} strokeWidth={1.6} />
  }
  if (/fleur|cheveu|nature|corps/.test(normalizedCategory)) {
    return <Flower2 aria-hidden="true" size={22} strokeWidth={1.6} />
  }
  return <Tags aria-hidden="true" size={22} strokeWidth={1.6} />
}

function CategoryIcon({ category, imageUrl, isAllProducts }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <span className="store-category-icon">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        renderCategoryFallbackIcon(category, isAllProducts)
      )}
    </span>
  )
}

function Catalogue() {
  const searchInputRef = useRef(null)
  const location = useLocation()
  const { slug: categorySlug } = useParams()
  const { settings: storeSettings } = useStoreSettings()
  const whatsappPhone = storeSettings.whatsappPhone.replace(/\D/g, '')
  const [products, setProducts] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [customerProfile, setCustomerProfile] = useState(readCustomerProfile)
  const [orderNotice, setOrderNotice] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const customer = customerProfile.customer

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.hash, location.pathname])

  useEffect(() => {
    let active = true

    api
      .get('/products')
      .then(({ data }) => {
        if (active) setProducts(data)
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })

    api
      .get('/promotions/active')
      .then(({ data }) => {
        if (active) setPromotions(data)
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })

    return () => {
      active = false
    }
  }, [])

  const productCategories = useMemo(
    () =>
      [
        ...new Set(
          (products || [])
            .map((product) => product.category?.trim())
            .filter(Boolean),
        ),
      ],
    [products],
  )
  const categoryOptions = useMemo(
    () => ['Tout', ...productCategories],
    [productCategories],
  )
  const selectedCategory = categorySlug
    ? productCategories.find((item) => getCategorySlug(item) === categorySlug)
    : null
  const categoryNotFound = Boolean(
    categorySlug && products !== null && !selectedCategory,
  )

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')
    return (products || []).filter((product) => {
      const matchesCategory =
        !categorySlug || product.category?.trim() === selectedCategory
      const searchableText =
        `${product.name} ${product.description || ''} ${product.category || ''}`.toLocaleLowerCase(
          'fr',
        )
      return matchesCategory && searchableText.includes(normalizedQuery)
    })
  }, [categorySlug, products, query, selectedCategory])
  const promotedProducts = useMemo(
    () => visibleProducts.map((product) => applyBestPromotion(product, promotions)),
    [promotions, visibleProducts],
  )

  function focusSearch() {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => searchInputRef.current?.focus(), 250)
  }

  function openWhatsAppOrder(
    product,
    quantity,
    customerDetails,
    profileWarning = '',
  ) {
    const unitPrice = Number(product.price) || 0
    const total = unitPrice * quantity
    const createdAt = new Date()
    const orderReference = `ORT-${createdAt
      .getTime()
      .toString(36)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const customerName =
      `${customerDetails.firstName} ${customerDetails.lastName}`.trim()
    const historyWarning = saveOrderHistoryEntry({
      id: orderReference,
      productName: product.name,
      category: product.category?.trim() || '',
      quantity,
      unitPrice,
      total,
      createdAt: createdAt.toISOString(),
    })
    setOrderNotice(
      [
        profileWarning,
        historyWarning ||
          'Votre commande est notée dans l’historique de cet appareil. La confirmation se fait directement sur WhatsApp.',
      ]
        .filter(Boolean)
        .join(' '),
    )
    const message = [
      storeSettings.whatsappMessage.trim() ||
        DEFAULT_STORE_SETTINGS.whatsappMessage,
      `Référence : ${orderReference}`,
      `Date : ${new Intl.DateTimeFormat('fr-CI', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(createdAt)}`,
      `Nom du client : ${customerName}`,
      `Article : ${product.name}`,
      ...(product.category?.trim()
        ? [`Catégorie : ${product.category.trim()}`]
        : []),
      `Quantité : ${quantity}`,
      `Prix unitaire : ${priceFormatter.format(unitPrice)}`,
      ...(product.promotion
        ? [
            `Promotion appliquée : ${product.promotion.title}`,
            `Économie : ${priceFormatter.format(
              (Number(product.originalPrice) || 0) - unitPrice,
            )}`,
          ]
        : []),
      `Total : ${priceFormatter.format(total)}`,
      'Merci de confirmer la disponibilité et les modalités de livraison et de paiement.',
    ].join('\n')
    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function beginOrder(product, quantity) {
    setOrderNotice('')
    if (!customer) {
      setPendingOrder({ product, quantity })
      setDialogOpen(true)
      return
    }
    openWhatsAppOrder(product, quantity, customer)
  }

  function closeCustomerDialog() {
    setDialogOpen(false)
    setPendingOrder(null)
  }

  function saveCustomerProfile(customerDetails) {
    const savedCustomer = {
      firstName: customerDetails.firstName,
      lastName: customerDetails.lastName,
    }
    const warning = persistCustomerProfile(savedCustomer)

    setCustomerProfile({ customer: savedCustomer, warning })
    setDialogOpen(false)

    if (pendingOrder) {
      openWhatsAppOrder(
        pendingOrder.product,
        pendingOrder.quantity,
        savedCustomer,
        warning,
      )
    } else {
      setOrderNotice(warning || 'Votre nom a été mis à jour.')
    }
    setPendingOrder(null)
  }

  return (
    <main className="storefront" id="accueil">
      <header className="store-header">
        <Link className="store-brand" to="/" aria-label="ORTARA, accueil">
          <BrandLogo className="brand-logo store-brand-logo" />
        </Link>

        <nav className="store-desktop-nav" aria-label="Navigation principale">
          <Link className={!categorySlug ? 'is-current' : ''} to="/">
            Accueil
          </Link>
          <Link
            className={categorySlug ? 'is-current' : ''}
            to="/boutique"
          >
            Boutique
          </Link>
          <Link to="/#comment-commander">Comment commander</Link>
        </nav>

        <div className="store-header-actions">
          <button
            className="store-icon-button"
            type="button"
            aria-label="Rechercher un article"
            onClick={focusSearch}
          >
            <Search aria-hidden="true" size={19} />
          </button>
          <Link className="store-profile-button" to="/profil">
            <UserRound aria-hidden="true" size={18} />
            <span>{customer ? `Bonjour ${customer.firstName}` : 'Mon profil'}</span>
          </Link>
        </div>
      </header>

      {categorySlug ? (
        <section
          className="store-category-page-intro"
          aria-labelledby="category-page-title"
        >
          <Link className="store-inline-link" to="/boutique">
            <ArrowLeft aria-hidden="true" size={15} />
            Retour à la boutique
          </Link>
          <p className="store-eyebrow">Univers ORTARA</p>
          <h1 id="category-page-title">
            {selectedCategory ||
              (products === null ? 'Chargement…' : 'Catégorie introuvable')}
          </h1>
          <p>
            {selectedCategory
              ? `Découvrez les articles de la catégorie ${selectedCategory}.`
              : products === null
                ? 'Chargement des articles…'
                : 'Cette catégorie n’est plus disponible.'}
          </p>
        </section>
      ) : (
        <>
          <section className="store-hero">
            <div className="store-hero-copy">
              <p className="store-eyebrow">
                <span />
                Bienvenue dans l’univers ORTARA
              </p>
              <h1>
                Faites-vous
                <br />
                <em>plaisir.</em>
              </h1>
              <p className="store-hero-description">
                Découvrez une sélection de produits choisis avec soin. Une pièce
                vous plaît ? Commandez-la directement auprès de la boutique.
              </p>
              <div className="store-hero-actions">
                <Link className="store-primary-button" to="/boutique">
                  Explorer la boutique
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
                <a className="store-text-link" href="#comment-commander">
                  Comment ça marche ?
                  <ArrowDown aria-hidden="true" size={15} />
                </a>
              </div>
              <div className="store-hero-note">
                <span className="store-online-dot" />
                <span>Commande simple, échange direct avec la patronne</span>
              </div>
            </div>

          </section>

          <section
            className="store-category-section"
            aria-labelledby="category-title"
          >
            <div className="store-section-heading store-category-heading">
              <div>
                <p className="store-eyebrow">Prenez le temps de choisir</p>
                <h2 id="category-title">Parcourir par univers</h2>
              </div>
              <Link className="store-inline-link" to="/boutique">
                Tous les articles <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <div className="store-category-list">
              {categoryOptions.map((item, index) => {
                const isAllProducts = index === 0
                const categoryImageUrl = isAllProducts
                  ? null
                  : products?.find(
                      (product) =>
                        product.category?.trim() === item &&
                        product.image?.url,
                    )?.image?.url
                const count = isAllProducts
                  ? products?.length || 0
                  : products?.filter((product) => product.category?.trim() === item)
                      .length || 0
                const isSelected = isAllProducts
                  ? !categorySlug
                  : getCategorySlug(item) === categorySlug

                return (
                  <Link
                    className={`store-category-item${isSelected ? ' is-selected' : ''}`}
                    key={`${isAllProducts ? 'all' : getCategorySlug(item)}-${index}`}
                    to={
                      isAllProducts
                        ? '/'
                        : `/categorie/${getCategorySlug(item)}`
                    }
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    <CategoryIcon
                      category={item}
                      imageUrl={categoryImageUrl}
                      isAllProducts={isAllProducts}
                    />
                    <span className="store-category-name">{item}</span>
                    <span className="store-category-count">
                      {count} article(s)
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}

      <section className="store-catalogue-section" id="catalogue">
        <div className="store-section-heading store-catalogue-heading">
          <div>
            <p className="store-eyebrow">La sélection ORTARA</p>
            <h2>
              {categorySlug
                ? selectedCategory
                  ? 'Les articles'
                  : 'Catégorie introuvable'
                : 'À découvrir'}
            </h2>
            <p className="store-section-description">
              {selectedCategory
                ? `Tous les articles de la catégorie ${selectedCategory}.`
                : 'Chaque article peut être commandé directement sur WhatsApp.'}
            </p>
          </div>
          {products && (
            <span className="store-count-badge">
              {visibleProducts.length} article{visibleProducts.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="store-catalogue-controls">
          <label className="store-search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Rechercher un article</span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Que recherchez-vous ?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {!categorySlug && (
            <div className="store-filter-list" aria-label="Filtrer les articles">
              {categoryOptions.map((item, index) => {
                const isAllProducts = index === 0
                const isSelected = isAllProducts
                  ? !categorySlug
                  : getCategorySlug(item) === categorySlug

                return (
                  <Link
                    className={`store-filter-chip${isSelected ? ' is-selected' : ''}`}
                    key={`${isAllProducts ? 'all' : getCategorySlug(item)}-${index}`}
                    to={
                      isAllProducts
                        ? '/'
                        : `/categorie/${getCategorySlug(item)}`
                    }
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    {item}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {customerProfile.warning && (
          <p className="store-storage-warning" role="status">
            {customerProfile.warning}
          </p>
        )}
        {orderNotice && (
          <p className="store-profile-hint" role="status">
            {orderNotice}{' '}
            <Link to="/profil">Voir mon profil et mes demandes</Link>
          </p>
        )}
        {!whatsappPhone && (
          <p className="store-storage-warning" role="alert">
            Les commandes WhatsApp ne sont pas encore configurées pour cette
            boutique.
          </p>
        )}
        {error && <p className="store-error" role="alert">{error}</p>}
        {products === null && !error && (
          <p className="store-loading">Chargement des articles…</p>
        )}
        {categoryNotFound && (
          <div className="store-empty-state">
            <span className="store-empty-icon">
              <PackageOpen aria-hidden="true" size={28} />
            </span>
            <h3>Cette catégorie n’est plus disponible.</h3>
            <p>Consultez toutes les catégories et les articles de la boutique.</p>
            <Link className="store-inline-link" to="/boutique">
              Voir tous les articles <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        )}
        {products && !categorySlug && products.length === 0 && (
          <div className="store-empty-state">
            <span className="store-empty-icon">
              <PackageOpen aria-hidden="true" size={28} />
            </span>
            <p className="store-eyebrow">Un peu de patience</p>
            <h3>Les nouveautés arrivent bientôt.</h3>
            <p>
              La sélection de la boutique sera bientôt disponible ici.
              Revenez découvrir les prochains articles ORTARA.
            </p>
          </div>
        )}
        {products && !categoryNotFound && products.length > 0 && visibleProducts.length === 0 && (
          <div className="store-empty-state store-empty-compact">
            <h3>Aucun article trouvé.</h3>
            <p>Essayez un autre mot-clé ou consultez une autre catégorie.</p>
          </div>
        )}
        {visibleProducts.length > 0 && (
          <div className="store-product-grid">
            {promotedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                canContact={Boolean(whatsappPhone)}
                onOrder={beginOrder}
              />
            ))}
          </div>
        )}
      </section>

      {!categorySlug && (
        <section className="store-how-section" id="comment-commander">
          <div className="store-how-intro">
            <p className="store-eyebrow">C’est tout simple</p>
            <h2>Comment commander ?</h2>
            <p>
              Le site vous met en contact avec la boutique. La confirmation, le
              paiement et la livraison se font directement avec la patronne.
            </p>
          </div>
          <div className="store-steps">
            <article className="store-step">
              <span className="store-step-number">01</span>
              <span className="store-step-icon">
                <ShoppingBag aria-hidden="true" size={21} />
              </span>
              <h3>Choisissez votre article</h3>
              <p>Sélectionnez un article et indiquez la quantité souhaitée.</p>
            </article>
            <article className="store-step">
              <span className="store-step-number">02</span>
              <span className="store-step-icon">
                <UserRound aria-hidden="true" size={21} />
              </span>
              <h3>Présentez-vous</h3>
              <p>
                Lors de votre première commande, renseignez votre nom et votre
                prénom. Ils seront repris ensuite sur cet appareil.
              </p>
            </article>
            <article className="store-step">
              <span className="store-step-number">03</span>
              <span className="store-step-icon">
                <Sparkles aria-hidden="true" size={21} />
              </span>
              <h3>Échangez sur WhatsApp</h3>
              <p>
                Votre demande est préremplie. La patronne confirme la
                disponibilité et les modalités avec vous.
              </p>
            </article>
          </div>
        </section>
      )}

      {!categorySlug && (
        <section className="store-help-section">
          <div className="store-help-card">
            <div className="store-help-icon">
              <Flower2 aria-hidden="true" size={26} />
            </div>
            <div>
              <p className="store-eyebrow">À votre rythme</p>
              <h2>Besoin d’un conseil ?</h2>
              <p>
                Parcourez les articles et leurs détails, puis choisissez ce qui
                vous convient.
              </p>
            </div>
            <Link className="store-secondary-button" to="/#catalogue">
              Voir les articles
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>
      )}

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
        <Link
          className={categorySlug ? 'is-current' : ''}
          to="/boutique"
        >
          <ShoppingBag aria-hidden="true" size={19} />
          <span>Boutique</span>
        </Link>
        <Link to="/profil">
          <UserRound aria-hidden="true" size={19} />
          <span>Mon profil</span>
        </Link>
      </nav>

      {dialogOpen && (
        <CustomerNameDialog
          initialCustomer={customer}
          orderPending={Boolean(pendingOrder)}
          storageWarning={customerProfile.warning}
          onClose={closeCustomerDialog}
          onSubmit={saveCustomerProfile}
        />
      )}
    </main>
  )
}

export default Catalogue
