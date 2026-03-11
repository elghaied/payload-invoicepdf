import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'

import type { InvoiceTemplateProps } from '../types.js'

const ACCENT = '#2563eb'

const styles = StyleSheet.create({
  accentBar: { backgroundColor: ACCENT, height: 6 },
  colDesc: { flex: 3 },
  colPrice: { flex: 1, textAlign: 'right' },
  colQty: { flex: 1, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  column: { width: '48%' },
  columns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { color: ACCENT, fontSize: 16, fontWeight: 'bold' },
  content: { padding: 40 },
  docNumber: { color: '#666', fontSize: 11, marginTop: 2, textAlign: 'right' },
  docTitle: { color: ACCENT, fontSize: 20, fontWeight: 'bold', textAlign: 'right' },
  footer: { bottom: 30, color: '#94a3b8', fontSize: 8, left: 40, position: 'absolute', right: 40, textAlign: 'center' },
  grandTotal: {
    borderTopColor: ACCENT,
    borderTopWidth: 2,
    color: ACCENT,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    paddingTop: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  label: { color: '#999', fontSize: 8, letterSpacing: 1, marginBottom: 3, textTransform: 'uppercase' },
  logo: { height: 50, marginBottom: 8, objectFit: 'contain', width: 100 },
  meta: { color: '#666', fontSize: 9, marginTop: 4 },
  notes: { backgroundColor: '#f1f5f9', borderRadius: 4, marginTop: 24, padding: 12 },
  page: { color: '#1a1a1a', fontFamily: 'Helvetica', fontSize: 10, padding: 0 },
  table: { marginTop: 8 },
  tableHeader: {
    backgroundColor: ACCENT,
    color: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableHeaderText: { color: '#fff', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, width: 220 },
  totalsBlock: { alignItems: 'flex-end', marginTop: 20 },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const ModernTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, client, company, currency, documentNumber, dueDate,
    issueDate, items, notes, status, subtotal, taxTotal, total, validUntil,
  } = props

  const title = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              {company.logo && <Image src={company.logo} style={styles.logo} />}
              <Text style={styles.companyName}>{company.name}</Text>
            </View>
            <View>
              <Text style={styles.docTitle}>{title}</Text>
              <Text style={styles.docNumber}>{documentNumber}</Text>
              <Text style={styles.meta}>Status: {status}</Text>
              <Text style={styles.meta}>Issued: {issueDate}</Text>
              {dueDate && <Text style={styles.meta}>Due: {dueDate}</Text>}
              {validUntil && <Text style={styles.meta}>Valid until: {validUntil}</Text>}
            </View>
          </View>

          {/* Company / Client columns */}
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.label}>From</Text>
              <Text>{company.address.street}</Text>
              <Text>{company.address.postalCode} {company.address.city}</Text>
              <Text>{company.address.country}</Text>
              {company.email && <Text>{company.email}</Text>}
              {company.vatNumber && <Text>VAT: {company.vatNumber}</Text>}
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>To</Text>
              <Text style={{ fontWeight: 'bold' }}>{client.name}</Text>
              {client.address && (
                <>
                  <Text>{client.address.street}</Text>
                  <Text>{client.address.postalCode} {client.address.city}</Text>
                  <Text>{client.address.country}</Text>
                </>
              )}
              {client.email && <Text>{client.email}</Text>}
              {client.vatNumber && <Text>VAT: {client.vatNumber}</Text>}
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, styles.tableHeaderText]}>Description</Text>
              <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
              <Text style={[styles.colPrice, styles.tableHeaderText]}>Price</Text>
              <Text style={[styles.colTax, styles.tableHeaderText]}>Tax</Text>
              <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{fmt(item.unitPrice, currency)}</Text>
                <Text style={styles.colTax}>{(item.taxRate * 100).toFixed(0)}%</Text>
                <Text style={styles.colTotal}>{fmt(item.lineTotal, currency)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{fmt(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{fmt(taxTotal, currency)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>Total</Text>
              <Text>{fmt(total, currency)}</Text>
            </View>
          </View>

          {notes && (
            <View style={styles.notes}>
              <Text style={styles.label}>Notes</Text>
              <Text>{notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>
            {company.bankName && `${company.bankName} | IBAN: ${company.iban} | BIC: ${company.bic}`}
            {company.siret && ` | SIRET: ${company.siret}`}
          </Text>
          {company.legalMentions && <Text>{company.legalMentions}</Text>}
        </View>
      </Page>
    </Document>
  )
}
