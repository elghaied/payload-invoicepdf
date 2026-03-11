import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { EmailTemplate, EmailTemplateProps } from '../types.js'

export const renderEmailToHtml = (
  template: EmailTemplate,
  props: EmailTemplateProps,
): string => {
  const element = React.createElement(template.component, props)
  return renderToStaticMarkup(element)
}
