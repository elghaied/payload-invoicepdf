import type { InvoiceTemplate, InvoiceTemplateProps } from '../types.js'

export const renderPdfToBuffer = async (
  template: InvoiceTemplate,
  props: InvoiceTemplateProps,
): Promise<Buffer> => {
  // Dynamic import to avoid issues with SSR/build
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const React = await import('react')

  const element = React.createElement(template.component, props)
  const buffer = await renderToBuffer(element as any)
  return Buffer.from(buffer)
}
