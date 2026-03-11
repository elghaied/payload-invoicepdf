import type { CollectionBeforeChangeHook } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createCalculateDueDateHook =
  (pluginConfig: SanitizedInvoicePdfConfig): CollectionBeforeChangeHook =>
  async ({ data, req }) => {
    if (!data.issueDate) {return data}

    const issueDate = new Date(data.issueDate)
    const shopInfo = await req.payload.findGlobal({
      slug: 'shop-info' as any,
      depth: 0,
      req,
    })

    const paymentTerms =
      (shopInfo as any)?.defaultPaymentTerms ?? pluginConfig.defaultPaymentTerms

    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + paymentTerms)

    data.dueDate = dueDate.toISOString()

    return data
  }
