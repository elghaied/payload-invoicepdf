import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { convertQuoteToInvoice } from '../utils/convert-quote-to-invoice.js'

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
      const result = await convertQuoteToInvoice(req, quoteId)
      return Response.json({
        success: true,
        invoiceId: result.invoiceId,
        message: `Invoice created from quote ${result.quoteNumber}`,
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'Convert to invoice failed', err: error as Error })
      return Response.json({ error: 'Conversion failed' }, { status: 500 })
    }
  },
})
