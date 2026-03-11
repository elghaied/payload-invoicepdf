'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'
import './SidebarButton.css'

export const ConvertToInvoiceButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleConvert = useCallback(async () => {
    if (!id) return
    if (!window.confirm('Convert this quote to an invoice? The quote will be marked as accepted.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const apiUrl = `${config.routes.api}/invoicepdf/convert-to-invoice`

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quoteId: id }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage(`Invoice created! ID: ${data.invoiceId}`)
      } else {
        setMessage(data.error || 'Conversion failed')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }, [id, config.routes.api])

  if (!id || collectionSlug !== 'quotes') return null

  return (
    <div className="sidebar-button">
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="sidebar-button__btn sidebar-button__btn--convert"
      >
        {loading ? 'Converting...' : 'Convert to Invoice'}
      </button>
      {message && (
        <p className="sidebar-button__message">{message}</p>
      )}
    </div>
  )
}
