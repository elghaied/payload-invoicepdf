import type { Payload } from 'payload'
import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  if (payload.db?.destroy) {
    await payload.db.destroy()
  }
})

describe('payload-invoicepdf plugin', () => {
  test('should register invoices collection', () => {
    expect(payload.collections['invoices']).toBeDefined()
  })

  test('should register quotes collection', () => {
    expect(payload.collections['quotes']).toBeDefined()
  })

  test('should register shop-info global', async () => {
    const shopInfo = await payload.findGlobal({ slug: 'shop-info' as any })
    expect(shopInfo).toBeDefined()
  })

  test('should auto-generate invoice number on create', async () => {
    const invoice = await payload.create({
      collection: 'invoices' as any,
      data: {
        status: 'draft',
        issueDate: new Date().toISOString(),
        client: { name: 'Test Client' },
        items: [
          { description: 'Test item', quantity: 2, unitPrice: 100, taxRate: 0.2 },
        ],
      },
    })

    const doc = invoice as any
    expect(doc.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/)
  })

  test('should calculate totals correctly', async () => {
    const invoice = await payload.create({
      collection: 'invoices' as any,
      data: {
        status: 'draft',
        issueDate: new Date().toISOString(),
        client: { name: 'Test Client' },
        items: [
          { description: 'Item A', quantity: 2, unitPrice: 100, taxRate: 0.2 },
          { description: 'Item B', quantity: 1, unitPrice: 50, taxRate: 0.1 },
        ],
      },
    })

    const doc = invoice as any
    expect(doc.subtotal).toBe(250) // (2*100) + (1*50)
    expect(doc.taxTotal).toBe(45)  // (200*0.2) + (50*0.1)
    expect(doc.total).toBe(295)    // 250 + 45
  })

  test('should auto-generate quote number on create', async () => {
    const quote = await payload.create({
      collection: 'quotes' as any,
      data: {
        status: 'draft',
        issueDate: new Date().toISOString(),
        client: { name: 'Test Client' },
        items: [
          { description: 'Quote item', quantity: 1, unitPrice: 500, taxRate: 0.2 },
        ],
      },
    })

    const doc = quote as any
    expect(doc.quoteNumber).toMatch(/^QT-\d{4}-\d{4}$/)
  })
})
