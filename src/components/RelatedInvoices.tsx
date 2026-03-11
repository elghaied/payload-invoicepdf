'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './RelatedDocument.css'

interface InvoiceDoc {
  id: string
  invoiceNumber?: string
  issueDate?: string
  status?: string
}

export const RelatedInvoices: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([])

  useEffect(() => {
    if (!id || collectionSlug !== 'quotes') {return}

    let cancelled = false
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${config.routes.api}/quotes/${id}?depth=1`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const doc = await res.json()
          if (Array.isArray(doc.relatedInvoices)) {
            const resolved = doc.relatedInvoices
              .filter((inv: any) => inv && typeof inv === 'object')
              .map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                issueDate: inv.issueDate,
                status: inv.status,
              }))
            setInvoices(resolved)
          }
        }
      } catch {
        // silently fail
      }
    }

    void fetchRelated()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api])

  if (!id || collectionSlug !== 'quotes' || invoices.length === 0) {return null}

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="related-document__header">Related Invoices</div>
      {invoices.map((inv) => (
        <a
          className="related-document__card"
          href={`${config.routes.admin}/collections/invoices/${inv.id}`}
          key={inv.id}
        >
          <div className="related-document__title">
            {inv.invoiceNumber || inv.id}
          </div>
          <div className="related-document__meta">
            {inv.status && (
              <span className={`related-document__status related-document__status--${inv.status}`}>
                {inv.status}
              </span>
            )}
            {inv.issueDate && (
              <span className="related-document__date">
                {new Date(inv.issueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
