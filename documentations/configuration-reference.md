# Configuration Reference

All options for the `invoicePdf()` plugin function.

## Required Options

### `productCollection`

**Type:** `string`

Slug of your existing product collection. The plugin uses this for the product autofill feature on line items.

```ts
productCollection: 'products'
```

### `productFieldMapping`

**Type:** `{ name: string, price: string, ref?: string, description?: string, image?: string }`

Maps your product collection's fields to what the plugin expects.

```ts
productFieldMapping: {
  name: 'name',         // Product name → line item description
  price: 'price',       // Product price → line item unit price
  ref: 'sku',           // Optional: product reference/SKU
  description: 'description', // Optional: detailed description
  image: 'image',       // Optional: product image
}
```

### `templates`

**Type:** `InvoiceTemplate[]`

Array of PDF templates available for document generation. Use the built-in templates, add custom ones, or both.

```ts
import { builtInTemplates } from 'payload-invoicepdf'
import { myTemplate } from './templates/my-template'

templates: [...builtInTemplates, myTemplate]
```

Each template has:
- `name` — display name shown in the template selector
- `component` — React component using `@react-pdf/renderer`

## Optional Options

### `invoiceNumberPrefix`

**Type:** `string` — **Default:** `'INV'`

Prefix for auto-generated invoice numbers. Results in numbers like `INV-2026-0001`.

### `quoteNumberPrefix`

**Type:** `string` — **Default:** `'QT'`

Prefix for auto-generated quote numbers. Results in numbers like `QT-2026-0001`.

### `currency`

**Type:** `string` — **Default:** `'€'`

Currency symbol used in PDF templates and calculations.

### `defaultTaxRate`

**Type:** `number` — **Default:** `0.20`

Default tax rate as a decimal. `0.20` = 20%. Applied to new line items.

### `defaultPaymentTerms`

**Type:** `number` — **Default:** `30`

Default payment terms in days. Used to auto-calculate the due date from the issue date. Can also be set per-document via the Shop Info global.

### `mediaCollection`

**Type:** `string` — **Default:** `'media'`

Slug of the collection where generated PDFs are uploaded. Must have `upload` enabled.

### `customerCollection`

**Type:** `string` — **Default:** `undefined`

Slug of your existing customer/user collection. When set, a customer dropdown appears on invoices/quotes with an autofill button.

Requires `customerFieldMapping` to be configured.

### `customerFieldMapping`

**Type:** `object` — **Required when `customerCollection` is set**

Maps your customer collection's fields to invoice client fields. Supports dot notation for nested fields and arrays for concatenated names.

```ts
customerFieldMapping: {
  name: 'companyName',          // string field
  // or concatenate multiple fields:
  // name: ['firstName', 'lastName'],
  email: 'email',
  vatNumber: 'vatNumber',
  address: {
    street: 'address.street',     // dot notation for nested fields
    city: 'address.city',
    postalCode: 'address.postalCode',
    country: 'address.country',
  },
}
```

### `customerFilterOptions`

**Type:** `Record<string, any>` — **Default:** `undefined`

Payload query filter applied to the customer relationship dropdown. Useful when your customer collection includes non-customer records.

```ts
// Only show records where role equals 'customer'
customerFilterOptions: {
  role: { equals: 'customer' },
}
```

### `inlineClientFields`

**Type:** `boolean` — **Default:** `true`

Controls how client data is handled on invoices/quotes.

- **`true` (default)** — Client name, email, address, and VAT fields are visible and editable on the form. Selecting a customer auto-fills these fields, but they can be manually edited.
- **`false`** — Inline client fields are removed. The customer relationship becomes required, and client data is resolved directly from the customer record when generating PDFs.

### `emailTemplates`

**Type:** `EmailTemplate[]` — **Default:** `[]`

Custom email templates merged with the built-in ones. If a custom template has the same `name` as a built-in one, it replaces it.

```ts
emailTemplates: [myCustomEmailTemplate]
```

Each email template has:
- `name` — unique identifier
- `label` — display name in the email composer
- `description` — shown in the template selector
- `kind` — `'attachment'` (sends PDF as attachment) or `'link'` (sends a view link)
- `component` — React component that renders to HTML
- `forTypes` — optional array of `'invoice'` | `'quote'` to restrict availability

### `disabled`

**Type:** `boolean` — **Default:** `false`

Disables all plugin behavior (hooks, endpoints, admin components) while keeping the collection schemas. Useful for migrations or testing.

## Full Example

```ts
invoicePdf({
  // Required
  productCollection: 'products',
  productFieldMapping: {
    name: 'name',
    price: 'price',
    ref: 'sku',
    description: 'description',
  },
  templates: [...builtInTemplates, corporateTemplate],

  // Optional
  invoiceNumberPrefix: 'INV',
  quoteNumberPrefix: 'QT',
  currency: '€',
  defaultTaxRate: 0.20,
  defaultPaymentTerms: 30,
  mediaCollection: 'media',

  // Customer autofill
  customerCollection: 'customers',
  customerFieldMapping: {
    name: 'companyName',
    email: 'email',
    vatNumber: 'vatNumber',
    address: {
      street: 'address.street',
      city: 'address.city',
      postalCode: 'address.postalCode',
      country: 'address.country',
    },
  },

  // Email
  emailTemplates: [corporateEmailTemplate],
})
```

## Collections & Globals Created

The plugin adds these to your Payload config:

| Type | Slug | Description |
|------|------|-------------|
| Collection | `invoices` | Invoices with line items, totals, PDF generation, and send history |
| Collection | `quotes` | Quotes with validity dates, acceptance tokens, and conversion to invoices |
| Global | `shop-info` | Company details used on all generated PDFs |

## API Endpoints

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/api/invoicepdf/generate-pdf` | POST | Required | Generate PDF for a document |
| `/api/invoicepdf/send-email` | POST | Required | Send a document via email |
| `/api/invoicepdf/convert-to-invoice` | POST | Required | Convert a quote to a draft invoice |
| `/api/invoicepdf/email-config` | GET | Required | Get email configuration and available templates |
| `/api/invoicepdf/quotes/:id/accept` | POST | Token | Accept a quote (token-based, no login) |
| `/api/invoicepdf/quotes/:id/reject` | POST | Token | Reject a quote (token-based, no login) |
