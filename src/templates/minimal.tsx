import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceTemplateProps } from '../types.js'

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica', color: '#2d2d2d' },
  header: { marginBottom: 40 },
  logo: { width: 80, height: 40, objectFit: 'contain', marginBottom: 12 },
  docTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', letterSpacing: 2 },
  docNumber: { fontSize: 10, color: '#888', marginTop: 4 },
  metaSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  metaColumn: { width: '30%' },
  label: { fontSize: 8, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 10, lineHeight: 1.5 },
  bold: { fontWeight: 'bold' },
  separator: { borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0', marginVertical: 6 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsBlock: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  notes: { marginTop: 30 },
  footer: { position: 'absolute', bottom: 40, left: 50, right: 50, fontSize: 7, color: '#bbb' },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const MinimalTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, documentNumber, status, issueDate, dueDate, validUntil,
    company, client, items, subtotal, taxTotal, total, currency, notes,
  } = props

  const title = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {company.logo && <Image src={company.logo} style={styles.logo} />}
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.docNumber}>{documentNumber} — {status}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.bold}>{company.name}</Text>
            <Text style={styles.value}>{company.address.street}</Text>
            <Text style={styles.value}>{company.address.postalCode} {company.address.city}</Text>
            <Text style={styles.value}>{company.address.country}</Text>
            {company.email && <Text style={styles.value}>{company.email}</Text>}
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.bold}>{client.name}</Text>
            {client.address && (
              <>
                <Text style={styles.value}>{client.address.street}</Text>
                <Text style={styles.value}>{client.address.postalCode} {client.address.city}</Text>
                <Text style={styles.value}>{client.address.country}</Text>
              </>
            )}
            {client.email && <Text style={styles.value}>{client.email}</Text>}
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.label}>Details</Text>
            <Text style={styles.value}>Issued: {issueDate}</Text>
            {dueDate && <Text style={styles.value}>Due: {dueDate}</Text>}
            {validUntil && <Text style={styles.value}>Valid until: {validUntil}</Text>}
            {company.vatNumber && <Text style={styles.value}>VAT: {company.vatNumber}</Text>}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.label]}>Description</Text>
            <Text style={[styles.colQty, styles.label]}>Qty</Text>
            <Text style={[styles.colPrice, styles.label]}>Unit Price</Text>
            <Text style={[styles.colTax, styles.label]}>Tax</Text>
            <Text style={[styles.colTotal, styles.label]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
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
            <Text style={styles.label}>Subtotal</Text>
            <Text>{fmt(subtotal, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Tax</Text>
            <Text>{fmt(taxTotal, currency)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>{fmt(total, currency)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {company.bankName && <Text>{company.bankName} — IBAN: {company.iban} — BIC: {company.bic}</Text>}
          {company.siret && <Text>SIRET: {company.siret}</Text>}
          {company.legalMentions && <Text>{company.legalMentions}</Text>}
        </View>
      </Page>
    </Document>
  )
}
