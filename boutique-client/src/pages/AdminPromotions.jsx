import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  Check,
  CirclePercent,
  Clock3,
  ExternalLink,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Plus,
  Rocket,
  SlidersHorizontal,
  Tag,
  TicketPercent,
} from 'lucide-react'
import { api, getErrorMessage } from '../api.js'
import BrandLogo from '../components/BrandLogo.jsx'

const dateInputValue = (date) => date.toISOString().slice(0, 10)

function makeEmptyForm() {
  const startsAt = new Date()
  const expiresAt = new Date(startsAt)
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 7)
  return {
    title: '',
    discountType: 'percentage',
    discountValue: '',
    category: '',
    startsAt: dateInputValue(startsAt),
    expiresAt: dateInputValue(expiresAt),
    message: '',
    active: true,
  }
}

function getPromotionState(promotion, now) {
  if (!promotion.active) return 'paused'
  if (new Date(promotion.expiresAt) <= now) return 'expired'
  if (new Date(promotion.startsAt) > now) return 'upcoming'
  return 'active'
}

function formatPromotionDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function formatDiscount(promotion) {
  if (promotion.discountType === 'percentage') {
    return `-${promotion.discountValue}%`
  }
  return `-${Number(promotion.discountValue).toLocaleString('fr-FR')} F CFA`
}

function formatDiscountDetail(promotion) {
  if (promotion.discountType === 'percentage') {
    return `${promotion.discountValue}% de réduction`
  }
  return `${Number(promotion.discountValue).toLocaleString('fr-FR')} F CFA de réduction`
}

function AdminPromotions() {
  const navigate = useNavigate()
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(makeEmptyForm)
  const [now] = useState(() => new Date())

  const fetchData = useCallback(async () => {
    const [promotionResponse, productResponse] = await Promise.all([
      api.get('/promotions'),
      api.get('/products'),
    ])
    return {
      promotions: promotionResponse.data,
      products: productResponse.data,
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchData()
      .then((data) => {
        if (!active) return
        setPromotions(data.promotions)
        setProducts(data.products)
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
  }, [fetchData, navigate])

  const categories = useMemo(
    () => [
      ...new Set(
        products.map((product) => product.category?.trim()).filter(Boolean),
      ),
    ],
    [products],
  )

  const activePromotions = promotions.filter(
    (promotion) => getPromotionState(promotion, now) === 'active',
  )
  const upcomingPromotions = promotions.filter(
    (promotion) => getPromotionState(promotion, now) === 'upcoming',
  )
  const historyPromotions = promotions.filter((promotion) =>
    ['expired', 'paused'].includes(getPromotionState(promotion, now)),
  )

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setEditingId('')
    setForm(makeEmptyForm())
    setError('')
  }

  function editPromotion(promotion) {
    setEditingId(promotion._id)
    setForm({
      title: promotion.title,
      discountType: promotion.discountType,
      discountValue: String(promotion.discountValue),
      category: promotion.category || '',
      startsAt: dateInputValue(new Date(promotion.startsAt)),
      expiresAt: dateInputValue(new Date(promotion.expiresAt)),
      message: promotion.message || '',
      active: promotion.active,
    })
    setError('')
    document.getElementById('promotion-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  async function refreshData() {
    const data = await fetchData()
    setPromotions(data.promotions)
    setProducts(data.products)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        startsAt: new Date(`${form.startsAt}T00:00:00.000Z`).toISOString(),
        expiresAt: new Date(`${form.expiresAt}T23:59:59.999Z`).toISOString(),
      }
      if (editingId) {
        await api.put(`/promotions/${editingId}`, payload)
        setNotice('Promotion mise à jour.')
      } else {
        await api.post('/promotions', payload)
        setNotice('Promotion créée.')
      }
      resetForm()
      await refreshData()
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('adminToken')
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function togglePromotion(promotion) {
    setError('')
    setNotice('')
    try {
      await api.patch(`/promotions/${promotion._id}/active`, {
        active: !promotion.active,
      })
      await refreshData()
      setNotice(
        promotion.active ? 'Promotion mise en pause.' : 'Promotion réactivée.',
      )
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('adminToken')
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(requestError))
    }
  }

  function sharePromotion(promotion) {
    const message = [
      `✨ ${promotion.title} chez ORTARA ✨`,
      formatDiscountDetail(promotion),
      promotion.category
        ? `Sur la catégorie ${promotion.category}.`
        : 'Sur toute la boutique.',
      promotion.message,
      `Offre valable du ${formatPromotionDate(promotion.startsAt)} au ${formatPromotionDate(promotion.expiresAt)}.`,
    ]
      .filter(Boolean)
      .join('\n')
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function matchedProductCount(promotion) {
    return products.filter((product) => {
      const category = promotion.category?.trim()
      return !category || product.category?.trim() === category
    }).length
  }

  function renderPromotionCard(promotion) {
    const state = getPromotionState(promotion, now)
    return (
      <article className="promo-card" key={promotion._id}>
        <div className="promo-card-top">
          <span className={`promo-icon is-${state}`}>
            {promotion.discountType === 'percentage'
              ? <CirclePercent size={21} />
              : <Tag size={21} />}
          </span>
          <div className="promo-card-info">
            <div className="promo-title-row">
              <h3>{promotion.title}</h3>
              <span className={`promo-state is-${state}`}>
                <i />
                {state === 'active'
                  ? 'En cours'
                  : state === 'upcoming'
                    ? 'À venir'
                    : state === 'expired'
                      ? 'Terminée'
                      : 'En pause'}
              </span>
            </div>
            <p>
              {promotion.category || 'Toute la boutique'}
              {' · '}
              {matchedProductCount(promotion)} article(s) concerné(s)
            </p>
          </div>
          <strong className="promo-discount">{formatDiscount(promotion)}</strong>
        </div>
        {promotion.message && <p className="promo-message">{promotion.message}</p>}
        <div className="promo-card-bottom">
          <span className="promo-dates">
            <CalendarDays size={15} />
            {formatPromotionDate(promotion.startsAt)} – {formatPromotionDate(promotion.expiresAt)}
          </span>
          <div className="promo-card-actions">
            <button type="button" className="promo-share-button" onClick={() => sharePromotion(promotion)}>
              <MessageCircle size={16} />
              Partager
              <ArrowUpRight size={14} />
            </button>
            <button type="button" className="promo-edit-button" onClick={() => editPromotion(promotion)} aria-label={`Modifier ${promotion.title}`}>
              <Pencil size={16} />
              Modifier
            </button>
            <button
              type="button"
              className={`promo-toggle${promotion.active ? ' is-on' : ''}`}
              role="switch"
              aria-checked={promotion.active}
              aria-label={promotion.active ? `Mettre ${promotion.title} en pause` : `Réactiver ${promotion.title}`}
              onClick={() => togglePromotion(promotion)}
            >
              <span />
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="owner-dashboard owner-promotions-page">
      <header className="owner-topbar">
        <Link className="owner-brand" to="/admin" aria-label="Tableau de bord">
          <BrandLogo className="owner-brand-logo" />
        </Link>
        <div className="owner-page-title">Promotions</div>
        <div className="owner-top-actions">
          <Link className="owner-online" to="/"><span>En ligne</span></Link>
          <Link className="owner-store-link" to="/">
            <span>Voir<br />boutique</span>
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <div className="owner-promo-content">
        {error && <p className="error-message" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        <section className="promo-hero">
          <div className="promo-hero-content">
            <span className="promo-hero-kicker"><Rocket size={15} /> Campagnes &amp; croissance</span>
            <h1>Boostez vos ventes avec des offres exclusives</h1>
            <p>
              Les offres actives s’appliquent aux articles concernés et sont
              visibles dans le catalogue et les demandes WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('promotion-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Plus size={18} />
              Créer une promotion
            </button>
          </div>
          <div className="promo-hero-art" aria-hidden="true">
            <TicketPercent size={82} strokeWidth={1.2} />
            <span>ORTARA<br />OFFRES</span>
          </div>
        </section>

        <section className="promo-section">
          <div className="promo-section-heading">
            <div>
              <span className="promo-heading-dot" />
              <h2>Promotions en cours</h2>
              <p>Offres actives sur la boutique</p>
            </div>
            <span className="promo-count-pill">
              {activePromotions.length} en ligne
            </span>
          </div>
          {loading ? (
            <p className="loading-state">Chargement des promotions…</p>
          ) : activePromotions.length ? (
            <div className="promo-card-list">
              {activePromotions.map(renderPromotionCard)}
            </div>
          ) : (
            <div className="promo-empty">
              <span><Tag size={22} /></span>
              <div>
                <strong>Aucune promotion active</strong>
                <p>Créez une offre pour l’afficher dans le catalogue client.</p>
              </div>
            </div>
          )}
        </section>

        {upcomingPromotions.length > 0 && (
          <section className="promo-section">
            <div className="promo-section-heading">
              <div>
                <span className="promo-heading-dot is-upcoming" />
                <h2>À venir</h2>
                <p>Les campagnes programmées</p>
              </div>
              <span className="promo-count-pill">{upcomingPromotions.length}</span>
            </div>
            <div className="promo-card-list">
              {upcomingPromotions.map(renderPromotionCard)}
            </div>
          </section>
        )}

        <section className="promo-form-card" id="promotion-form">
          <div className="promo-form-heading">
            <span><Plus size={22} /></span>
            <div>
              <h2>{editingId ? 'Modifier la promotion' : 'Créer une offre promotionnelle'}</h2>
              <p>Elle sera visible dans la boutique pendant sa période de validité.</p>
            </div>
          </div>
          <form className="promo-form" onSubmit={handleSubmit}>
            <label>
              Nom de l’offre
              <input
                name="title"
                required
                maxLength="100"
                placeholder="Ex. Offre de saison"
                value={form.title}
                onChange={updateField}
              />
            </label>

            <fieldset className="promo-type-field">
              <legend>Type d’avantage commercial</legend>
              <div className="promo-type-options">
                <button
                  type="button"
                  className={form.discountType === 'percentage' ? 'is-selected' : ''}
                  onClick={() => setForm((current) => ({ ...current, discountType: 'percentage' }))}
                >
                  <CirclePercent size={17} /> Pourcentage %
                </button>
                <button
                  type="button"
                  className={form.discountType === 'fixed' ? 'is-selected' : ''}
                  onClick={() => setForm((current) => ({ ...current, discountType: 'fixed' }))}
                >
                  <Tag size={17} /> Montant fixe
                </button>
              </div>
            </fieldset>

            <div className="promo-form-grid">
              <label>
                Valeur de la réduction
                <span className="promo-input-suffix">
                  <input
                    name="discountValue"
                    type="number"
                    min="1"
                    max={form.discountType === 'percentage' ? '100' : undefined}
                    step="1"
                    required
                    placeholder="10"
                    value={form.discountValue}
                    onChange={updateField}
                  />
                  <b>{form.discountType === 'percentage' ? '%' : 'F CFA'}</b>
                </span>
              </label>
              <label>
                Catégorie concernée
                <select name="category" value={form.category} onChange={updateField}>
                  <option value="">Toute la boutique</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="promo-form-grid">
              <label>
                Date de début
                <input
                  name="startsAt"
                  type="date"
                  required
                  value={form.startsAt}
                  onChange={updateField}
                />
              </label>
              <label>
                Date d’expiration
                <input
                  name="expiresAt"
                  type="date"
                  required
                  min={form.startsAt}
                  value={form.expiresAt}
                  onChange={updateField}
                />
              </label>
            </div>

            <label>
              Message de présentation (WhatsApp)
              <textarea
                name="message"
                maxLength="500"
                rows="3"
                placeholder="Présentez votre offre à vos clientes..."
                value={form.message}
                onChange={updateField}
              />
            </label>

            <div className="promo-form-footnote">
              <Check size={16} />
              Le prix remisé sera calculé automatiquement sur les articles concernés.
            </div>

            <div className="promo-form-actions">
              {editingId && (
                <button className="promo-cancel-button" type="button" onClick={resetForm}>
                  Annuler
                </button>
              )}
              <button className="promo-submit-button" type="submit" disabled={saving}>
                <Rocket size={17} />
                {saving
                  ? 'Enregistrement…'
                  : editingId
                    ? 'Enregistrer les modifications'
                    : 'Activer la promotion'}
              </button>
            </div>
          </form>
        </section>

        <details className="promo-history">
          <summary>
            <span className="promo-history-icon"><Archive size={18} /></span>
            <span className="promo-history-text">
              <strong>Historique des promotions</strong>
              <small>{historyPromotions.length} terminée(s) ou en pause</small>
            </span>
            <Clock3 size={17} />
          </summary>
          {historyPromotions.length ? (
            <div className="promo-card-list">
              {historyPromotions.map(renderPromotionCard)}
            </div>
          ) : (
            <p className="promo-history-empty">Aucune campagne terminée ou en pause.</p>
          )}
        </details>

        <nav className="owner-bottom-nav" aria-label="Navigation patronne">
          <Link to="/admin"><LayoutGrid size={22} strokeWidth={1.8} /><span>Bord</span></Link>
          <Link to="/admin/catalog"><Archive size={22} strokeWidth={1.8} /><span>Catalogue</span></Link>
          <Link className="active" to="/admin/promotions"><Tag size={22} strokeWidth={1.8} /><span>Promos</span></Link>
          <Link to="/admin/settings"><SlidersHorizontal size={22} strokeWidth={1.8} /><span>Réglages</span></Link>
        </nav>
      </div>
    </main>
  )
}

export default AdminPromotions
