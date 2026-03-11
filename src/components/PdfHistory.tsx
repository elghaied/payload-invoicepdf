'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import './PdfHistory.css'

interface MediaDoc {
  createdAt: string
  filename: string
  filesize: number
  id: string
  mimeType: string
  url: string
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatSize = (bytes: number) => {
  if (!bytes) {return ''}
  if (bytes < 1024) {return `${bytes} B`}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`}
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
    if (!id || !collectionSlug) {return}
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
    void fetchPdfs()
  }, [fetchPdfs])

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!id || !collectionSlug) {return}
      if (!window.confirm('Delete this PDF?')) {return}

      try {
        await fetch(`${apiRoute}/media/${mediaId}`, {
          credentials: 'include',
          method: 'DELETE',
        })

        const updatedIds = mediaDocs
          .filter((doc) => doc.id !== mediaId)
          .map((doc) => doc.id)

        await fetch(`${apiRoute}/${collectionSlug}/${id}`, {
          body: JSON.stringify({ generatedPdfs: updatedIds }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })

        setMediaDocs((prev) => prev.filter((doc) => doc.id !== mediaId))
      } catch {
        // silently fail
      }
    },
    [id, collectionSlug, mediaDocs, apiRoute],
  )

  if (!id) {return null}

  return (
    <div className="pdf-history">
      {loading && (
        <p className="pdf-history__loading">Loading...</p>
      )}

      {!loading && mediaDocs.length === 0 && (
        <div className="pdf-history__empty">
          <p className="pdf-history__empty-text">
            No PDFs generated yet. Use the &quot;Generate PDF&quot; button in the sidebar.
          </p>
        </div>
      )}

      {!loading && mediaDocs.length > 0 && (
        <div className="pdf-history__list">
          {mediaDocs.map((doc, index) => {
            const fullUrl = doc.url?.startsWith('http') ? doc.url : `${serverUrl}${doc.url}`
            return (
              <div className="pdf-history__item" key={doc.id}>
                <div className="pdf-history__icon">PDF</div>
                <div className="pdf-history__info">
                  <div className="pdf-history__name-row">
                    <span className="pdf-history__filename" title={doc.filename}>
                      {doc.filename}
                    </span>
                    {index === 0 && (
                      <span className="pdf-history__badge">Latest</span>
                    )}
                  </div>
                  <div className="pdf-history__meta">
                    <span>{formatDate(doc.createdAt)}</span>
                    {doc.filesize > 0 && <span>{formatSize(doc.filesize)}</span>}
                  </div>
                </div>
                <div className="pdf-history__actions">
                  <a
                    className="pdf-history__download"
                    href={fullUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Download
                  </a>
                  <button
                    className="pdf-history__delete"
                    onClick={() => handleDelete(doc.id)}
                    type="button"
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
