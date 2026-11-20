export function applyBestPromotion(product, promotions) {
  const price = Math.max(0, Number(product.price) || 0)
  let bestPromotion = null
  let bestDiscount = 0

  promotions.forEach((promotion) => {
    const category = promotion.category?.trim()
    if (category && category !== product.category?.trim()) return

    const value = Number(promotion.discountValue) || 0
    const discount = Math.min(
      price,
      promotion.discountType === 'percentage'
        ? Math.round((price * value) / 100)
        : value,
    )
    if (discount > bestDiscount) {
      bestPromotion = promotion
      bestDiscount = discount
    }
  })

  if (!bestPromotion) return product
  return {
    ...product,
    originalPrice: price,
    price: price - bestDiscount,
    promotion: bestPromotion,
  }
}
