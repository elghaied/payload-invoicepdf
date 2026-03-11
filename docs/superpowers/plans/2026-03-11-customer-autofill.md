# Customer Autofill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional customer collection autofill to invoices/quotes, supporting any collection (customers, users with roles, etc.) with configurable field mapping and two modes (autofill into inline fields, or reference-only).

**Architecture:** Mirrors the existing product autofill pattern — a relationship field + client-side UI component + server-side beforeChange hook. A shared `resolveCustomerData` utility handles dot-path field access and name array concatenation. When `inlineClientFields: false` (reference mode), PDF generation fetches customer data live from the relationship.

**Tech Stack:** Payload CMS 3.x, React (client components), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-11-customer-autofill-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/utils/resolve-customer-data.ts` | Shared utility: dot-path access, name concatenation, full customer-to-client mapping |
| Create | `src/components/CustomerAutoFill.tsx` | Client-side component: watches customer relationship, fetches and fills inline fields |
| Create | `src/hooks/auto-fill-from-customer.ts` | Server-side beforeChange hook: safety net autofill on save |
| Modify | `src/types.ts` | Add customer config fields to `InvoicePdfConfig` and `SanitizedInvoicePdfConfig` |
| Modify | `src/defaults.ts` | Sanitize/validate customer config options |
| Modify | `src/collections/invoices.ts` | Conditionally inject customer relationship + autofill UI into client group |
| Modify | `src/collections/quotes.ts` | Same changes as invoices |
| Modify | `src/utils/build-template-props.ts` | Accept optional resolved client data for reference mode |
| Modify | `src/hooks/generate-pdf.ts` | In reference mode, fetch customer and resolve mapping before building props |
| Modify | `src/endpoints/generate-pdf.ts` | Same reference mode resolution for the on-demand PDF endpoint |
| Modify | `src/exports/client.ts` | Export `CustomerAutoFill` component |
| Modify | `dev/payload.config.ts` | Add `customers` collection and customer config to plugin |
| Modify | `dev/seed.ts` | Add sample customer records and link them to invoices |

---

## Chunk 1: Core Types and Utility

### Task 1: Add customer config to types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add customer fields to `InvoicePdfConfig`**

Open `src/types.ts`. Add the following fields inside the `InvoicePdfConfig` interface, after the `mediaCollection` field (line 28):

```ts
  /** Slug of an existing customer/user collection for autofill */
  customerCollection?: string
  /** Maps customer collection fields to invoice client fields */
  customerFieldMapping?: {
    /** Field name or array of field names to concatenate with space */
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  /** Filter options for the customer relationship dropdown (e.g., { role: { equals: 'customer' } }) */
  customerFilterOptions?: Record<string, any>
  /** When true (default), customer selection fills editable inline fields.
   *  When false, inline client fields are removed — data is resolved from the customer record. */
  inlineClientFields?: boolean
```

- [ ] **Step 2: Add customer fields to `SanitizedInvoicePdfConfig`**

In the same file, add to `SanitizedInvoicePdfConfig` (after `disabled: boolean`, line 100):

```ts
  customerCollection?: string
  customerFieldMapping?: {
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  customerFilterOptions?: Record<string, any>
  inlineClientFields: boolean
```

Note: `inlineClientFields` is non-optional here (always has a default).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add customer config types to InvoicePdfConfig"
```

---

### Task 2: Update config sanitization

**Files:**
- Modify: `src/defaults.ts`

- [ ] **Step 1: Add customer fields to sanitizeConfig**

Open `src/defaults.ts`. In the `sanitizeConfig` function, add the customer fields to the returned object, after the `disabled` field (line 22):

```ts
  customerCollection: config.customerCollection,
  customerFieldMapping: config.customerFieldMapping,
  customerFilterOptions: config.customerFilterOptions,
  inlineClientFields: config.inlineClientFields ?? true,
```

- [ ] **Step 2: Add validation — if customerCollection is set, customerFieldMapping must be provided**

Add validation at the top of `sanitizeConfig`, before the return statement. Change the function from an arrow returning an object literal to one with a body:

```ts
export const sanitizeConfig = (config: InvoicePdfConfig): SanitizedInvoicePdfConfig => {
  if (config.customerCollection && !config.customerFieldMapping) {
    throw new Error(
      'payload-invoicepdf: customerFieldMapping is required when customerCollection is configured',
    )
  }

  return {
    productCollection: config.productCollection,
    productFieldMapping: config.productFieldMapping,
    templates: config.templates,
    invoiceNumberPrefix: config.invoiceNumberPrefix ?? DEFAULTS.invoiceNumberPrefix,
    quoteNumberPrefix: config.quoteNumberPrefix ?? DEFAULTS.quoteNumberPrefix,
    currency: config.currency ?? DEFAULTS.currency,
    defaultTaxRate: config.defaultTaxRate ?? DEFAULTS.defaultTaxRate,
    defaultPaymentTerms: config.defaultPaymentTerms ?? DEFAULTS.defaultPaymentTerms,
    mediaCollection: config.mediaCollection ?? DEFAULTS.mediaCollection,
    disabled: config.disabled ?? false,
    customerCollection: config.customerCollection,
    customerFieldMapping: config.customerFieldMapping,
    customerFilterOptions: config.customerFilterOptions,
    inlineClientFields: config.inlineClientFields ?? true,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/defaults.ts
git commit -m "feat: sanitize and validate customer config options"
```

---

### Task 3: Create resolveCustomerData utility

**Files:**
- Create: `src/utils/resolve-customer-data.ts`

- [ ] **Step 1: Create the utility file**

```ts
import type { SanitizedInvoicePdfConfig } from '../types.js'

/**
 * Traverse an object by dot-separated path (e.g., 'address.street').
 * Returns undefined if any segment is missing.
 */
export const getByPath = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, segment) => current?.[segment], obj)
}

/**
 * Resolve the client name from a customer document using the field mapping.
 * Supports a single field name or an array of field names concatenated with space.
 */
const resolveCustomerName = (
  customerDoc: Record<string, any>,
  nameMapping: string | string[],
): string => {
  if (Array.isArray(nameMapping)) {
    return nameMapping
      .map((field) => getByPath(customerDoc, field))
      .filter((v) => v != null && String(v).trim() !== '')
      .map(String)
      .join(' ')
  }
  const value = getByPath(customerDoc, nameMapping)
  return value != null ? String(value) : ''
}

/**
 * Resolve a full client data object from a customer document using the configured field mapping.
 * Returns the shape expected by the invoice/quote client group and PDF templates.
 */
export const resolveCustomerData = (
  customerDoc: Record<string, any>,
  fieldMapping: NonNullable<SanitizedInvoicePdfConfig['customerFieldMapping']>,
): {
  name: string
  email?: string
  vatNumber?: string
  address?: { street?: string; city?: string; postalCode?: string; country?: string }
} => {
  const result: {
    name: string
    email?: string
    vatNumber?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
  } = {
    name: resolveCustomerName(customerDoc, fieldMapping.name),
  }

  if (fieldMapping.email) {
    const email = getByPath(customerDoc, fieldMapping.email)
    if (email != null) result.email = String(email)
  }

  if (fieldMapping.vatNumber) {
    const vatNumber = getByPath(customerDoc, fieldMapping.vatNumber)
    if (vatNumber != null) result.vatNumber = String(vatNumber)
  }

  if (fieldMapping.address) {
    const address: { street?: string; city?: string; postalCode?: string; country?: string } = {}
    const addrMapping = fieldMapping.address
    if (addrMapping.street) {
      const v = getByPath(customerDoc, addrMapping.street)
      if (v != null) address.street = String(v)
    }
    if (addrMapping.city) {
      const v = getByPath(customerDoc, addrMapping.city)
      if (v != null) address.city = String(v)
    }
    if (addrMapping.postalCode) {
      const v = getByPath(customerDoc, addrMapping.postalCode)
      if (v != null) address.postalCode = String(v)
    }
    if (addrMapping.country) {
      const v = getByPath(customerDoc, addrMapping.country)
      if (v != null) address.country = String(v)
    }
    if (Object.keys(address).length > 0) result.address = address
  }

  return result
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/resolve-customer-data.ts
git commit -m "feat: add resolveCustomerData utility for field mapping"
```

---

## Chunk 2: Server-Side Hook and PDF Generation

### Task 4: Create auto-fill-from-customer hook

**Files:**
- Create: `src/hooks/auto-fill-from-customer.ts`

This hook mirrors `src/hooks/auto-fill-from-product.ts` but operates on the single `client` group instead of an `items` array.

- [ ] **Step 1: Create the hook file**

```ts
import type { CollectionBeforeChangeHook } from 'payload'
import type { SanitizedInvoicePdfConfig } from '../types.js'
import { resolveCustomerData } from '../utils/resolve-customer-data.js'

const getCustomerId = (customer: any): string | null => {
  if (!customer) return null
  if (typeof customer === 'object') return customer.id
  return String(customer)
}

export const createAutoFillFromCustomerHook =
  (pluginConfig: SanitizedInvoicePdfConfig): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    if (!pluginConfig.customerCollection || !pluginConfig.customerFieldMapping) return data
    if (!data.client?.customer) return data

    const currentId = getCustomerId(data.client.customer)
    const originalId = getCustomerId(originalDoc?.client?.customer)

    // Only auto-fill when customer is newly selected or changed
    if (!currentId || currentId === originalId) return data

    const customerDoc = await req.payload.findByID({
      collection: pluginConfig.customerCollection as any,
      id: currentId,
      depth: 0,
      req,
    })

    if (!customerDoc) return data

    const resolved = resolveCustomerData(customerDoc as Record<string, any>, pluginConfig.customerFieldMapping)

    // Merge resolved data into client fields
    data.client.name = resolved.name || data.client.name
    if (resolved.email != null) data.client.email = resolved.email
    if (resolved.vatNumber != null) data.client.vatNumber = resolved.vatNumber
    if (resolved.address) {
      if (!data.client.address) data.client.address = {}
      if (resolved.address.street != null) data.client.address.street = resolved.address.street
      if (resolved.address.city != null) data.client.address.city = resolved.address.city
      if (resolved.address.postalCode != null) data.client.address.postalCode = resolved.address.postalCode
      if (resolved.address.country != null) data.client.address.country = resolved.address.country
    }

    return data
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/auto-fill-from-customer.ts
git commit -m "feat: add server-side customer autofill beforeChange hook"
```

---

### Task 5: Update PDF generation for reference mode

**Files:**
- Modify: `src/utils/build-template-props.ts`
- Modify: `src/hooks/generate-pdf.ts`

- [ ] **Step 1: Add optional `resolvedClient` parameter to `buildTemplateProps`**

Open `src/utils/build-template-props.ts`. Add `resolvedClient` to the args type (line 3, inside the args object):

```ts
export const buildTemplateProps = (args: {
  doc: Record<string, any>
  shopInfo: Record<string, any>
  config: SanitizedInvoicePdfConfig
  type: 'invoice' | 'quote'
  logoDataUri?: string
  resolvedClient?: {
    name: string
    email?: string
    vatNumber?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
  }
}): InvoiceTemplateProps => {
```

Then update the destructuring on line 10 to include it:

```ts
  const { doc, shopInfo, config, type, logoDataUri, resolvedClient } = args
```

Then update the `client` section (lines 41-52) to use `resolvedClient` when provided:

```ts
    client: resolvedClient
      ? {
          name: resolvedClient.name,
          email: resolvedClient.email || undefined,
          address: resolvedClient.address
            ? {
                street: resolvedClient.address.street || '',
                city: resolvedClient.address.city || '',
                postalCode: resolvedClient.address.postalCode || '',
                country: resolvedClient.address.country || '',
              }
            : undefined,
          vatNumber: resolvedClient.vatNumber || undefined,
        }
      : {
          name: doc.client?.name || '',
          email: doc.client?.email || undefined,
          address: doc.client?.address
            ? {
                street: doc.client.address.street || '',
                city: doc.client.address.city || '',
                postalCode: doc.client.address.postalCode || '',
                country: doc.client.address.country || '',
              }
            : undefined,
          vatNumber: doc.client?.vatNumber || undefined,
        },
```

- [ ] **Step 2: Update generate-pdf hook to resolve customer in reference mode**

Open `src/hooks/generate-pdf.ts`. Add the import at the top:

```ts
import { resolveCustomerData } from '../utils/resolve-customer-data.js'
```

After fetching `shopInfo` and before calling `buildTemplateProps` (between lines 38 and 40), add customer resolution for reference mode:

```ts
      // In reference mode, resolve client data from the customer relationship
      let resolvedClient: Record<string, any> | undefined
      if (!pluginConfig.inlineClientFields && pluginConfig.customerCollection && pluginConfig.customerFieldMapping) {
        const customerId = typeof doc.client?.customer === 'object'
          ? doc.client.customer.id
          : doc.client?.customer
        if (customerId) {
          try {
            const customerDoc = await req.payload.findByID({
              collection: pluginConfig.customerCollection as any,
              id: customerId,
              depth: 0,
              req,
            })
            resolvedClient = resolveCustomerData(
              customerDoc as Record<string, any>,
              pluginConfig.customerFieldMapping,
            )
          } catch {
            req.payload.logger.error(
              `Failed to fetch customer ${customerId} for PDF generation`,
            )
          }
        } else {
          req.payload.logger.warn(
            `Reference mode: no customer selected for ${type} ${doc.id}, PDF will have empty client data`,
          )
        }
      }
```

Then pass `resolvedClient` to `buildTemplateProps`:

```ts
      const props = buildTemplateProps({
        doc,
        shopInfo: shopInfo as any,
        config: pluginConfig,
        type,
        logoDataUri,
        resolvedClient,
      })
```

- [ ] **Step 3: Update the on-demand PDF endpoint for reference mode**

Open `src/endpoints/generate-pdf.ts`. Add the import at the top:

```ts
import { resolveCustomerData } from '../utils/resolve-customer-data.js'
```

After fetching `shopInfo` and before calling `buildTemplateProps` (between lines 58 and 60), add the same customer resolution logic:

```ts
      // In reference mode, resolve client data from the customer relationship
      let resolvedClient: Record<string, any> | undefined
      if (!pluginConfig.inlineClientFields && pluginConfig.customerCollection && pluginConfig.customerFieldMapping) {
        const customerId = typeof (doc as any).client?.customer === 'object'
          ? (doc as any).client.customer.id
          : (doc as any).client?.customer
        if (customerId) {
          const customerDoc = await req.payload.findByID({
            collection: pluginConfig.customerCollection as any,
            id: customerId,
            depth: 0,
            req,
          })
          resolvedClient = resolveCustomerData(
            customerDoc as Record<string, any>,
            pluginConfig.customerFieldMapping,
          )
        }
      }
```

Then pass `resolvedClient` to `buildTemplateProps` (line 60):

```ts
      const props = buildTemplateProps({
        doc: doc as any,
        shopInfo: shopInfo as any,
        config: pluginConfig,
        type,
        logoDataUri,
        resolvedClient,
      })
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/build-template-props.ts src/hooks/generate-pdf.ts src/endpoints/generate-pdf.ts
git commit -m "feat: resolve customer data in reference mode for PDF generation"
```

---

## Chunk 3: Collection Schema and Client Component

### Task 6: Create CustomerAutoFill client component

**Files:**
- Create: `src/components/CustomerAutoFill.tsx`
- Modify: `src/exports/client.ts`

- [ ] **Step 1: Create the component**

Mirrors `src/components/ProductAutoFill.tsx` — watches the `customer` relationship field, fetches customer data, fills inline client fields.

```tsx
'use client'
import React, { useEffect, useRef } from 'react'
import { useConfig, useField } from '@payloadcms/ui'
import { getByPath } from '../utils/resolve-customer-data.js'

type Props = {
  path: string
  customerFieldMapping: {
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  customerCollection: string
}

export const CustomerAutoFill: React.FC<Props> = ({
  path,
  customerFieldMapping: mapping,
  customerCollection: collection,
}) => {
  const basePath = path.replace(/\.autoFillFromCustomer$/, '')

  const { value: customerId } = useField<string>({ path: `${basePath}.customer` })
  const { setValue: setName } = useField<string>({ path: `${basePath}.name` })
  const { setValue: setEmail } = useField<string>({ path: `${basePath}.email` })
  const { setValue: setVatNumber } = useField<string>({ path: `${basePath}.vatNumber` })
  const { setValue: setStreet } = useField<string>({ path: `${basePath}.address.street` })
  const { setValue: setCity } = useField<string>({ path: `${basePath}.address.city` })
  const { setValue: setPostalCode } = useField<string>({ path: `${basePath}.address.postalCode` })
  const { setValue: setCountry } = useField<string>({ path: `${basePath}.address.country` })
  const { config } = useConfig()

  const prevCustomerRef = useRef<string | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentId = customerId
      ? typeof customerId === 'object'
        ? (customerId as any).id || (customerId as any).value
        : String(customerId)
      : null

    // On first render, record the current ID without fetching
    // to avoid overwriting existing values when editing a saved document
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevCustomerRef.current = currentId
      return
    }

    if (currentId === prevCustomerRef.current) return
    prevCustomerRef.current = currentId

    if (!currentId) return

    fetch(`${config.routes.api}/${collection}/${currentId}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed')
        return res.json()
      })
      .then((customer) => {
        // Resolve name (string or string[])
        if (mapping.name) {
          const nameFields = Array.isArray(mapping.name) ? mapping.name : [mapping.name]
          const name = nameFields
            .map((field) => getByPath(customer, field))
            .filter((v) => v != null && String(v).trim() !== '')
            .map(String)
            .join(' ')
          if (name) setName(name)
        }

        if (mapping.email) {
          const email = getByPath(customer, mapping.email)
          if (email != null) setEmail(String(email))
        }

        if (mapping.vatNumber) {
          const vatNumber = getByPath(customer, mapping.vatNumber)
          if (vatNumber != null) setVatNumber(String(vatNumber))
        }

        if (mapping.address) {
          if (mapping.address.street) {
            const v = getByPath(customer, mapping.address.street)
            if (v != null) setStreet(String(v))
          }
          if (mapping.address.city) {
            const v = getByPath(customer, mapping.address.city)
            if (v != null) setCity(String(v))
          }
          if (mapping.address.postalCode) {
            const v = getByPath(customer, mapping.address.postalCode)
            if (v != null) setPostalCode(String(v))
          }
          if (mapping.address.country) {
            const v = getByPath(customer, mapping.address.country)
            if (v != null) setCountry(String(v))
          }
        }
      })
      .catch(() => {
        // Silently ignore — customer may not exist or user may lack access
      })
  }, [
    customerId, mapping, collection, config.routes.api,
    setName, setEmail, setVatNumber, setStreet, setCity, setPostalCode, setCountry,
  ])

  return null
}
```

- [ ] **Step 2: Export the component**

Open `src/exports/client.ts`. Add at the end:

```ts
export { CustomerAutoFill } from '../components/CustomerAutoFill.js'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CustomerAutoFill.tsx src/exports/client.ts
git commit -m "feat: add CustomerAutoFill client component"
```

---

### Task 7: Update invoices collection to inject customer fields

**Files:**
- Modify: `src/collections/invoices.ts`

- [ ] **Step 1: Add import for the customer hook**

Add at the top of the file:

```ts
import { createAutoFillFromCustomerHook } from '../hooks/auto-fill-from-customer.js'
```

- [ ] **Step 2: Add customer hook to beforeChange array**

In the `hooks.beforeChange` array, add the customer hook as the first entry (before the product hook). It should only be added when `customerCollection` is configured and `inlineClientFields` is true:

Replace the current `hooks` block (lines 18-30):

```ts
  hooks: {
    beforeChange: [
      ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
        ? [createAutoFillFromCustomerHook(pluginConfig)]
        : []),
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        fieldName: 'invoiceNumber',
        prefix: pluginConfig.invoiceNumberPrefix,
        collectionSlug: 'invoices',
      }),
      createCalculateTotalsHook(pluginConfig),
      createCalculateDueDateHook(pluginConfig),
    ],
    afterChange: [createGeneratePdfHook(pluginConfig, 'invoice')],
  },
```

- [ ] **Step 3: Build the client group fields dynamically**

Replace the `client` group field definition (lines 74-90) with logic that conditionally includes the customer relationship, autofill UI field, and inline fields:

```ts
    {
      name: 'client',
      type: 'group',
      fields: [
        // Customer relationship field — only when customerCollection is configured
        ...(pluginConfig.customerCollection
          ? [
              {
                name: 'customer',
                type: 'relationship' as const,
                relationTo: pluginConfig.customerCollection,
                required: !pluginConfig.inlineClientFields,
                admin: {
                  description: 'Select a customer to auto-fill client details',
                },
                ...(pluginConfig.customerFilterOptions
                  ? { filterOptions: pluginConfig.customerFilterOptions }
                  : {}),
              },
            ]
          : []),
        // AutoFill UI component — only in autofill mode
        ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
          ? [
              {
                type: 'ui' as const,
                name: 'autoFillFromCustomer',
                label: ' ',
                admin: {
                  components: {
                    Field: {
                      path: 'payload-invoicepdf/client',
                      exportName: 'CustomerAutoFill',
                      clientProps: {
                        customerFieldMapping: pluginConfig.customerFieldMapping,
                        customerCollection: pluginConfig.customerCollection,
                      },
                    },
                  },
                },
              },
            ]
          : []),
        // Inline client fields — only when inlineClientFields is true (or no customer collection)
        ...(pluginConfig.inlineClientFields !== false
          ? [
              { name: 'name', type: 'text' as const, required: true },
              { name: 'email', type: 'email' as const },
              {
                name: 'address',
                type: 'group' as const,
                fields: [
                  { name: 'street', type: 'text' as const },
                  { name: 'city', type: 'text' as const },
                  { name: 'postalCode', type: 'text' as const },
                  { name: 'country', type: 'text' as const },
                ],
              },
              { name: 'vatNumber', type: 'text' as const, label: 'VAT Number' },
            ]
          : []),
      ],
    },
```

- [ ] **Step 4: Commit**

```bash
git add src/collections/invoices.ts
git commit -m "feat: conditionally inject customer fields into invoices collection"
```

---

### Task 8: Update quotes collection with same changes

**Files:**
- Modify: `src/collections/quotes.ts`

- [ ] **Step 1: Add import for the customer hook**

Add at the top:

```ts
import { createAutoFillFromCustomerHook } from '../hooks/auto-fill-from-customer.js'
```

- [ ] **Step 2: Add customer hook to beforeChange array**

Replace the `hooks` block (lines 17-27):

```ts
  hooks: {
    beforeChange: [
      ...(pluginConfig.customerCollection && pluginConfig.inlineClientFields
        ? [createAutoFillFromCustomerHook(pluginConfig)]
        : []),
      createAutoFillFromProductHook(pluginConfig),
      createAutoNumberHook({
        fieldName: 'quoteNumber',
        prefix: pluginConfig.quoteNumberPrefix,
        collectionSlug: 'quotes',
      }),
      createCalculateTotalsHook(pluginConfig),
    ],
    afterChange: [createGeneratePdfHook(pluginConfig, 'quote')],
  },
```

- [ ] **Step 3: Replace client group with dynamic fields**

Replace the `client` group (lines 72-88) with the exact same dynamic field construction as Task 7 Step 3 (identical code — the client group is the same for invoices and quotes).

- [ ] **Step 4: Commit**

```bash
git add src/collections/quotes.ts
git commit -m "feat: conditionally inject customer fields into quotes collection"
```

---

## Chunk 4: Dev App and Manual Testing

### Task 9: Add customers collection to dev app

**Files:**
- Modify: `dev/payload.config.ts`
- Modify: `dev/seed.ts`

- [ ] **Step 1: Add customers collection to dev app**

Open `dev/payload.config.ts`. Add a `customers` collection to the `collections` array (after `media`):

```ts
      {
        slug: 'customers',
        admin: { useAsTitle: 'companyName' },
        fields: [
          { name: 'companyName', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'vatNumber', type: 'text', label: 'VAT Number' },
          {
            name: 'address',
            type: 'group',
            fields: [
              { name: 'street', type: 'text' },
              { name: 'city', type: 'text' },
              { name: 'postalCode', type: 'text' },
              { name: 'country', type: 'text' },
            ],
          },
        ],
      },
```

- [ ] **Step 2: Add customer config to plugin options**

In the `invoicePdf()` plugin call, add the customer configuration:

```ts
      invoicePdf({
        productCollection: 'products',
        productFieldMapping: {
          name: 'name',
          price: 'price',
          ref: 'sku',
          description: 'description',
        },
        customerCollection: 'customers',
        customerFieldMapping: {
          name: 'companyName',
          email: 'email',
          vatNumber: 'vatNumber',
          address: {
            street: 'address.street',
            city: 'address.city',
            postalCode: 'address.postalCode',
            country: 'address.country',
          },
        },
        templates: [...builtInTemplates, corporateTemplate],
      }),
```

- [ ] **Step 3: Seed sample customers**

Open `dev/seed.ts`. After the products seeding block and before the invoices seeding block, add:

```ts
  // Seed customers
  const { totalDocs: customerCount } = await payload.count({
    collection: 'customers' as any,
  })

  let customerIds: string[] = []
  if (!customerCount) {
    const customers = [
      {
        companyName: 'TechStart SAS',
        email: 'finance@techstart.fr',
        vatNumber: 'FR98765432101',
        address: { street: '45 Rue de la République', city: 'Lyon', postalCode: '69002', country: 'France' },
      },
      {
        companyName: 'GreenLeaf SARL',
        email: 'comptabilite@greenleaf.fr',
        address: { street: '12 Avenue des Champs', city: 'Bordeaux', postalCode: '33000', country: 'France' },
      },
      {
        companyName: 'DataFlow Inc.',
        email: 'ap@dataflow.com',
        vatNumber: 'FR55667788990',
        address: { street: '78 Tech Park Boulevard', city: 'Toulouse', postalCode: '31000', country: 'France' },
      },
    ]

    for (const customer of customers) {
      const doc = await payload.create({
        collection: 'customers' as any,
        data: customer,
      })
      customerIds.push(doc.id)
    }
  } else {
    const { docs: existingCustomers } = await payload.find({
      collection: 'customers' as any,
      limit: 10,
    })
    customerIds = existingCustomers.map((c: any) => c.id)
  }
```

Then update the invoice seed data to include `client.customer` references. In each invoice's `client` object, add a `customer: customerIds[N]` field. For example, the first invoice:

```ts
        client: {
          customer: customerIds[0],
          name: 'TechStart SAS',
          // ... rest unchanged
        },
```

Second invoice: `customer: customerIds[1]`, third: `customer: customerIds[2]`.

- [ ] **Step 4: Commit**

```bash
git add dev/payload.config.ts dev/seed.ts
git commit -m "feat: add customers collection and seed data to dev app"
```

---

### Task 10: Manual testing

- [ ] **Step 1: Start the dev app**

```bash
cd /home/sam/projects/payload-invoicepdf && pnpm dev
```

- [ ] **Step 2: Verify autofill mode**

1. Open the admin panel at http://localhost:3000/admin
2. Navigate to Invoices > Create New
3. Verify the `client` group shows a "Customer" relationship dropdown at the top
4. Select a customer from the dropdown
5. Confirm that name, email, address, and vatNumber fields are auto-filled
6. Verify fields remain editable after autofill
7. Change the customer selection — confirm fields update

- [ ] **Step 3: Verify no customerCollection = original behavior**

1. Temporarily remove `customerCollection` and `customerFieldMapping` from `dev/payload.config.ts`
2. Restart the dev app
3. Verify the invoice form shows only the original inline client fields (no customer dropdown)
4. Restore the config

- [ ] **Step 4: Verify reference mode**

1. Add `inlineClientFields: false` to the plugin config in `dev/payload.config.ts`
2. Restart the dev app
3. Verify the invoice form shows only the customer relationship (no inline fields)
4. Verify the customer relationship is required
5. Create an invoice with a customer selected, change status to "sent"
6. Verify the PDF is generated with the correct client data from the customer record
7. Restore config to `inlineClientFields: true` (or remove the line)
