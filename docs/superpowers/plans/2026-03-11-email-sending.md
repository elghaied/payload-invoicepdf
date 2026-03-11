# Email Sending Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email sending capabilities to the payload-invoicepdf plugin with two built-in templates, a send email drawer, and a token-based accept/reject workflow for quotes.

**Architecture:** Extends the existing plugin with 4 new endpoints, 2 UI components (sidebar button + Payload Drawer), 2 built-in email templates (React → `renderToStaticMarkup`), a token generation hook for quotes, and shared fields for send history. The existing convert-to-invoice logic is extracted into a reusable utility for the accept-quote endpoint.

**Tech Stack:** Payload CMS 3.37, React 19, react-dom/server (renderToStaticMarkup), Node.js crypto, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-11-email-sending-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/email-templates/attached-pdf.tsx` | "Attached PDF" email template component |
| `src/email-templates/live-document-link.tsx` | "Live Document Link" email template component |
| `src/email-templates/index.ts` | Built-in email template definitions + exports |
| `src/utils/convert-quote-to-invoice.ts` | Shared logic extracted from convert-to-invoice endpoint |
| `src/utils/build-email-template-props.ts` | Builds `EmailTemplateProps` from document + shop-info |
| `src/utils/render-email.ts` | Renders email template to HTML string via `renderToStaticMarkup` |
| `src/hooks/generate-tokens.ts` | `beforeChange` hook generating accept/reject tokens on quote creation |
| `src/endpoints/send-email.ts` | `POST /invoicepdf/send-email` endpoint |
| `src/endpoints/email-config.ts` | `GET /invoicepdf/email-config` endpoint |
| `src/endpoints/accept-quote.ts` | `POST /invoicepdf/quotes/:id/accept` endpoint |
| `src/endpoints/reject-quote.ts` | `POST /invoicepdf/quotes/:id/reject` endpoint |
| `src/fields/send-history.ts` | Shared `sendHistory` + `lastSentAt` field definitions |
| `src/components/SendEmailButton.tsx` | Sidebar button that opens the drawer |
| `src/components/SendEmailDrawer.tsx` | Payload Drawer with email form |
| `src/components/SendEmailDrawer.css` | Drawer styling |
| `docs/live-document-link.md` | Consumer guide for setting up live document link pages |

### Modified files

| File | Changes |
|------|---------|
| `src/types.ts` | Add `EmailTemplate`, `EmailTemplateProps`, `SendHistoryEntry` interfaces; update config types |
| `src/defaults.ts` | Add `emailTemplates` merge logic in `sanitizeConfig` |
| `src/collections/quotes.ts` | Add token fields, `rejectionReason`, `lastSentAt`, `sendHistory`; add generate-tokens hook |
| `src/collections/invoices.ts` | Add `lastSentAt`, `sendHistory` |
| `src/endpoints/convert-to-invoice.ts` | Refactor to use shared `convertQuoteToInvoice` utility |
| `src/index.ts` | Register 4 new endpoints, add `SendEmailButton` to both collection sidebars, export email template types |
| `src/exports/client.ts` | Export `SendEmailButton`, `SendEmailDrawer` |

---

## Chunk 1: Types, Config, and Shared Definitions

### Task 1: Add email-related types to `src/types.ts`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `EmailTemplateProps` interface**

After the existing `InvoiceTemplateProps` interface (after line 101), add:

```ts
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
```

- [ ] **Step 2: Add `EmailTemplate` interface**

```ts
export interface EmailTemplate {
  name: string
  label: string
  description: string
  component: React.FC<EmailTemplateProps>
  forTypes?: ('invoice' | 'quote')[]
}
```

- [ ] **Step 3: Add `SendHistoryEntry` interface**

```ts
export interface SendHistoryEntry {
  sentAt: string
  to: string
  templateUsed: string
  subject: string
  attachedPdf?: string
  sentBy: string
}
```

- [ ] **Step 4: Add `emailTemplates` to `InvoicePdfConfig`**

Add to the `InvoicePdfConfig` interface:

```ts
/** Custom email templates from consumer, merged with built-in templates */
emailTemplates?: EmailTemplate[]
```

- [ ] **Step 5: Add `emailTemplates` to `SanitizedInvoicePdfConfig`**

Add to the `SanitizedInvoicePdfConfig` interface:

```ts
emailTemplates: EmailTemplate[]
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /home/sam/projects/payload-invoicepdf && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors related to the added types.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts
git commit -m "feat: add EmailTemplate, EmailTemplateProps, and SendHistoryEntry types"
```

### Task 2: Update `src/defaults.ts` with email template merge logic

**Files:**
- Modify: `src/defaults.ts`

This task depends on Task 5 (email templates index) for the import. We'll add the import and merge logic now, and the actual email template index file will be created in Task 5. For now, use a placeholder import that we'll wire up later.

- [ ] **Step 1: Add email template merge to `sanitizeConfig`**

At the top of `src/defaults.ts`, add the import (this file won't exist yet — that's OK, we'll create it in Task 5):

```ts
import { builtInEmailTemplates } from './email-templates/index.js'
```

In the `sanitizeConfig` function's return object, add before the closing `}`:

```ts
emailTemplates: (() => {
  const consumerTemplates = config.emailTemplates ?? []
  const consumerNames = new Set(consumerTemplates.map(t => t.name))
  const filtered = builtInEmailTemplates.filter(t => !consumerNames.has(t.name))
  return [...filtered, ...consumerTemplates]
})(),
```

This gives consumer templates priority when names collide.

- [ ] **Step 2: Commit** (may have type errors until Task 5 — that's expected)

```bash
git add src/defaults.ts
git commit -m "feat: add email template merge logic to sanitizeConfig"
```

### Task 3: Create shared send history field definitions

**Files:**
- Create: `src/fields/send-history.ts`

These field definitions are reused by both quotes and invoices collections.

- [ ] **Step 1: Create `src/fields/send-history.ts`**

```ts
import type { Field } from 'payload'

export const createSendHistoryFields = (mediaCollection: string): Field[] => [
  {
    name: 'lastSentAt',
    type: 'date',
    admin: {
      readOnly: true,
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
  {
    name: 'sendHistory',
    type: 'array',
    admin: {
      readOnly: true,
      position: 'sidebar',
      initCollapsed: true,
      components: {
        RowLabel: {
          path: 'payload-invoicepdf/client',
          exportName: 'SendHistoryRowLabel',
        },
      },
    },
    fields: [
      {
        name: 'sentAt',
        type: 'date',
        admin: {
          readOnly: true,
          date: { pickerAppearance: 'dayAndTime' },
        },
      },
      {
        name: 'to',
        type: 'email',
        admin: { readOnly: true },
      },
      {
        name: 'templateUsed',
        type: 'text',
        admin: { readOnly: true },
      },
      {
        name: 'subject',
        type: 'text',
        admin: { readOnly: true },
      },
      {
        name: 'attachedPdf',
        type: 'relationship',
        relationTo: mediaCollection,
        admin: { readOnly: true },
      },
      {
        name: 'sentBy',
        type: 'relationship',
        relationTo: 'users',
        admin: { readOnly: true },
      },
    ],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/fields/send-history.ts
git commit -m "feat: add shared sendHistory field definitions"
```

---

## Chunk 2: Extract Convert-to-Invoice Utility

### Task 4: Extract shared `convertQuoteToInvoice` utility

**Files:**
- Create: `src/utils/convert-quote-to-invoice.ts`
- Modify: `src/endpoints/convert-to-invoice.ts`

- [ ] **Step 1: Create `src/utils/convert-quote-to-invoice.ts`**

Extract the core logic from the existing endpoint into a reusable function:

```ts
import type { PayloadRequest } from 'payload'

export const convertQuoteToInvoice = async (
  req: PayloadRequest,
  quoteId: string,
): Promise<{ invoiceId: string; quoteNumber: string }> => {
  const quote = await req.payload.findByID({
    collection: 'quotes' as any,
    id: quoteId,
    depth: 0,
    req,
  })

  if (!quote) {
    throw new Error('Quote not found')
  }

  const quoteData = quote as any

  // Create new invoice from quote data
  const invoice = await req.payload.create({
    collection: 'invoices' as any,
    data: {
      status: 'draft',
      template: quoteData.template,
      issueDate: new Date().toISOString(),
      client: quoteData.client,
      items: quoteData.items?.map((item: any) => ({
        product: item.product,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
      notes: quoteData.notes,
      sourceQuote: quoteId,
    },
    req,
  })

  // Update quote: set status to accepted and append to relatedInvoices
  const existingRelated = Array.isArray(quoteData.relatedInvoices)
    ? quoteData.relatedInvoices.map((r: any) => (typeof r === 'object' ? r.id : r))
    : []
  await req.payload.update({
    collection: 'quotes' as any,
    id: quoteId,
    data: {
      status: 'accepted',
      relatedInvoices: [...existingRelated, invoice.id],
    },
    req,
  })

  return { invoiceId: invoice.id as string, quoteNumber: quoteData.quoteNumber }
}
```

- [ ] **Step 2: Refactor `src/endpoints/convert-to-invoice.ts` to use the utility**

Replace the existing inline logic:

```ts
import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { convertQuoteToInvoice } from '../utils/convert-quote-to-invoice.js'

export const createConvertToInvoiceEndpoint = (
  _pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/convert-to-invoice',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json?.()
    const { quoteId } = body || {}

    if (!quoteId) {
      return Response.json({ error: 'quoteId is required' }, { status: 400 })
    }

    try {
      const result = await convertQuoteToInvoice(req, quoteId)
      return Response.json({
        success: true,
        invoiceId: result.invoiceId,
        message: `Invoice created from quote ${result.quoteNumber}`,
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'Convert to invoice failed', err: error as Error })
      return Response.json({ error: 'Conversion failed' }, { status: 500 })
    }
  },
})
```

- [ ] **Step 3: Verify existing functionality still works**

Run: `cd /home/sam/projects/payload-invoicepdf && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors (or only pre-existing ones).

- [ ] **Step 4: Commit**

```bash
git add src/utils/convert-quote-to-invoice.ts src/endpoints/convert-to-invoice.ts
git commit -m "refactor: extract convertQuoteToInvoice utility from endpoint"
```

---

## Chunk 3: Token System

### Task 5: Create token generation hook

**Files:**
- Create: `src/hooks/generate-tokens.ts`

- [ ] **Step 1: Create `src/hooks/generate-tokens.ts`**

```ts
import crypto from 'crypto'
import type { CollectionBeforeChangeHook } from 'payload'

export const createGenerateTokensHook = (): CollectionBeforeChangeHook =>
  async ({ data, operation }) => {
    if (operation !== 'create') return data

    data.acceptToken = crypto.randomBytes(32).toString('hex')
    data.rejectToken = crypto.randomBytes(32).toString('hex')

    // Set token expiry to validUntil if present, otherwise 30 days from now
    if (data.validUntil) {
      data.tokenExpiresAt = data.validUntil
    } else {
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)
      data.tokenExpiresAt = thirtyDays.toISOString()
    }

    return data
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/generate-tokens.ts
git commit -m "feat: add token generation hook for quotes"
```

### Task 6: Add token and email fields to quotes collection

**Files:**
- Modify: `src/collections/quotes.ts`

- [ ] **Step 1: Add imports**

Add at top of `src/collections/quotes.ts`:

```ts
import { createGenerateTokensHook } from '../hooks/generate-tokens.js'
import { createSendHistoryFields } from '../fields/send-history.js'
```

- [ ] **Step 2: Add `createGenerateTokensHook()` to the `beforeChange` hooks array**

In the `hooks.beforeChange` array, add at the end:

```ts
createGenerateTokensHook(),
```

- [ ] **Step 3: Add token fields before `relatedInvoices`**

Before the `relatedInvoices` field, add:

```ts
{
  name: 'acceptToken',
  type: 'text',
  admin: { hidden: true, readOnly: true },
},
{
  name: 'rejectToken',
  type: 'text',
  admin: { hidden: true, readOnly: true },
},
{
  name: 'tokenExpiresAt',
  type: 'date',
  admin: { hidden: true, readOnly: true },
},
{
  name: 'rejectionReason',
  type: 'textarea',
  admin: { readOnly: true },
},
```

- [ ] **Step 4: Add sendHistory fields**

After the token fields, add:

```ts
...createSendHistoryFields(pluginConfig.mediaCollection),
```

- [ ] **Step 5: Commit**

```bash
git add src/collections/quotes.ts
git commit -m "feat: add token fields, rejectionReason, and sendHistory to quotes"
```

### Task 7: Add email fields to invoices collection

**Files:**
- Modify: `src/collections/invoices.ts`

- [ ] **Step 1: Add import**

```ts
import { createSendHistoryFields } from '../fields/send-history.js'
```

- [ ] **Step 2: Add sendHistory fields before `sourceQuote`**

Before the `sourceQuote` field, add:

```ts
...createSendHistoryFields(pluginConfig.mediaCollection),
```

- [ ] **Step 3: Commit**

```bash
git add src/collections/invoices.ts
git commit -m "feat: add sendHistory and lastSentAt fields to invoices"
```

---

## Chunk 4: Email Templates

### Task 8: Create email template props builder

**Files:**
- Create: `src/utils/build-email-template-props.ts`

- [ ] **Step 1: Create `src/utils/build-email-template-props.ts`**

```ts
import type { EmailTemplateProps } from '../types.js'

export const buildEmailTemplateProps = (args: {
  doc: Record<string, any>
  shopInfo: Record<string, any>
  type: 'invoice' | 'quote'
  viewUrl?: string
}): EmailTemplateProps => {
  const { doc, shopInfo, type, viewUrl } = args

  return {
    type,
    documentNumber: type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber,
    viewUrl,
    client: {
      name: doc.client?.name || '',
      email: doc.client?.email || undefined,
      address: doc.client?.address
        ? {
            street: doc.client.address.street || undefined,
            city: doc.client.address.city || undefined,
            postalCode: doc.client.address.postalCode || undefined,
            country: doc.client.address.country || undefined,
          }
        : undefined,
    },
    company: {
      name: shopInfo.companyName || '',
      logo: shopInfo.companyLogo?.url || undefined,
      email: shopInfo.email || undefined,
      phone: shopInfo.phone || undefined,
      website: shopInfo.website || undefined,
      address: {
        street: shopInfo.address?.street || undefined,
        city: shopInfo.address?.city || undefined,
        postalCode: shopInfo.address?.postalCode || undefined,
        country: shopInfo.address?.country || undefined,
      },
      legalMentions: shopInfo.legalMentions || undefined,
    },
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/build-email-template-props.ts
git commit -m "feat: add buildEmailTemplateProps utility"
```

### Task 9: Create email render utility

**Files:**
- Create: `src/utils/render-email.ts`

- [ ] **Step 1: Create `src/utils/render-email.ts`**

```ts
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { EmailTemplate, EmailTemplateProps } from '../types.js'

export const renderEmailToHtml = (
  template: EmailTemplate,
  props: EmailTemplateProps,
): string => {
  const element = React.createElement(template.component, props)
  return renderToStaticMarkup(element)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/render-email.ts
git commit -m "feat: add renderEmailToHtml utility"
```

### Task 10: Create "Attached PDF" email template

**Files:**
- Create: `src/email-templates/attached-pdf.tsx`

- [ ] **Step 1: Create `src/email-templates/attached-pdf.tsx`**

```tsx
import React from 'react'
import type { EmailTemplateProps } from '../types.js'

export const AttachedPdfEmail: React.FC<EmailTemplateProps> = ({
  type,
  documentNumber,
  client,
  company,
}) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f4f5', padding: '32px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header */}
                <tr>
                  <td style={{ padding: '32px 40px 24px', borderBottom: '1px solid #e4e4e7' }}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        style={{ maxHeight: '48px', maxWidth: '200px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b' }}>
                        {company.name}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '32px 40px' }}>
                    <p style={{ fontSize: '16px', color: '#18181b', margin: '0 0 16px' }}>
                      Dear {client.name},
                    </p>
                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Please find attached {docLabel} <strong>{documentNumber}</strong>.
                    </p>
                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 24px' }}>
                      If you have any questions, please don&apos;t hesitate to reach out.
                    </p>

                    {/* Signature */}
                    <table cellPadding={0} cellSpacing={0} style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
                      <tr>
                        <td style={{ paddingTop: '16px' }}>
                          <p style={{ fontSize: '14px', color: '#18181b', fontWeight: 'bold', margin: '0 0 4px' }}>
                            {company.name}
                          </p>
                          {company.phone && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.phone}
                            </p>
                          )}
                          {company.email && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.email}
                            </p>
                          )}
                          {company.website && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0' }}>
                              {company.website}
                            </p>
                          )}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                {company.legalMentions && (
                  <tr>
                    <td style={{ padding: '16px 40px', backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7' }}>
                      <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
                        {company.legalMentions}
                      </p>
                    </td>
                  </tr>
                )}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/email-templates/attached-pdf.tsx
git commit -m "feat: add Attached PDF email template"
```

### Task 11: Create "Live Document Link" email template

**Files:**
- Create: `src/email-templates/live-document-link.tsx`

- [ ] **Step 1: Create `src/email-templates/live-document-link.tsx`**

```tsx
import React from 'react'
import type { EmailTemplateProps } from '../types.js'

export const LiveDocumentLinkEmail: React.FC<EmailTemplateProps> = ({
  type,
  documentNumber,
  viewUrl,
  client,
  company,
}) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f4f5', padding: '32px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header */}
                <tr>
                  <td style={{ padding: '32px 40px 24px', borderBottom: '1px solid #e4e4e7' }}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        style={{ maxHeight: '48px', maxWidth: '200px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b' }}>
                        {company.name}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '32px 40px' }}>
                    <p style={{ fontSize: '16px', color: '#18181b', margin: '0 0 16px' }}>
                      Dear {client.name},
                    </p>
                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }}>
                      {docLabel} <strong>{documentNumber}</strong> is ready for your review.
                      You can review and respond to this {docLabel.toLowerCase()} online.
                    </p>

                    {/* CTA Button */}
                    {viewUrl && (
                      <table cellPadding={0} cellSpacing={0} style={{ margin: '24px 0' }}>
                        <tr>
                          <td
                            align="center"
                            style={{
                              backgroundColor: '#18181b',
                              borderRadius: '6px',
                              padding: '14px 32px',
                            }}
                          >
                            <a
                              href={viewUrl}
                              style={{
                                color: '#ffffff',
                                fontSize: '15px',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                              }}
                            >
                              View {docLabel}
                            </a>
                          </td>
                        </tr>
                      </table>
                    )}

                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 24px' }}>
                      If you have any questions, please don&apos;t hesitate to reach out.
                    </p>

                    {/* Signature */}
                    <table cellPadding={0} cellSpacing={0} style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
                      <tr>
                        <td style={{ paddingTop: '16px' }}>
                          <p style={{ fontSize: '14px', color: '#18181b', fontWeight: 'bold', margin: '0 0 4px' }}>
                            {company.name}
                          </p>
                          {company.phone && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.phone}
                            </p>
                          )}
                          {company.email && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.email}
                            </p>
                          )}
                          {company.website && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0' }}>
                              {company.website}
                            </p>
                          )}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                {company.legalMentions && (
                  <tr>
                    <td style={{ padding: '16px 40px', backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7' }}>
                      <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
                        {company.legalMentions}
                      </p>
                    </td>
                  </tr>
                )}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/email-templates/live-document-link.tsx
git commit -m "feat: add Live Document Link email template"
```

### Task 12: Create email templates index

**Files:**
- Create: `src/email-templates/index.ts`

- [ ] **Step 1: Create `src/email-templates/index.ts`**

```ts
import type { EmailTemplate } from '../types.js'
import { AttachedPdfEmail } from './attached-pdf.js'
import { LiveDocumentLinkEmail } from './live-document-link.js'

export const attachedPdfEmailTemplate: EmailTemplate = {
  name: 'attached-pdf',
  label: 'Attached PDF',
  description:
    'Sends the document as a PDF file attached to the email. Works out of the box — no frontend setup required.',
  component: AttachedPdfEmail,
  forTypes: ['invoice', 'quote'],
}

export const liveDocumentLinkEmailTemplate: EmailTemplate = {
  name: 'live-document-link',
  label: 'Live Document Link',
  description:
    'Sends a link where the client can view the document online and accept or reject it. Requires frontend setup.',
  component: LiveDocumentLinkEmail,
  forTypes: ['quote'],
}

export const builtInEmailTemplates: EmailTemplate[] = [
  attachedPdfEmailTemplate,
  liveDocumentLinkEmailTemplate,
]

export { AttachedPdfEmail, LiveDocumentLinkEmail }
```

- [ ] **Step 2: Verify the import in `src/defaults.ts` now resolves**

Run: `cd /home/sam/projects/payload-invoicepdf && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/email-templates/
git commit -m "feat: add built-in email templates index with attached-pdf and live-document-link"
```

---

## Chunk 5: Endpoints

### Task 13: Create email-config endpoint

**Files:**
- Create: `src/endpoints/email-config.ts`

- [ ] **Step 1: Create `src/endpoints/email-config.ts`**

```ts
import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createEmailConfigEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/email-config',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailConfig = req.payload.config.email

    if (!emailConfig) {
      return Response.json({ configured: false })
    }

    return Response.json({
      configured: true,
      defaultFromAddress: emailConfig.defaultFromAddress || undefined,
      defaultFromName: emailConfig.defaultFromName || undefined,
    })
  },
})
```

> **Note:** This initial version accepts `pluginConfig` but doesn't use it yet. Task 20 replaces this file to add template listing support using `pluginConfig`.

- [ ] **Step 2: Commit**

```bash
git add src/endpoints/email-config.ts
git commit -m "feat: add email-config endpoint"
```

### Task 14: Create send-email endpoint

**Files:**
- Create: `src/endpoints/send-email.ts`

This is the most complex endpoint. It handles both "attached-pdf" and "live-document-link" templates.

- [ ] **Step 1: Create `src/endpoints/send-email.ts`**

```ts
import crypto from 'crypto'
import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { buildEmailTemplateProps } from '../utils/build-email-template-props.js'
import { renderEmailToHtml } from '../utils/render-email.js'

export const createSendEmailEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/send-email',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailConfig = req.payload.config.email
    if (!emailConfig) {
      return Response.json({ error: 'Email is not configured' }, { status: 400 })
    }

    const body = await req.json?.()
    const { type, id, to, subject, templateName, attachedPdfId } = body || {}

    if (!type || !id || !to || !subject || !templateName) {
      return Response.json(
        { error: 'Required: type, id, to, subject, templateName' },
        { status: 400 },
      )
    }

    if (!['invoice', 'quote'].includes(type)) {
      return Response.json({ error: 'type must be "invoice" or "quote"' }, { status: 400 })
    }

    const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'

    // Find the email template
    const emailTemplate = pluginConfig.emailTemplates.find((t) => t.name === templateName)
    if (!emailTemplate) {
      return Response.json({ error: `Email template "${templateName}" not found` }, { status: 400 })
    }

    // Check forTypes
    if (emailTemplate.forTypes && !emailTemplate.forTypes.includes(type)) {
      return Response.json(
        { error: `Template "${templateName}" is not available for ${type}s` },
        { status: 400 },
      )
    }

    try {
      const doc = await req.payload.findByID({
        collection: collectionSlug as any,
        id,
        depth: 1,
        req,
      })

      if (!doc) {
        return Response.json({ error: 'Document not found' }, { status: 404 })
      }

      const shopInfo = await req.payload.findGlobal({
        slug: 'shop-info' as any,
        depth: 1,
        req,
      })

      // For live-document-link, construct viewUrl and ensure tokens exist
      let viewUrl: string | undefined
      if (templateName === 'live-document-link' && type === 'quote') {
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL
        if (!baseUrl) {
          return Response.json(
            { error: 'NEXT_PUBLIC_SERVER_URL or NEXT_PUBLIC_SITE_URL must be set for live document links' },
            { status: 400 },
          )
        }

        const docData = doc as any

        // Generate tokens if they don't exist yet
        if (!docData.acceptToken || !docData.rejectToken) {
          const acceptToken = crypto.randomBytes(32).toString('hex')
          const rejectToken = crypto.randomBytes(32).toString('hex')
          const tokenExpiresAt = docData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          await req.payload.update({
            collection: 'quotes' as any,
            id,
            data: { acceptToken, rejectToken, tokenExpiresAt },
            context: { skipPdfGeneration: true },
            req,
          })

          docData.acceptToken = acceptToken
        }

        viewUrl = `${baseUrl}/quotes/${id}/accept?token=${docData.acceptToken}`
      }

      // Build props and render email HTML
      const emailProps = buildEmailTemplateProps({
        doc: doc as any,
        shopInfo: shopInfo as any,
        type,
        viewUrl,
      })

      const html = renderEmailToHtml(emailTemplate, emailProps)

      // Build email options
      const from = emailConfig.defaultFromName
        ? `${emailConfig.defaultFromName} <${emailConfig.defaultFromAddress}>`
        : emailConfig.defaultFromAddress

      const emailOptions: Record<string, any> = {
        to,
        from,
        subject,
        html,
      }

      // For attached-pdf template, attach the PDF file
      if (templateName === 'attached-pdf' && attachedPdfId) {
        const mediaDoc = await req.payload.findByID({
          collection: pluginConfig.mediaCollection as any,
          id: attachedPdfId,
          depth: 0,
          req,
        })

        if (mediaDoc) {
          const mediaData = mediaDoc as any
          // Construct full file path for local storage, or use URL for cloud
          const fileUrl = mediaData.url?.startsWith('http')
            ? mediaData.url
            : `${req.payload.config.serverURL || ''}${mediaData.url}`

          emailOptions.attachments = [
            {
              filename: mediaData.filename,
              path: fileUrl,
            },
          ]
        }
      }

      // Send the email
      await req.payload.sendEmail(emailOptions)

      // Update document: append to sendHistory, set lastSentAt, update status if draft
      const docData = doc as any
      const existingHistory = Array.isArray(docData.sendHistory) ? docData.sendHistory : []
      const updateData: Record<string, any> = {
        lastSentAt: new Date().toISOString(),
        sendHistory: [
          ...existingHistory,
          {
            sentAt: new Date().toISOString(),
            to,
            templateUsed: templateName,
            subject,
            attachedPdf: attachedPdfId || undefined,
            sentBy: typeof req.user === 'object' ? req.user.id : req.user,
          },
        ],
      }

      // Update status from draft → sent if currently draft
      if (docData.status === 'draft') {
        updateData.status = 'sent'
      }

      await req.payload.update({
        collection: collectionSlug as any,
        id,
        data: updateData,
        context: { skipPdfGeneration: true },
        req,
      })

      return Response.json({ success: true, message: 'Email sent successfully' })
    } catch (error) {
      req.payload.logger.error({ msg: 'Send email failed', err: error as Error })
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/endpoints/send-email.ts
git commit -m "feat: add send-email endpoint"
```

### Task 15: Create accept-quote endpoint

**Files:**
- Create: `src/endpoints/accept-quote.ts`

- [ ] **Step 1: Create `src/endpoints/accept-quote.ts`**

```ts
import type { Endpoint } from 'payload'
import { convertQuoteToInvoice } from '../utils/convert-quote-to-invoice.js'

export const createAcceptQuoteEndpoint = (): Endpoint => ({
  path: '/invoicepdf/quotes/:id/accept',
  method: 'post',
  handler: async (req) => {
    const id = req.routeParams?.id as string
    if (!id) {
      return Response.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const body = await req.json?.()
    const { token } = body || {}

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 })
    }

    try {
      const quote = await req.payload.findByID({
        collection: 'quotes' as any,
        id,
        depth: 0,
        req,
      })

      if (!quote) {
        return Response.json({ error: 'Quote not found' }, { status: 404 })
      }

      const quoteData = quote as any

      // Check if quote is in a terminal state
      if (['accepted', 'rejected', 'expired'].includes(quoteData.status)) {
        return Response.json(
          { error: `Quote already ${quoteData.status}` },
          { status: 409 },
        )
      }

      // Verify token
      if (token !== quoteData.acceptToken) {
        return Response.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Check expiry
      if (quoteData.tokenExpiresAt && new Date(quoteData.tokenExpiresAt) < new Date()) {
        return Response.json({ error: 'Token expired' }, { status: 410 })
      }

      // Accept the quote and create invoice
      const result = await convertQuoteToInvoice(req, id)

      return Response.json({
        success: true,
        message: 'Quote accepted',
        invoiceId: result.invoiceId,
      })
    } catch (error) {
      req.payload.logger.error({ msg: 'Accept quote failed', err: error as Error })
      return Response.json({ error: 'Failed to accept quote' }, { status: 500 })
    }
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/endpoints/accept-quote.ts
git commit -m "feat: add accept-quote endpoint with token verification"
```

### Task 16: Create reject-quote endpoint

**Files:**
- Create: `src/endpoints/reject-quote.ts`

- [ ] **Step 1: Create `src/endpoints/reject-quote.ts`**

```ts
import type { Endpoint } from 'payload'

export const createRejectQuoteEndpoint = (): Endpoint => ({
  path: '/invoicepdf/quotes/:id/reject',
  method: 'post',
  handler: async (req) => {
    const id = req.routeParams?.id as string
    if (!id) {
      return Response.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const body = await req.json?.()
    const { token, reason } = body || {}

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 })
    }

    try {
      const quote = await req.payload.findByID({
        collection: 'quotes' as any,
        id,
        depth: 0,
        req,
      })

      if (!quote) {
        return Response.json({ error: 'Quote not found' }, { status: 404 })
      }

      const quoteData = quote as any

      // Check if quote is in a terminal state
      if (['accepted', 'rejected', 'expired'].includes(quoteData.status)) {
        return Response.json(
          { error: `Quote already ${quoteData.status}` },
          { status: 409 },
        )
      }

      // Verify token
      if (token !== quoteData.rejectToken) {
        return Response.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Check expiry
      if (quoteData.tokenExpiresAt && new Date(quoteData.tokenExpiresAt) < new Date()) {
        return Response.json({ error: 'Token expired' }, { status: 410 })
      }

      // Reject the quote
      const updateData: Record<string, any> = { status: 'rejected' }
      if (reason) {
        updateData.rejectionReason = reason
      }

      await req.payload.update({
        collection: 'quotes' as any,
        id,
        data: updateData,
        context: { skipPdfGeneration: true },
        req,
      })

      return Response.json({ success: true, message: 'Quote rejected' })
    } catch (error) {
      req.payload.logger.error({ msg: 'Reject quote failed', err: error as Error })
      return Response.json({ error: 'Failed to reject quote' }, { status: 500 })
    }
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/endpoints/reject-quote.ts
git commit -m "feat: add reject-quote endpoint with token verification"
```

---

## Chunk 6: UI Components

### Task 17: Create SendEmailButton sidebar component

**Files:**
- Create: `src/components/SendEmailButton.tsx`

- [ ] **Step 1: Create `src/components/SendEmailButton.tsx`**

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useConfig, useModal } from '@payloadcms/ui'
import { SendEmailDrawer, SEND_EMAIL_DRAWER_SLUG } from './SendEmailDrawer.js'
import './SidebarButton.css'

interface EmailConfig {
  configured: boolean
  defaultFromAddress?: string
  defaultFromName?: string
}

export const SendEmailButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const { openModal } = useModal()
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [hasPdfs, setHasPdfs] = useState(false)

  const type = collectionSlug === 'invoices' ? 'invoice' : 'quote'
  const label = type === 'invoice' ? 'Send Invoice' : 'Send Quote'

  // Check email config
  useEffect(() => {
    let cancelled = false
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${config.routes.api}/invoicepdf/email-config`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setEmailConfig(data)
        }
      } catch {
        setEmailConfig({ configured: false })
      }
    }
    fetchConfig()
    return () => { cancelled = true }
  }, [config.routes.api])

  // Check if document has PDFs
  useEffect(() => {
    if (!id || !collectionSlug) return
    let cancelled = false
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${config.routes.api}/${collectionSlug}/${id}?depth=0`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const doc = await res.json()
          setHasPdfs(Array.isArray(doc.generatedPdfs) && doc.generatedPdfs.length > 0)
        }
      } catch {
        // silently fail
      }
    }
    fetchDoc()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api])

  if (!id) return null

  const disabled = !emailConfig?.configured || !hasPdfs
  let hint = ''
  if (!emailConfig?.configured) {
    hint = 'Email must be configured in Payload config'
  } else if (!hasPdfs) {
    hint = 'Generate a PDF first'
  }

  return (
    <div className="sidebar-button">
      {hint && <p className="sidebar-button__hint">{hint}</p>}
      <button
        type="button"
        onClick={() => openModal(SEND_EMAIL_DRAWER_SLUG)}
        disabled={disabled}
        className="sidebar-button__btn sidebar-button__btn--send"
      >
        {label}
      </button>
      {/* Drawer is always mounted — Payload's modal system controls visibility */}
      {emailConfig?.configured && (
        <SendEmailDrawer
          type={type}
          documentId={id as string}
          emailConfig={emailConfig}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add send button color to `SidebarButton.css`**

Append to `src/components/SidebarButton.css`:

```css
.sidebar-button__btn--send {
  background-color: #2563eb;
}

.sidebar-button__btn--send:hover:not(:disabled) {
  background-color: #1d4ed8;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SendEmailButton.tsx src/components/SidebarButton.css
git commit -m "feat: add SendEmailButton sidebar component"
```

### Task 18: Create SendEmailDrawer component

**Files:**
- Create: `src/components/SendEmailDrawer.tsx`
- Create: `src/components/SendEmailDrawer.css`

This is the largest UI component. Uses Payload's `Drawer` component.

- [ ] **Step 1: Create `src/components/SendEmailDrawer.css`**

```css
.send-email-drawer__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.send-email-drawer__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.send-email-drawer__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-elevation-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.send-email-drawer__input {
  padding: 8px 12px;
  border: 1px solid var(--theme-elevation-200);
  border-radius: 4px;
  font-size: 14px;
  background: var(--theme-input-bg);
  color: var(--theme-elevation-800);
}

.send-email-drawer__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-email-drawer__input--readonly {
  background: var(--theme-elevation-50);
  color: var(--theme-elevation-500);
}

.send-email-drawer__select {
  padding: 8px 12px;
  border: 1px solid var(--theme-elevation-200);
  border-radius: 4px;
  font-size: 14px;
  background: var(--theme-input-bg);
  color: var(--theme-elevation-800);
}

.send-email-drawer__template-desc {
  font-size: 12px;
  color: var(--theme-elevation-500);
  line-height: 1.4;
  margin-top: 4px;
  padding: 8px;
  background: var(--theme-elevation-50);
  border-radius: 4px;
}

.send-email-drawer__warning {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.send-email-drawer__actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.send-email-drawer__send-btn {
  flex: 1;
  padding: 10px 20px;
  background-color: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.send-email-drawer__send-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.send-email-drawer__send-btn:disabled {
  background-color: var(--theme-elevation-300);
  cursor: not-allowed;
}

.send-email-drawer__cancel-btn {
  padding: 10px 20px;
  background: none;
  color: var(--theme-elevation-600);
  border: 1px solid var(--theme-elevation-200);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.send-email-drawer__cancel-btn:hover {
  background: var(--theme-elevation-50);
}

.send-email-drawer__message {
  font-size: 12px;
  margin-top: 4px;
  color: var(--theme-elevation-400);
}

.send-email-drawer__message--error {
  color: #dc2626;
}
```

- [ ] **Step 2: Create `src/components/SendEmailDrawer.tsx`**

```tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useConfig, useModal, Drawer, toast } from '@payloadcms/ui'
import './SendEmailDrawer.css'

interface EmailConfig {
  configured: boolean
  defaultFromAddress?: string
  defaultFromName?: string
}

interface PdfOption {
  id: string
  filename: string
  createdAt: string
}

interface EmailTemplateOption {
  name: string
  label: string
  description: string
}

interface Props {
  type: 'invoice' | 'quote'
  documentId: string
  emailConfig: EmailConfig
}

export const SEND_EMAIL_DRAWER_SLUG = 'send-email-drawer'

export const SendEmailDrawer: React.FC<Props> = ({
  type,
  documentId,
  emailConfig,
}) => {
  const { closeModal } = useModal()
  const { config } = useConfig()
  const apiRoute = config.routes.api
  const serverUrl = config.serverURL || ''

  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [templateName, setTemplateName] = useState('attached-pdf')
  const [templates, setTemplates] = useState<EmailTemplateOption[]>([])
  const [pdfOptions, setPdfOptions] = useState<PdfOption[]>([])
  const [selectedPdfId, setSelectedPdfId] = useState('')
  const [sending, setSending] = useState(false)
  const [serverUrlMissing, setServerUrlMissing] = useState(false)

  const fromDisplay = emailConfig.defaultFromName
    ? `${emailConfig.defaultFromName} <${emailConfig.defaultFromAddress}>`
    : emailConfig.defaultFromAddress || ''

  // Fetch document data to pre-fill fields
  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'
        const res = await fetch(`${apiRoute}/${collectionSlug}/${documentId}?depth=1`, {
          credentials: 'include',
        })
        if (cancelled || !res.ok) return

        const doc = await res.json()

        // Pre-fill To with client email
        if (doc.client?.email) {
          setTo(doc.client.email)
        }

        // Pre-fill Subject
        const docNumber = type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber
        const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'
        setSubject(`${docLabel} ${docNumber || ''}`.trim())

        // Build PDF options from generatedPdfs
        const pdfs = Array.isArray(doc.generatedPdfs) ? doc.generatedPdfs : []
        const pdfOpts: PdfOption[] = pdfs
          .filter((p: any) => typeof p === 'object' && p.id)
          .map((p: any) => ({
            id: p.id,
            filename: p.filename || 'Unknown',
            createdAt: p.createdAt || '',
          }))
        setPdfOptions(pdfOpts)
        if (pdfOpts.length > 0) {
          setSelectedPdfId(pdfOpts[0].id)
        }
      } catch {
        // silently fail
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [apiRoute, type, documentId])

  // Fetch available email templates
  useEffect(() => {
    // Templates come from the document config — for now, fetch from a simple endpoint
    // or hardcode the known templates. The send-email endpoint validates the template name.
    // We'll fetch the config and parse available templates.
    // Since templates are server-side, we expose them via a query param on email-config.
    let cancelled = false
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${apiRoute}/invoicepdf/email-config?includeTemplates=true&type=${type}`, {
          credentials: 'include',
        })
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (data.templates) {
          setTemplates(data.templates)
          if (data.templates.length > 0 && !data.templates.find((t: any) => t.name === templateName)) {
            setTemplateName(data.templates[0].name)
          }
        }
        if (data.serverUrlMissing !== undefined) {
          setServerUrlMissing(data.serverUrlMissing)
        }
      } catch {
        // silently fail
      }
    }
    fetchTemplates()
    return () => { cancelled = true }
  }, [apiRoute, type, templateName])

  const selectedTemplate = templates.find((t) => t.name === templateName)
  const isLiveLink = templateName === 'live-document-link'
  const sendDisabled = sending || !to || !subject || (isLiveLink && serverUrlMissing)

  const handleSend = useCallback(async () => {
    setSending(true)
    try {
      const res = await fetch(`${apiRoute}/invoicepdf/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          id: documentId,
          to,
          subject,
          templateName,
          attachedPdfId: selectedPdfId || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Email sent successfully')
        closeModal(SEND_EMAIL_DRAWER_SLUG)
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSending(false)
    }
  }, [apiRoute, type, documentId, to, subject, templateName, selectedPdfId, closeModal])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Drawer slug={SEND_EMAIL_DRAWER_SLUG} title={type === 'invoice' ? 'Send Invoice' : 'Send Quote'}>
      <div className="send-email-drawer__form">
        {/* To */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">To</label>
          <input
            type="email"
            className="send-email-drawer__input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="client@example.com"
          />
        </div>

        {/* From */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">From</label>
          <input
            type="text"
            className="send-email-drawer__input send-email-drawer__input--readonly"
            value={fromDisplay}
            disabled
          />
        </div>

        {/* Subject */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">Subject</label>
          <input
            type="text"
            className="send-email-drawer__input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Template */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">Email Template</label>
          <select
            className="send-email-drawer__select"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
          {selectedTemplate?.description && (
            <p className="send-email-drawer__template-desc">
              {selectedTemplate.description}
            </p>
          )}
          {isLiveLink && serverUrlMissing && (
            <p className="send-email-drawer__warning">
              NEXT_PUBLIC_SERVER_URL or NEXT_PUBLIC_SITE_URL must be set to use this template.
            </p>
          )}
        </div>

        {/* Attached PDF */}
        {!isLiveLink && pdfOptions.length > 0 && (
          <div className="send-email-drawer__field">
            <label className="send-email-drawer__label">Attached PDF</label>
            <select
              className="send-email-drawer__select"
              value={selectedPdfId}
              onChange={(e) => setSelectedPdfId(e.target.value)}
            >
              {pdfOptions.map((pdf, index) => (
                <option key={pdf.id} value={pdf.id}>
                  {pdf.filename}{index === 0 ? ' (Latest)' : ''} — {formatDate(pdf.createdAt)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="send-email-drawer__actions">
          <button
            type="button"
            className="send-email-drawer__send-btn"
            onClick={handleSend}
            disabled={sendDisabled}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
          <button
            type="button"
            className="send-email-drawer__cancel-btn"
            onClick={() => closeModal(SEND_EMAIL_DRAWER_SLUG)}
          >
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SendEmailDrawer.tsx src/components/SendEmailDrawer.css
git commit -m "feat: add SendEmailDrawer component with Payload Drawer"
```

### Task 19: Create SendHistoryRowLabel component

**Files:**
- Create: `src/components/SendHistoryRowLabel.tsx`

Small component used by the sendHistory array field to show compact row labels.

- [ ] **Step 1: Create `src/components/SendHistoryRowLabel.tsx`**

```tsx
'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const SendHistoryRowLabel: React.FC = () => {
  const { data } = useRowLabel<{ to?: string; sentAt?: string }>()

  const to = data?.to || 'Unknown'
  const date = data?.sentAt
    ? new Date(data.sentAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return <span>{to}{date ? ` — ${date}` : ''}</span>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SendHistoryRowLabel.tsx
git commit -m "feat: add SendHistoryRowLabel component for sendHistory array"
```

---

## Chunk 7: Integration (Plugin Entry Point + Exports)

### Task 20: Update email-config endpoint to include templates

**Files:**
- Modify: `src/endpoints/email-config.ts`

The `SendEmailDrawer` needs the list of available templates (filtered by document type). Extend the `email-config` endpoint to return templates when `includeTemplates=true` is passed.

- [ ] **Step 1: Update `src/endpoints/email-config.ts`**

Replace the file with:

```ts
import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createEmailConfigEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/email-config',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailConfig = req.payload.config.email
    const url = req.url ? new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`) : null
    const includeTemplates = url?.searchParams.get('includeTemplates') === 'true'
    const docType = url?.searchParams.get('type') as 'invoice' | 'quote' | null

    const response: Record<string, any> = {
      configured: !!emailConfig,
    }

    if (emailConfig) {
      response.defaultFromAddress = emailConfig.defaultFromAddress || undefined
      response.defaultFromName = emailConfig.defaultFromName || undefined
    }

    if (includeTemplates) {
      let templates = pluginConfig.emailTemplates
      if (docType) {
        templates = templates.filter(
          (t) => !t.forTypes || t.forTypes.includes(docType),
        )
      }
      response.templates = templates.map((t) => ({
        name: t.name,
        label: t.label,
        description: t.description,
      }))
      response.serverUrlMissing =
        !process.env.NEXT_PUBLIC_SERVER_URL && !process.env.NEXT_PUBLIC_SITE_URL
    }

    return Response.json(response)
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/endpoints/email-config.ts
git commit -m "feat: extend email-config endpoint to return templates"
```

### Task 21: Update plugin entry point (`src/index.ts`)

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add imports for new endpoints**

Add after existing endpoint imports:

```ts
import { createSendEmailEndpoint } from './endpoints/send-email.js'
import { createEmailConfigEndpoint } from './endpoints/email-config.js'
import { createAcceptQuoteEndpoint } from './endpoints/accept-quote.js'
import { createRejectQuoteEndpoint } from './endpoints/reject-quote.js'
```

- [ ] **Step 2: Register 4 new endpoints**

After the two existing `config.endpoints.push(...)` calls, add:

```ts
config.endpoints.push(createSendEmailEndpoint(pluginConfig))
config.endpoints.push(createEmailConfigEndpoint(pluginConfig))
config.endpoints.push(createAcceptQuoteEndpoint())
config.endpoints.push(createRejectQuoteEndpoint())
```

- [ ] **Step 3: Add `SendEmailButton` UI field to invoices sidebar**

In the `invoiceCol` fields array, after the `generatePdf` UI field object, add:

```ts
{
  name: 'sendEmail',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: 'payload-invoicepdf/client#SendEmailButton',
    },
  },
},
```

- [ ] **Step 4: Add `SendEmailButton` UI field to quotes sidebar**

In the `quotesCol` fields array, after the `generatePdf` UI field object, add the same block as Step 3.

- [ ] **Step 5: Add email template type exports**

Update the re-exports at the bottom of the file. Add:

```ts
export type { EmailTemplate, EmailTemplateProps } from './types.js'
export { builtInEmailTemplates, AttachedPdfEmail, LiveDocumentLinkEmail } from './email-templates/index.js'
```

- [ ] **Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat: register email endpoints and SendEmailButton in plugin entry"
```

### Task 22: Update client exports

**Files:**
- Modify: `src/exports/client.ts`

- [ ] **Step 1: Add new exports**

Append to `src/exports/client.ts`:

```ts
export { SendEmailButton } from '../components/SendEmailButton.js'
export { SendEmailDrawer } from '../components/SendEmailDrawer.js'
export { SendHistoryRowLabel } from '../components/SendHistoryRowLabel.js'
```

- [ ] **Step 2: Commit**

```bash
git add src/exports/client.ts
git commit -m "feat: export SendEmailButton, SendEmailDrawer, and SendHistoryRowLabel"
```

### Task 23: Verify full TypeScript compilation

- [ ] **Step 1: Run TypeScript check**

Run: `cd /home/sam/projects/payload-invoicepdf && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors (or only pre-existing ones). Fix any issues before proceeding.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from email sending integration"
```

---

## Chunk 8: Documentation

### Task 24: Create live document link guide

**Files:**
- Create: `docs/live-document-link.md`

- [ ] **Step 1: Create `docs/live-document-link.md`**

```md
# Live Document Link — Setup Guide

The "Live Document Link" email template sends your client a link to view and respond to a quote online. When they click the link, they see the quote and can accept or reject it. Accepting auto-creates an invoice.

## Prerequisites

Set `NEXT_PUBLIC_SERVER_URL` (or `NEXT_PUBLIC_SITE_URL`) in your `.env`:

\`\`\`env
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
\`\`\`

## How It Works

1. You send a quote email using the "Live Document Link" template
2. The client receives an email with a "View Quote" button
3. The button links to a page on YOUR frontend (you build this)
4. The page displays the quote and Accept/Reject buttons
5. Accepting calls the plugin's API → sets quote to "accepted" and creates a draft invoice
6. Rejecting calls the plugin's API → sets quote to "rejected" with an optional reason

The link URL contains a secure token. The token IS the authorization — no login required. Each quote gets unique accept and reject tokens.

## Frontend Pages

You need to create two pages in your Next.js app:

### Accept Page: `app/quotes/[id]/accept/page.tsx`

\`\`\`tsx
'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function AcceptQuotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteId = params.id as string
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired'>('idle')
  const [message, setMessage] = useState('')

  const handleAccept = async () => {
    setStatus('loading')
    try {
      const res = await fetch(\`/api/invoicepdf/quotes/\${quoteId}/accept\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage('Quote accepted! An invoice has been created.')
      } else if (res.status === 410) {
        setStatus('expired')
        setMessage('This link has expired.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (!token) return <p>Invalid link — no token provided.</p>

  return (
    <div>
      <h1>Accept Quote</h1>
      {status === 'idle' && (
        <button onClick={handleAccept}>Accept Quote</button>
      )}
      {status === 'loading' && <p>Processing...</p>}
      {status === 'success' && <p>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
      {status === 'expired' && <p style={{ color: 'orange' }}>{message}</p>}
    </div>
  )
}
\`\`\`

### Reject Page: `app/quotes/[id]/reject/page.tsx`

\`\`\`tsx
'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function RejectQuotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteId = params.id as string
  const token = searchParams.get('token')

  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired'>('idle')
  const [message, setMessage] = useState('')

  const handleReject = async () => {
    setStatus('loading')
    try {
      const res = await fetch(\`/api/invoicepdf/quotes/\${quoteId}/reject\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: reason || undefined }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage('Quote has been declined.')
      } else if (res.status === 410) {
        setStatus('expired')
        setMessage('This link has expired.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (!token) return <p>Invalid link — no token provided.</p>

  return (
    <div>
      <h1>Decline Quote</h1>
      {status === 'idle' && (
        <>
          <textarea
            placeholder="Reason for declining (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <button onClick={handleReject}>Decline Quote</button>
        </>
      )}
      {status === 'loading' && <p>Processing...</p>}
      {status === 'success' && <p>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
      {status === 'expired' && <p style={{ color: 'orange' }}>{message}</p>}
    </div>
  )
}
\`\`\`

## Token Security

- Each token is 32 bytes of cryptographically random data (256-bit entropy)
- Tokens expire based on the quote's `validUntil` date, or 30 days from creation
- Once a quote is accepted, rejected, or expired, the tokens can no longer be used
- The token IS the authorization — anyone with the link can act on the quote
- Treat quote emails like password reset links: don't share them publicly
```

- [ ] **Step 2: Commit**

```bash
git add -f docs/live-document-link.md
git commit -m "docs: add live document link setup guide"
```

### Task 25: Final verification

- [ ] **Step 1: Run TypeScript check**

Run: `cd /home/sam/projects/payload-invoicepdf && npx tsc --noEmit --pretty 2>&1 | head -40`

- [ ] **Step 2: Start dev server and verify**

Run: `cd /home/sam/projects/payload-invoicepdf && pnpm dev`

Verify manually:
1. Open an invoice → sidebar shows "Send Invoice" button
2. Open a quote → sidebar shows "Send Quote" button
3. If no email configured → button disabled with message
4. Click button → drawer opens with pre-filled fields
5. Send history appears in sidebar (collapsed by default)

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: final adjustments from manual testing"
```
