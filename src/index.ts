import type { Config } from 'payload'
import type { InvoicePdfConfig } from './types.js'
import { sanitizeConfig } from './defaults.js'
import { shopInfoGlobal } from './globals/shop-info.js'
import { createInvoicesCollection } from './collections/invoices.js'
import { createQuotesCollection } from './collections/quotes.js'
import { createGeneratePdfEndpoint } from './endpoints/generate-pdf.js'
import { createConvertToInvoiceEndpoint } from './endpoints/convert-to-invoice.js'
import { createSendEmailEndpoint } from './endpoints/send-email.js'
import { createEmailConfigEndpoint } from './endpoints/email-config.js'
import { createAcceptQuoteEndpoint } from './endpoints/accept-quote.js'
import { createRejectQuoteEndpoint } from './endpoints/reject-quote.js'

export const invoicePdf =
  (pluginOptions: InvoicePdfConfig) =>
  (config: Config): Config => {
    const pluginConfig = sanitizeConfig(pluginOptions)

    // Always add collections/globals for schema consistency
    if (!config.collections) config.collections = []
    if (!config.globals) config.globals = []

    config.globals.push(shopInfoGlobal)

    // Create collections — pass disabled flag so they can omit hooks when disabled
    const invoicesCollection = createInvoicesCollection(pluginConfig)
    const quotesCollection = createQuotesCollection(pluginConfig)

    if (pluginConfig.disabled) {
      // Strip hooks when disabled — keep schema only
      invoicesCollection.hooks = {}
      quotesCollection.hooks = {}
    }

    config.collections.push(invoicesCollection)
    config.collections.push(quotesCollection)

    if (pluginConfig.disabled) return config

    // Endpoints
    if (!config.endpoints) config.endpoints = []
    config.endpoints.push(createGeneratePdfEndpoint(pluginConfig))
    config.endpoints.push(createConvertToInvoiceEndpoint(pluginConfig))
    config.endpoints.push(createSendEmailEndpoint(pluginConfig))
    config.endpoints.push(createEmailConfigEndpoint(pluginConfig))
    config.endpoints.push(createAcceptQuoteEndpoint())
    config.endpoints.push(createRejectQuoteEndpoint())

    // Admin components — tabbed UI + sidebar buttons
    const isSidebarField = (f: any) => 'admin' in f && f.admin?.position === 'sidebar'

    const invoiceCol = config.collections.find((c) => c.slug === 'invoices')
    if (invoiceCol) {
      const sidebarFields = invoiceCol.fields.filter(isSidebarField)
      const contentFields = invoiceCol.fields.filter((f) => !isSidebarField(f))
      invoiceCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Invoice',
              fields: contentFields,
            },
            {
              label: 'PDF History',
              fields: [
                {
                  name: 'pdfHistoryView',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: 'payload-invoicepdf/client#PdfHistory',
                    },
                  },
                },
              ],
            },
          ],
        },
        ...sidebarFields,
        {
          name: 'downloadPdf',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#DownloadPdfButton',
            },
          },
        },
        {
          name: 'generatePdf',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#GeneratePdfButton',
            },
          },
        },
        {
          name: 'sendEmail',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#SendEmailButton',
            },
          },
        },
        {
          name: 'relatedQuote',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#RelatedQuote',
            },
          },
        },
      ]
    }

    const quotesCol = config.collections.find((c) => c.slug === 'quotes')
    if (quotesCol) {
      const sidebarFields = quotesCol.fields.filter(isSidebarField)
      const contentFields = quotesCol.fields.filter((f) => !isSidebarField(f))
      quotesCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Quote',
              fields: contentFields,
            },
            {
              label: 'PDF History',
              fields: [
                {
                  name: 'pdfHistoryView',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: 'payload-invoicepdf/client#PdfHistory',
                    },
                  },
                },
              ],
            },
          ],
        },
        ...sidebarFields,
        {
          name: 'downloadPdf',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#DownloadPdfButton',
            },
          },
        },
        {
          name: 'generatePdf',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#GeneratePdfButton',
            },
          },
        },
        {
          name: 'convertToInvoice',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#ConvertToInvoiceButton',
            },
          },
        },
        {
          name: 'sendEmail',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#SendEmailButton',
            },
          },
        },
        {
          name: 'relatedInvoicesView',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: 'payload-invoicepdf/client#RelatedInvoices',
            },
          },
        },
      ]
    }

    return config
  }

// Re-export types and templates for consumers
export type { InvoicePdfConfig, InvoiceTemplate, InvoiceTemplateProps, EmailTemplate, EmailTemplateProps } from './types.js'
export { builtInEmailTemplates, AttachedPdfEmail, LiveDocumentLinkEmail } from './email-templates/index.js'
export { builtInTemplates, classicTemplate, modernTemplate, minimalTemplate, boldTemplate } from './templates/index.js'
export { ClassicTemplate, ModernTemplate, MinimalTemplate, BoldTemplate } from './templates/index.js'
