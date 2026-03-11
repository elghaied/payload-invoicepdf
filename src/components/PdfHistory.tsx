'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'

interface MediaDoc {
  id: string
  filename: string
  url: string
  filesize: number
  createdAt: string
  mimeType: string
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatSize = (bytes: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const PdfHistory: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [mediaDocs, setMediaDocs] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(true)

  const serverUrl = config.serverURL || ''
  const apiRoute = config.routes.api

  const fetchPdfs = useCallback(async () => {
    if (!id || !collectionSlug) return
    setLoading(true)
    try {
      const res = await fetch(`${apiRoute}/${collectionSlug}/${id}?depth=1`, {
        credentials: 'include',
      })
      if (res.ok) {
        const doc = await res.json()
        const pdfs = Array.isArray(doc.generatedPdfs) ? doc.generatedPdfs : []
        setMediaDocs(pdfs.filter((p: any) => typeof p === 'object' && p.id))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [id, collectionSlug, apiRoute])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!id || !collectionSlug) return
      if (!window.confirm('Delete this PDF?')) return

      try {
        await fetch(`${apiRoute}/media/${mediaId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        const updatedIds = mediaDocs
          .filter((doc) => doc.id !== mediaId)
          .map((doc) => doc.id)

        await fetch(`${apiRoute}/${collectionSlug}/${id}`, {
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
    [id, collectionSlug, mediaDocs, apiRoute],
  )

  if (!id) return null

  return (
    <div style={{ maxWidth: 800 }}>
      {loading && (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: 14, padding: '20px 0' }}>
          Loading...
        </p>
      )}

      {!loading && mediaDocs.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            border: '1px dashed var(--theme-elevation-150)',
            borderRadius: 8,
          }}
        >
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: 14, margin: 0 }}>
            No PDFs generated yet. Use the &quot;Generate PDF&quot; button in the sidebar.
          </p>
        </div>
      )}

      {!loading && mediaDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mediaDocs.map((doc, index) => {
            const fullUrl = doc.url?.startsWith('http') ? doc.url : `${serverUrl}${doc.url}`
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  border: '1px solid var(--theme-elevation-150)',
                  borderRadius: 8,
                  background: 'var(--theme-elevation-50)',
                }}
              >
                {/* File type indicator */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    background: 'var(--theme-elevation-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--theme-elevation-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  PDF
                </div>

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--theme-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </span>
                    {index === 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--theme-success-500, #22c55e)',
                          background: 'var(--theme-success-100, #dcfce7)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginTop: 4,
                      fontSize: 12,
                      color: 'var(--theme-elevation-500)',
                    }}
                  >
                    <span>{formatDate(doc.createdAt)}</span>
                    {doc.filesize > 0 && <span>{formatSize(doc.filesize)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      fontSize: 13,
                      borderRadius: 4,
                      border: '1px solid var(--theme-elevation-150)',
                      background: 'var(--theme-elevation-0)',
                      color: 'var(--theme-text)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 13,
                      borderRadius: 4,
                      border: '1px solid var(--theme-error-500, #e11d48)',
                      background: 'transparent',
                      color: 'var(--theme-error-500, #e11d48)',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
