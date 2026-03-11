# Custom Templates

Build your own PDF and email templates using React components.

## Custom PDF Templates

PDF templates use [`@react-pdf/renderer`](https://react-pdf.org/) — a React renderer for creating PDF documents. You use special components (`Document`, `Page`, `View`, `Text`, `Image`) instead of HTML elements.

### Basic Structure

```tsx
import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceTemplateProps } from 'payload-invoicepdf'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold' },
  table: { marginTop: 20 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
})

const MyTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const { type, documentNumber, company, client, items, subtotal, taxTotal, total, currency } = props

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logo && <Image src={company.logo} style={{ width: 60, height: 60 }} />}
            <Text style={styles.title}>{company.name}</Text>
          </View>
          <View>
            <Text style={styles.title}>{type === 'invoice' ? 'Invoice' : 'Quote'}</Text>
            <Text>{documentNumber}</Text>
          </View>
        </View>

        {/* Client */}
        <Text style={{ fontWeight: 'bold' }}>{client.name}</Text>
        {client.email && <Text>{client.email}</Text>}

        {/* Items */}
        <View style={styles.table}>
          {items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{currency}{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{currency}{item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
          <Text>Subtotal: {currency}{subtotal.toFixed(2)}</Text>
          <Text>Tax: {currency}{taxTotal.toFixed(2)}</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Total: {currency}{total.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

### Registering Your Template

Export your template as an `InvoiceTemplate` object and add it to the config:

```tsx
// templates/my-template.tsx
export const myTemplate = {
  name: 'My Template',
  component: MyTemplate,
}
```

```ts
// payload.config.ts
import { invoicePdf, builtInTemplates } from 'payload-invoicepdf'
import { myTemplate } from './templates/my-template'

invoicePdf({
  templates: [...builtInTemplates, myTemplate],
  // ...
})
```

### Key Notes

- **Company logo** is passed as a data URI string — use `<Image src={company.logo} />` directly
- **Use `@react-pdf/renderer` components only** — no HTML elements (`div`, `span`, etc.)
- **Styles use `StyleSheet.create`** with flexbox layout (similar to React Native)
- **Available fonts:** Helvetica, Courier, Times-Roman (built-in). Custom fonts can be registered via `@react-pdf/renderer`'s `Font.register()`
- **Page sizes:** `A4`, `LETTER`, or custom dimensions
- The `type` prop tells you whether you're rendering an invoice or quote — use it to adjust labels (e.g., "Due Date" vs "Valid Until")

For a complete real-world example, see the [corporate template in the dev project](https://github.com/payload-invoicepdf/payload-invoicepdf/blob/main/dev/templates/corporate.tsx).

## Custom Email Templates

Email templates are standard React components that render to HTML. Use HTML elements (not `@react-pdf/renderer` components).

### Basic Structure

```tsx
import React from 'react'
import type { EmailTemplateProps } from 'payload-invoicepdf'

const MyEmail: React.FC<EmailTemplateProps> = ({ type, documentNumber, client, company }) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tr>
            <td align="center" style={{ padding: '32px 0' }}>
              <table width="600" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                    <p>Dear {client.name},</p>
                    <p>Please find attached {docLabel} <strong>{documentNumber}</strong>.</p>
                    <p>Best regards,<br />{company.name}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
```

### Registering Your Email Template

```tsx
// templates/my-email.tsx
import type { EmailTemplate } from 'payload-invoicepdf'

export const myEmailTemplate: EmailTemplate = {
  name: 'my-email',
  label: 'My Email',
  description: 'A simple email template for invoices and quotes.',
  kind: 'attachment',    // 'attachment' sends PDF as attachment, 'link' sends a view URL
  component: MyEmail,
  forTypes: ['invoice', 'quote'],  // optional: restrict to specific document types
}
```

```ts
// payload.config.ts
invoicePdf({
  emailTemplates: [myEmailTemplate],
  // ...
})
```

### Email Template Props

```ts
interface EmailTemplateProps {
  type: 'invoice' | 'quote'
  documentNumber: string
  viewUrl?: string              // only set for 'link' kind templates
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
```

### Template Kinds

- **`attachment`** — The plugin attaches the PDF to the email. Works out of the box.
- **`link`** — The plugin includes a `viewUrl` in the props. The email should contain a link/button pointing to this URL. Requires a frontend page to display the document. See [Quote Acceptance](live-document-link.md).

### Tips for Email HTML

- Use `<table>` layout for email compatibility (not flexbox/grid)
- Inline all styles — email clients strip `<style>` tags
- Keep widths at 600px max for mobile clients
- Test with [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/) for cross-client rendering
- If a custom template has the same `name` as a built-in one, it replaces it
