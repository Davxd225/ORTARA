import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  CheckCircle2,
  Clock3,
  ExternalLink,
  AtSign,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Music2,
  Save,
  Share2,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import { api, getErrorMessage } from '../api.js'
import BrandLogo from '../components/BrandLogo.jsx'
import {
  DEFAULT_STORE_SETTINGS,
  splitWhatsAppPhone,
  useStoreSettings,
} from '../storeSettings.js'

function AdminSettings() {
  const navigate = useNavigate()
  const { setSettings: setPublicSettings } = useStoreSettings()
  const defaultPhoneParts = splitWhatsAppPhone(DEFAULT_STORE_SETTINGS.whatsappPhone)
  const [phoneCountryCode, setPhoneCountryCode] = useState(defaultPhoneParts.countryCode)
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneParts.phoneNumber)
  const [form, setForm] = useState(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/settings')
      .then(({ data }) => {
        if (!active) return
        const nextSettings = { ...DEFAULT_STORE_SETTINGS, ...data }
        const phoneParts = splitWhatsAppPhone(nextSettings.whatsappPhone)
        nextSettings.whatsappPhone = phoneParts.phoneNumber
          ? `+${phoneParts.countryCode} ${phoneParts.phoneNumber}`
          : `+${phoneParts.countryCode}`
        setForm(nextSettings)
        setPhoneCountryCode(phoneParts.countryCode)
        setPhoneNumber(phoneParts.phoneNumber)
        setPublicSettings(nextSettings)
        setUpdatedAt(data.updatedAt || '')
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
  }, [navigate, setPublicSettings])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setNotice('')
    setError('')
  }

  function updatePhone(countryCode, nationalNumber) {
    const digits = nationalNumber.replace(/\D/g, '')
    const cleanCountryCode = countryCode.replace(/\D/g, '').slice(0, 4)
    setPhoneCountryCode(cleanCountryCode)
    setPhoneNumber(digits)
    setForm((current) => ({
      ...current,
      whatsappPhone: cleanCountryCode
        ? `+${cleanCountryCode} ${digits}`.trim()
        : digits,
    }))
    setNotice('')
    setError('')
  }

  async function saveSettings(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const { data } = await api.put('/settings', form)
      const nextSettings = { ...DEFAULT_STORE_SETTINGS, ...data }
      setForm(nextSettings)
      setPublicSettings(nextSettings)
      setUpdatedAt(data.updatedAt || '')
      setNotice('Modifications enregistrées et appliquées à la boutique.')
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

  function testWhatsApp() {
    const phone = form.whatsappPhone.replace(/\D/g, '')
    if (!phone) {
      setError('Ajoutez un numéro WhatsApp avant de tester le lien.')
      return
    }

    const message =
      form.whatsappMessage.trim() || DEFAULT_STORE_SETTINGS.whatsappMessage
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <main className="owner-dashboard owner-settings-page">
      <header className="owner-topbar">
        <Link className="owner-brand" to="/admin" aria-label="Tableau de bord">
          <BrandLogo className="owner-brand-logo" />
        </Link>
        <div className="owner-page-title">Réglages</div>
        <Link className="owner-store-link" to="/" aria-label="Voir la boutique">
          <span>Voir<br />boutique</span>
          <ExternalLink size={16} strokeWidth={1.8} />
        </Link>
      </header>

      <div className="owner-settings-content">
        <section className="owner-settings-intro">
          <span className="owner-settings-eyebrow">
            <CheckCircle2 size={15} />
            CONFIGURATION DE LA BOUTIQUE
          </span>
          <h1>Coordonnées &amp; réseaux</h1>
          <p>
            Gérez les informations affichées à vos clientes et le contact
            utilisé pour les commandes.
          </p>
        </section>

        {error && <p className="owner-settings-message is-error" role="alert">{error}</p>}
        {notice && <p className="owner-settings-message is-success" role="status">{notice}</p>}

        <form className="owner-settings-form" onSubmit={saveSettings}>
          <section className="owner-settings-card">
            <div className="owner-settings-card-heading">
              <span className="owner-settings-icon is-whatsapp"><MessageCircle size={21} /></span>
              <div>
                <h2>WhatsApp Commande</h2>
                <p>Le numéro qui reçoit les demandes de vos clientes.</p>
              </div>
              <span className="owner-settings-recommended">Recommandé</span>
            </div>

            <div className="owner-settings-phone-row">
              <label className="owner-settings-field owner-settings-country">
                Indicatif
                <input
                  autoComplete="tel-country-code"
                  inputMode="numeric"
                  maxLength={5}
                  type="tel"
                  value={`+${phoneCountryCode}`}
                  onChange={(event) =>
                    updatePhone(event.target.value, phoneNumber)
                  }
                />
              </label>
              <label className="owner-settings-field">
                Numéro WhatsApp Business
                <input
                  autoComplete="tel-national"
                  inputMode="tel"
                  type="tel"
                  placeholder="07 00 00 00 00"
                  value={phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ')}
                  onChange={(event) =>
                    updatePhone(phoneCountryCode, event.target.value)
                  }
                />
              </label>
            </div>
            <small className="owner-settings-hint">
              Les clientes commanderont directement à ce numéro.
            </small>

            <label className="owner-settings-field">
              Message d’accueil pré-rempli
              <textarea
                maxLength={1000}
                name="whatsappMessage"
                rows={3}
                value={form.whatsappMessage}
                onChange={updateField}
              />
              <small>
                Ce texte précède les détails de l’article, du prix et de la
                commande.
              </small>
            </label>

            <div className="owner-settings-test">
              <span><MessageCircle size={17} /> Vérifier l’expérience cliente</span>
              <button type="button" onClick={testWhatsApp}>
                Tester le lien <ExternalLink size={15} />
              </button>
            </div>
          </section>

          <section className="owner-settings-card">
            <div className="owner-settings-card-heading">
              <span className="owner-settings-icon is-social"><Share2 size={21} /></span>
              <div>
                <h2>Réseaux sociaux</h2>
                <p>Les liens apparaissent dans le pied de page de la boutique.</p>
              </div>
            </div>

            <label className="owner-settings-field">
              <span className="owner-settings-label-icon"><AtSign size={17} /> Page Instagram</span>
              <input
                autoComplete="url"
                name="instagram"
                placeholder="@votrecompte ou lien Instagram"
                value={form.instagram}
                onChange={updateField}
              />
            </label>

            <label className="owner-settings-field">
              <span className="owner-settings-label-icon"><Music2 size={17} /> Compte TikTok</span>
              <input
                autoComplete="url"
                name="tiktok"
                placeholder="@votrecompte ou lien TikTok"
                value={form.tiktok}
                onChange={updateField}
              />
            </label>

            <label className="owner-settings-field">
              <span className="owner-settings-label-icon"><Share2 size={17} /> Lien Facebook</span>
              <input
                autoComplete="url"
                name="facebook"
                placeholder="@votrepage ou lien Facebook"
                value={form.facebook}
                onChange={updateField}
              />
            </label>
          </section>

          <section className="owner-settings-card">
            <div className="owner-settings-card-heading">
              <span className="owner-settings-icon is-workshop"><MapPin size={21} /></span>
              <div>
                <h2>Atelier &amp; horaires</h2>
                <p>Ces renseignements s’affichent dans le pied de page client.</p>
              </div>
            </div>

            <label className="owner-settings-field">
              <span className="owner-settings-label-icon"><MapPin size={17} /> Adresse / quartier</span>
              <input
                autoComplete="street-address"
                name="address"
                placeholder="Adresse ou quartier de l’atelier"
                value={form.address}
                onChange={updateField}
              />
            </label>

            <label className="owner-settings-field">
              <span className="owner-settings-label-icon"><Clock3 size={17} /> Disponibilité du service client</span>
              <input
                name="serviceHours"
                placeholder="Ex. Lun. au sam. : 09h00 – 19h30"
                value={form.serviceHours}
                onChange={updateField}
              />
            </label>

            <p className="owner-settings-privacy">
              <CheckCircle2 size={16} />
              Les informations sont enregistrées dans la base de la boutique et
              mises à jour dès l’enregistrement.
            </p>
          </section>

          <div className="owner-settings-actions">
            <button type="submit" disabled={saving || loading}>
              <Save size={18} />
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
            <p>
              {updatedAt
                ? `Dernière mise à jour : ${new Intl.DateTimeFormat('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(updatedAt))}`
                : 'Les modifications seront visibles dans la boutique après l’enregistrement.'}
            </p>
          </div>
        </form>
      </div>

      <nav className="owner-bottom-nav" aria-label="Navigation patronne">
        <Link to="/admin"><LayoutGrid size={22} strokeWidth={1.8} /><span>Bord</span></Link>
        <Link to="/admin/catalog"><Archive size={22} strokeWidth={1.8} /><span>Catalogue</span></Link>
        <Link to="/admin/promotions"><Tag size={22} strokeWidth={1.8} /><span>Promos</span></Link>
        <Link className="active" to="/admin/settings"><SlidersHorizontal size={22} strokeWidth={1.8} /><span>Réglages</span></Link>
      </nav>
    </main>
  )
}

export default AdminSettings
