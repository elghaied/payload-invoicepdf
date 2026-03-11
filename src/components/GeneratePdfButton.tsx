'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'
import './SidebarButton.css'

export const GeneratePdfButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const type = collectionSlug === 'invoices' ? 'invoice' : 'quote'

  const handleGenerate = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setMessage(null)

    try {
      const apiUrl = `${config.routes.api}/invoicepdf/generate-pdf`

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, id }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        setMessage('PDF generated!')
      } else {
        const data = await res.json()
        setMessage(data.error || 'Generation failed')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }, [id, type, config.routes.api])

  if (!id) return null

  return (
    <div className="sidebar-button">
      <p className="sidebar-button__hint">
        Save your changes before generating — unsaved edits won't appear in the PDF.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="sidebar-button__btn sidebar-button__btn--generate"
      >
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>
      {message && (
        <p className="sidebar-button__message">{message}</p>
      )}
    </div>
  )
}
