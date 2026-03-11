# Email Sending Feature — Design Spec

## Overview

Add email sending capabilities to the payload-invoicepdf plugin. After a PDF is generated for a quote or invoice, users can send it via email directly from the admin panel. Includes two built-in email templates and a token-based accept/reject workflow for quotes.

## Types & Plugin Config

### New types in `src/types.ts`

```ts
export interface EmailTemplate {
  name: string
  label: string
  description: string
  component: React.FC<EmailTemplateProps>
  forTypes?: ('invoice' | 'quote')[]
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

// Note: EmailTemplateProps intentionally excludes vatNumber, siret, iban, bic, bankName,
// items, totals, etc. Email templates render greetings and document references, not
// financial details. Consumers needing those fields can create custom templates with
// extended props.

export interface SendHistoryEntry {
  sentAt: string
  to: string
  templateUsed: string
  subject: string
  attachedPdf?: string
  sentBy: string
}
```

### Config additions

`InvoicePdfConfig` gains:
- `emailTemplates?: EmailTemplate[]` — custom email templates from consumer

`SanitizedInvoicePdfConfig` resolves `emailTemplates` to merged array: built-in templates first, then consumer templates appended. If a consumer template has the same `name` as a built-in, the consumer's version overrides the built-in.

## Collection Field Changes

### Quotes — new fields

| Field | Type | Notes |
|-------|------|-------|
| `acceptToken` | text | hidden, readOnly, auto-generated on creation via `crypto.randomBytes(32).toString('hex')` |
| `rejectToken` | text | hidden, readOnly, auto-generated on creation |
| `tokenExpiresAt` | date | hidden, readOnly, set to `validUntil` or creation + 30 days |
| `rejectionReason` | textarea | readOnly in admin, set by reject endpoint |
| `lastSentAt` | date | readOnly, sidebar |
| `sendHistory` | array | readOnly, sidebar, collapsible (defaultCollapsed). See note below. |

### Invoices — new fields

| Field | Type | Notes |
|-------|------|-------|
| `lastSentAt` | date | readOnly, sidebar |
| `sendHistory` | array | readOnly, sidebar, collapsible (defaultCollapsed). See note below. |

**Note on sendHistory placement:** Array fields in the sidebar can be visually heavy. The field uses `admin.components.RowLabel` to show compact "to — date" summaries, and `defaultCollapsed: true` + `admin.initCollapsed: true` to keep it unobtrusive. If Payload's sidebar layout proves problematic with arrays, fall back to placing it in a dedicated "Email History" tab alongside "PDF History".

### sendHistory array fields (both collections)

| Field | Type |
|-------|------|
| `sentAt` | date |
| `to` | email |
| `templateUsed` | text |
| `subject` | text |
| `attachedPdf` | relationship to media |
| `sentBy` | relationship to users |

### New hook: `createGenerateTokensHook`

- `beforeChange` on quotes, `operation === 'create'` only
- Generates `acceptToken` and `rejectToken` via `crypto.randomBytes(32).toString('hex')`
- Sets `tokenExpiresAt` to `validUntil` or creation date + 30 days

## Endpoints

### 1. `POST /invoicepdf/send-email` (authenticated)

Request:
```ts
{
  type: 'invoice' | 'quote'
  id: string
  to: string
  subject: string
  templateName: string
  attachedPdfId?: string
}
```

Handler:
1. Validate inputs, fetch document + shop-info
2. If "live-document-link": ensure tokens exist (generate if missing), construct `viewUrl` from `NEXT_PUBLIC_SERVER_URL || NEXT_PUBLIC_SITE_URL`
3. Render email template to HTML via `renderToStaticMarkup()`
4. If "attached-pdf": fetch PDF from media, attach it
5. Send via `req.payload.sendEmail()` — `from` comes from `req.payload.config.email.defaultFromAddress` / `defaultFromName`
6. Append to `sendHistory`, set `lastSentAt`, update status from `draft` → `sent` (if currently draft). Pass `req` to maintain transaction atomicity.
7. Return success/error JSON

### 2. `POST /invoicepdf/quotes/:id/accept` (public, token auth)

Request: `{ token: string }`

Handler:
1. Fetch quote
2. Check status — if already `accepted`, `rejected`, or `expired` → `{ error: "Quote already {status}", status: 409 }`
3. Verify `token === doc.acceptToken` and `tokenExpiresAt > now`
4. Invalid token → `{ error: "Invalid token", status: 401 }`
5. Expired → `{ error: "Token expired", status: 410 }`
6. Set status to "accepted", trigger invoice creation by calling a shared `convertQuoteToInvoice(req, quoteId)` utility extracted from the existing convert-to-invoice endpoint
7. Return `{ success: true, message: "Quote accepted" }`

### 3. `POST /invoicepdf/quotes/:id/reject` (public, token auth)

Request: `{ token: string, reason?: string }`

Same validation as accept. Sets status to "rejected", stores `rejectionReason`.

### 4. `GET /invoicepdf/email-config` (authenticated)

Returns:
```ts
{
  configured: boolean
  defaultFromAddress?: string
  defaultFromName?: string
}
```

Used by SendEmailButton to check if email is configured and by the drawer to populate the "From" field.

Source: `configured` is `true` when `req.payload.config.email` is defined. `defaultFromAddress` and `defaultFromName` come from `req.payload.config.email.defaultFromAddress` and `req.payload.config.email.defaultFromName`.

## UI Components

### `SendEmailButton` (sidebar)

- Placed after GeneratePdfButton in both collection sidebars
- Label: "Send Quote" or "Send Invoice"
- Disabled with tooltip if email not configured or no PDFs generated
- Opens `SendEmailDrawer` on click

### `SendEmailDrawer` (Payload Drawer)

| Field | Behavior |
|-------|----------|
| To | Pre-filled with client email, editable |
| From | Read-only, from email config |
| Subject | Pre-filled "Quote {number}" or "Invoice {number}", editable |
| Template | SelectInput filtered by `forTypes`. Default: "attached-pdf". Shows description below. Warning if "live-document-link" selected without `NEXT_PUBLIC_SERVER_URL` |
| Attached PDF | SelectInput from generatedPdfs history. Pre-selected: latest. Shows filename + date |
| Send | Submits to send-email endpoint. Loading state. Toast on success/error. Closes drawer on success |

## Built-in Email Templates

### `attached-pdf`

- `forTypes: ['invoice', 'quote']`
- Description: "Sends the document as a PDF file attached to the email. Works out of the box — no frontend setup required."
- Renders: company logo (if present) + company name header, greeting, "find attached {type} {number}", signature block, legal footer
- Inline CSS, no frameworks

### `live-document-link`

- `forTypes: ['quote']`
- Description: "Sends a link where the client can view the document online and accept or reject it. Requires frontend setup."
- Renders: same structure as attached-pdf but with prominent "View Quote" button linking to `viewUrl`
- Inline CSS, no frameworks

Both templates render company logo in header when `company.logo` exists, falling back to text-only company name.

## Token System (quotes only)

- Each quote gets unique `acceptToken` + `rejectToken` on creation
- `tokenExpiresAt` set to `validUntil` or +30 days
- Tokens are 32 bytes of `crypto.randomBytes` (256-bit entropy) — brute-force is infeasible, no CSRF/rate-limiting needed
- Base URL from `NEXT_PUBLIC_SERVER_URL || NEXT_PUBLIC_SITE_URL`

### URL flow (important distinction)

The **email contains frontend page URLs** (GET, with token as query param):
- `{baseUrl}/quotes/{id}/accept?token={acceptToken}`
- `{baseUrl}/quotes/{id}/reject?token={rejectToken}`

These are pages the **consumer builds** (see docs/live-document-link.md). The consumer's frontend page reads the token from the query string, displays the document, and on user action **POSTs to the plugin API endpoint** with the token in the request body:
- `POST /api/invoicepdf/quotes/:id/accept` with `{ token }`
- `POST /api/invoicepdf/quotes/:id/reject` with `{ token, reason? }`

The email link and the API endpoint are intentionally separate — the link is a frontend page, the endpoint is the backend verification.

## Exports

### Client exports (add to `src/exports/client.ts`)
- `SendEmailButton`
- `SendEmailDrawer`

### Package re-exports
- Types: `EmailTemplate`, `EmailTemplateProps`
- Components: `builtInEmailTemplates`, `AttachedPdfEmail`, `LiveDocumentLinkEmail`

## Documentation

Create `docs/live-document-link.md`:
1. Feature explanation
2. Required env var: `NEXT_PUBLIC_SERVER_URL` or `NEXT_PUBLIC_SITE_URL`
3. Consumer creates frontend pages for accept/reject
4. Full Next.js App Router example (accept page, reject page, token handling, PDF display, API calls, state handling)
5. Note: token IS the auth, no login needed

## Plugin Entry Point Changes (`src/index.ts`)

- Register 4 new endpoints (send-email, email-config, accept, reject)
- Add `SendEmailButton` UI field to both collection sidebars (after GeneratePdfButton)
- Merge built-in email templates with consumer templates in `sanitizeConfig`
- Add new fields to collections (tokens, sendHistory, lastSentAt, rejectionReason)

## Refactoring

### Extract `convertQuoteToInvoice` utility

The existing `convert-to-invoice.ts` endpoint contains inline logic for creating an invoice from a quote. This logic needs to be extracted into a shared utility `src/utils/convert-quote-to-invoice.ts` so it can be called from both:
1. The existing `POST /invoicepdf/convert-to-invoice` endpoint
2. The new `POST /invoicepdf/quotes/:id/accept` endpoint

## Behavioral Notes

### Status changes on email send
When a user sends an email via the send-email endpoint:
- If the document's current status is `draft`, it is updated to `sent`
- If the status is anything else (already `sent`, `paid`, etc.), it is left unchanged

### Email rendering
Email templates are rendered server-side using `renderToStaticMarkup()` from `react-dom/server`. This is a standard Node.js import, not a browser API. The plugin already depends on React for PDF template rendering.
