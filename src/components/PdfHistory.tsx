'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields, useConfig } from '@payloadcms/ui'

interface MediaDoc {
  id: string
  filename: string
  url: string
}

export const PdfHistory: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const generatedPdfsField = useFormFields(([fields]) => fields['generatedPdfs'])
  const [mediaDocs, setMediaDocs] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(false)

  const rawValue = generatedPdfsField?.value

  // Normalize IDs from relationship value (can be objects or strings)
  const pdfIds: string[] = Array.isArray(rawValue)
    ? rawValue.map((entry: any) => (typeof entry === 'object' ? entry.id ?? entry.value : entry)).filter(Boolean)
    : []

  const serverUrl = config.serverURL || ''

  useEffect(() => {
    if (pdfIds.length === 0) {
      setMediaDocs([])
      return
    }

    let cancelled = false
    const fetchMedia = async () => {
      setLoading(true)
      try {
        const qs = pdfIds.map((pid) => `where[id][in]=${pid}`).join('&')
        const res = await fetch(
          `${config.routes.api}/media?${qs}&limit=${pdfIds.length}&sort=-createdAt`,
          { credentials: 'include' },
        )
        if (!cancelled && res.ok) {
          const data = await res.json()
          setMediaDocs(data.docs ?? [])
        }
      } catch {
        // silently fail — user can retry
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMedia()
    return () => { cancelled = true }
  }, [pdfIds.join(','), config.routes.api])

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!id || !collectionSlug) return
      if (!window.confirm('Delete this PDF?')) return

      try {
        // Delete the media doc
        await fetch(`${config.routes.api}/media/${mediaId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        // Remove from the relationship array
        const updatedIds = pdfIds.filter((pid) => pid !== mediaId)
        await fetch(`${config.routes.api}/${collectionSlug}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ generatedPdfs: updatedIds }),
        })

        setMediaDocs((prev) => prev.filter((doc) => doc.id !== mediaId))
      } catch {
        // silently fail
      }
    },
    [id, collectionSlug, pdfIds, config.routes.api],
  )

  if (!id) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Generated PDFs</p>
      {loading && <p style={{ fontSize: 12, color: '#888' }}>Loading...</p>}
      {!loading && mediaDocs.length === 0 && (
        <p style={{ fontSize: 12, color: '#888' }}>No PDFs generated yet.</p>
      )}
      {mediaDocs.map((doc) => {
        const fullUrl = doc.url?.startsWith('http') ? doc.url : `${serverUrl}${doc.url}`
        return (
          <div
            key={doc.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 0',
              borderBottom: '1px solid #eee',
              gap: 8,
            }}
          >
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: '#0070f3',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={fullUrl}
            >
              {doc.filename}
            </a>
            <button
              type="button"
              onClick={() => handleDelete(doc.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#e11d48',
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 6px',
                flexShrink: 0,
              }}
              title="Delete PDF"
            >
              x
            </button>
          </div>
        )
      })}
    </div>
  )
}
