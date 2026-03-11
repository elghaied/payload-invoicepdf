'use client'

import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    padding: '24px',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#18181b',
    margin: '0 0 8px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    color: '#71717a',
    margin: '0 0 24px',
    lineHeight: '1.5',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  rejectBtn: {
    display: 'inline-block',
    padding: '14px 48px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '16px',
  } as React.CSSProperties,
  backLink: {
    display: 'block',
    fontSize: '13px',
    color: '#71717a',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  } as React.CSSProperties,
  status: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#3f3f46',
  } as React.CSSProperties,
  success: { color: '#71717a' } as React.CSSProperties,
  error: { color: '#dc2626' } as React.CSSProperties,
  expired: { color: '#d97706' } as React.CSSProperties,
  icon: { fontSize: '48px', marginBottom: '16px' } as React.CSSProperties,
}

export default function RejectQuotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteId = params.id as string
  const token = searchParams.get('token')

  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired' | 'conflict'>('idle')
  const [message, setMessage] = useState('')

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
        setStatus('success')
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

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>&#9888;</div>
          <h1 style={styles.title}>Invalid Link</h1>
          <p style={styles.subtitle}>This link is missing a required token. Please use the link from your email.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'idle' && (
          <>
            <div style={styles.icon}>&#128196;</div>
            <h1 style={styles.title}>Decline Quote</h1>
            <p style={styles.subtitle}>
              We&apos;re sorry to hear that. If you&apos;d like, let us know why so we can improve.
            </p>
            <textarea
              style={styles.textarea}
              placeholder="Reason for declining (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button style={styles.rejectBtn} onClick={handleReject}>
              Decline Quote
            </button>
            <a href={`/quotes/${quoteId}/accept?token=${token}`} style={styles.backLink}>
              Accept this quote instead
            </a>
          </>
        )}

        {status === 'loading' && (
          <>
            <div style={styles.icon}>&#9203;</div>
            <h1 style={styles.title}>Processing...</h1>
            <p style={styles.subtitle}>Please wait while we process your response.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.icon}>&#128172;</div>
            <h1 style={{ ...styles.title, ...styles.success }}>Quote Declined</h1>
            <p style={styles.status}>{message}</p>
          </>
        )}

        {status === 'conflict' && (
          <>
            <div style={styles.icon}>&#8505;</div>
            <h1 style={styles.title}>Already Processed</h1>
            <p style={styles.status}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.icon}>&#10060;</div>
            <h1 style={{ ...styles.title, ...styles.error }}>Error</h1>
            <p style={styles.status}>{message}</p>
            <button style={{ ...styles.rejectBtn, marginTop: '16px' }} onClick={handleReject}>
              Try Again
            </button>
          </>
        )}

        {status === 'expired' && (
          <>
            <div style={styles.icon}>&#9200;</div>
            <h1 style={{ ...styles.title, ...styles.expired }}>Link Expired</h1>
            <p style={styles.status}>{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
