# PDF Templates

The plugin ships 4 built-in templates. Each is a React component using `@react-pdf/renderer` that receives standardized props and renders a full A4 PDF document.

## Built-in Templates

### Classic

Traditional business invoice layout with clean horizontal rules, a structured header, and a standard table format.

### Modern

Sleek and minimal with colored accent bars, a contemporary two-column layout, and generous whitespace.

### Minimal

Ultra-clean design with maximum whitespace, subtle typography, and no heavy visual elements.

### Bold

High-contrast design with a strong colored header band, prominent totals section, and bold typography.

## Using Templates

### All Built-in Templates

```ts
import { builtInTemplates } from 'payload-invoicepdf'

invoicePdf({
  templates: builtInTemplates,
  // ...
})
```

### Specific Templates

```ts
import { classicTemplate, modernTemplate } from 'payload-invoicepdf'

invoicePdf({
  templates: [classicTemplate, modernTemplate],
  // ...
})
```

### Mixed (Built-in + Custom)

```ts
import { builtInTemplates } from 'payload-invoicepdf'
import { myTemplate } from './templates/my-template'

invoicePdf({
  templates: [...builtInTemplates, myTemplate],
  // ...
})
```

## Template Selection

Each invoice and quote has a `template` field in the admin UI. Users select which template to use when creating or editing a document. The PDF is rendered with the selected template whenever it's generated.

## Template Props

Every template receives the same `InvoiceTemplateProps` object:

```ts
interface InvoiceTemplateProps {
  type: 'invoice' | 'quote'
  documentNumber: string          // e.g. "INV-2026-0001"
  status: string                  // e.g. "draft", "sent", "paid"
  issueDate: string
  dueDate?: string                // invoices only
  validUntil?: string             // quotes only

  company: {
    name: string
    logo?: string                 // data URI
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
  currency: string                // e.g. "€"
  notes?: string
  paymentTerms?: number           // days
}
```

To build your own templates using these props, see [Custom Templates](custom-templates.md).
