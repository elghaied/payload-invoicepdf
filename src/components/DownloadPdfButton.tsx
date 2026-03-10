'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

export const DownloadPdfButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const pdfUrlField = useFormFields(([fields]) => fields['pdfUrl'])

  const pdfUrl = pdfUrlField?.value as string | undefined

  if (!pdfUrl || !id) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <a
        href={pdfUrl}
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
        Download PDF
      </a>
    </div>
  )
}
