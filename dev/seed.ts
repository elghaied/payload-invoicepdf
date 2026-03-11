import type { Payload } from 'payload'

import { devUser } from './helpers/credentials.js'

export const seed = async (payload: Payload) => {
  // Seed admin user
  const { totalDocs: userCount } = await payload.count({
    collection: 'users',
    where: { email: { equals: devUser.email } },
  })

  if (!userCount) {
    await payload.create({
      collection: 'users',
      data: devUser,
    })
  }

  // Seed shop info
  await payload.updateGlobal({
    slug: 'shop-info' as any,
    data: {
      companyName: 'Acme Corp',
      address: {
        street: '123 Innovation Drive',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
      phone: '+33 1 23 45 67 89',
      email: 'billing@acme-corp.fr',
      website: 'https://acme-corp.fr',
      vatNumber: 'FR12345678901',
      siret: '123 456 789 00012',
      iban: 'FR76 3000 6000 0112 3456 7890 189',
      bic: 'AGRIFRPP',
      bankName: 'Crédit Agricole',
      legalMentions: 'SAS au capital de 10 000€ — RCS Paris B 123 456 789',
      defaultPaymentTerms: 30,
    },
  })

  // Seed products
  const { totalDocs: productCount } = await payload.count({
    collection: 'products' as any,
  })

  if (!productCount) {
    const products = [
      { name: 'Web Development - Full Day', price: 650, sku: 'DEV-DAY', description: 'Full day of web development services' },
      { name: 'Web Development - Half Day', price: 350, sku: 'DEV-HALF', description: 'Half day of web development services' },
      { name: 'UI/UX Design - Full Day', price: 550, sku: 'DES-DAY', description: 'Full day of UI/UX design services' },
      { name: 'Consulting - Hourly', price: 120, sku: 'CON-HR', description: 'One hour of consulting' },
      { name: 'Hosting - Monthly', price: 49.99, sku: 'HOST-MO', description: 'Monthly hosting plan' },
    ]

    for (const product of products) {
      await payload.create({
        collection: 'products' as any,
        data: product,
      })
    }
  }

  // Seed sample invoices
  const { totalDocs: invoiceCount } = await payload.count({
    collection: 'invoices' as any,
  })

  if (!invoiceCount) {
    await payload.create({
      collection: 'invoices' as any,
      data: {
        status: 'sent',
        template: 'Classic',
        issueDate: new Date().toISOString(),
        client: {
          name: 'TechStart SAS',
          email: 'finance@techstart.fr',
          address: {
            street: '45 Rue de la République',
            city: 'Lyon',
            postalCode: '69002',
            country: 'France',
          },
          vatNumber: 'FR98765432101',
        },
        items: [
          { description: 'Web Development - Full Day', quantity: 5, unitPrice: 650, taxRate: 0.2 },
          { description: 'UI/UX Design - Full Day', quantity: 2, unitPrice: 550, taxRate: 0.2 },
        ],
        notes: 'Payment by bank transfer. Thank you for your business!',
      },
    })

    await payload.create({
      collection: 'invoices' as any,
      data: {
        status: 'draft',
        template: 'Modern',
        issueDate: new Date().toISOString(),
        client: {
          name: 'GreenLeaf SARL',
          email: 'comptabilite@greenleaf.fr',
          address: {
            street: '12 Avenue des Champs',
            city: 'Bordeaux',
            postalCode: '33000',
            country: 'France',
          },
        },
        items: [
          { description: 'Consulting - Hourly', quantity: 8, unitPrice: 120, taxRate: 0.2 },
          { description: 'Hosting - Monthly', quantity: 12, unitPrice: 49.99, taxRate: 0.2 },
        ],
      },
    })

    await payload.create({
      collection: 'invoices' as any,
      data: {
        status: 'paid',
        template: 'Bold',
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          name: 'DataFlow Inc.',
          email: 'ap@dataflow.com',
          address: {
            street: '78 Tech Park Boulevard',
            city: 'Toulouse',
            postalCode: '31000',
            country: 'France',
          },
          vatNumber: 'FR55667788990',
        },
        items: [
          { description: 'Web Development - Full Day', quantity: 10, unitPrice: 650, taxRate: 0.2 },
          { description: 'Web Development - Half Day', quantity: 3, unitPrice: 350, taxRate: 0.2 },
          { description: 'Consulting - Hourly', quantity: 4, unitPrice: 120, taxRate: 0.2 },
        ],
        notes: 'Project: E-commerce platform migration — Phase 1',
      },
    })
  }

  // Seed sample quotes
  const { totalDocs: quoteCount } = await payload.count({
    collection: 'quotes' as any,
  })

  if (!quoteCount) {
    await payload.create({
      collection: 'quotes' as any,
      data: {
        status: 'sent',
        template: 'Minimal',
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          name: 'BlueSky Startup',
          email: 'hello@bluesky-startup.fr',
          address: {
            street: '5 Impasse de l\'Innovation',
            city: 'Nantes',
            postalCode: '44000',
            country: 'France',
          },
        },
        items: [
          { description: 'UI/UX Design - Full Day', quantity: 3, unitPrice: 550, taxRate: 0.2 },
          { description: 'Web Development - Full Day', quantity: 15, unitPrice: 650, taxRate: 0.2 },
          { description: 'Hosting - Monthly', quantity: 12, unitPrice: 49.99, taxRate: 0.2 },
        ],
        notes: 'Quote valid for 30 days. Includes 3 revision rounds.',
      },
    })

    await payload.create({
      collection: 'quotes' as any,
      data: {
        status: 'draft',
        template: 'Classic',
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          name: 'MediCare Plus',
          email: 'procurement@medicareplus.fr',
          address: {
            street: '22 Rue de la Santé',
            city: 'Marseille',
            postalCode: '13001',
            country: 'France',
          },
          vatNumber: 'FR11223344556',
        },
        items: [
          { description: 'Consulting - Hourly', quantity: 20, unitPrice: 120, taxRate: 0.2 },
          { description: 'Web Development - Full Day', quantity: 8, unitPrice: 650, taxRate: 0.2 },
        ],
        notes: 'Phase 1: Requirements analysis and technical audit',
      },
    })
  }
}
