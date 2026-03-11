# Live Document Link — Setup Guide

The "Live Document Link" email template sends your client a link to view and respond to a quote online. When they click the link, they see the quote and can accept or reject it. Accepting auto-creates an invoice.

## Prerequisites

Set `NEXT_PUBLIC_SERVER_URL` (or `NEXT_PUBLIC_SITE_URL`) in your `.env`:

```env
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

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

```tsx
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
      const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/accept`, {
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
```

### Reject Page: `app/quotes/[id]/reject/page.tsx`

```tsx
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
      const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/reject`, {
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
```

## Token Security

- Each token is 32 bytes of cryptographically random data (256-bit entropy)
- Tokens expire based on the quote's `validUntil` date, or 30 days from creation
- Once a quote is accepted, rejected, or expired, the tokens can no longer be used
- The token IS the authorization — anyone with the link can act on the quote
- Treat quote emails like password reset links: don't share them publicly
