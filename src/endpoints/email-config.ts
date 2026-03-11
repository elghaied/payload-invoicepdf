import type { Endpoint } from 'payload'

import type { SanitizedInvoicePdfConfig } from '../types.js'

export const createEmailConfigEndpoint = (
  pluginConfig: SanitizedInvoicePdfConfig,
): Endpoint => ({
  handler: (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailAdapter = req.payload.email
    const url = req.url ? new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`) : null
    const includeTemplates = url?.searchParams.get('includeTemplates') === 'true'
    const docType = url?.searchParams.get('type') as 'invoice' | 'quote' | null

    const response: Record<string, any> = {
      configured: !!emailAdapter,
    }

    if (emailAdapter) {
      response.defaultFromAddress = emailAdapter.defaultFromAddress || undefined
      response.defaultFromName = emailAdapter.defaultFromName || undefined
    }

    if (includeTemplates) {
      let templates = pluginConfig.emailTemplates
      if (docType) {
        templates = templates.filter(
          (t) => !t.forTypes || t.forTypes.includes(docType),
        )
      }
      response.templates = templates.map((t) => ({
        name: t.name,
        description: t.description,
        kind: t.kind,
        label: t.label,
      }))
      response.serverUrlMissing =
        !process.env.NEXT_PUBLIC_SERVER_URL && !process.env.NEXT_PUBLIC_SITE_URL
    }

    return Response.json(response)
  },
  method: 'get',
  path: '/invoicepdf/email-config',
})
