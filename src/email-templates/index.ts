import type { EmailTemplate } from '../types.js'

import { AttachedPdfEmail } from './attached-pdf.js'
import { LiveDocumentLinkEmail } from './live-document-link.js'

export const attachedPdfEmailTemplate: EmailTemplate = {
  name: 'attached-pdf',
  component: AttachedPdfEmail,
  description:
    'Sends the document as a PDF file attached to the email. Works out of the box — no frontend setup required.',
  forTypes: ['invoice', 'quote'],
  kind: 'attachment',
  label: 'Attached PDF',
}

export const liveDocumentLinkEmailTemplate: EmailTemplate = {
  name: 'live-document-link',
  component: LiveDocumentLinkEmail,
  description:
    'Sends a link where the client can view the document online and accept or reject it. Requires frontend setup.',
  forTypes: ['quote'],
  kind: 'link',
  label: 'Live Document Link',
}

export const builtInEmailTemplates: EmailTemplate[] = [
  attachedPdfEmailTemplate,
  liveDocumentLinkEmailTemplate,
]

export { AttachedPdfEmail, LiveDocumentLinkEmail }
