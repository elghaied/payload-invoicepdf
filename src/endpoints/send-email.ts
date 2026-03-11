import crypto from 'crypto'
import type { Endpoint } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { buildEmailTemplateProps } from '../utils/build-email-template-props.js'
import { renderEmailToHtml } from '../utils/render-email.js'

export const createSendEmailEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  path: '/invoicepdf/send-email',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailAdapter = req.payload.email
    if (!emailAdapter) {
      return Response.json({ error: 'Email is not configured' }, { status: 400 })
    }

    const body = await req.json?.()
    const { type, id, to, subject, templateName, attachedPdfId } = body || {}

    if (!type || !id || !to || !subject || !templateName) {
      return Response.json(
        { error: 'Required: type, id, to, subject, templateName' },
        { status: 400 },
      )
    }

    if (!['invoice', 'quote'].includes(type)) {
      return Response.json({ error: 'type must be "invoice" or "quote"' }, { status: 400 })
    }

    const collectionSlug = type === 'invoice' ? 'invoices' : 'quotes'

    // Find the email template
    const emailTemplate = pluginConfig.emailTemplates.find((t) => t.name === templateName)
    if (!emailTemplate) {
      return Response.json({ error: `Email template "${templateName}" not found` }, { status: 400 })
    }

    // Check forTypes
    if (emailTemplate.forTypes && !emailTemplate.forTypes.includes(type)) {
      return Response.json(
        { error: `Template "${templateName}" is not available for ${type}s` },
        { status: 400 },
      )
    }

    try {
      const doc = await req.payload.findByID({
        collection: collectionSlug as any,
        id,
        depth: 1,
        req,
      })

      if (!doc) {
        return Response.json({ error: 'Document not found' }, { status: 404 })
      }

      const shopInfo = await req.payload.findGlobal({
        slug: 'shop-info' as any,
        depth: 1,
        req,
      })

      // For live-document-link, construct viewUrl and ensure tokens exist
      let viewUrl: string | undefined
      if (templateName === 'live-document-link' && type === 'quote') {
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL
        if (!baseUrl) {
          return Response.json(
            { error: 'NEXT_PUBLIC_SERVER_URL or NEXT_PUBLIC_SITE_URL must be set for live document links' },
            { status: 400 },
          )
        }

        const docData = doc as any

        // Generate tokens if they don't exist yet
        if (!docData.acceptToken || !docData.rejectToken) {
          const acceptToken = crypto.randomBytes(32).toString('hex')
          const rejectToken = crypto.randomBytes(32).toString('hex')
          const tokenExpiresAt = docData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          await req.payload.update({
            collection: 'quotes' as any,
            id,
            data: { acceptToken, rejectToken, tokenExpiresAt },
            context: { skipPdfGeneration: true },
            req,
          })

          docData.acceptToken = acceptToken
        }

        viewUrl = `${baseUrl}/quotes/${id}/accept?token=${docData.acceptToken}`
      }

      // Build props and render email HTML
      const emailProps = buildEmailTemplateProps({
        doc: doc as any,
        shopInfo: shopInfo as any,
        type,
        viewUrl,
      })

      const html = await renderEmailToHtml(emailTemplate, emailProps)

      // Build email options
      const from = emailAdapter.defaultFromName
        ? `${emailAdapter.defaultFromName} <${emailAdapter.defaultFromAddress}>`
        : emailAdapter.defaultFromAddress

      const emailOptions: Record<string, any> = {
        to,
        from,
        subject,
        html,
      }

      // For attached-pdf template, attach the PDF file
      if (templateName === 'attached-pdf' && attachedPdfId) {
        const mediaDoc = await req.payload.findByID({
          collection: pluginConfig.mediaCollection as any,
          id: attachedPdfId,
          depth: 0,
          req,
        })

        if (mediaDoc) {
          const mediaData = mediaDoc as any
          // Construct full file path for local storage, or use URL for cloud
          const fileUrl = mediaData.url?.startsWith('http')
            ? mediaData.url
            : `${req.payload.config.serverURL || ''}${mediaData.url}`

          emailOptions.attachments = [
            {
              filename: mediaData.filename,
              path: fileUrl,
            },
          ]
        }
      }

      // Send the email
      await req.payload.sendEmail(emailOptions)

      // Update document: append to sendHistory, set lastSentAt, update status if draft
      const docData = doc as any
      const existingHistory = Array.isArray(docData.sendHistory) ? docData.sendHistory : []
      const updateData: Record<string, any> = {
        lastSentAt: new Date().toISOString(),
        sendHistory: [
          ...existingHistory,
          {
            sentAt: new Date().toISOString(),
            to,
            templateUsed: templateName,
            subject,
            attachedPdf: attachedPdfId || undefined,
            sentBy: typeof req.user === 'object' ? req.user.id : req.user,
          },
        ],
      }

      // Update status from draft → sent if currently draft
      if (docData.status === 'draft') {
        updateData.status = 'sent'
      }

      await req.payload.update({
        collection: collectionSlug as any,
        id,
        data: updateData,
        context: { skipPdfGeneration: true },
        req,
      })

      return Response.json({ success: true, message: 'Email sent successfully' })
    } catch (error) {
      req.payload.logger.error({ msg: 'Send email failed', err: error as Error })
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }
  },
})
