'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'
import './RelatedDocument.css'

interface QuoteDoc {
  id: string
  quoteNumber?: string
  status?: string
  issueDate?: string
}

export const RelatedQuote: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [quote, setQuote] = useState<QuoteDoc | null>(null)

  useEffect(() => {
    if (!id || collectionSlug !== 'invoices') return

    let cancelled = false
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${config.routes.api}/invoices/${id}?depth=1`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const doc = await res.json()
          if (doc.sourceQuote && typeof doc.sourceQuote === 'object') {
            setQuote({
              id: doc.sourceQuote.id,
              quoteNumber: doc.sourceQuote.quoteNumber,
              status: doc.sourceQuote.status,
              issueDate: doc.sourceQuote.issueDate,
            })
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchRelated()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api])

  if (!id || collectionSlug !== 'invoices' || !quote) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="related-document__header">Source Quote</div>
      <a
        href={`${config.routes.admin}/collections/quotes/${quote.id}`}
        className="related-document__card"
      >
        <div className="related-document__title">
          {quote.quoteNumber || quote.id}
        </div>
        <div className="related-document__meta">
          {quote.status && (
            <span className={`related-document__status related-document__status--${quote.status}`}>
              {quote.status}
            </span>
          )}
          {quote.issueDate && (
            <span className="related-document__date">
              {new Date(quote.issueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </a>
    </div>
  )
}
