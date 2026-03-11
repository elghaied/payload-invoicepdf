import type { CollectionConfig } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

import { createSendHistoryFields } from '../fields/send-history.js'
import { createAutoFillFromCustomerHook } from '../hooks/auto-fill-from-customer.js'
import { createAutoFillFromProductHook } from '../hooks/auto-fill-from-product.js'
import { createAutoNumberHook } from '../hooks/auto-number.js'
import { createCalculateDueDateHook } from '../hooks/calculate-due-date.js'
import { createCalculateTotalsHook } from '../hooks/calculate-totals.js'
import { createGeneratePdfHook } from '../hooks/generate-pdf.js'

export const createInvoicesCollection = (
  pluginConfig: SanitizedInvoicePdfConfig,
): CollectionConfig => ({
  slug: 'invoices',
  admin: {
    defaultColumns: [
      'invoiceNumber',
      pluginConfig.inlineClientFields !== false ? 'client.name' : 'client.customer',
      'status',
      'total',
      'issueDate',
    ],
    group: 'Invoicing',
    useAsTitle: 'invoiceNumber',
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
      index: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'template',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: pluginConfig.templates[0]?.name,
      options: pluginConfig.templates.map((t) => ({
        label: t.name,
        value: t.name,
      })),
    },
    {
      name: 'issueDate',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' }, readOnly: true },
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
                admin: {
                  description: 'Select a customer to auto-fill client details',
                },
                relationTo: pluginConfig.customerCollection,
                required: !pluginConfig.inlineClientFields,
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
                name: 'autoFillFromCustomer',
                type: 'ui' as const,
                admin: {
                  components: {
                    Field: {
                      clientProps: {
                        customerCollection: pluginConfig.customerCollection,
                        customerFieldMapping: pluginConfig.customerFieldMapping,
                      },
                      exportName: 'CustomerAutoFill',
                      path: 'payload-invoicepdf/client',
                    },
                  },
                },
                label: ' ',
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
      fields: [
        {
          name: 'product',
          type: 'relationship',
          admin: { description: 'Select a product to auto-fill description and price' },
          relationTo: pluginConfig.productCollection,
        },
        {
          name: 'autoFillFromProduct',
          type: 'ui',
          admin: {
            components: {
              Field: {
                clientProps: {
                  productCollection: pluginConfig.productCollection,
                  productFieldMapping: pluginConfig.productFieldMapping,
                },
                exportName: 'ProductAutoFill',
                path: 'payload-invoicepdf/client',
              },
            },
          },
          label: ' ',
        },
        {
          name: 'description',
          type: 'text',
          admin: { description: 'Auto-filled when a product is selected. Changing the product overrides this value.' },
          required: true,
        },
        { name: 'quantity', type: 'number', defaultValue: 1, min: 0, required: true },
        {
          name: 'unitPrice',
          type: 'number',
          admin: { description: 'Auto-filled when a product is selected. Changing the product overrides this value.' },
          min: 0,
          required: true,
        },
        {
          name: 'taxRate',
          type: 'number',
          defaultValue: pluginConfig.defaultTaxRate,
          max: 1,
          min: 0,
        },
        {
          name: 'lineTotal',
          type: 'number',
          admin: { readOnly: true },
        },
      ],
      labels: { plural: 'Items', singular: 'Item' },
      minRows: 1,
    },
    { name: 'notes', type: 'textarea' },
    { name: 'subtotal', type: 'number', admin: { readOnly: true } },
    { name: 'taxTotal', type: 'number', admin: { readOnly: true } },
    { name: 'total', type: 'number', admin: { readOnly: true } },
    ...createSendHistoryFields(pluginConfig.mediaCollection),
    {
      name: 'sourceQuote',
      type: 'relationship',
      admin: { hidden: true, position: 'sidebar' },
      relationTo: 'quotes',
    },
    {
      name: 'generatedPdfs',
      type: 'relationship',
      admin: { hidden: true },
      hasMany: true,
      relationTo: pluginConfig.mediaCollection,
    },
  ],
  hooks: {
    afterChange: [createGeneratePdfHook(pluginConfig, 'invoice')],
    beforeChange: [
      ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
        ? [createAutoFillFromCustomerHook(pluginConfig)]
        : []),
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        collectionSlug: 'invoices',
        fieldName: 'invoiceNumber',
        prefix: pluginConfig.invoiceNumberPrefix,
      }),
      createCalculateTotalsHook(pluginConfig),
      createCalculateDueDateHook(pluginConfig),
    ],
  },
})
