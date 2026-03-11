import type { CollectionBeforeChangeHook } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

const getProductId = (product: any): null | string => {
  if (!product) {return null}
  if (typeof product === 'object') {return product.id}
  return String(product)
}

export const createAutoFillFromProductHook =
  (pluginConfig: SanitizedInvoicePdfConfig): CollectionBeforeChangeHook =>
  async ({ data, operation, originalDoc, req }) => {
    if (!data.items || !Array.isArray(data.items)) {return data}

    const { productCollection, productFieldMapping } = pluginConfig

    // Build a map of original items by their array row ID to detect product changes
    const originalItemMap = new Map<string, Record<string, any>>()
    if (operation === 'update' && originalDoc?.items) {
      for (const item of originalDoc.items) {
        if (item.id) {originalItemMap.set(item.id, item)}
      }
    }

    // Find items where the product was just selected or changed
    const itemsToFill: Array<{ item: Record<string, any>; productId: string }> = []

    for (const item of data.items) {
      const productId = getProductId(item.product)
      if (!productId) {continue}

      const originalItem = item.id ? originalItemMap.get(item.id) : undefined
      const originalProductId = getProductId(originalItem?.product)

      // Only auto-fill when product is newly selected or changed
      if (productId === originalProductId) {continue}

      itemsToFill.push({ item, productId })
    }

    if (itemsToFill.length === 0) {return data}

    // Fetch all needed products in one query
    const uniqueIds = [...new Set(itemsToFill.map((i) => i.productId))]
    const { docs: products } = await req.payload.find({
      collection: productCollection as any,
      depth: 0,
      limit: uniqueIds.length,
      req,
      where: { id: { in: uniqueIds } },
    })

    const productMap = new Map(products.map((p: any) => [String(p.id), p]))

    // Auto-fill item fields using the configured field mapping
    for (const { item, productId } of itemsToFill) {
      const product = productMap.get(productId)
      if (!product) {continue}

      const nameValue = product[productFieldMapping.name]
      if (nameValue != null) {
        item.description = String(nameValue)
      }

      const priceValue = product[productFieldMapping.price]
      if (priceValue != null) {
        item.unitPrice = Number(priceValue)
      }
    }

    return data
  }
