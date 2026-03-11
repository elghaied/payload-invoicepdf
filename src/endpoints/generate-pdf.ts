import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig, ResolvedClientData } from '../types.js'
import { buildTemplateProps } from '../utils/build-template-props.js'
import { resolveMediaToDataUri } from '../utils/resolve-media-to-data-uri.js'
import { renderPdfToBuffer } from '../utils/render-pdf.js'
import { resolveCustomerData } from '../utils/resolve-customer-data.js'

export const createGeneratePdfEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/generate-pdf',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json?.()
    const { type, id } = body || {}

    if (!type || !id || !['invoice', 'quote'].includes(type)) {
      return Response.json(
        { error: 'Invalid request. Required: { type: "invoice" | "quote", id: string }' },
        { status: 400 },
      )
    }

    const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'

    try {
      const doc = await req.payload.findByID({
        collection: collectionSlug as any,
        id,
        depth: 1,
        req,
      })

      if (!doc) {
        return Response.json({ error: 'Document not found' }, { status: 404 })
      }

      const shopInfo = await req.payload.findGlobal({
        slug: 'shop-info' as any,
        depth: 1,
        req,
      })

      const templateName = (doc as any).template || pluginConfig.templates[0]?.name
      const template = pluginConfig.templates.find((t) => t.name === templateName)

      if (!template) {
        return Response.json({ error: `Template "${templateName}" not found` }, { status: 400 })
      }

      const logoDataUri = resolveMediaToDataUri(
        req.payload,
        pluginConfig.mediaCollection,
        (shopInfo as any).companyLogo,
      )

      // In reference mode, resolve client data from the customer relationship
      let resolvedClient: ResolvedClientData | undefined
      if (!pluginConfig.inlineClientFields && pluginConfig.customerCollection && pluginConfig.customerFieldMapping) {
        const customerId = typeof (doc as any).client?.customer === 'object'
          ? (doc as any).client.customer.id
          : (doc as any).client?.customer
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
            `Reference mode: no customer selected, PDF will have empty client data`,
          )
        }
      }

      const props = buildTemplateProps({
        doc: doc as any,
        shopInfo: shopInfo as any,
        config: pluginConfig,
        type,
        logoDataUri,
        resolvedClient,
      })

      const pdfBuffer = await renderPdfToBuffer(template, props)

      const docNumber =
        type === 'invoice'
          ? (doc as any).invoiceNumber
          : (doc as any).quoteNumber
      const fileName = `${docNumber || type}.pdf`

      // Upload PDF to media collection and update document pdfUrl
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

      await req.payload.update({
        collection: collectionSlug as any,
        id,
        data: { pdfUrl },
        context: { skipPdfGeneration: true },
        req,
      })

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(pdfBuffer.length),
        },
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'PDF generation failed', err: error as Error })
      return Response.json({ error: 'PDF generation failed' }, { status: 500 })
    }
  },
})
