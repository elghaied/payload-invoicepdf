'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import './SidebarButton.css'

export const ConvertToInvoiceButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<null | string>(null)

  const handleConvert = useCallback(async () => {
    if (!id) {return}
    if (!window.confirm('Convert this quote to an invoice? The quote will be marked as accepted.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const apiUrl = `${config.routes.api}/invoicepdf/convert-to-invoice`

      const res = await fetch(apiUrl, {
        body: JSON.stringify({ quoteId: id }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
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

  if (!id || collectionSlug !== 'quotes') {return null}

  return (
    <div className="sidebar-button">
      <button
        className="sidebar-button__btn sidebar-button__btn--convert"
        disabled={loading}
        onClick={handleConvert}
        type="button"
      >
        {loading ? 'Converting...' : 'Convert to Invoice'}
      </button>
      {message && (
        <p className="sidebar-button__message">{message}</p>
      )}
    </div>
  )
}
