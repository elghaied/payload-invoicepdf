import type { CollectionConfig } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { createAutoFillFromCustomerHook } from '../hooks/auto-fill-from-customer.js'
import { createAutoFillFromProductHook } from '../hooks/auto-fill-from-product.js'
import { createAutoNumberHook } from '../hooks/auto-number.js'
import { createCalculateTotalsHook } from '../hooks/calculate-totals.js'
import { createCalculateDueDateHook } from '../hooks/calculate-due-date.js'
import { createGeneratePdfHook } from '../hooks/generate-pdf.js'

export const createInvoicesCollection = (
  pluginConfig: SanitizedInvoicePdfConfig,
): CollectionConfig => ({
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: [
      'invoiceNumber',
      pluginConfig.inlineClientFields !== false ? 'client.name' : 'client.customer',
      'status',
      'total',
      'issueDate',
    ],
    group: 'Invoicing',
  },
  hooks: {
    beforeChange: [
      ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
        ? [createAutoFillFromCustomerHook(pluginConfig)]
        : []),
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        fieldName: 'invoiceNumber',
        prefix: pluginConfig.invoiceNumberPrefix,
        collectionSlug: 'invoices',
      }),
      createCalculateTotalsHook(pluginConfig),
      createCalculateDueDateHook(pluginConfig),
    ],
    afterChange: [createGeneratePdfHook(pluginConfig, 'invoice')],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'template',
      type: 'select',
      defaultValue: pluginConfig.templates[0]?.name,
      options: pluginConfig.templates.map((t) => ({
        label: t.name,
        value: t.name,
      })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'issueDate',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'client',
      type: 'group',
      fields: [
        // Customer relationship field — only when customerCollection is configured
        ...(pluginConfig.customerCollection
          ? [
              {
                name: 'customer',
                type: 'relationship' as const,
                relationTo: pluginConfig.customerCollection,
                required: !pluginConfig.inlineClientFields,
                admin: {
                  description: 'Select a customer to auto-fill client details',
                },
                ...(pluginConfig.customerFilterOptions
                  ? { filterOptions: pluginConfig.customerFilterOptions }
                  : {}),
              },
            ]
          : []),
        // AutoFill UI component — only in autofill mode
        ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
          ? [
              {
                type: 'ui' as const,
                name: 'autoFillFromCustomer',
                label: ' ',
                admin: {
                  components: {
                    Field: {
                      path: 'payload-invoicepdf/client',
                      exportName: 'CustomerAutoFill',
                      clientProps: {
                        customerFieldMapping: pluginConfig.customerFieldMapping,
                        customerCollection: pluginConfig.customerCollection,
                      },
                    },
                  },
                },
              },
            ]
          : []),
        // Inline client fields — only when inlineClientFields is true (or no customer collection)
        ...(pluginConfig.inlineClientFields !== false
          ? [
              { name: 'name', type: 'text' as const, required: true },
              { name: 'email', type: 'email' as const },
              {
                name: 'address',
                type: 'group' as const,
                fields: [
                  { name: 'street', type: 'text' as const },
                  { name: 'city', type: 'text' as const },
                  { name: 'postalCode', type: 'text' as const },
                  { name: 'country', type: 'text' as const },
                ],
              },
              { name: 'vatNumber', type: 'text' as const, label: 'VAT Number' },
            ]
          : []),
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Item', plural: 'Items' },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: pluginConfig.productCollection,
          admin: { description: 'Select a product to auto-fill description and price' },
        },
        {
          type: 'ui',
          name: 'autoFillFromProduct',
          label: ' ',
          admin: {
            components: {
              Field: {
                path: 'payload-invoicepdf/client',
                exportName: 'ProductAutoFill',
                clientProps: {
                  productFieldMapping: pluginConfig.productFieldMapping,
                  productCollection: pluginConfig.productCollection,
                },
              },
            },
          },
        },
        {
          name: 'description',
          type: 'text',
          required: true,
          admin: { description: 'Auto-filled when a product is selected. Changing the product overrides this value.' },
        },
        { name: 'quantity', type: 'number', required: true, defaultValue: 1, min: 0 },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Auto-filled when a product is selected. Changing the product overrides this value.' },
        },
        {
          name: 'taxRate',
          type: 'number',
          defaultValue: pluginConfig.defaultTaxRate,
          min: 0,
          max: 1,
        },
        {
          name: 'lineTotal',
          type: 'number',
          admin: { readOnly: true },
        },
      ],
    },
    { name: 'notes', type: 'textarea' },
    { name: 'subtotal', type: 'number', admin: { readOnly: true } },
    { name: 'taxTotal', type: 'number', admin: { readOnly: true } },
    { name: 'total', type: 'number', admin: { readOnly: true } },
    {
      name: 'sourceQuote',
      type: 'relationship',
      relationTo: 'quotes',
      admin: { hidden: true, position: 'sidebar' },
    },
    {
      name: 'generatedPdfs',
      type: 'relationship',
      relationTo: pluginConfig.mediaCollection,
      hasMany: true,
      admin: { hidden: true },
    },
  ],
})
