import type { InvoicePdfConfig, SanitizedInvoicePdfConfig } from './types.js'

import { builtInEmailTemplates } from './email-templates/index.js'

export const DEFAULTS = {
  currency: '€',
  defaultPaymentTerms: 30,
  defaultTaxRate: 0.2,
  invoiceNumberPrefix: 'INV',
  mediaCollection: 'media',
  quoteNumberPrefix: 'QT',
} as const

export const sanitizeConfig = (config: InvoicePdfConfig): SanitizedInvoicePdfConfig => {
  if (config.customerCollection && !config.customerFieldMapping) {
    throw new Error(
      'payload-invoicepdf: customerFieldMapping is required when customerCollection is configured',
    )
  }

  return {
    currency: config.currency ?? DEFAULTS.currency,
    customerCollection: config.customerCollection,
    customerFieldMapping: config.customerFieldMapping,
    customerFilterOptions: config.customerFilterOptions,
    defaultPaymentTerms: config.defaultPaymentTerms ?? DEFAULTS.defaultPaymentTerms,
    defaultTaxRate: config.defaultTaxRate ?? DEFAULTS.defaultTaxRate,
    disabled: config.disabled ?? false,
    emailTemplates: (() => {
      const consumerTemplates = config.emailTemplates ?? []
      const consumerNames = new Set(consumerTemplates.map(t => t.name))
      const filtered = builtInEmailTemplates.filter(t => !consumerNames.has(t.name))
      return [...filtered, ...consumerTemplates]
    })(),
    inlineClientFields: config.inlineClientFields ?? true,
    invoiceNumberPrefix: config.invoiceNumberPrefix ?? DEFAULTS.invoiceNumberPrefix,
    mediaCollection: config.mediaCollection ?? DEFAULTS.mediaCollection,
    productCollection: config.productCollection,
    productFieldMapping: config.productFieldMapping,
    quoteNumberPrefix: config.quoteNumberPrefix ?? DEFAULTS.quoteNumberPrefix,
    templates: config.templates,
  }
}
