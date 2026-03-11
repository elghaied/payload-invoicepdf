import type { PayloadRequest } from 'payload'

export const convertQuoteToInvoice = async (
  req: PayloadRequest,
  quoteId: string,
): Promise<{ invoiceId: string; quoteNumber: string }> => {
  const quote = await req.payload.findByID({
    id: quoteId,
    collection: 'quotes' as any,
    depth: 0,
    req,
  })

  if (!quote) {
    throw new Error('Quote not found')
  }

  const quoteData = quote as any

  // Create new invoice from quote data
  const invoice = await req.payload.create({
    collection: 'invoices' as any,
    data: {
      client: quoteData.client,
      issueDate: new Date().toISOString(),
      items: quoteData.items?.map((item: any) => ({
        description: item.description,
        product: item.product,
        quantity: item.quantity,
        taxRate: item.taxRate,
        unitPrice: item.unitPrice,
      })),
      notes: quoteData.notes,
      sourceQuote: quoteId,
      status: 'draft',
      template: quoteData.template,
    },
    req,
  })

  // Update quote: set status to accepted and append to relatedInvoices
  const existingRelated = Array.isArray(quoteData.relatedInvoices)
    ? quoteData.relatedInvoices.map((r: any) => (typeof r === 'object' ? r.id : r))
    : []
  await req.payload.update({
    id: quoteId,
    collection: 'quotes' as any,
    data: {
      relatedInvoices: [...existingRelated, invoice.id],
      status: 'accepted',
    },
    req,
  })

  return { invoiceId: invoice.id as string, quoteNumber: quoteData.quoteNumber }
}
