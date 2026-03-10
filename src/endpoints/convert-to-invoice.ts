import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createConvertToInvoiceEndpoint = (
  _pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/convert-to-invoice',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json?.()
    const { quoteId } = body || {}

    if (!quoteId) {
      return Response.json({ error: 'quoteId is required' }, { status: 400 })
    }

    try {
      const quote = await req.payload.findByID({
        collection: 'quotes' as any,
        id: quoteId,
        depth: 0,
        req,
      })

      if (!quote) {
        return Response.json({ error: 'Quote not found' }, { status: 404 })
      }

      const quoteData = quote as any

      // Create new invoice from quote data
      const invoice = await req.payload.create({
        collection: 'invoices' as any,
        data: {
          status: 'draft',
          template: quoteData.template,
          issueDate: new Date().toISOString(),
          client: quoteData.client,
          items: quoteData.items?.map((item: any) => ({
            product: item.product,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
          notes: quoteData.notes,
        },
        req,
      })

      // Set quote status to accepted
      await req.payload.update({
        collection: 'quotes' as any,
        id: quoteId,
        data: { status: 'accepted' },
        req,
      })

      return Response.json({
        success: true,
        invoiceId: invoice.id,
        message: `Invoice created from quote ${quoteData.quoteNumber}`,
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'Convert to invoice failed', err: error as Error })
      return Response.json({ error: 'Conversion failed' }, { status: 500 })
    }
  },
})
