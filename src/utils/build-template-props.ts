import type { InvoiceTemplateProps, SanitizedInvoicePdfConfig, ResolvedClientData } from '../types.js'

export const buildTemplateProps = (args: {
  doc: Record<string, any>
  shopInfo: Record<string, any>
  config: SanitizedInvoicePdfConfig
  type: 'invoice' | 'quote'
  logoDataUri?: string
  resolvedClient?: ResolvedClientData
}): InvoiceTemplateProps => {
  const { doc, shopInfo, config, type, logoDataUri, resolvedClient } = args

  return {
    type,
    documentNumber: type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber,
    status: doc.status,
    issueDate: doc.issueDate,
    dueDate: type === 'invoice' ? doc.dueDate : undefined,
    validUntil: type === 'quote' ? doc.validUntil : undefined,

    company: {
      name: shopInfo.companyName || '',
      logo: logoDataUri || shopInfo.companyLogo?.url || undefined,
      address: {
        street: shopInfo.address?.street || '',
        city: shopInfo.address?.city || '',
        postalCode: shopInfo.address?.postalCode || '',
        country: shopInfo.address?.country || '',
      },
      phone: shopInfo.phone || undefined,
      email: shopInfo.email || undefined,
      website: shopInfo.website || undefined,
      vatNumber: shopInfo.vatNumber || undefined,
      siret: shopInfo.siret || undefined,
      iban: shopInfo.iban || undefined,
      bic: shopInfo.bic || undefined,
      bankName: shopInfo.bankName || undefined,
      legalMentions: shopInfo.legalMentions || undefined,
    },

    client: resolvedClient
      ? {
          name: resolvedClient.name,
          email: resolvedClient.email || undefined,
          address: resolvedClient.address
            ? {
                street: resolvedClient.address.street || '',
                city: resolvedClient.address.city || '',
                postalCode: resolvedClient.address.postalCode || '',
                country: resolvedClient.address.country || '',
              }
            : undefined,
          vatNumber: resolvedClient.vatNumber || undefined,
        }
      : {
          name: doc.client?.name || '',
          email: doc.client?.email || undefined,
          address: doc.client?.address
            ? {
                street: doc.client.address.street || '',
                city: doc.client.address.city || '',
                postalCode: doc.client.address.postalCode || '',
                country: doc.client.address.country || '',
              }
            : undefined,
          vatNumber: doc.client?.vatNumber || undefined,
        },

    items: (doc.items || []).map((item: any) => ({
      description: item.description || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      taxRate: item.taxRate ?? config.defaultTaxRate,
      lineTotal: item.lineTotal || 0,
    })),

    subtotal: doc.subtotal || 0,
    taxTotal: doc.taxTotal || 0,
    total: doc.total || 0,
    currency: config.currency,
    notes: doc.notes || undefined,
    paymentTerms: type === 'invoice' ? (shopInfo.defaultPaymentTerms ?? config.defaultPaymentTerms) : undefined,
  }
}
