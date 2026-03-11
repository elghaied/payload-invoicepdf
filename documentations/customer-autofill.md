# Customer Autofill

Connect your existing customer collection to auto-fill client details on invoices and quotes.

## Setup

Add `customerCollection` and `customerFieldMapping` to your plugin config:

```ts
invoicePdf({
  // ...required options
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
})
```

## Field Mapping

The `customerFieldMapping` maps fields from your customer collection to the invoice client fields. It supports:

### Simple fields

```ts
customerFieldMapping: {
  name: 'companyName',
  email: 'contactEmail',
}
```

### Dot notation for nested fields

```ts
customerFieldMapping: {
  address: {
    street: 'billingAddress.street',
    city: 'billingAddress.city',
  },
}
```

### Array for concatenated names

If your customers have separate first/last name fields:

```ts
customerFieldMapping: {
  name: ['firstName', 'lastName'],  // Joined with a space: "John Doe"
}
```

## How It Works

With customer autofill configured, invoices and quotes get a **Customer** dropdown at the top of the client section. When you select a customer:

1. The plugin fetches the customer record
2. Resolves each mapped field from the customer data
3. Fills in the client name, email, VAT number, and address fields

The auto-filled fields remain editable — you can adjust them per document after autofill.

## Filtering the Customer Dropdown

If your customer collection includes records you don't want in the dropdown (e.g., users with non-customer roles), use `customerFilterOptions`:

```ts
invoicePdf({
  customerCollection: 'users',
  customerFieldMapping: {
    name: ['firstName', 'lastName'],
    email: 'email',
  },
  customerFilterOptions: {
    role: { equals: 'customer' },
  },
})
```

This applies a Payload query filter to the customer relationship field.

## Reference Mode

By default (`inlineClientFields: true`), client fields are visible and editable on the form. If you want client data to always come directly from the customer record:

```ts
invoicePdf({
  customerCollection: 'customers',
  customerFieldMapping: { /* ... */ },
  inlineClientFields: false,
})
```

In reference mode:
- Inline client fields (name, email, address, VAT) are removed from the form
- The customer relationship becomes required
- PDF generation resolves client data from the customer record at render time
- Ensures PDFs always show current customer data

## Examples

### Simple customer collection

```ts
// Collection: customers
// Fields: companyName, email, vatNumber, address.street, address.city, address.postalCode, address.country

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
}
```

### Users collection with role filtering

```ts
// Collection: users
// Fields: firstName, lastName, email, role, company.address.*

customerCollection: 'users',
customerFieldMapping: {
  name: ['firstName', 'lastName'],
  email: 'email',
  address: {
    street: 'company.address.street',
    city: 'company.address.city',
    postalCode: 'company.address.postalCode',
    country: 'company.address.country',
  },
},
customerFilterOptions: {
  role: { equals: 'customer' },
},
```
