import type { Endpoint } from 'payload'
import { convertQuoteToInvoice } from '../utils/convert-quote-to-invoice.js'

export const createAcceptQuoteEndpoint = (): Endpoint => ({
  path: '/invoicepdf/quotes/:id/accept',
  method: 'post',
  handler: async (req) => {
    const id = req.routeParams?.id as string
    if (!id) {
      return Response.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const body = await req.json?.()
    const { token } = body || {}

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 })
    }

    try {
      const quote = await req.payload.findByID({
        collection: 'quotes' as any,
        id,
        depth: 0,
        req,
      })

      if (!quote) {
        return Response.json({ error: 'Quote not found' }, { status: 404 })
      }

      const quoteData = quote as any

      // Check if quote is in a terminal state
      if (['accepted', 'rejected', 'expired'].includes(quoteData.status)) {
        return Response.json(
          { error: `Quote already ${quoteData.status}` },
          { status: 409 },
        )
      }

      // Verify token
      if (token !== quoteData.acceptToken) {
        return Response.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Check expiry
      if (quoteData.tokenExpiresAt && new Date(quoteData.tokenExpiresAt) < new Date()) {
        return Response.json({ error: 'Token expired' }, { status: 410 })
      }

      // Accept the quote and create invoice
      const result = await convertQuoteToInvoice(req, id)

      return Response.json({
        success: true,
        message: 'Quote accepted',
        invoiceId: result.invoiceId,
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'Accept quote failed', err: error as Error })
      return Response.json({ error: 'Failed to accept quote' }, { status: 500 })
    }
  },
})
