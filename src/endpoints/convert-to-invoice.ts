import type { Endpoint } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

import { convertQuoteToInvoice } from '../utils/convert-quote-to-invoice.js'

export const createConvertToInvoiceEndpoint = (
  _pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
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
        invoiceId: result.invoiceId,
        message: `Invoice created from quote ${result.quoteNumber}`,
        success: true,
      })
    } catch (error) {
      req.payload.logger.error({ err: error as Error, msg: 'Convert to invoice failed' })
      return Response.json({ error: 'Conversion failed' }, { status: 500 })
    }
  },
  method: 'post',
  path: '/invoicepdf/convert-to-invoice',
})
