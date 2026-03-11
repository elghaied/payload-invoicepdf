# Customer Autofill Design

## Problem

Invoices/quotes currently use hardcoded inline `client` fields (name, email, address, vatNumber) with no relationship to any collection. Users must manually type client data for every invoice. Plugin consumers need the ability to autofill from a customer collection — but "customer" varies: it could be a dedicated `customers` collection, a `users` collection filtered by role, or any arbitrary collection.

## Configuration

All customer config is optional. Omitting it preserves today's inline-only behavior.

```ts
interface InvoicePdfConfig {
  // ... existing fields ...

  /** Slug of the customer/user collection */
  customerCollection?: string

  /** Maps customer collection fields to invoice client fields */
  customerFieldMapping?: {
    name: string | string[]  // string[] concatenates with space (e.g., ['firstName', 'lastName'])
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }

  /** Filter for the customer relationship dropdown (e.g., { role: { equals: 'customer' } }) */
  customerFilterOptions?: Record<string, any>

  /** true (default): autofill mode — relationship fills editable inline fields.
      false: reference mode — no inline fields, data resolved from customer record at PDF time. */
  inlineClientFields?: boolean
}
```

### Validation Rules

- If `customerCollection` is set, `customerFieldMapping` is required (validated at sanitize time).
- If `inlineClientFields` is `false`, the `customer` relationship field is required on the form.
- If `inlineClientFields` is omitted or `true`, the `customer` relationship field is optional.

### Example Configs

```ts
// Separate customers collection
invoicePdf({
  customerCollection: 'customers',
  customerFieldMapping: {
    name: 'companyName',
    email: 'email',
    vatNumber: 'taxId',
    address: { street: 'street', city: 'city', postalCode: 'zip', country: 'country' },
  },
})

// Users with role customer
invoicePdf({
  customerCollection: 'users',
  customerFieldMapping: {
    name: ['firstName', 'lastName'],
    email: 'email',
  },
  customerFilterOptions: { role: { equals: 'customer' } },
})

// Reference mode (no inline fields)
invoicePdf({
  customerCollection: 'customers',
  customerFieldMapping: { name: 'companyName', email: 'email' },
  inlineClientFields: false,
})
```

## Collection Schema Changes

### Autofill mode (`inlineClientFields: true`, default)

The `customer` relationship and `autoFillFromCustomer` UI field are injected at the top of the `client` group's fields array. All existing inline fields remain editable.

```
client (group)
  customer              <- NEW relationship (optional)
  autoFillFromCustomer  <- NEW ui field (hidden, runs CustomerAutoFill)
  name                  <- existing, auto-filled on customer select
  email                 <- existing, auto-filled
  address (group)       <- existing, auto-filled
    street, city, postalCode, country
  vatNumber             <- existing, auto-filled
```

### Reference mode (`inlineClientFields: false`)

Inline fields removed. Client group contains only the required relationship.

```
client (group)
  customer              <- relationship (required)
```

### No customerCollection configured

No changes. Today's manual inline behavior.

## Client Component: CustomerAutoFill.tsx

Mirrors `ProductAutoFill.tsx`. Renders as a `ui` field, returns `null`.

**Props:**
```ts
type Props = {
  path: string
  customerFieldMapping: { name: string | string[]; email?: string; vatNumber?: string; address?: { ... } }
  customerCollection: string
}
```

**Behavior:**
1. Watches `customer` relationship field via `useField`
2. On change (not initial mount), fetches customer record via REST API
3. Resolves field mapping:
   - `name` as string[]: concatenates values with space
   - Flat fields: reads directly from mapped field name
   - Address sub-fields: dot-path resolution (e.g., `'address.street'`)
4. Sets inline `client` fields via `useField` setValue
5. Silently ignores fetch errors

## Server Hook: auto-fill-from-customer.ts

`beforeChange` hook. Only added when `customerCollection` is configured AND `inlineClientFields: true`.

1. Check if `data.client.customer` changed vs `originalDoc.client.customer`
2. If unchanged or no customer, skip
3. Fetch customer via `req.payload.findByID`
4. Apply field mapping to populate `data.client.*`
5. Return modified data

**Hook order:**
```
beforeChange: [
  autoFillFromCustomer,  <- NEW (autofill mode only)
  autoFillFromProduct,
  autoNumber,
  calculateTotals,
  calculateDueDate,
]
```

## PDF Generation: Reference Mode

When `inlineClientFields: false`, the `generatePdf` hook resolves client data:

1. Read `doc.client.customer` (relationship ID)
2. Fetch customer record via `req.payload.findByID`
3. Apply `customerFieldMapping` to build the `client` template prop
4. Pass to template

Autofill mode: no PDF generation changes (inline fields used as-is).

Edge case: if customer is null in reference mode, log warning and use empty client data.

## Shared Utility: resolveCustomerData

`src/utils/resolve-customer-data.ts`

Extracts mapping resolution logic used by:
- `CustomerAutoFill.tsx` (client-side)
- `auto-fill-from-customer.ts` (server hook)
- `generate-pdf.ts` (reference mode)

Functions:
- `getByPath(obj, 'address.street')` — dot-path object traversal
- `resolveCustomerName(doc, mapping)` — handles string | string[] name mapping
- `resolveCustomerData(doc, fieldMapping)` — full resolution returning `{ name, email, address, vatNumber }`

## Files

### New
- `src/components/CustomerAutoFill.tsx`
- `src/hooks/auto-fill-from-customer.ts`
- `src/utils/resolve-customer-data.ts`

### Modified
- `src/types.ts` — customer config fields on `InvoicePdfConfig` and `SanitizedInvoicePdfConfig`
- `src/defaults.ts` — sanitize/validate customer config
- `src/collections/invoices.ts` — inject customer fields, conditional schema
- `src/collections/quotes.ts` — same as invoices
- `src/hooks/generate-pdf.ts` — reference mode client resolution
- `src/exports/client.ts` — export CustomerAutoFill
- `dev/payload.config.ts` — add customer config to dev app

### Unchanged
- Templates (same `client` prop shape)
- Product autofill
- Shop info global
