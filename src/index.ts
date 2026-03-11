import type { Config } from 'payload'

import type { InvoicePdfConfig } from './types.js'

import { createInvoicesCollection } from './collections/invoices.js'
import { createQuotesCollection } from './collections/quotes.js'
import { sanitizeConfig } from './defaults.js'
import { createAcceptQuoteEndpoint } from './endpoints/accept-quote.js'
import { createConvertToInvoiceEndpoint } from './endpoints/convert-to-invoice.js'
import { createEmailConfigEndpoint } from './endpoints/email-config.js'
import { createGeneratePdfEndpoint } from './endpoints/generate-pdf.js'
import { createRejectQuoteEndpoint } from './endpoints/reject-quote.js'
import { createSendEmailEndpoint } from './endpoints/send-email.js'
import { shopInfoGlobal } from './globals/shop-info.js'

export const invoicePdf =
  (pluginOptions: InvoicePdfConfig) =>
  (config: Config): Config => {
    const pluginConfig = sanitizeConfig(pluginOptions)

    // Always add collections/globals for schema consistency
    if (!config.collections) {config.collections = []}
    if (!config.globals) {config.globals = []}

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

    if (pluginConfig.disabled) {return config}

    // Endpoints
    if (!config.endpoints) {config.endpoints = []}
    config.endpoints.push(createGeneratePdfEndpoint(pluginConfig))
    config.endpoints.push(createConvertToInvoiceEndpoint(pluginConfig))
    config.endpoints.push(createSendEmailEndpoint(pluginConfig))
    config.endpoints.push(createEmailConfigEndpoint(pluginConfig))
    config.endpoints.push(createAcceptQuoteEndpoint())
    config.endpoints.push(createRejectQuoteEndpoint())

    // Admin components — tabbed UI + sidebar buttons
    const isSidebarField = (f: any) => 'admin' in f && f.admin?.position === 'sidebar'
    const SEND_HISTORY_FIELDS = new Set(['lastSentAt', 'sendHistory'])
    const isSendHistoryField = (f: any) => 'name' in f && SEND_HISTORY_FIELDS.has(f.name)

    const invoiceCol = config.collections.find((c) => c.slug === 'invoices')
    if (invoiceCol) {
      const sidebarFields = invoiceCol.fields.filter(isSidebarField)
      const sendHistoryFields = invoiceCol.fields.filter((f) => isSendHistoryField(f))
      const contentFields = invoiceCol.fields.filter((f) => !isSidebarField(f) && !isSendHistoryField(f))
      invoiceCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              fields: contentFields,
              label: 'Invoice',
            },
            {
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
              label: 'PDF History',
            },
            {
              fields: sendHistoryFields,
              label: 'Send History',
            },
          ],
        },
        ...sidebarFields,
        {
          name: 'downloadPdf',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#DownloadPdfButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'generatePdf',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#GeneratePdfButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'sendEmail',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#SendEmailButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'relatedQuote',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#RelatedQuote',
            },
            position: 'sidebar',
          },
        },
      ]
    }

    const quotesCol = config.collections.find((c) => c.slug === 'quotes')
    if (quotesCol) {
      const sidebarFields = quotesCol.fields.filter(isSidebarField)
      const sendHistoryFields = quotesCol.fields.filter((f) => isSendHistoryField(f))
      const contentFields = quotesCol.fields.filter((f) => !isSidebarField(f) && !isSendHistoryField(f))
      quotesCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              fields: contentFields,
              label: 'Quote',
            },
            {
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
              label: 'PDF History',
            },
            {
              fields: sendHistoryFields,
              label: 'Send History',
            },
          ],
        },
        ...sidebarFields,
        {
          name: 'downloadPdf',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#DownloadPdfButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'generatePdf',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#GeneratePdfButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'convertToInvoice',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#ConvertToInvoiceButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'sendEmail',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#SendEmailButton',
            },
            position: 'sidebar',
          },
        },
        {
          name: 'relatedInvoicesView',
          type: 'ui',
          admin: {
            components: {
              Field: 'payload-invoicepdf/client#RelatedInvoices',
            },
            position: 'sidebar',
          },
        },
      ]
    }

    return config
  }

export { AttachedPdfEmail, builtInEmailTemplates, LiveDocumentLinkEmail } from './email-templates/index.js'
export { boldTemplate, builtInTemplates, classicTemplate, minimalTemplate, modernTemplate } from './templates/index.js'
export { BoldTemplate, ClassicTemplate, MinimalTemplate, ModernTemplate } from './templates/index.js'
// Re-export types and templates for consumers
export type { EmailTemplate, EmailTemplateProps, InvoicePdfConfig, InvoiceTemplate, InvoiceTemplateProps } from './types.js'
