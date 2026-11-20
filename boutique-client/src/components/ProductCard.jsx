import {
  ArrowRight,
  CirclePercent,
  MessageCircle,
  PackageOpen,
  Tag,
} from 'lucide-react'
import { useState } from 'react'

const priceFormatter = new Intl.NumberFormat('fr-CI', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

function ProductCard({ product, canContact, onOrder }) {
  const [quantity, setQuantity] = useState(1)
  const [imageFailed, setImageFailed] = useState(false)
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0))
  const outOfStock = stock === 0
  const quantityUnavailable = outOfStock || quantity > stock
  const stockMessage = outOfStock
    ? 'Cet article est en rupture de stock.'
    : quantity > stock
      ? `Il ne reste que ${stock} article${stock > 1 ? 's' : ''} en stock. Il n'est pas possible d'en commander ${quantity}.`
      : ''

  return (
    <article className="store-product-card">
      <div className="store-product-image-wrap">
        {product.image?.url && !imageFailed ? (
          <img
            className="store-product-image"
            src={product.image.url}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="store-product-placeholder">
            <PackageOpen aria-hidden="true" size={35} strokeWidth={1.4} />
            <span>Photo à venir</span>
          </div>
        )}
      </div>

      <div className="store-product-content">
        {product.category && (
          <span className="store-product-tag">
            <Tag aria-hidden="true" size={12} />
            {product.category}
          </span>
        )}
        {product.promotion && (
          <span className="store-promotion-label">
            <CirclePercent aria-hidden="true" size={13} />
            {product.promotion.discountType === 'percentage'
              ? `-${product.promotion.discountValue}%`
              : `-${priceFormatter.format(
                  (Number(product.originalPrice) || 0) -
                    (Number(product.price) || 0),
                )}`}
            {' · '}
            {product.promotion.title}
          </span>
        )}
        <div className="store-product-title-row">
          <h3>{product.name}</h3>
          <span
            className={`store-stock-pill${outOfStock ? ' is-out' : ''}`}
          >
            {outOfStock ? 'Épuisé' : `${stock} disponible${stock > 1 ? 's' : ''}`}
          </span>
        </div>
        {product.description && (
          <p className="store-product-description">{product.description}</p>
        )}
        <div className="store-product-buy-row">
          <span className="store-product-prices">
            {product.promotion && (
              <del>{priceFormatter.format(Number(product.originalPrice) || 0)}</del>
            )}
            <span className="store-product-price">
              {priceFormatter.format(Number(product.price) || 0)}
            </span>
          </span>
          <label
            className="store-quantity-label"
            htmlFor={`quantity-${product._id}`}
          >
            Qté.
            <input
              id={`quantity-${product._id}`}
              className="store-quantity-input"
              type="number"
              min="1"
              max={stock || undefined}
              step="1"
              value={quantity}
              aria-invalid={quantityUnavailable}
              onChange={(event) =>
                setQuantity(
                  Math.max(1, Math.floor(Number(event.target.value) || 1)),
                )
              }
            />
          </label>
        </div>
        {stockMessage && (
          <p className="store-stock-warning" role="alert">
            {stockMessage}
          </p>
        )}
        <button
          className="store-order-button"
          type="button"
          disabled={!canContact || quantityUnavailable}
          onClick={() => onOrder(product, quantity)}
        >
          <MessageCircle aria-hidden="true" size={17} />
          <span>
            {!canContact
              ? 'Contact indisponible'
              : outOfStock
                ? 'Indisponible'
                : quantityUnavailable
                  ? 'Quantité indisponible'
                  : 'Commander sur WhatsApp'}
          </span>
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    </article>
  )
}

export default ProductCard
