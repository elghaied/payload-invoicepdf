import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceTemplateProps } from '../types.js'

const ACCENT = '#2563eb'

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  accentBar: { height: 6, backgroundColor: ACCENT },
  content: { padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  logo: { width: 100, height: 50, objectFit: 'contain', marginBottom: 8 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: ACCENT },
  docTitle: { fontSize: 20, fontWeight: 'bold', color: ACCENT, textAlign: 'right' },
  docNumber: { fontSize: 11, color: '#666', textAlign: 'right', marginTop: 2 },
  columns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  column: { width: '48%' },
  label: { fontSize: 8, color: '#999', textTransform: 'uppercase', marginBottom: 3, letterSpacing: 1 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: { color: '#fff', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBlock: { alignItems: 'flex-end', marginTop: 20 },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ACCENT,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
    paddingTop: 6,
    marginTop: 4,
  },
  notes: { marginTop: 24, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#94a3b8', textAlign: 'center' },
  meta: { fontSize: 9, color: '#666', marginTop: 4 },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const ModernTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, documentNumber, status, issueDate, dueDate, validUntil,
    company, client, items, subtotal, taxTotal, total, currency, notes,
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
