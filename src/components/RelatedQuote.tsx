'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './RelatedDocument.css'

interface QuoteDoc {
  id: string
  issueDate?: string
  quoteNumber?: string
  status?: string
}

export const RelatedQuote: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [quote, setQuote] = useState<null | QuoteDoc>(null)

  useEffect(() => {
    if (!id || collectionSlug !== 'invoices') {return}

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
              issueDate: doc.sourceQuote.issueDate,
              quoteNumber: doc.sourceQuote.quoteNumber,
              status: doc.sourceQuote.status,
            })
          }
        }
      } catch {
        // silently fail
      }
    }

    void fetchRelated()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api])

  if (!id || collectionSlug !== 'invoices' || !quote) {return null}

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="related-document__header">Source Quote</div>
      <a
        className="related-document__card"
        href={`${config.routes.admin}/collections/quotes/${quote.id}`}
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
