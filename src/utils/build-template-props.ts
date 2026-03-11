import type { InvoiceTemplateProps, ResolvedClientData, SanitizedInvoicePdfConfig } from '../types.js'

export const buildTemplateProps = (args: {
  config: SanitizedInvoicePdfConfig
  doc: Record<string, any>
  logoDataUri?: string
  resolvedClient?: ResolvedClientData
  shopInfo: Record<string, any>
  type: 'invoice' | 'quote'
}): InvoiceTemplateProps => {
  const { type, config, doc, logoDataUri, resolvedClient, shopInfo } = args

  return {
    type,
    documentNumber: type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber,
    dueDate: type === 'invoice' ? doc.dueDate : undefined,
    issueDate: doc.issueDate,
    status: doc.status,
    validUntil: type === 'quote' ? doc.validUntil : undefined,

    company: {
      name: shopInfo.companyName || '',
      address: {
        city: shopInfo.address?.city || '',
        country: shopInfo.address?.country || '',
        postalCode: shopInfo.address?.postalCode || '',
        street: shopInfo.address?.street || '',
      },
      bankName: shopInfo.bankName || undefined,
      bic: shopInfo.bic || undefined,
      email: shopInfo.email || undefined,
      iban: shopInfo.iban || undefined,
      legalMentions: shopInfo.legalMentions || undefined,
      logo: logoDataUri || shopInfo.companyLogo?.url || undefined,
      phone: shopInfo.phone || undefined,
      siret: shopInfo.siret || undefined,
      vatNumber: shopInfo.vatNumber || undefined,
      website: shopInfo.website || undefined,
    },

    client: resolvedClient
      ? {
          name: resolvedClient.name,
          address: resolvedClient.address
            ? {
                city: resolvedClient.address.city || '',
                country: resolvedClient.address.country || '',
                postalCode: resolvedClient.address.postalCode || '',
                street: resolvedClient.address.street || '',
              }
            : undefined,
          email: resolvedClient.email || undefined,
          vatNumber: resolvedClient.vatNumber || undefined,
        }
      : {
          name: doc.client?.name || '',
          address: doc.client?.address
            ? {
                city: doc.client.address.city || '',
                country: doc.client.address.country || '',
                postalCode: doc.client.address.postalCode || '',
                street: doc.client.address.street || '',
              }
            : undefined,
          email: doc.client?.email || undefined,
          vatNumber: doc.client?.vatNumber || undefined,
        },

    items: (doc.items || []).map((item: any) => ({
      description: item.description || '',
      lineTotal: item.lineTotal || 0,
      quantity: item.quantity || 0,
      taxRate: item.taxRate ?? config.defaultTaxRate,
      unitPrice: item.unitPrice || 0,
    })),

    currency: config.currency,
    notes: doc.notes || undefined,
    paymentTerms: type === 'invoice' ? (shopInfo.defaultPaymentTerms ?? config.defaultPaymentTerms) : undefined,
    subtotal: doc.subtotal || 0,
    taxTotal: doc.taxTotal || 0,
    total: doc.total || 0,
  }
}
