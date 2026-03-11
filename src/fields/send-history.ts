import type { Field } from 'payload'

export const createSendHistoryFields = (mediaCollection: string): Field[] => [
  {
    name: 'lastSentAt',
    type: 'date',
    admin: {
      readOnly: true,
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
  {
    name: 'sendHistory',
    type: 'array',
    admin: {
      readOnly: true,
      position: 'sidebar',
      initCollapsed: true,
      components: {
        RowLabel: {
          path: 'payload-invoicepdf/client',
          exportName: 'SendHistoryRowLabel',
        },
      },
    },
    fields: [
      {
        name: 'sentAt',
        type: 'date',
        admin: {
          readOnly: true,
          date: { pickerAppearance: 'dayAndTime' },
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
        relationTo: mediaCollection,
        admin: { readOnly: true },
      },
      {
        name: 'sentBy',
        type: 'relationship',
        relationTo: 'users',
        admin: { readOnly: true },
      },
    ],
  },
]
