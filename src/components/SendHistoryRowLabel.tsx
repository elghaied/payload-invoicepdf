'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const SendHistoryRowLabel: React.FC = () => {
  const { data } = useRowLabel<{ to?: string; sentAt?: string }>()

  const to = data?.to || 'Unknown'
  const date = data?.sentAt
    ? new Date(data.sentAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return <span>{to}{date ? ` — ${date}` : ''}</span>
}
