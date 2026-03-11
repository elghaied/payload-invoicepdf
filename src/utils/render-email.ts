import React from 'react'
import type { EmailTemplate, EmailTemplateProps } from '../types.js'

export const renderEmailToHtml = async (
  template: EmailTemplate,
  props: EmailTemplateProps,
): Promise<string> => {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const element = React.createElement(template.component, props)
  return renderToStaticMarkup(element)
}
