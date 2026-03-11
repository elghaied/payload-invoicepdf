import React from 'react'
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
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>&#9888;</div>
          <h1 style={styles.title}>Invalid Link</h1>
          <p style={styles.subtitle}>This link is missing a required token. Please use the link from your email.</p>
        </div>
      </div>
    )
  }

  const payload = await getPayload({ config })

  let quote: Record<string, any> | null = null
  let error: string | null = null
  let pdfUrl: string | null = null

  try {
    const doc = await payload.findByID({
      collection: 'quotes' as any,
      id,
      depth: 1,
    })
    quote = doc as any
  } catch {
    error = 'Quote not found.'
  }

  if (quote) {
    // Validate token
    if (token !== quote.acceptToken) {
      error = 'Invalid token.'
      quote = null
    } else if (quote.tokenExpiresAt && new Date(quote.tokenExpiresAt) < new Date()) {
      error = 'This link has expired. Please contact us for a new quote.'
      quote = null
    }
  }

  // Get latest PDF URL
  if (quote) {
    const pdfs = Array.isArray(quote.generatedPdfs) ? quote.generatedPdfs : []
    const latestPdf = pdfs[0]
    if (latestPdf && typeof latestPdf === 'object' && latestPdf.url) {
      pdfUrl = latestPdf.url
    } else if (latestPdf && typeof latestPdf === 'string') {
      // Not populated, fetch it
      try {
        const mediaDoc = await payload.findByID({
          collection: 'media' as any,
          id: latestPdf,
          depth: 0,
        })
        pdfUrl = (mediaDoc as any)?.url || null
      } catch {
        // PDF not found, continue without it
      }
    }
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>&#10060;</div>
          <h1 style={styles.title}>Error</h1>
          <p style={styles.subtitle}>{error}</p>
        </div>
      </div>
    )
  }

  const isProcessed = ['accepted', 'rejected', 'expired'].includes(quote?.status)

  return (
    <>
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={styles.iframe}
          title="Quote PDF"
        />
      )}

      <div style={styles.actionBar}>
        {isProcessed ? (
          <span style={styles.processedText}>
            Quote {quote!.status.charAt(0).toUpperCase() + quote!.status.slice(1)}
          </span>
        ) : (
          <QuoteActions quoteId={id} token={token} />
        )}
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
            Download PDF
          </a>
        )}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    padding: '24px',
  },
  iframe: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    zIndex: 0,
  },
  actionBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderTop: '1px solid #e4e4e7',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
  },
  processedText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#71717a',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#18181b',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717a',
    margin: '0 0 24px',
    lineHeight: '1.5',
  },
  downloadLink: {
    fontSize: '13px',
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
}
