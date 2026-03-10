'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'

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
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 16px',
          backgroundColor: loading ? '#999' : '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {loading ? 'Converting...' : 'Convert to Invoice'}
      </button>
      {message && (
        <p style={{ fontSize: 12, marginTop: 4, color: '#666' }}>{message}</p>
      )}
    </div>
  )
}
