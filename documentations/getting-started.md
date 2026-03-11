# Getting Started

## Installation

```bash
npm install payload-invoicepdf
# or
pnpm add payload-invoicepdf
```

## Prerequisites

You need:

1. A Payload CMS 3.x project
2. A **media collection** with `upload` enabled (the plugin stores generated PDFs here)
3. A **products collection** (the plugin auto-fills line items from it)

Example products collection:

```ts
{
  slug: 'products',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'sku', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
```

## Minimal Configuration

```ts
// payload.config.ts
import { buildConfig } from 'payload'
import { invoicePdf, builtInTemplates } from 'payload-invoicepdf'

export default buildConfig({
  // ...your existing config
  plugins: [
    invoicePdf({
      productCollection: 'products',
      productFieldMapping: {
        name: 'name',
        price: 'price',
      },
      templates: builtInTemplates,
    }),
  ],
})
```

This gives you:

- **Invoices** collection — with auto-numbering, status tracking, line items, totals, and PDF generation
- **Quotes** collection — same as invoices, plus quote-specific statuses and validity dates
- **Shop Info** global — your company name, logo, address, VAT, bank details, and legal mentions
- **Admin UI** — sidebar buttons for Download PDF, Generate PDF, and Send Email; tabbed views for PDF History and Send History

## Fill in Shop Info

After starting your app, go to the admin panel and find **Shop Info** under Globals. Fill in your company details — these appear on every generated PDF.

Key fields:
- Company name and logo
- Address (street, city, postal code, country)
- Contact (phone, email, website)
- Accounting (VAT number, SIRET, IBAN, BIC, bank name)
- Default payment terms (in days)
- Legal mentions (footer text on PDFs)

## Create Your First Invoice

1. Go to **Invoices** in the admin panel
2. Select a template (Classic, Modern, Minimal, or Bold)
3. Add client details (name, email, address)
4. Add line items — click the product autofill button to populate from your products collection
5. The plugin auto-calculates subtotal, tax, and total
6. Save the invoice — a PDF is automatically generated when the status is not "draft"
7. Use the sidebar buttons to download or email the PDF

## Adding Customer Autofill

If you have an existing customers collection, connect it for one-click client autofill:

```ts
invoicePdf({
  productCollection: 'products',
  productFieldMapping: { name: 'name', price: 'price' },
  templates: builtInTemplates,
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
})
```

See [Customer Autofill](customer-autofill.md) for full details.

## Adding Email

The plugin uses Payload's built-in email adapter. Configure it in your Payload config:

```ts
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export default buildConfig({
  email: nodemailerAdapter({
    defaultFromAddress: 'invoices@yourcompany.com',
    defaultFromName: 'Your Company',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  plugins: [
    invoicePdf({ /* ... */ }),
  ],
})
```

Once email is configured, the **Send Email** button in the sidebar becomes functional. See [Email Sending](email-sending.md) for templates and options.

## Next Steps

- [Configuration Reference](configuration-reference.md) — all config options
- [PDF Templates](pdf-templates.md) — built-in templates
- [Custom Templates](custom-templates.md) — build your own
- [Email Sending](email-sending.md) — email setup and templates
- [Quote Acceptance](live-document-link.md) — let clients accept/decline quotes via a link
- [Customer Autofill](customer-autofill.md) — connect your customer collection
