import type { EmailTemplateProps } from '../types.js'

export const buildEmailTemplateProps = (args: {
  doc: Record<string, any>
  serverUrl?: string
  shopInfo: Record<string, any>
  type: 'invoice' | 'quote'
  viewUrl?: string
}): EmailTemplateProps => {
  const { doc, serverUrl, shopInfo, type, viewUrl } = args

  return {
    type,
    documentNumber: type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber,
    viewUrl,
    client: {
      name: doc.client?.name || '',
      email: doc.client?.email || undefined,
      address: doc.client?.address
        ? {
            street: doc.client.address.street || undefined,
            city: doc.client.address.city || undefined,
            postalCode: doc.client.address.postalCode || undefined,
            country: doc.client.address.country || undefined,
          }
        : undefined,
    },
    company: {
      name: shopInfo.companyName || '',
      logo: shopInfo.companyLogo?.url
        ? shopInfo.companyLogo.url.startsWith('http')
          ? shopInfo.companyLogo.url
          : serverUrl
            ? `${serverUrl}${shopInfo.companyLogo.url}`
            : shopInfo.companyLogo.url
        : undefined,
      email: shopInfo.email || undefined,
      phone: shopInfo.phone || undefined,
      website: shopInfo.website || undefined,
      address: {
        street: shopInfo.address?.street || undefined,
        city: shopInfo.address?.city || undefined,
        postalCode: shopInfo.address?.postalCode || undefined,
        country: shopInfo.address?.country || undefined,
      },
      legalMentions: shopInfo.legalMentions || undefined,
    },
  }
}
