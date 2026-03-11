import type { CollectionBeforeChangeHook } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

import { resolveCustomerData } from '../utils/resolve-customer-data.js'

const getCustomerId = (customer: any): null | string => {
  if (!customer) {return null}
  if (typeof customer === 'object') {return customer.id}
  return String(customer)
}

export const createAutoFillFromCustomerHook =
  (pluginConfig: SanitizedInvoicePdfConfig): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    if (!pluginConfig.customerCollection || !pluginConfig.customerFieldMapping) {return data}
    if (!data.client?.customer) {return data}

    const currentId = getCustomerId(data.client.customer)
    const originalId = getCustomerId(originalDoc?.client?.customer)

    // Only auto-fill when customer is newly selected or changed
    if (!currentId || currentId === originalId) {return data}

    const customerDoc = await req.payload.findByID({
      id: currentId,
      collection: pluginConfig.customerCollection as any,
      depth: 0,
      req,
    })

    if (!customerDoc) {return data}

    const resolved = resolveCustomerData(customerDoc as Record<string, any>, pluginConfig.customerFieldMapping)

    // Merge resolved data into client fields
    data.client.name = resolved.name || data.client.name
    if (resolved.email != null) {data.client.email = resolved.email}
    if (resolved.vatNumber != null) {data.client.vatNumber = resolved.vatNumber}
    if (resolved.address) {
      if (!data.client.address) {data.client.address = {}}
      if (resolved.address.street != null) {data.client.address.street = resolved.address.street}
      if (resolved.address.city != null) {data.client.address.city = resolved.address.city}
      if (resolved.address.postalCode != null) {data.client.address.postalCode = resolved.address.postalCode}
      if (resolved.address.country != null) {data.client.address.country = resolved.address.country}
    }

    return data
  }
