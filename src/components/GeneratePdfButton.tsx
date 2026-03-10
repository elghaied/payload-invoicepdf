'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'

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
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 16px',
          backgroundColor: loading ? '#999' : '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>
      {message && (
        <p style={{ fontSize: 12, marginTop: 4, color: '#666' }}>{message}</p>
      )}
    </div>
  )
}
