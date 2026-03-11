'use client'

import { useConfig, useDocumentInfo, useModal } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { SEND_EMAIL_DRAWER_SLUG, SendEmailDrawer } from './SendEmailDrawer.js'
import './SidebarButton.css'

interface EmailConfig {
  configured: boolean
  defaultFromAddress?: string
  defaultFromName?: string
}

export const SendEmailButton: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const { openModal } = useModal()
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [hasPdfs, setHasPdfs] = useState(false)

  const type = collectionSlug === 'invoices' ? 'invoice' : 'quote'
  const label = type === 'invoice' ? 'Send Invoice' : 'Send Quote'

  // Check email config
  useEffect(() => {
    let cancelled = false
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${config.routes.api}/invoicepdf/email-config`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setEmailConfig(data)
        }
      } catch {
        setEmailConfig({ configured: false })
      }
    }
    void fetchConfig()
    return () => { cancelled = true }
  }, [config.routes.api])

  // Check if document has PDFs
  useEffect(() => {
    if (!id || !collectionSlug) {return}
    let cancelled = false
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${config.routes.api}/${collectionSlug}/${id}?depth=0`, {
          credentials: 'include',
        })
        if (!cancelled && res.ok) {
          const doc = await res.json()
          setHasPdfs(Array.isArray(doc.generatedPdfs) && doc.generatedPdfs.length > 0)
        }
      } catch {
        // silently fail
      }
    }
    void fetchDoc()
    return () => { cancelled = true }
  }, [id, collectionSlug, config.routes.api])

  if (!id) {return null}

  const disabled = !emailConfig?.configured || !hasPdfs
  let hint = ''
  if (!emailConfig?.configured) {
    hint = 'Email must be configured in Payload config'
  } else if (!hasPdfs) {
    hint = 'Generate a PDF first'
  }

  return (
    <div className="sidebar-button">
      {hint && <p className="sidebar-button__hint">{hint}</p>}
      <button
        className="sidebar-button__btn sidebar-button__btn--send"
        disabled={disabled}
        onClick={() => openModal(SEND_EMAIL_DRAWER_SLUG)}
        type="button"
      >
        {label}
      </button>
      {/* Drawer is always mounted — Payload's modal system controls visibility */}
      {emailConfig?.configured && (
        <SendEmailDrawer
          documentId={id as string}
          emailConfig={emailConfig}
          type={type}
        />
      )}
    </div>
  )
}
