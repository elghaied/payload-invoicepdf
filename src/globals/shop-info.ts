import type { GlobalConfig } from 'payload'

export const shopInfoGlobal: GlobalConfig = {
  slug: 'shop-info',
  admin: {
    group: 'Invoicing',
  },
  fields: [
    { name: 'companyName', type: 'text', label: 'Company Name', required: true },
    { name: 'companyLogo', type: 'upload', label: 'Company Logo', relationTo: 'media' },
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
      defaultValue: 30,
      label: 'Default Payment Terms (days)',
    },
  ],
  label: 'Shop Info',
}
