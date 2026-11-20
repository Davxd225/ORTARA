import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  ExternalLink,
  Eye,
  LayoutGrid,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Upload,
  Warehouse,
  X,
} from 'lucide-react'
import { api, getErrorMessage } from '../api.js'
import BrandLogo from '../components/BrandLogo.jsx'

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

const stockFilters = [
  { id: 'all', label: 'Tous' },
  { id: 'available', label: 'En stock' },
  { id: 'low', label: 'Stock faible / rupture' },
]

function getStockState(product) {
  const stock = Math.max(0, Number(product.stock) || 0)
  if (stock === 0) return { label: 'Rupture (0 stock)', type: 'out' }
  if (stock <= 3) return { label: `Stock : ${stock} (faible)`, type: 'low' }
  return { label: `Stock : ${stock}`, type: 'available' }
}

function AdminCatalog() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [formMode, setFormMode] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewProduct, setPreviewProduct] = useState(null)
  const [deletingProductId, setDeletingProductId] = useState('')
  const [deletingCategory, setDeletingCategory] = useState('')

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

  const categories = useMemo(
    () => [
      ...new Set(products.map((product) => product.category?.trim()).filter(Boolean)),
    ],
    [products],
  )

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')
    return products.filter((product) => {
      const stock = Math.max(0, Number(product.stock) || 0)
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'available' && stock > 3) ||
        (stockFilter === 'low' && stock <= 3)
      const matchesCategory =
        !categoryFilter || product.category?.trim() === categoryFilter
      const searchableText = [
        product.name,
        product.category,
        product.description,
        product._id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr')
      return (
        matchesStock &&
        matchesCategory &&
        searchableText.includes(normalizedQuery)
      )
    })
  }, [categoryFilter, products, query, stockFilter])

  function closeForm() {
    setFormMode('')
    setForm(emptyForm)
    setImageFile(null)
    setEditingId('')
  }

  function openNewForm() {
    setForm(emptyForm)
    setImageFile(null)
    setEditingId('')
    setFormMode('product')
    setError('')
  }

  function openEditForm(product, mode = 'product') {
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: product.category || '',
      stock: String(product.stock ?? 0),
      imageUrl: product.image?.url || '',
    })
    setImageFile(null)
    setEditingId(product._id)
    setFormMode(mode)
    setError('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (formMode !== 'stock' && !editingId && !form.category.trim()) {
      setError('Indiquez une catégorie pour ajouter cet article.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (formMode === 'stock') {
        await api.put(`/products/${editingId}`, { stock: Number(form.stock) })
        setNotice('Stock mis à jour.')
      } else {
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
        if (editingId) {
          await api.put(`/products/${editingId}`, requestData)
          setNotice('Article modifié.')
        } else {
          await api.post('/products', requestData)
          setNotice('Article ajouté au catalogue.')
        }
      }
      closeForm()
      setProducts(await fetchProducts())
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

  async function deleteProduct(product) {
    if (
      deletingProductId ||
      deletingCategory ||
      !window.confirm(
        `Supprimer « ${product.name} » du catalogue ? Cette action est définitive.`,
      )
    ) {
      return
    }

    setDeletingProductId(product._id)
    setError('')
    setNotice('')
    try {
      await api.delete(`/products/${product._id}`)
      const remainingProducts = products.filter(
        (item) => item._id !== product._id,
      )
      setProducts(remainingProducts)
      if (
        categoryFilter &&
        !remainingProducts.some(
          (item) => item.category?.trim() === categoryFilter,
        )
      ) {
        setCategoryFilter('')
      }
      if (previewProduct?._id === product._id) setPreviewProduct(null)
      setNotice(`« ${product.name} » a été supprimé du catalogue.`)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('adminToken')
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(requestError))
    } finally {
      setDeletingProductId('')
    }
  }

  async function deleteCategory(category, itemCount) {
    if (
      deletingProductId ||
      deletingCategory ||
      !window.confirm(
        `Retirer le rayon « ${category} » ? Les ${itemCount} article(s) seront conservés sans catégorie. Les promotions liées à ce rayon ne s’appliqueront plus.`,
      )
    ) {
      return
    }

    setDeletingCategory(category)
    setError('')
    setNotice('')
    try {
      const { data } = await api.delete('/products/categories', {
        data: { category },
      })
      setProducts((current) =>
        current.map((product) =>
          product.category?.trim() === category
            ? { ...product, category: '' }
            : product,
        ),
      )
      setCategoryFilter('')
      setNotice(
        `Rayon « ${category} » retiré. ${data.updatedCount} article(s) conservé(s) sans catégorie.`,
      )
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('adminToken')
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(requestError))
    } finally {
      setDeletingCategory('')
    }
  }

  return (
    <main className="owner-dashboard owner-catalog-page">
      <header className="owner-topbar">
        <Link className="owner-brand" to="/admin" aria-label="Tableau de bord">
          <BrandLogo className="owner-brand-logo" />
        </Link>
        <div className="owner-page-title">Catalogue</div>
        <div className="owner-top-actions">
          <Link className="owner-online" to="/">
            <span>En ligne</span>
          </Link>
          <Link className="owner-store-link" to="/">
            <span>Voir<br />boutique</span>
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <div className="owner-catalog-content">
        <div className="owner-catalog-heading">
          <div>
            <p className="owner-catalog-eyebrow">COLLECTION &amp; ATELIER</p>
            <h1>Gestion du Catalogue</h1>
          </div>
          <button className="owner-new-product" type="button" onClick={openNewForm}>
            <Plus size={21} />
            <span>Nouvel article</span>
          </button>
        </div>

        {error && <p className="error-message" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        <div className="owner-catalog-search-row">
          <label className="owner-catalog-search">
            <Search size={22} />
            <input
              type="search"
              placeholder="Rechercher un article, référence..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Rechercher dans le catalogue"
            />
          </label>
          <button
            className={`owner-filter-toggle${stockFilter !== 'all' || categoryFilter || query ? ' is-active' : ''}`}
            type="button"
            aria-label="Réinitialiser les filtres"
            title="Réinitialiser les filtres"
            onClick={() => {
              setQuery('')
              setStockFilter('all')
              setCategoryFilter('')
            }}
          >
            <SlidersHorizontal size={23} />
          </button>
        </div>

        <div className="owner-catalog-filters">
          {stockFilters.map((filter) => {
            const count = products.filter((product) => {
              const stock = Math.max(0, Number(product.stock) || 0)
              return (
                filter.id === 'all' ||
                (filter.id === 'available' && stock > 3) ||
                (filter.id === 'low' && stock <= 3)
              )
            }).length
            return (
              <button
                key={filter.id}
                className={stockFilter === filter.id ? 'is-active' : ''}
                type="button"
                onClick={() => setStockFilter(filter.id)}
              >
                {filter.label} ({count})
              </button>
            )
          })}
        </div>

        <section className="owner-category-section" aria-label="Catégories">
          <div className="owner-category-heading">
            <h2>Rayons de la boutique</h2>
            {categories.length > 2 && <span>Glisser pour voir</span>}
          </div>
          <div className="owner-category-list">
            <button
              className={!categoryFilter ? 'is-active' : ''}
              type="button"
              onClick={() => setCategoryFilter('')}
            >
              <span className="owner-category-image owner-category-all">
                <LayoutGrid size={24} />
              </span>
              <span>Toutes ({products.length})</span>
            </button>
            {categories.map((category) => {
              const items = products.filter(
                (product) => product.category?.trim() === category,
              )
              return (
                <div className="owner-category-entry" key={category}>
                  <button
                    className={`owner-category-select${categoryFilter === category ? ' is-active' : ''}`}
                    type="button"
                    onClick={() =>
                      setCategoryFilter((current) =>
                        current === category ? '' : category,
                      )
                    }
                  >
                    <span className="owner-category-image">
                      {items[0]?.image?.url ? (
                        <img src={items[0].image.url} alt="" loading="lazy" />
                      ) : (
                        <Tag size={23} />
                      )}
                    </span>
                    <span>{category} ({items.length})</span>
                  </button>
                  <button
                    className="owner-category-delete"
                    type="button"
                    title={`Supprimer le rayon ${category}`}
                    aria-label={`Supprimer la catégorie ${category}`}
                    disabled={Boolean(deletingProductId || deletingCategory)}
                    onClick={() => deleteCategory(category, items.length)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {loading ? (
          <p className="loading-state">Chargement du catalogue…</p>
        ) : visibleProducts.length ? (
          <section className="owner-catalog-list" aria-label="Articles du catalogue">
            {visibleProducts.map((product) => {
              const stock = getStockState(product)
              const reference = product._id?.slice(-6).toUpperCase()
              return (
                <article className="owner-catalog-product" key={product._id}>
                  <div className="owner-catalog-product-main">
                    <div className="owner-catalog-product-image">
                      {product.image?.url ? (
                        <img src={product.image.url} alt={product.name} loading="lazy" />
                      ) : (
                        <PackageOpen size={28} />
                      )}
                      {reference && <span>#{reference}</span>}
                    </div>
                    <div className="owner-catalog-product-details">
                      <span className="owner-product-category">
                        {product.category || 'Sans catégorie'}
                      </span>
                      <h2>{product.name}</h2>
                      <div className="owner-product-price-row">
                        <strong>{priceFormatter.format(Number(product.price) || 0)}</strong>
                        <span className={`owner-stock-badge is-${stock.type}`}>
                          <i />
                          {stock.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  {stock.type === 'out' && (
                    <p className="owner-product-out-note">
                      Ventes suspendues dans la boutique
                    </p>
                  )}
                  <div className="owner-product-actions">
                    <button
                      type="button"
                      className="owner-product-preview"
                      onClick={() => setPreviewProduct(product)}
                    >
                      <Eye size={18} />
                      Aperçu
                    </button>
                    <span className="owner-product-action-spacer" />
                    <button
                      type="button"
                      className="owner-product-adjust"
                      onClick={() => openEditForm(product, 'stock')}
                    >
                      <SlidersHorizontal size={17} />
                      Ajuster
                    </button>
                    <button
                      type="button"
                      className="owner-product-edit"
                      onClick={() => openEditForm(product)}
                    >
                      <Pencil size={17} />
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="owner-product-delete"
                      title={`Supprimer ${product.name}`}
                      aria-label={`Supprimer ${product.name}`}
                      disabled={Boolean(deletingProductId || deletingCategory)}
                      onClick={() => deleteProduct(product)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <div className="owner-catalog-empty">
            <PackageOpen size={32} />
            <strong>{products.length ? 'Aucun résultat' : 'Le catalogue est vide'}</strong>
            <span>
              {products.length
                ? 'Modifiez la recherche ou les filtres sélectionnés.'
                : 'Ajoutez un article pour le faire apparaître ici.'}
            </span>
          </div>
        )}
      </div>

      {formMode && (
        <div className="owner-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm()
        }}>
          <section className="owner-modal" role="dialog" aria-modal="true" aria-labelledby="owner-form-title">
            <div className="owner-modal-heading">
              <h2 id="owner-form-title">
                {formMode === 'stock'
                  ? 'Ajuster le stock'
                  : editingId
                    ? 'Modifier l’article'
                    : 'Nouvel article'}
              </h2>
              <button type="button" onClick={closeForm} aria-label="Fermer"><X size={21} /></button>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            <form className="form-stack" onSubmit={handleSubmit}>
              {formMode === 'stock' ? (
                <label className="form-field">
                  Quantité en stock
                  <input
                    autoFocus
                    className="form-control"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.stock}
                    onChange={updateField}
                  />
                </label>
              ) : (
                <>
                  <label className="form-field">Nom de l’article
                    <input className="form-control" name="name" required value={form.name} onChange={updateField} />
                  </label>
                  <label className="form-field">Description
                    <textarea className="form-control textarea" name="description" value={form.description} onChange={updateField} />
                  </label>
                  <div className="owner-form-grid">
                    <label className="form-field">Prix (FCFA)
                      <input className="form-control" name="price" type="number" min="0" step="1" required value={form.price} onChange={updateField} />
                    </label>
                    <label className="form-field">Stock
                      <input className="form-control" name="stock" type="number" min="0" step="1" required value={form.stock} onChange={updateField} />
                    </label>
                  </div>
                  <label className="form-field">Catégorie
                    <input
                      className="form-control"
                      name="category"
                      required={!editingId}
                      placeholder="Ex. Robes"
                      value={form.category}
                      onChange={updateField}
                    />
                  </label>
                  <label className="form-field">
                    Photo de l’article
                    <span className="owner-file-picker">
                      <span className="owner-file-picker-icon"><Upload size={19} /></span>
                      <span className="owner-file-picker-copy">
                        <strong title={imageFile?.name}>
                          {imageFile?.name || 'Choisir une image'}
                        </strong>
                        <small>{imageFile ? 'Image prête à être ajoutée' : 'JPG, PNG ou WEBP'}</small>
                      </span>
                      <span className="owner-file-picker-action">
                        {imageFile ? 'Modifier' : 'Parcourir'}
                      </span>
                      <input
                        className="owner-file-picker-input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                      />
                    </span>
                  </label>
                  {!imageFile && (
                    <label className="form-field">URL de l’image
                      <input className="form-control" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={updateField} />
                    </label>
                  )}
                </>
              )}
              <div className="form-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving ? 'Enregistrement…' : formMode === 'stock' ? 'Enregistrer le stock' : 'Enregistrer'}
                </button>
                <button className="button-secondary" type="button" onClick={closeForm}>Annuler</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {previewProduct && (
        <div className="owner-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreviewProduct(null)
        }}>
          <section className="owner-preview-modal" role="dialog" aria-modal="true" aria-labelledby="owner-preview-title">
            <button className="owner-preview-close" type="button" onClick={() => setPreviewProduct(null)} aria-label="Fermer"><X size={21} /></button>
            {previewProduct.image?.url ? (
              <img src={previewProduct.image.url} alt={previewProduct.name} />
            ) : (
              <div className="owner-preview-placeholder"><PackageOpen size={38} /></div>
            )}
            <div className="owner-preview-details">
              <span>{previewProduct.category || 'Sans catégorie'}</span>
              <h2 id="owner-preview-title">{previewProduct.name}</h2>
              {previewProduct.description && <p>{previewProduct.description}</p>}
              <strong>{priceFormatter.format(Number(previewProduct.price) || 0)}</strong>
              <small>Stock disponible : {previewProduct.stock ?? 0}</small>
            </div>
          </section>
        </div>
      )}

      <nav className="owner-bottom-nav" aria-label="Navigation patronne">
        <Link to="/admin"><LayoutGrid size={22} strokeWidth={1.8} /><span>Bord</span></Link>
        <Link className="active" to="/admin/catalog"><Archive size={22} strokeWidth={1.8} /><span>Catalogue</span></Link>
        <Link to="/admin/promotions"><Tag size={22} strokeWidth={1.8} /><span>Promos</span></Link>
        <Link to="/admin/settings"><Warehouse size={22} strokeWidth={1.8} /><span>Réglages</span></Link>
      </nav>
    </main>
  )
}

export default AdminCatalog
