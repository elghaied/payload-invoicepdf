import type { PayloadRequest } from 'payload'

export const convertQuoteToInvoice = async (
  req: PayloadRequest,
  quoteId: string,
): Promise<{ invoiceId: string; quoteNumber: string }> => {
  const quote = await req.payload.findByID({
    collection: 'quotes' as any,
    id: quoteId,
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
      sourceQuote: quoteId,
    },
    req,
  })

  // Update quote: set status to accepted and append to relatedInvoices
  const existingRelated = Array.isArray(quoteData.relatedInvoices)
    ? quoteData.relatedInvoices.map((r: any) => (typeof r === 'object' ? r.id : r))
    : []
  await req.payload.update({
    collection: 'quotes' as any,
    id: quoteId,
    data: {
      status: 'accepted',
      relatedInvoices: [...existingRelated, invoice.id],
    },
    req,
  })

  return { invoiceId: invoice.id as string, quoteNumber: quoteData.quoteNumber }
}
