import type { ResolvedClientData, SanitizedInvoicePdfConfig } from '../types.js'

/**
 * Traverse an object by dot-separated path (e.g., 'address.street').
 * Returns undefined if any segment is missing.
 */
export const getByPath = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, segment) => current?.[segment], obj)
}

/**
 * Resolve the client name from a customer document using the field mapping.
 * Supports a single field name or an array of field names concatenated with space.
 */
const resolveCustomerName = (
  customerDoc: Record<string, any>,
  nameMapping: string | string[],
): string => {
  if (Array.isArray(nameMapping)) {
    return nameMapping
      .map((field) => getByPath(customerDoc, field))
      .filter((v) => v != null && String(v).trim() !== '')
      .map(String)
      .join(' ')
  }
  const value = getByPath(customerDoc, nameMapping)
  return value != null ? String(value) : ''
}

/**
 * Resolve a full client data object from a customer document using the configured field mapping.
 * Returns the shape expected by the invoice/quote client group and PDF templates.
 */
export const resolveCustomerData = (
  customerDoc: Record<string, any>,
  fieldMapping: NonNullable<SanitizedInvoicePdfConfig['customerFieldMapping']>,
): ResolvedClientData => {
  const result: ResolvedClientData = {
    name: resolveCustomerName(customerDoc, fieldMapping.name),
  }

  if (fieldMapping.email) {
    const email = getByPath(customerDoc, fieldMapping.email)
    if (email != null) {result.email = String(email)}
  }

  if (fieldMapping.vatNumber) {
    const vatNumber = getByPath(customerDoc, fieldMapping.vatNumber)
    if (vatNumber != null) {result.vatNumber = String(vatNumber)}
  }

  if (fieldMapping.address) {
    const address: { city?: string; country?: string; postalCode?: string; street?: string } = {}
    const addrMapping = fieldMapping.address
    if (addrMapping.street) {
      const v = getByPath(customerDoc, addrMapping.street)
      if (v != null) {address.street = String(v)}
    }
    if (addrMapping.city) {
      const v = getByPath(customerDoc, addrMapping.city)
      if (v != null) {address.city = String(v)}
    }
    if (addrMapping.postalCode) {
      const v = getByPath(customerDoc, addrMapping.postalCode)
      if (v != null) {address.postalCode = String(v)}
    }
    if (addrMapping.country) {
      const v = getByPath(customerDoc, addrMapping.country)
      if (v != null) {address.country = String(v)}
    }
    if (Object.keys(address).length > 0) {result.address = address}
  }

  return result
}
