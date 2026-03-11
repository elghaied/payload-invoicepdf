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
    margin: '0 0 32px',
    lineHeight: '1.5',
  } as React.CSSProperties,
  acceptBtn: {
    display: 'inline-block',
    padding: '14px 48px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '16px',
  } as React.CSSProperties,
  rejectLink: {
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
  success: { color: '#16a34a' } as React.CSSProperties,
  error: { color: '#dc2626' } as React.CSSProperties,
  expired: { color: '#d97706' } as React.CSSProperties,
  icon: { fontSize: '48px', marginBottom: '16px' } as React.CSSProperties,
}

export default function AcceptQuotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteId = params.id as string
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired' | 'conflict'>('idle')
  const [message, setMessage] = useState('')

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
        setStatus('success')
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
            <h1 style={styles.title}>Accept Quote</h1>
            <p style={styles.subtitle}>
              By accepting this quote, an invoice will be created and the work can proceed.
            </p>
            <button style={styles.acceptBtn} onClick={handleAccept}>
              Accept Quote
            </button>
            <a href={`/quotes/${quoteId}/reject?token=${token}`} style={styles.rejectLink}>
              Decline this quote instead
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
            <div style={styles.icon}>&#9989;</div>
            <h1 style={{ ...styles.title, ...styles.success }}>Quote Accepted</h1>
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
            <button style={{ ...styles.acceptBtn, marginTop: '16px' }} onClick={handleAccept}>
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
