const customerProfileKey = 'ortaraCustomerProfile'
const orderHistoryKey = 'ortaraOrderHistory'

export function readCustomerProfile() {
  try {
    const savedProfile = localStorage.getItem(customerProfileKey)
    if (!savedProfile) return { customer: null, warning: '' }

    const customer = JSON.parse(savedProfile)
    if (
      typeof customer.firstName === 'string' &&
      typeof customer.lastName === 'string' &&
      customer.firstName.trim() &&
      customer.lastName.trim()
    ) {
      return {
        customer: {
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
        },
        warning: '',
      }
    }

    return {
      customer: null,
      warning:
        'Votre profil enregistré est incomplet. Il sera demandé à votre prochaine commande.',
    }
  } catch {
    return {
      customer: null,
      warning: 'Ce navigateur ne peut pas lire le profil client enregistré.',
    }
  }
}

export function saveCustomerProfile(customer) {
  try {
    localStorage.setItem(customerProfileKey, JSON.stringify(customer))
    return ''
  } catch {
    return 'Le navigateur ne peut pas mémoriser votre nom sur cet appareil.'
  }
}

function isOrderHistoryEntry(order) {
  return (
    typeof order?.id === 'string' &&
    typeof order.productName === 'string' &&
    Number.isInteger(order.quantity) &&
    order.quantity > 0 &&
    Number.isFinite(order.unitPrice) &&
    Number.isFinite(order.total) &&
    typeof order.createdAt === 'string'
  )
}

export function readOrderHistory() {
  try {
    const savedHistory = localStorage.getItem(orderHistoryKey)
    if (!savedHistory) return { orders: [], warning: '' }

    const history = JSON.parse(savedHistory)
    if (!Array.isArray(history)) {
      return {
        orders: [],
        warning: 'L’historique enregistré est illisible sur cet appareil.',
      }
    }

    const orders = history.filter(isOrderHistoryEntry)
    return {
      orders,
      warning:
        orders.length === history.length
          ? ''
          : 'Certaines demandes de l’historique n’ont pas pu être affichées.',
    }
  } catch {
    return {
      orders: [],
      warning: 'Ce navigateur ne peut pas lire l’historique des commandes.',
    }
  }
}

export function saveOrderHistoryEntry(order) {
  try {
    const savedHistory = localStorage.getItem(orderHistoryKey)
    const history = savedHistory ? JSON.parse(savedHistory) : []
    if (!Array.isArray(history)) {
      return 'L’historique existant est illisible; cette demande n’a pas été enregistrée.'
    }

    localStorage.setItem(
      orderHistoryKey,
      JSON.stringify([order, ...history]),
    )
    return ''
  } catch {
    return 'Cette demande n’a pas pu être enregistrée dans l’historique de cet appareil.'
  }
}
