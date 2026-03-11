import type { Config } from 'payload'
import type { InvoicePdfConfig } from './types.js'
import { sanitizeConfig } from './defaults.js'
import { shopInfoGlobal } from './globals/shop-info.js'
import { createInvoicesCollection } from './collections/invoices.js'
import { createQuotesCollection } from './collections/quotes.js'
import { createGeneratePdfEndpoint } from './endpoints/generate-pdf.js'
import { createConvertToInvoiceEndpoint } from './endpoints/convert-to-invoice.js'

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

    // Admin components — tabbed UI + sidebar buttons
    const invoiceCol = config.collections.find((c) => c.slug === 'invoices')
    if (invoiceCol) {
      const existingFields = [...invoiceCol.fields]
      invoiceCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Invoice',
              fields: existingFields,
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
      ]
    }

    const quotesCol = config.collections.find((c) => c.slug === 'quotes')
    if (quotesCol) {
      const existingFields = [...quotesCol.fields]
      quotesCol.fields = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Quote',
              fields: existingFields,
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
      ]
    }

    return config
  }

// Re-export types and templates for consumers
export type { InvoicePdfConfig, InvoiceTemplate, InvoiceTemplateProps } from './types.js'
export { builtInTemplates, classicTemplate, modernTemplate, minimalTemplate, boldTemplate } from './templates/index.js'
export { ClassicTemplate, ModernTemplate, MinimalTemplate, BoldTemplate } from './templates/index.js'
