import type { EmailTemplate } from '../types.js'
import { AttachedPdfEmail } from './attached-pdf.js'
import { LiveDocumentLinkEmail } from './live-document-link.js'

export const attachedPdfEmailTemplate: EmailTemplate = {
  name: 'attached-pdf',
  label: 'Attached PDF',
  description:
    'Sends the document as a PDF file attached to the email. Works out of the box — no frontend setup required.',
  kind: 'attachment',
  component: AttachedPdfEmail,
  forTypes: ['invoice', 'quote'],
}

export const liveDocumentLinkEmailTemplate: EmailTemplate = {
  name: 'live-document-link',
  label: 'Live Document Link',
  description:
    'Sends a link where the client can view the document online and accept or reject it. Requires frontend setup.',
  kind: 'link',
  component: LiveDocumentLinkEmail,
  forTypes: ['quote'],
}

export const builtInEmailTemplates: EmailTemplate[] = [
  attachedPdfEmailTemplate,
  liveDocumentLinkEmailTemplate,
]

export { AttachedPdfEmail, LiveDocumentLinkEmail }
