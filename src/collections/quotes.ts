import type { CollectionConfig } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

import { createSendHistoryFields } from '../fields/send-history.js'
import { createAutoFillFromCustomerHook } from '../hooks/auto-fill-from-customer.js'
import { createAutoFillFromProductHook } from '../hooks/auto-fill-from-product.js'
import { createAutoNumberHook } from '../hooks/auto-number.js'
import { createCalculateTotalsHook } from '../hooks/calculate-totals.js'
import { createGeneratePdfHook } from '../hooks/generate-pdf.js'
import { createGenerateTokensHook } from '../hooks/generate-tokens.js'

export const createQuotesCollection = (
  pluginConfig: SanitizedInvoicePdfConfig,
): CollectionConfig => ({
  slug: 'quotes',
  admin: {
    defaultColumns: [
      'quoteNumber',
      pluginConfig.inlineClientFields !== false ? 'client.name' : 'client.customer',
      'status',
      'total',
      'issueDate',
    ],
    group: 'Invoicing',
    useAsTitle: 'quoteNumber',
  },
  fields: [
    {
      name: 'quoteNumber',
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
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
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
      name: 'validUntil',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'client',
      type: 'group',
      fields: [
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
    {
      name: 'acceptToken',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'rejectToken',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'tokenExpiresAt',
      type: 'date',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: { readOnly: true },
    },
    ...createSendHistoryFields(pluginConfig.mediaCollection),
    {
      name: 'relatedInvoices',
      type: 'relationship',
      admin: { hidden: true, position: 'sidebar' },
      hasMany: true,
      relationTo: 'invoices',
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
    afterChange: [createGeneratePdfHook(pluginConfig, 'quote')],
    beforeChange: [
      ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
        ? [createAutoFillFromCustomerHook(pluginConfig)]
        : []),
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        collectionSlug: 'quotes',
        fieldName: 'quoteNumber',
        prefix: pluginConfig.quoteNumberPrefix,
      }),
      createCalculateTotalsHook(pluginConfig),
      createGenerateTokensHook(),
    ],
  },
})
