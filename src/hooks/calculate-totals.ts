import type { CollectionBeforeChangeHook } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createCalculateTotalsHook =
  (_pluginConfig: SanitizedInvoicePdfConfig): CollectionBeforeChangeHook =>
  async ({ data }) => {
    if (!data.items || !Array.isArray(data.items)) return data

    let subtotal = 0
    let taxTotal = 0

    for (const item of data.items) {
      const quantity = item.quantity || 0
      const unitPrice = item.unitPrice || 0
      const taxRate = item.taxRate ?? 0

      const lineSubtotal = quantity * unitPrice
      const lineTax = lineSubtotal * taxRate

      item.lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100
      subtotal += lineSubtotal
      taxTotal += lineTax
    }

    data.subtotal = Math.round(subtotal * 100) / 100
    data.taxTotal = Math.round(taxTotal * 100) / 100
    data.total = Math.round((subtotal + taxTotal) * 100) / 100

    return data
  }
