import type { Config } from 'payload'

export interface InvoicePdfConfig {
  /** Currency symbol, default '€' */
  currency?: string
  /** Slug of an existing customer/user collection for autofill */
  customerCollection?: string
  /** Maps customer collection fields to invoice client fields */
  customerFieldMapping?: {
    address?: {
      city?: string
      country?: string
      postalCode?: string
      street?: string
    }
    email?: string
    /** Field name or array of field names to concatenate with space */
    name: string | string[]
    vatNumber?: string
  }
  /** Filter options for the customer relationship dropdown (e.g., { role: { equals: 'customer' } }) */
  customerFilterOptions?: Record<string, any>
  /** Default payment terms in days, default 30 */
  defaultPaymentTerms?: number
  /** Tax rate as decimal (0.20 = 20%), default 0.20 */
  defaultTaxRate?: number
  /** Disable the plugin (keeps schema for migrations) */
  disabled?: boolean
  /** Custom email templates from consumer, merged with built-in templates */
  emailTemplates?: EmailTemplate[]
  /** When true (default), customer selection fills editable inline fields.
   *  When false, inline client fields are removed — data is resolved from the customer record. */
  inlineClientFields?: boolean
  /** Invoice number prefix, default 'INV' */
  invoiceNumberPrefix?: string
  /** Collection slug for PDF file uploads, default 'media' */
  mediaCollection?: string
  /** Slug of the existing product collection in the user's Payload project */
  productCollection: string
  /** Map of product collection fields to invoicepdf's expected fields */
  productFieldMapping: {
    description?: string
    image?: string
    name: string
    price: string
    ref?: string
  }
  /** Quote number prefix, default 'QT' */
  quoteNumberPrefix?: string
  /** JSX templates array — plugin ships 4 built-in, devs can add custom ones */
  templates: InvoiceTemplate[]
}

export interface InvoiceTemplate {
  component: React.FC<InvoiceTemplateProps>
  name: string
}

export interface InvoiceTemplateProps {
  client: {
    address?: { city: string; country: string; postalCode: string; street: string }
    email?: string
    name: string
    vatNumber?: string
  }
  company: {
    address: { city: string; country: string; postalCode: string; street: string }
    bankName?: string
    bic?: string
    email?: string
    iban?: string
    legalMentions?: string
    logo?: string
    name: string
    phone?: string
    siret?: string
    vatNumber?: string
    website?: string
  }
  currency: string
  documentNumber: string
  dueDate?: string
  issueDate: string

  items: Array<{
    description: string
    lineTotal: number
    quantity: number
    taxRate: number
    unitPrice: number
  }>

  notes?: string

  paymentTerms?: number

  status: string
  subtotal: number
  taxTotal: number
  total: number
  type: 'invoice' | 'quote'
  validUntil?: string
}

/** Internal resolved config with all defaults applied */
export interface SanitizedInvoicePdfConfig {
  currency: string
  customerCollection?: string
  customerFieldMapping?: {
    address?: {
      city?: string
      country?: string
      postalCode?: string
      street?: string
    }
    email?: string
    name: string | string[]
    vatNumber?: string
  }
  customerFilterOptions?: Record<string, any>
  defaultPaymentTerms: number
  defaultTaxRate: number
  disabled: boolean
  emailTemplates: EmailTemplate[]
  inlineClientFields: boolean
  invoiceNumberPrefix: string
  mediaCollection: string
  productCollection: string
  productFieldMapping: {
    description?: string
    image?: string
    name: string
    price: string
    ref?: string
  }
  quoteNumberPrefix: string
  templates: InvoiceTemplate[]
}

export interface EmailTemplateProps {
  client: {
    address?: { city?: string; country?: string; postalCode?: string; street?: string }
    email?: string
    name: string
  }
  company: {
    address?: { city?: string; country?: string; postalCode?: string; street?: string }
    email?: string
    legalMentions?: string
    logo?: string
    name: string
    phone?: string
    website?: string
  }
  documentNumber: string
  type: 'invoice' | 'quote'
  viewUrl?: string
}

export interface EmailTemplate {
  component: React.FC<EmailTemplateProps>
  description: string
  forTypes?: ('invoice' | 'quote')[]
  kind: 'attachment' | 'link'
  label: string
  name: string
}

export interface SendHistoryEntry {
  attachedPdf?: string
  sentAt: string
  sentBy: string
  subject: string
  templateUsed: string
  to: string
}

/** Plugin type alias for Payload */
export type InvoicePdfPlugin = (config: InvoicePdfConfig) => (incomingConfig: Config) => Config

/** Resolved client data shape used by autofill and PDF generation */
export interface ResolvedClientData {
  address?: { city?: string; country?: string; postalCode?: string; street?: string }
  email?: string
  name: string
  vatNumber?: string
}
