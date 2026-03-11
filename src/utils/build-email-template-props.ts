import type { EmailTemplateProps } from '../types.js'

export const buildEmailTemplateProps = (args: {
  doc: Record<string, any>
  serverUrl?: string
  shopInfo: Record<string, any>
  type: 'invoice' | 'quote'
  viewUrl?: string
}): EmailTemplateProps => {
  const { type, doc, serverUrl, shopInfo, viewUrl } = args

  return {
    type,
    client: {
      name: doc.client?.name || '',
      address: doc.client?.address
        ? {
            city: doc.client.address.city || undefined,
            country: doc.client.address.country || undefined,
            postalCode: doc.client.address.postalCode || undefined,
            street: doc.client.address.street || undefined,
          }
        : undefined,
      email: doc.client?.email || undefined,
    },
    company: {
      name: shopInfo.companyName || '',
      address: {
        city: shopInfo.address?.city || undefined,
        country: shopInfo.address?.country || undefined,
        postalCode: shopInfo.address?.postalCode || undefined,
        street: shopInfo.address?.street || undefined,
      },
      email: shopInfo.email || undefined,
      legalMentions: shopInfo.legalMentions || undefined,
      logo: shopInfo.companyLogo?.url
        ? shopInfo.companyLogo.url.startsWith('http')
          ? shopInfo.companyLogo.url
          : serverUrl
            ? `${serverUrl}${shopInfo.companyLogo.url}`
            : shopInfo.companyLogo.url
        : undefined,
      phone: shopInfo.phone || undefined,
      website: shopInfo.website || undefined,
    },
    documentNumber: type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber,
    viewUrl,
  }
}
