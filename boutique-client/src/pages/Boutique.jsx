import {
  ArrowRight,
  House,
  PackageOpen,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../api.js'
import { getCategorySlug } from '../categorySlug.js'
import BrandLogo from '../components/BrandLogo.jsx'
import StoreBusinessDetails from '../components/StoreBusinessDetails.jsx'
import StoreSocialLinks from '../components/StoreSocialLinks.jsx'
import '../storefront.css'

const currentYear = new Date().getFullYear()

function CategoryCard({ category }) {
  const [imageFailed, setImageFailed] = useState(false)
  const categoryUrl = `/categorie/${getCategorySlug(category.name)}`

  return (
    <article className="store-category-card">
      <Link
        className="store-category-card-link"
        to={categoryUrl}
        aria-label={`Découvrir la catégorie ${category.name}`}
      >
        <div className="store-category-card-visual">
          {category.imageUrl && !imageFailed ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="store-category-card-placeholder">
              <PackageOpen aria-hidden="true" size={38} strokeWidth={1.3} />
              <span>Collection ORTARA</span>
            </div>
          )}
          <span className="store-category-card-count">
            {category.products.length} article
            {category.products.length === 1 ? '' : 's'}
          </span>
          <div className="store-category-card-title">
            <span>COLLECTION ORTARA</span>
            <h2>{category.name}</h2>
          </div>
        </div>
        <div className="store-category-card-details">
          <p>
            {category.products.length} article
            {category.products.length === 1 ? '' : 's'} à découvrir.
          </p>
          <span className="store-category-card-cta">
            Découvrir la sélection
            <ArrowRight aria-hidden="true" size={16} />
          </span>
        </div>
      </Link>
    </article>
  )
}

function Boutique() {
  const searchInputRef = useRef(null)
  const [products, setProducts] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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

    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const productsByCategory = new Map()

    for (const product of products || []) {
      const name = product.category?.trim()
      if (!name) continue
      const categoryProducts = productsByCategory.get(name) || []
      categoryProducts.push(product)
      productsByCategory.set(name, categoryProducts)
    }

    return [...productsByCategory.entries()]
      .map(([name, categoryProducts]) => ({
        name,
        products: categoryProducts,
        imageUrl: categoryProducts.find((product) => product.image?.url)?.image
          ?.url,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
  }, [products])

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')
    return categories.filter((category) =>
      category.name.toLocaleLowerCase('fr').includes(normalizedQuery),
    )
  }, [categories, query])

  function focusSearch() {
    document
      .getElementById('boutique-categories')
      ?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => searchInputRef.current?.focus(), 250)
  }

  return (
    <main className="storefront store-category-index-page" id="accueil">
      <header className="store-header">
        <Link className="store-brand" to="/" aria-label="ORTARA, accueil">
          <BrandLogo className="brand-logo store-brand-logo" />
        </Link>

        <nav className="store-desktop-nav" aria-label="Navigation principale">
          <Link to="/">Accueil</Link>
          <Link className="is-current" to="/boutique">
            Boutique
          </Link>
          <Link to="/#comment-commander">Comment commander</Link>
        </nav>

        <div className="store-header-actions">
          <button
            className="store-icon-button"
            type="button"
            aria-label="Rechercher une catégorie"
            onClick={focusSearch}
          >
            <Search aria-hidden="true" size={19} />
          </button>
          <Link className="store-profile-button" to="/profil">
            <span>Mon profil</span>
          </Link>
        </div>
      </header>

      <section
        className="store-category-index"
        id="boutique-categories"
        aria-labelledby="boutique-title"
      >
        <div className="store-category-index-intro">
          <p className="store-eyebrow">Collections & univers</p>
          <h1 id="boutique-title">Nos catégories & univers</h1>
          <p>
            Explorez les catégories de la boutique et trouvez la sélection qui
            vous plaît.
          </p>

          <div className="store-category-index-controls">
            <label className="store-search">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">Rechercher une catégorie</span>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Rechercher une catégorie…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {products && (
              <span className="store-category-index-count">
                {visibleCategories.length} catégorie
                {visibleCategories.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {error && <p className="store-error" role="alert">{error}</p>}
        {products === null && !error && (
          <p className="store-loading">Chargement des catégories…</p>
        )}
        {products && categories.length === 0 && (
          <div className="store-empty-state">
            <span className="store-empty-icon">
              <PackageOpen aria-hidden="true" size={28} />
            </span>
            <h2>Aucune catégorie pour le moment.</h2>
            <p>Les catégories apparaîtront ici dès qu’un article sera ajouté.</p>
          </div>
        )}
        {products &&
          categories.length > 0 &&
          visibleCategories.length === 0 && (
            <div className="store-empty-state store-empty-compact">
              <h2>Aucune catégorie trouvée.</h2>
              <p>Essayez un autre mot-clé.</p>
            </div>
          )}
        {visibleCategories.length > 0 && (
          <div className="store-category-index-grid">
            {visibleCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        )}
      </section>

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
        <Link className="is-current" to="/boutique" aria-current="page">
          <ShoppingBag aria-hidden="true" size={19} />
          <span>Boutique</span>
        </Link>
        <Link to="/profil">
          <UserRound aria-hidden="true" size={19} />
          <span>Mon profil</span>
        </Link>
      </nav>
    </main>
  )
}

export default Boutique
