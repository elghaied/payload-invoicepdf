# Quote Acceptance — Live Document Link

Let clients view, accept, or decline quotes via a secure link. Accepting auto-creates a draft invoice.

## How It Works

1. You send a quote email using the **Live Document Link** template
2. The client receives an email with a "View Quote" button
3. The button links to a page on your frontend (you build this page)
4. The page displays the quote PDF full-screen with accept/decline buttons
5. **Accept** → quote status becomes "accepted", a draft invoice is created
6. **Decline** → quote status becomes "rejected", optional reason is stored

The link contains a secure token. No login required — the token IS the authorization.

## Prerequisites

Set your server URL in `.env`:

```env
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

Without this, the plugin cannot generate the view URL for the email.

## Frontend Setup

You need one page in your Next.js app with two files: a server component that validates the token and fetches the PDF, and a client component for the action buttons.

### Server Component: `app/quotes/[id]/page.tsx`

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { QuoteActions } from './QuoteActions'

type Args = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function QuotePage({ params, searchParams }: Args) {
  const { id } = await params
  const { token } = await searchParams

  if (!token) {
    return <p>Invalid link — no token provided.</p>
  }

  const payload = await getPayload({ config })

  let quote: Record<string, any> | null = null
  try {
    quote = (await payload.findByID({ collection: 'quotes', id, depth: 1 })) as any
  } catch {
    return <p>Quote not found.</p>
  }

  if (token !== quote.acceptToken) {
    return <p>Invalid token.</p>
  }
  if (quote.tokenExpiresAt && new Date(quote.tokenExpiresAt) < new Date()) {
    return <p>This link has expired. Please contact us for a new quote.</p>
  }

  // Get latest PDF URL
  let pdfUrl: string | null = null
  const pdfs = Array.isArray(quote.generatedPdfs) ? quote.generatedPdfs : []
  const latestPdf = pdfs[0]
  if (latestPdf && typeof latestPdf === 'object' && latestPdf.url) {
    pdfUrl = latestPdf.url
  }

  const isProcessed = ['accepted', 'rejected', 'expired'].includes(quote.status)

  return (
    <>
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          title="Quote PDF"
        />
      )}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e4e4e7',
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '16px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        {isProcessed ? (
          <span>Quote already {quote.status}.</span>
        ) : (
          <QuoteActions quoteId={id} token={token} />
        )}
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
        )}
      </div>
    </>
  )
}
```

### Client Component: `app/quotes/[id]/QuoteActions.tsx`

```tsx
'use client'

import { useState } from 'react'

export function QuoteActions({ quoteId, token }: { quoteId: string; token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [message, setMessage] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  const handleAccept = async () => {
    setStatus('loading')
    const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setStatus('done')
    setMessage(res.ok ? 'Quote accepted! An invoice has been created.' : data.error)
  }

  const handleReject = async () => {
    setStatus('loading')
    const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, reason: reason || undefined }),
    })
    const data = await res.json()
    setStatus('done')
    setMessage(res.ok ? 'Quote declined.' : data.error)
  }

  if (status === 'loading') return <span>Processing...</span>
  if (status === 'done') return <span>{message}</span>

  if (showReject) {
    return (
      <>
        <input
          placeholder="Reason for declining (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button onClick={handleReject}>Decline Quote</button>
        <button onClick={() => setShowReject(false)}>Go back</button>
      </>
    )
  }

  return (
    <>
      <button onClick={handleAccept}>Accept Quote</button>
      <button onClick={() => setShowReject(true)}>Decline</button>
    </>
  )
}
```

## API Endpoints

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/invoicepdf/quotes/:id/accept` | POST | `{ token }` | Accepts the quote and creates a draft invoice |
| `/api/invoicepdf/quotes/:id/reject` | POST | `{ token, reason? }` | Rejects the quote with optional reason |

Response codes:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `401` | Invalid token |
| `409` | Quote already accepted/rejected/expired |
| `410` | Token expired |

## Token Security

- 32 bytes of cryptographically random data (256-bit entropy)
- Tokens expire based on the quote's `validUntil` date, or 30 days from creation
- Once a quote is accepted, rejected, or expired, tokens can no longer be used
- The token IS the authorization — anyone with the link can act on the quote
- Treat quote emails like password reset links: don't share them publicly

## Quote-to-Invoice Conversion

When a client accepts a quote:

1. A new invoice is created with the quote's template, client details, line items, and notes
2. The invoice's `sourceQuote` field links back to the original quote
3. The quote's status is set to "accepted"
4. The new invoice appears in the quote's **Related Invoices** sidebar

The created invoice starts in `draft` status so you can review it before sending.
