import type { CollectionAfterChangeHook } from 'payload'
import type { SanitizedInvoicePdfConfig, ResolvedClientData } from '../types.js'
import { buildTemplateProps } from '../utils/build-template-props.js'
import { resolveMediaToDataUri } from '../utils/resolve-media-to-data-uri.js'
import { renderPdfToBuffer } from '../utils/render-pdf.js'
import { resolveCustomerData } from '../utils/resolve-customer-data.js'

export const createGeneratePdfHook =
  (
    pluginConfig: SanitizedInvoicePdfConfig,
    type: 'invoice' | 'quote',
  ): CollectionAfterChangeHook =>
  async ({ doc, req, context }) => {
    // Prevent infinite loop when we update generatedPdfs
    if (context.skipPdfGeneration) return doc

    // Skip PDF generation for drafts to avoid unnecessary overhead
    if (doc.status === 'draft') return doc

    const templateName = doc.template || pluginConfig.templates[0]?.name
    const template = pluginConfig.templates.find((t) => t.name === templateName)

    if (!template) {
      req.payload.logger.error(`Template "${templateName}" not found`)
      return doc
    }

    try {
      const shopInfo = await req.payload.findGlobal({
        slug: 'shop-info' as any,
        depth: 1,
        req,
      })

      const logoDataUri = resolveMediaToDataUri(
        req.payload,
        pluginConfig.mediaCollection,
        (shopInfo as any).companyLogo,
      )

      // In reference mode, resolve client data from the customer relationship
      let resolvedClient: ResolvedClientData | undefined
      if (!pluginConfig.inlineClientFields && pluginConfig.customerCollection && pluginConfig.customerFieldMapping) {
        const customerId = typeof doc.client?.customer === 'object'
          ? doc.client.customer.id
          : doc.client?.customer
        if (customerId) {
          try {
            const customerDoc = await req.payload.findByID({
              collection: pluginConfig.customerCollection as any,
              id: customerId,
              depth: 0,
              req,
            })
            resolvedClient = resolveCustomerData(
              customerDoc as Record<string, any>,
              pluginConfig.customerFieldMapping,
            )
          } catch {
            req.payload.logger.error(
              `Failed to fetch customer ${customerId} for PDF generation`,
            )
          }
        } else {
          req.payload.logger.warn(
            `Reference mode: no customer selected for ${type} ${doc.id}, PDF will have empty client data`,
          )
        }
      }

      const props = buildTemplateProps({
        doc,
        shopInfo: shopInfo as any,
        config: pluginConfig,
        type,
        logoDataUri,
        resolvedClient,
      })

      const pdfBuffer = await renderPdfToBuffer(template, props)

      const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'
      const docNumber = type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber
      const fileName = `${docNumber || collectionSlug}.pdf`

      // Upload the PDF to the configured media collection
      const file = {
        data: pdfBuffer,
        mimetype: 'application/pdf',
        name: fileName,
        size: pdfBuffer.length,
      }

      const mediaDoc = await req.payload.create({
        collection: pluginConfig.mediaCollection as any,
        data: { alt: fileName },
        file,
        req,
      })

      // Prepend new media doc to generatedPdfs array
      const existingPdfs = (Array.isArray(doc.generatedPdfs) ? doc.generatedPdfs : [])
        .map((entry: any) => (typeof entry === 'object' ? entry.id : entry))

      await req.payload.update({
        collection: collectionSlug as any,
        id: doc.id,
        data: { generatedPdfs: [mediaDoc.id, ...existingPdfs] },
        context: { skipPdfGeneration: true },
        req,
      })

      doc.generatedPdfs = [mediaDoc.id, ...existingPdfs]
    } catch (error) {
      req.payload.logger.error({
        msg: `Failed to generate PDF for ${type} ${doc.id}`,
        err: error as Error,
      })
    }

    return doc
  }
