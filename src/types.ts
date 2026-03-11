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
  /** Slug of an existing customer/user collection for autofill */
  customerCollection?: string
  /** Maps customer collection fields to invoice client fields */
  customerFieldMapping?: {
    /** Field name or array of field names to concatenate with space */
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  /** Filter options for the customer relationship dropdown (e.g., { role: { equals: 'customer' } }) */
  customerFilterOptions?: Record<string, any>
  /** When true (default), customer selection fills editable inline fields.
   *  When false, inline client fields are removed — data is resolved from the customer record. */
  inlineClientFields?: boolean
  /** Custom email templates from consumer, merged with built-in templates */
  emailTemplates?: EmailTemplate[]
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
  customerCollection?: string
  customerFieldMapping?: {
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  customerFilterOptions?: Record<string, any>
  inlineClientFields: boolean
  emailTemplates: EmailTemplate[]
}

export interface EmailTemplateProps {
  type: 'invoice' | 'quote'
  documentNumber: string
  viewUrl?: string
  client: {
    name: string
    email?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
  }
  company: {
    name: string
    logo?: string
    email?: string
    phone?: string
    website?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
    legalMentions?: string
  }
}

export interface EmailTemplate {
  name: string
  label: string
  description: string
  kind: 'attachment' | 'link'
  component: React.FC<EmailTemplateProps>
  forTypes?: ('invoice' | 'quote')[]
}

export interface SendHistoryEntry {
  sentAt: string
  to: string
  templateUsed: string
  subject: string
  attachedPdf?: string
  sentBy: string
}

/** Plugin type alias for Payload */
export type InvoicePdfPlugin = (config: InvoicePdfConfig) => (incomingConfig: Config) => Config

/** Resolved client data shape used by autofill and PDF generation */
export interface ResolvedClientData {
  name: string
  email?: string
  vatNumber?: string
  address?: { street?: string; city?: string; postalCode?: string; country?: string }
}
