'use client'

import React, { useState } from 'react'

type Props = {
  quoteId: string
  token: string
}

export function QuoteActions({ quoteId, token }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'accepted' | 'rejected' | 'error' | 'expired' | 'conflict'>('idle')
  const [message, setMessage] = useState('')
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const handleAccept = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('accepted')
        setMessage('Quote accepted! An invoice has been created.')
      } else if (res.status === 410) {
        setStatus('expired')
        setMessage('This link has expired. Please contact us for a new quote.')
      } else if (res.status === 409) {
        setStatus('conflict')
        setMessage(data.error || 'This quote has already been processed.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  const handleReject = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/invoicepdf/quotes/${quoteId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: reason || undefined }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('rejected')
        setMessage('Quote has been declined. We appreciate your feedback.')
      } else if (res.status === 410) {
        setStatus('expired')
        setMessage('This link has expired. Please contact us if you need assistance.')
      } else if (res.status === 409) {
        setStatus('conflict')
        setMessage(data.error || 'This quote has already been processed.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  if (status === 'loading') {
    return <span style={styles.statusText}>Processing...</span>
  }

  if (status === 'accepted') {
    return <span style={{ ...styles.statusText, color: '#16a34a' }}>Quote Accepted — an invoice has been created.</span>
  }

  if (status === 'rejected') {
    return <span style={{ ...styles.statusText, color: '#71717a' }}>Quote Declined. We appreciate your feedback.</span>
  }

  if (status === 'conflict') {
    return <span style={styles.statusText}>{message}</span>
  }

  if (status === 'expired') {
    return <span style={{ ...styles.statusText, color: '#d97706' }}>{message}</span>
  }

  if (status === 'error') {
    return (
      <>
        <span style={{ ...styles.statusText, color: '#dc2626' }}>{message}</span>
        <button style={styles.acceptBtn} onClick={() => setStatus('idle')}>
          Try Again
        </button>
      </>
    )
  }

  if (showReject) {
    return (
      <>
        <input
          style={styles.reasonInput}
          placeholder="Reason for declining (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button style={styles.rejectBtn} onClick={handleReject}>
          Decline Quote
        </button>
        <button style={styles.linkBtn} onClick={() => setShowReject(false)}>
          Go back
        </button>
      </>
    )
  }

  return (
    <>
      <button style={styles.acceptBtn} onClick={handleAccept}>
        Accept Quote
      </button>
      <button style={styles.linkBtn} onClick={() => setShowReject(true)}>
        Decline
      </button>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statusText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3f3f46',
  },
  acceptBtn: {
    padding: '10px 32px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '10px 32px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  linkBtn: {
    fontSize: '13px',
    color: '#71717a',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  reasonInput: {
    padding: '8px 12px',
    border: '1px solid #e4e4e7',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '250px',
  },
}
