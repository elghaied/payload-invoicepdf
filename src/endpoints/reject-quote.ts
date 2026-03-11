import type { Endpoint } from 'payload'

export const createRejectQuoteEndpoint = (): Endpoint => ({
  path: '/invoicepdf/quotes/:id/reject',
  method: 'post',
  handler: async (req) => {
    const id = req.routeParams?.id as string
    if (!id) {
      return Response.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const body = await req.json?.()
    const { token, reason } = body || {}

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
      if (token !== quoteData.rejectToken) {
        return Response.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Check expiry
      if (quoteData.tokenExpiresAt && new Date(quoteData.tokenExpiresAt) < new Date()) {
        return Response.json({ error: 'Token expired' }, { status: 410 })
      }

      // Reject the quote
      const updateData: Record<string, any> = { status: 'rejected' }
      if (reason) {
        updateData.rejectionReason = reason
      }

      await req.payload.update({
        collection: 'quotes' as any,
        id,
        data: updateData,
        context: { skipPdfGeneration: true },
        req,
      })

      return Response.json({ success: true, message: 'Quote rejected' })
    } catch (error) {
      req.payload.logger.error({ msg: 'Reject quote failed', err: error as Error })
      return Response.json({ error: 'Failed to reject quote' }, { status: 500 })
    }
  },
})
