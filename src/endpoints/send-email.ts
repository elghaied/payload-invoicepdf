import type { Endpoint } from 'payload'

import crypto from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import type { SanitizedInvoicePdfConfig } from '../types.js'

import { buildEmailTemplateProps } from '../utils/build-email-template-props.js'
import { renderEmailToHtml } from '../utils/render-email.js'

export const createSendEmailEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailAdapter = req.payload.email
    if (!emailAdapter) {
      return Response.json({ error: 'Email is not configured' }, { status: 400 })
    }

    const body = await req.json?.()
    const { id, type, attachedPdfId, subject, templateName, to } = body || {}

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
        id,
        collection: collectionSlug as any,
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

      // For link templates, construct viewUrl and ensure tokens exist
      let viewUrl: string | undefined
      if (emailTemplate.kind === 'link' && type === 'quote') {
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
            id,
            collection: 'quotes' as any,
            context: { skipPdfGeneration: true },
            data: { acceptToken, rejectToken, tokenExpiresAt },
            req,
          })

          docData.acceptToken = acceptToken
        }

        viewUrl = `${baseUrl}/quotes/${id}?token=${docData.acceptToken}`
      }

      // Build props and render email HTML
      const serverUrl =
        req.payload.config.serverURL ||
        process.env.NEXT_PUBLIC_SERVER_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        ''

      const emailProps = buildEmailTemplateProps({
        type,
        doc: doc as any,
        serverUrl,
        shopInfo: shopInfo as any,
        viewUrl,
      })

      const html = await renderEmailToHtml(emailTemplate, emailProps)

      // Build email options
      const from = emailAdapter.defaultFromName
        ? `${emailAdapter.defaultFromName} <${emailAdapter.defaultFromAddress}>`
        : emailAdapter.defaultFromAddress

      const emailOptions: Record<string, any> = {
        from,
        html,
        subject,
        to,
      }

      // Attach PDF file if one was selected
      if (attachedPdfId) {
        const mediaDoc = await req.payload.findByID({
          id: attachedPdfId,
          collection: pluginConfig.mediaCollection as any,
          depth: 0,
          req,
        })

        if (mediaDoc) {
          const mediaData = mediaDoc as any
          const attachment: Record<string, any> = { filename: mediaData.filename }

          if (mediaData.url?.startsWith('http')) {
            // Cloud storage: URL is already absolute
            attachment.path = mediaData.url
          } else if (mediaData.filename) {
            // Local storage: read file from disk using staticDir
            const collectionConfig = req.payload.config.collections.find(
              (c) => c.slug === pluginConfig.mediaCollection,
            )
            const uploadConfig = collectionConfig?.upload
            if (uploadConfig && typeof uploadConfig === 'object' && typeof uploadConfig.staticDir === 'string') {
              const filePath = resolve(uploadConfig.staticDir, mediaData.filename)
              attachment.content = readFileSync(filePath)
            } else if (req.payload.config.serverURL) {
              attachment.path = `${req.payload.config.serverURL}${mediaData.url}`
            }
          }

          if (attachment.content || attachment.path) {
            emailOptions.attachments = [attachment]
          }
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
            attachedPdf: attachedPdfId || undefined,
            sentAt: new Date().toISOString(),
            sentBy: typeof req.user === 'object' ? req.user.id : req.user,
            subject,
            templateUsed: templateName,
            to,
          },
        ],
      }

      // Update status from draft → sent if currently draft
      if (docData.status === 'draft') {
        updateData.status = 'sent'
      }

      await req.payload.update({
        id,
        collection: collectionSlug as any,
        context: { skipPdfGeneration: true },
        data: updateData,
        req,
      })

      return Response.json({ message: 'Email sent successfully', success: true })
    } catch (error) {
      req.payload.logger.error({ err: error as Error, msg: 'Send email failed' })
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }
  },
  method: 'post',
  path: '/invoicepdf/send-email',
})
