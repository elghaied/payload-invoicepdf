import type { CollectionConfig } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { createAutoFillFromProductHook } from '../hooks/auto-fill-from-product.js'
import { createAutoNumberHook } from '../hooks/auto-number.js'
import { createCalculateTotalsHook } from '../hooks/calculate-totals.js'
import { createGeneratePdfHook } from '../hooks/generate-pdf.js'

export const createQuotesCollection = (
  pluginConfig: SanitizedInvoicePdfConfig,
): CollectionConfig => ({
  slug: 'quotes',
  admin: {
    useAsTitle: 'quoteNumber',
    defaultColumns: ['quoteNumber', 'client.name', 'status', 'total', 'issueDate'],
    group: 'Invoicing',
  },
  hooks: {
    beforeChange: [
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        fieldName: 'quoteNumber',
        prefix: pluginConfig.quoteNumberPrefix,
        collectionSlug: 'quotes',
      }),
      createCalculateTotalsHook(pluginConfig),
    ],
    afterChange: [createGeneratePdfHook(pluginConfig, 'quote')],
  },
  fields: [
    {
      name: 'quoteNumber',
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
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
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
      name: 'validUntil',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'client',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        {
          name: 'address',
          type: 'group',
          fields: [
            { name: 'street', type: 'text' },
            { name: 'city', type: 'text' },
            { name: 'postalCode', type: 'text' },
            { name: 'country', type: 'text' },
          ],
        },
        { name: 'vatNumber', type: 'text', label: 'VAT Number' },
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
    { name: 'pdfUrl', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
  ],
})
