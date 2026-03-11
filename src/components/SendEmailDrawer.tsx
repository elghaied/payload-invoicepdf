'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useConfig, useModal, Drawer, toast } from '@payloadcms/ui'
import './SendEmailDrawer.css'

interface EmailConfig {
  configured: boolean
  defaultFromAddress?: string
  defaultFromName?: string
}

interface PdfOption {
  id: string
  filename: string
  createdAt: string
}

interface EmailTemplateOption {
  name: string
  label: string
  description: string
  kind: 'attachment' | 'link'
}

interface Props {
  type: 'invoice' | 'quote'
  documentId: string
  emailConfig: EmailConfig
}

export const SEND_EMAIL_DRAWER_SLUG = 'send-email-drawer'

export const SendEmailDrawer: React.FC<Props> = ({
  type,
  documentId,
  emailConfig,
}) => {
  const { closeModal } = useModal()
  const { config } = useConfig()
  const apiRoute = config.routes.api

  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedKind, setSelectedKind] = useState<'attachment' | 'link'>('attachment')
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<EmailTemplateOption[]>([])
  const [pdfOptions, setPdfOptions] = useState<PdfOption[]>([])
  const [selectedPdfId, setSelectedPdfId] = useState('')
  const [sending, setSending] = useState(false)
  const [serverUrlMissing, setServerUrlMissing] = useState(false)

  const fromDisplay = emailConfig.defaultFromName
    ? `${emailConfig.defaultFromName} <${emailConfig.defaultFromAddress}>`
    : emailConfig.defaultFromAddress || ''

  // Fetch document data to pre-fill fields
  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'
        const res = await fetch(`${apiRoute}/${collectionSlug}/${documentId}?depth=1`, {
          credentials: 'include',
        })
        if (cancelled || !res.ok) return

        const doc = await res.json()

        // Pre-fill To with client email
        if (doc.client?.email) {
          setTo(doc.client.email)
        }

        // Pre-fill Subject
        const docNumber = type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber
        const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'
        setSubject(`${docLabel} ${docNumber || ''}`.trim())

        // Build PDF options from generatedPdfs
        const pdfs = Array.isArray(doc.generatedPdfs) ? doc.generatedPdfs : []
        const pdfOpts: PdfOption[] = pdfs
          .filter((p: any) => typeof p === 'object' && p.id)
          .map((p: any) => ({
            id: p.id,
            filename: p.filename || 'Unknown',
            createdAt: p.createdAt || '',
          }))
        setPdfOptions(pdfOpts)
        if (pdfOpts.length > 0) {
          setSelectedPdfId(pdfOpts[0].id)
        }
      } catch {
        // silently fail
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [apiRoute, type, documentId])

  // Fetch available email templates
  useEffect(() => {
    let cancelled = false
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${apiRoute}/invoicepdf/email-config?includeTemplates=true&type=${type}`, {
          credentials: 'include',
        })
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (data.templates) {
          setTemplates(data.templates)
          // Auto-select first template of the current kind
          const ofKind = data.templates.filter((t: EmailTemplateOption) => t.kind === selectedKind)
          if (ofKind.length > 0 && !ofKind.find((t: EmailTemplateOption) => t.name === templateName)) {
            setTemplateName(ofKind[0].name)
          } else if (ofKind.length === 0 && data.templates.length > 0) {
            // Fall back to whatever kind is available
            setSelectedKind(data.templates[0].kind)
            setTemplateName(data.templates[0].name)
          }
        }
        if (data.serverUrlMissing !== undefined) {
          setServerUrlMissing(data.serverUrlMissing)
        }
      } catch {
        // silently fail
      }
    }
    fetchTemplates()
    return () => { cancelled = true }
  }, [apiRoute, type, selectedKind, templateName])

  const availableKinds = [...new Set(templates.map((t) => t.kind))]
  const filteredTemplates = templates.filter((t) => t.kind === selectedKind)
  const selectedTemplate = templates.find((t) => t.name === templateName)
  const isLink = selectedKind === 'link'
  const sendDisabled = sending || !to || !subject || !templateName || (isLink && serverUrlMissing)

  const handleKindChange = (kind: 'attachment' | 'link') => {
    setSelectedKind(kind)
    const firstOfKind = templates.find((t) => t.kind === kind)
    if (firstOfKind) {
      setTemplateName(firstOfKind.name)
    }
  }

  const handleSend = useCallback(async () => {
    setSending(true)
    try {
      const res = await fetch(`${apiRoute}/invoicepdf/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          id: documentId,
          to,
          subject,
          templateName,
          attachedPdfId: selectedPdfId || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Email sent successfully')
        closeModal(SEND_EMAIL_DRAWER_SLUG)
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSending(false)
    }
  }, [apiRoute, type, documentId, to, subject, templateName, selectedPdfId, closeModal])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Drawer slug={SEND_EMAIL_DRAWER_SLUG} title={type === 'invoice' ? 'Send Invoice' : 'Send Quote'}>
      <div className="send-email-drawer__form">
        {/* To */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">To</label>
          <input
            type="email"
            className="send-email-drawer__input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="client@example.com"
          />
        </div>

        {/* From */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">From</label>
          <input
            type="text"
            className="send-email-drawer__input send-email-drawer__input--readonly"
            value={fromDisplay}
            disabled
          />
        </div>

        {/* Subject */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">Subject</label>
          <input
            type="text"
            className="send-email-drawer__input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Delivery Type */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">Delivery Type</label>
          <div className="send-email-drawer__kind-toggle">
            {availableKinds.includes('attachment') && (
              <button
                type="button"
                className={`send-email-drawer__kind-btn${selectedKind === 'attachment' ? ' send-email-drawer__kind-btn--active' : ''}`}
                onClick={() => handleKindChange('attachment')}
              >
                Attachment
              </button>
            )}
            {availableKinds.includes('link') && (
              <button
                type="button"
                className={`send-email-drawer__kind-btn${selectedKind === 'link' ? ' send-email-drawer__kind-btn--active' : ''}`}
                onClick={() => handleKindChange('link')}
              >
                Link
              </button>
            )}
          </div>
          {isLink && serverUrlMissing && (
            <p className="send-email-drawer__warning">
              NEXT_PUBLIC_SERVER_URL or NEXT_PUBLIC_SITE_URL must be set for link templates.
            </p>
          )}
        </div>

        {/* Template */}
        <div className="send-email-drawer__field">
          <label className="send-email-drawer__label">Email Template</label>
          <select
            className="send-email-drawer__select"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          >
            {filteredTemplates.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
          {selectedTemplate?.description && (
            <p className="send-email-drawer__template-desc">
              {selectedTemplate.description}
            </p>
          )}
        </div>

        {/* Attached PDF */}
        {pdfOptions.length > 0 && (
          <div className="send-email-drawer__field">
            <label className="send-email-drawer__label">
              {isLink ? 'Attach PDF (optional)' : 'Attached PDF'}
            </label>
            <select
              className="send-email-drawer__select"
              value={selectedPdfId}
              onChange={(e) => setSelectedPdfId(e.target.value)}
            >
              {isLink && <option value="">None</option>}
              {pdfOptions.map((pdf, index) => (
                <option key={pdf.id} value={pdf.id}>
                  {pdf.filename}{index === 0 ? ' (Latest)' : ''} — {formatDate(pdf.createdAt)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="send-email-drawer__actions">
          <button
            type="button"
            className="send-email-drawer__send-btn"
            onClick={handleSend}
            disabled={sendDisabled}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
          <button
            type="button"
            className="send-email-drawer__cancel-btn"
            onClick={() => closeModal(SEND_EMAIL_DRAWER_SLUG)}
          >
            Cancel
          </button>
        </div>
      </div>
    </Drawer>
  )
}
