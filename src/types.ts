import type { Config } from 'payload'

export interface InvoicePdfConfig {
  /** Slug of the existing product collection in the user's Payload project */
  productCollection: string
  /** Map of product collection fields to invoicepdf's expected fields */
  productFieldMapping: {
    name: string
    price: string
    ref?: string
    description?: string
    image?: string
  }
  /** JSX templates array — plugin ships 4 built-in, devs can add custom ones */
  templates: InvoiceTemplate[]
  /** Invoice number prefix, default 'INV' */
  invoiceNumberPrefix?: string
  /** Quote number prefix, default 'QT' */
  quoteNumberPrefix?: string
  /** Currency symbol, default '€' */
  currency?: string
  /** Tax rate as decimal (0.20 = 20%), default 0.20 */
  defaultTaxRate?: number
  /** Default payment terms in days, default 30 */
  defaultPaymentTerms?: number
  /** Collection slug for PDF file uploads, default 'media' */
  mediaCollection?: string
  /** Disable the plugin (keeps schema for migrations) */
  disabled?: boolean
}

export interface InvoiceTemplate {
  name: string
  component: React.FC<InvoiceTemplateProps>
}

export interface InvoiceTemplateProps {
  type: 'invoice' | 'quote'
  documentNumber: string
  status: string
  issueDate: string
  dueDate?: string
  validUntil?: string

  company: {
    name: string
    logo?: string
    address: { street: string; city: string; postalCode: string; country: string }
    phone?: string
    email?: string
    website?: string
    vatNumber?: string
    siret?: string
    iban?: string
    bic?: string
    bankName?: string
    legalMentions?: string
  }

  client: {
    name: string
    email?: string
    address?: { street: string; city: string; postalCode: string; country: string }
    vatNumber?: string
  }

  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    lineTotal: number
  }>

  subtotal: number
  taxTotal: number
  total: number
  currency: string
  notes?: string
  paymentTerms?: number
}

/** Internal resolved config with all defaults applied */
export interface SanitizedInvoicePdfConfig {
  productCollection: string
  productFieldMapping: {
    name: string
    price: string
    ref?: string
    description?: string
    image?: string
  }
  templates: InvoiceTemplate[]
  invoiceNumberPrefix: string
  quoteNumberPrefix: string
  currency: string
  defaultTaxRate: number
  defaultPaymentTerms: number
  mediaCollection: string
  disabled: boolean
}

/** Plugin type alias for Payload */
export type InvoicePdfPlugin = (config: InvoicePdfConfig) => (incomingConfig: Config) => Config
