import type { GlobalConfig } from 'payload'

export const shopInfoGlobal: GlobalConfig = {
  slug: 'shop-info',
  label: 'Shop Info',
  admin: {
    group: 'Invoicing',
  },
  fields: [
    { name: 'companyName', type: 'text', required: true, label: 'Company Name' },
    { name: 'companyLogo', type: 'upload', relationTo: 'media', label: 'Company Logo' },
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
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'website', type: 'text' },
    { name: 'vatNumber', type: 'text', label: 'VAT Number' },
    { name: 'siret', type: 'text', label: 'SIRET' },
    { name: 'iban', type: 'text', label: 'IBAN' },
    { name: 'bic', type: 'text', label: 'BIC' },
    { name: 'bankName', type: 'text', label: 'Bank Name' },
    { name: 'legalMentions', type: 'textarea', label: 'Legal Mentions' },
    {
      name: 'defaultPaymentTerms',
      type: 'number',
      label: 'Default Payment Terms (days)',
      defaultValue: 30,
    },
  ],
}
