'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './SidebarButton.css'

export const DownloadPdfButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const [latestUrl, setLatestUrl] = useState<null | string>(null)

  const serverUrl = config.serverURL || ''

  useEffect(() => {
    if (!id || !collectionSlug) {return}

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

    void fetchLatest()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api, serverUrl])

  if (!latestUrl || !id) {return null}

  return (
    <div className="sidebar-button">
      <a
        className="sidebar-button__link"
        href={latestUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Download Latest PDF
      </a>
    </div>
  )
}
