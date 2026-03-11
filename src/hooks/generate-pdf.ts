import type { CollectionAfterChangeHook } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { buildTemplateProps } from '../utils/build-template-props.js'
import { resolveMediaToDataUri } from '../utils/resolve-media-to-data-uri.js'
import { renderPdfToBuffer } from '../utils/render-pdf.js'

export const createGeneratePdfHook =
  (
    pluginConfig: SanitizedInvoicePdfConfig,
    type: 'invoice' | 'quote',
  ): CollectionAfterChangeHook =>
  async ({ doc, req, context }) => {
    // Prevent infinite loop when we update pdfUrl
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

      const props = buildTemplateProps({
        doc,
        shopInfo: shopInfo as any,
        config: pluginConfig,
        type,
        logoDataUri,
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

      const pdfUrl = (mediaDoc as any).url || `/api/${pluginConfig.mediaCollection}/file/${fileName}`

      // Update the document with the PDF URL (skip hook to prevent loop)
      await req.payload.update({
        collection: collectionSlug as any,
        id: doc.id,
        data: { pdfUrl },
        context: { skipPdfGeneration: true },
        req,
      })

      doc.pdfUrl = pdfUrl
    } catch (error) {
      req.payload.logger.error({
        msg: `Failed to generate PDF for ${type} ${doc.id}`,
        err: error as Error,
      })
    }

    return doc
  }
