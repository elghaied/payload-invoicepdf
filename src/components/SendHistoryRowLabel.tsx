'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const SendHistoryRowLabel: React.FC = () => {
  const { data } = useRowLabel<{ sentAt?: string; to?: string }>()

  const to = data?.to || 'Unknown'
  const date = data?.sentAt
    ? new Date(data.sentAt).toLocaleDateString(undefined, {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
      })
    : ''

  return <span>{to}{date ? ` — ${date}` : ''}</span>
}
