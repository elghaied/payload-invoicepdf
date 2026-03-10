import type { CollectionConfig } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
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
    defaultColumns: ['invoiceNumber', 'client.name', 'status', 'total', 'issueDate'],
    group: 'Invoicing',
  },
  hooks: {
    beforeChange: [
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
          admin: { description: 'Optional — select a product to auto-fill fields' },
        },
        { name: 'description', type: 'text', required: true },
        { name: 'quantity', type: 'number', required: true, defaultValue: 1, min: 0 },
        { name: 'unitPrice', type: 'number', required: true, min: 0 },
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
