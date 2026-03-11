import type { InvoicePdfConfig, SanitizedInvoicePdfConfig } from './types.js'
import { builtInEmailTemplates } from './email-templates/index.js'

export const DEFAULTS = {
  invoiceNumberPrefix: 'INV',
  quoteNumberPrefix: 'QT',
  currency: '€',
  defaultTaxRate: 0.2,
  defaultPaymentTerms: 30,
  mediaCollection: 'media',
} as const

export const sanitizeConfig = (config: InvoicePdfConfig): SanitizedInvoicePdfConfig => {
  if (config.customerCollection && !config.customerFieldMapping) {
    throw new Error(
      'payload-invoicepdf: customerFieldMapping is required when customerCollection is configured',
    )
  }

  return {
    productCollection: config.productCollection,
    productFieldMapping: config.productFieldMapping,
    templates: config.templates,
    invoiceNumberPrefix: config.invoiceNumberPrefix ?? DEFAULTS.invoiceNumberPrefix,
    quoteNumberPrefix: config.quoteNumberPrefix ?? DEFAULTS.quoteNumberPrefix,
    currency: config.currency ?? DEFAULTS.currency,
    defaultTaxRate: config.defaultTaxRate ?? DEFAULTS.defaultTaxRate,
    defaultPaymentTerms: config.defaultPaymentTerms ?? DEFAULTS.defaultPaymentTerms,
    mediaCollection: config.mediaCollection ?? DEFAULTS.mediaCollection,
    disabled: config.disabled ?? false,
    customerCollection: config.customerCollection,
    customerFieldMapping: config.customerFieldMapping,
    customerFilterOptions: config.customerFilterOptions,
    inlineClientFields: config.inlineClientFields ?? true,
    emailTemplates: (() => {
      const consumerTemplates = config.emailTemplates ?? []
      const consumerNames = new Set(consumerTemplates.map(t => t.name))
      const filtered = builtInEmailTemplates.filter(t => !consumerNames.has(t.name))
      return [...filtered, ...consumerTemplates]
    })(),
  }
}
