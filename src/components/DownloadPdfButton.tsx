'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useConfig } from '@payloadcms/ui'

export const DownloadPdfButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [latestUrl, setLatestUrl] = useState<string | null>(null)

  const serverUrl = config.serverURL || ''

  useEffect(() => {
    if (!id || !collectionSlug) return

    let cancelled = false
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${config.routes.api}/${collectionSlug}/${id}?depth=1`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const doc = await res.json()
          const firstPdf = Array.isArray(doc.generatedPdfs) && doc.generatedPdfs[0]
          if (firstPdf && typeof firstPdf === 'object' && firstPdf.url) {
            const url = firstPdf.url.startsWith('http') ? firstPdf.url : `${serverUrl}${firstPdf.url}`
            setLatestUrl(url)
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchLatest()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api, serverUrl])

  if (!latestUrl || !id) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <a
        href={latestUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: '#0070f3',
          color: '#fff',
          borderRadius: 4,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 500,
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        Download Latest PDF
      </a>
    </div>
  )
}
