# Email Sending

Send invoices and quotes directly from the admin panel with PDF attachments or live document links.

## Prerequisites

Configure an email adapter in your Payload config. The plugin uses Payload's built-in email system.

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
  // ...
})
```

Without email configured, the Send Email button will be disabled.

## Sending an Email

1. Open an invoice or quote in the admin panel
2. Click **Send Email** in the sidebar
3. The email composer drawer opens with:
   - **To** — pre-filled with the client's email if available
   - **Subject** — pre-filled with the document number
   - **Template** — select from available email templates
   - **Attach PDF** — when using an `attachment` template, choose which generated PDF to attach
4. Click **Send**

After sending:
- The document status changes from `draft` to `sent` (if it was a draft)
- The `lastSentAt` field is updated
- An entry is added to the document's **Send History** tab

## Built-in Email Templates

### Attached PDF

- **Kind:** `attachment`
- **Available for:** invoices and quotes
- Sends the document as a PDF file attached to the email
- Works out of the box — no frontend setup required

### Live Document Link

- **Kind:** `link`
- **Available for:** quotes only
- Sends a link where the client can view the quote online and accept or decline it
- Requires a frontend page — see [Quote Acceptance](live-document-link.md)

## Send History

Every sent email is recorded in the document's **Send History** tab:

| Field | Description |
|-------|-------------|
| `sentAt` | Timestamp of when the email was sent |
| `to` | Recipient email address |
| `templateUsed` | Which email template was used |
| `subject` | Email subject line |
| `attachedPdf` | Reference to the attached PDF (if any) |
| `sentBy` | The admin user who sent it |

## Custom Email Templates

Add your own email templates to match your brand:

```ts
invoicePdf({
  emailTemplates: [myEmailTemplate],
  // ...
})
```

See [Custom Templates](custom-templates.md) for the full guide on building email templates.

## API

### Send Email

```
POST /api/invoicepdf/send-email
```

Body:
```json
{
  "type": "invoice",
  "id": "document-id",
  "to": "client@example.com",
  "subject": "Invoice INV-2026-0001",
  "templateName": "attached-pdf",
  "attachedPdfId": "media-id"
}
```

### Email Configuration

```
GET /api/invoicepdf/email-config?includeTemplates=true&type=invoice
```

Returns:
```json
{
  "isConfigured": true,
  "defaultFromAddress": "invoices@yourcompany.com",
  "defaultFromName": "Your Company",
  "templates": [
    {
      "name": "attached-pdf",
      "label": "Attached PDF",
      "description": "Sends the document as a PDF file attached to the email.",
      "kind": "attachment"
    }
  ]
}
```
