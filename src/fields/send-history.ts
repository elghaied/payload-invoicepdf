import type { Field } from 'payload'

export const createSendHistoryFields = (mediaCollection: string): Field[] => [
  {
    name: 'lastSentAt',
    type: 'date',
    admin: {
      date: { pickerAppearance: 'dayAndTime' },
      readOnly: true,
    },
  },
  {
    name: 'sendHistory',
    type: 'array',
    admin: {
      components: {
        RowLabel: {
          exportName: 'SendHistoryRowLabel',
          path: 'payload-invoicepdf/client',
        },
      },
      initCollapsed: true,
      readOnly: true,
    },
    fields: [
      {
        name: 'sentAt',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
          readOnly: true,
        },
      },
      {
        name: 'to',
        type: 'email',
        admin: { readOnly: true },
      },
      {
        name: 'templateUsed',
        type: 'text',
        admin: { readOnly: true },
      },
      {
        name: 'subject',
        type: 'text',
        admin: { readOnly: true },
      },
      {
        name: 'attachedPdf',
        type: 'relationship',
        admin: { readOnly: true },
        relationTo: mediaCollection,
      },
      {
        name: 'sentBy',
        type: 'relationship',
        admin: { readOnly: true },
        relationTo: 'users',
      },
    ],
  },
]
