import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api.js'
import BrandLogo from '../components/BrandLogo.jsx'
import {
  Archive,
  Bell,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  PackagePlus,
  Pencil,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Warehouse,
} from 'lucide-react'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '0',
  imageUrl: '',
}

const priceFormatter = new Intl.NumberFormat('fr-CI', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

function getGreeting(date = new Date()) {
  return date.getHours() >= 18 ? 'Bonsoir' : 'Bonjour'
}

function AdminDashboard() {
  const navigate = useNavigate()
  const imageInputRef = useRef(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeNav, setActiveNav] = useState('board')
  const [greeting, setGreeting] = useState(() => getGreeting())
  const [referenceTime] = useState(() => Date.now())
  const [dashboardMonth] = useState(() => {
    const date = new Date()
    return { year: date.getFullYear(), month: date.getMonth() }
  })
  const [today] = useState(() =>
    new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
    }).format(new Date()),
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setGreeting(getGreeting())
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const fetchProducts = useCallback(async () => {
    const { data } = await api.get('/products')
    return data
  }, [])

  useEffect(() => {
    let active = true

    fetchProducts()
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.response?.status === 401) {
          sessionStorage.removeItem('adminToken')
          navigate('/admin/login', { replace: true })
          return
        }
        setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetchProducts, navigate])

  async function reloadProducts() {
    try {
      setProducts(await fetchProducts())
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('adminToken')
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(requestError))
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId('')
    setImageFile(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function startEditing(product) {
    setShowForm(true)
    setEditingId(product._id)
    setImageFile(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: product.category || '',
      stock: String(product.stock ?? 0),
      imageUrl: product.image?.url || '',
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
    }
    let requestData = productData
    if (imageFile) {
      requestData = new FormData()
      Object.entries(productData).forEach(([key, value]) => {
        requestData.append(key, String(value))
      })
      requestData.append('image', imageFile)
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, requestData)
        setNotice('Article modifié.')
      } else {
        await api.post('/products', requestData)
        setNotice('Article ajouté au catalogue.')
      }
      resetForm()
      await reloadProducts()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const categoryCount = new Set(
    products.map((product) => product.category?.trim()).filter(Boolean),
  ).size
  const stockValue = products.reduce(
    (total, product) =>
      total + (Number(product.price) || 0) * (Number(product.stock) || 0),
    0,
  )
  const lowStockProducts = products.filter(
    (product) => Number(product.stock) >= 1 && Number(product.stock) <= 3,
  )
  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) === 0,
  )
  const categoryNames = [
    ...new Set(
      products.map((product) => product.category?.trim()).filter(Boolean),
    ),
  ]
  const stockUnits = products.reduce(
    (total, product) => total + (Number(product.stock) || 0),
    0,
  )
  const recentProducts = [...products]
    .sort((first, second) =>
      new Date(second.updatedAt || second.createdAt || 0) -
      new Date(first.updatedAt || first.createdAt || 0),
    )
    .slice(0, 3)
  const newThisMonth = products.filter((product) => {
    const date = new Date(product.createdAt)
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === dashboardMonth.year &&
      date.getMonth() === dashboardMonth.month
    )
  }).length

  function relativeDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date indisponible'
    const diffMinutes = Math.max(0, Math.floor((referenceTime - date.getTime()) / 60000))
    if (diffMinutes < 1) return "À l'instant"
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `Il y a ${diffHours} h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }
  return (
    <main className="owner-dashboard">
      <header className="owner-topbar">
        <Link className="owner-brand" to="/">
          <BrandLogo className="owner-brand-logo" />
        </Link>
        <div className="owner-top-actions">
          <Link className="owner-store-link" to="/">
            <span>Voir<br />boutique</span>
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <div className="owner-content">
        <section className="owner-welcome">
          <div className="owner-welcome-row">
            <div>
              <h1>{greeting} Mehira <span aria-hidden="true">👋</span></h1>
              <div className="owner-date">
                <CalendarDays size={18} />
                <span>Aujourd'hui: {today}</span>
              </div>
            </div>
          </div>
        </section>

        {error && <p className="error-message">{error}</p>}
        {notice && <p className="notice">{notice}</p>}

        {showForm && (
          <section className="owner-form-card">
            <div className="owner-card-title-row">
              <h2>{editingId ? 'Modifier l’article' : 'Nouvel article'}</h2>
              <button type="button" onClick={() => setShowForm(false)}>Fermer</button>
            </div>
            <form className="form-stack" onSubmit={handleSubmit}>
              <label className="form-field">Nom de l’article
                <input className="form-control" name="name" required value={form.name} onChange={updateField} />
              </label>
              <label className="form-field">Description
                <textarea className="form-control textarea" name="description" value={form.description} onChange={updateField} />
              </label>
              <label className="form-field">Prix (FCFA)
                <input className="form-control" name="price" type="number" min="0" step="1" required value={form.price} onChange={updateField} />
              </label>
              <label className="form-field">Catégorie
                <input className="form-control" name="category" value={form.category} onChange={updateField} />
              </label>
              <label className="form-field">Stock disponible
                <input className="form-control" name="stock" type="number" min="0" step="1" required value={form.stock} onChange={updateField} />
              </label>
              <label className="form-field">Photo
                <input ref={imageInputRef} className="form-control" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              </label>
              <label className="form-field">URL de l’image
                <input className="form-control" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={updateField} />
              </label>
              <div className="form-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter au catalogue'}
                </button>
                {editingId && <button className="button-secondary" type="button" onClick={resetForm}>Annuler</button>}
              </div>
            </form>
          </section>
        )}

        <Link className="owner-promo" to="/admin/promotions">
          <span className="owner-promo-icon"><Tag size={20} /></span>
          <span className="owner-promo-copy">
            <span className="owner-promo-label"><b>OFFRES</b><em>Campagnes boutique</em></span>
            <strong>Gérer les promotions</strong>
          </span>
          <span className="owner-promo-action">Gérer <ChevronRight size={18} /></span>
        </Link>

        <section className="owner-overview">
          <div className="owner-section-head">
            <h2>Aperçu du Catalogue</h2>
            <span>Temps réel</span>
          </div>
          <div className="owner-stat-grid">
            <article>
              <div className="owner-stat-title"><span>Articles</span><Archive size={20} /></div>
              <strong>{products.length}</strong>
              <small className="owner-positive"><TrendingUp size={15} /> {newThisMonth} ajouté(s) ce mois</small>
            </article>
            <article>
              <div className="owner-stat-title"><span>Catégories</span><Warehouse size={20} /></div>
              <strong>{categoryCount}</strong>
              <small>{categoryNames.join(', ') || 'Aucune catégorie'}</small>
            </article>
            <article className="owner-stock-stat">
              <div className="owner-stat-title"><span>Valeur estimée du stock</span><b>Actif</b></div>
              <div className="owner-stock-value">
                <strong>{stockValue.toLocaleString('fr-FR')}</strong><span> F CFA</span>
              </div>
              <small>{stockUnits} unité(s) en stock</small>
            </article>
          </div>
        </section>

        <section className="owner-alerts">
          <div className="owner-section-head">
            <h2><Bell size={24} /> Alertes de Stock</h2>
            <button type="button">{lowStockProducts.length + outOfStockProducts.length} à traiter</button>
          </div>
          <div className="owner-alert-card">
            {outOfStockProducts.length > 0 && (
              <div className="owner-alert-group">
                <div className="owner-alert-label"><b><i /> Ruptures critiques ({outOfStockProducts.length})</b><span>BLOQUE COMMANDES</span></div>
                {outOfStockProducts.slice(0, 2).map((product) => (
                  <article className="owner-alert-item" key={product._id}>
                    {product.image?.url ? <img src={product.image.url} alt="" /> : <span className="owner-alert-placeholder"><PackagePlus size={18} /></span>}
                    <div><strong>{product.name}</strong><small>{product.category || 'Article'} • Stock : 0</small></div>
                    <button type="button" onClick={() => startEditing(product)}>+ Réappro</button>
                  </article>
                ))}
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="owner-alert-group">
                <div className="owner-alert-label"><b><i /> Bientôt en rupture ({lowStockProducts.length})</b><span>STOCK FAIBLE</span></div>
                {lowStockProducts.slice(0, 3).map((product) => (
                  <article className="owner-alert-item" key={product._id}>
                    {product.image?.url ? <img src={product.image.url} alt="" /> : <span className="owner-alert-placeholder"><PackagePlus size={18} /></span>}
                    <div><strong>{product.name}</strong><small>{product.category || 'Article'} • {priceFormatter.format(Number(product.price) || 0)}</small></div>
                    <button className="owner-alert-restock" type="button" onClick={() => startEditing(product)}>Réappro</button>
                    <button className="owner-edit" type="button" onClick={() => startEditing(product)} aria-label={`Modifier ${product.name}`}><Pencil size={17} /></button>
                  </article>
                ))}
              </div>
            )}
            {!loading && outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
              <p className="owner-empty-alert">Aucune alerte stock pour le moment.</p>
            )}
          </div>
        </section>

        <section className="owner-activity">
          <div className="owner-section-head">
            <h2>Activité Récente</h2>
            <span>D’après le catalogue</span>
          </div>
          <div className="owner-activity-card">
            {recentProducts.length > 0 ? recentProducts.map((product) => {
              const activityDate = product.updatedAt || product.createdAt
              const wasUpdated = product.updatedAt && product.createdAt &&
                new Date(product.updatedAt).getTime() !== new Date(product.createdAt).getTime()
              return (
                <article key={product._id}>
                  <span className="owner-activity-icon">
                    {wasUpdated ? <Pencil size={18} /> : <PackagePlus size={18} />}
                  </span>
                  <div>
                    <strong>{wasUpdated ? 'Article modifié' : 'Article ajouté au catalogue'}</strong>
                    <p>{product.name} • Stock : {product.stock ?? 0}</p>
                    <b>{relativeDate(activityDate)}</b>
                  </div>
                </article>
              )
            }) : (
              <p className="owner-empty-alert">Aucune activité catalogue.</p>
            )}
          </div>
        </section>
      </div>

      <nav className="owner-bottom-nav" aria-label="Navigation patronne">
        {[
          { id: 'board', label: 'Bord', icon: LayoutGrid },
          { id: 'catalog', label: 'Catalogue', icon: Archive, link: '/admin/catalog' },
          { id: 'promos', label: 'Promos', icon: Tag, link: '/admin/promotions' },
          { id: 'settings', label: 'Réglages', icon: SlidersHorizontal, link: '/admin/settings' },
        ].map((item) => {
          const Icon = item.icon
          const content = <><Icon size={22} strokeWidth={1.8} /><span>{item.label}</span></>
          return item.link ? (
            <Link key={item.id} className={activeNav === item.id ? 'active' : ''} to={item.link} onClick={() => setActiveNav(item.id)}>{content}</Link>
          ) : (
            <button key={item.id} type="button" className={activeNav === item.id ? 'active' : ''} onClick={() => setActiveNav(item.id)}>{content}</button>
          )
        })}
      </nav>
    </main>
  )
}

export default AdminDashboard
