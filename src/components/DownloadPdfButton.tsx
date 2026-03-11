'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields, useConfig } from '@payloadcms/ui'

export const DownloadPdfButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const generatedPdfsField = useFormFields(([fields]) => fields['generatedPdfs'])
  const [latestUrl, setLatestUrl] = useState<string | null>(null)

  const rawValue = generatedPdfsField?.value
  const firstId = Array.isArray(rawValue) && rawValue.length > 0
    ? (typeof rawValue[0] === 'object' ? rawValue[0].id ?? rawValue[0].value : rawValue[0])
    : null

  const serverUrl = config.serverURL || ''

  useEffect(() => {
    if (!firstId) {
      setLatestUrl(null)
      return
    }

    let cancelled = false
    const fetchUrl = async () => {
      try {
        const res = await fetch(`${config.routes.api}/media/${firstId}`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          const url = data.url?.startsWith('http') ? data.url : `${serverUrl}${data.url}`
          setLatestUrl(url)
        }
      } catch {
        // silently fail
      }
    }

    fetchUrl()
    return () => { cancelled = true }
  }, [firstId, config.routes.api, serverUrl])

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
