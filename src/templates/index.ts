import type { InvoiceTemplate } from '../types.js'

import { BoldTemplate } from './bold.js'
import { ClassicTemplate } from './classic.js'
import { MinimalTemplate } from './minimal.js'
import { ModernTemplate } from './modern.js'

export const classicTemplate: InvoiceTemplate = {
  name: 'Classic',
  component: ClassicTemplate,
}

export const modernTemplate: InvoiceTemplate = {
  name: 'Modern',
  component: ModernTemplate,
}

export const minimalTemplate: InvoiceTemplate = {
  name: 'Minimal',
  component: MinimalTemplate,
}

export const boldTemplate: InvoiceTemplate = {
  name: 'Bold',
  component: BoldTemplate,
}

export const builtInTemplates: InvoiceTemplate[] = [
  classicTemplate,
  modernTemplate,
  minimalTemplate,
  boldTemplate,
]

export { BoldTemplate, ClassicTemplate, MinimalTemplate, ModernTemplate }
