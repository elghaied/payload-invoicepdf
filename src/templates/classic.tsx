import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'

import type { InvoiceTemplateProps } from '../types.js'

const styles = StyleSheet.create({
  clientBlock: { marginBottom: 20 },
  colDesc: { flex: 3 },
  colPrice: { flex: 1, textAlign: 'right' },
  colQty: { flex: 1, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  companyName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  datesRow: { flexDirection: 'row', gap: 40, marginBottom: 16 },
  docNumber: { color: '#666', fontSize: 12, textAlign: 'right' },
  docTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' },
  footer: { bottom: 30, color: '#999', fontSize: 8, left: 40, position: 'absolute', right: 40 },
  footerLine: { marginBottom: 2 },
  grandTotal: { borderTopColor: '#333', borderTopWidth: 1, fontSize: 14, fontWeight: 'bold', paddingTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  label: { color: '#999', fontSize: 8, marginBottom: 2, textTransform: 'uppercase' },
  logo: { height: 60, objectFit: 'contain', width: 120 },
  notes: { backgroundColor: '#fafafa', borderRadius: 4, marginTop: 20, padding: 10 },
  page: { color: '#333', fontFamily: 'Helvetica', fontSize: 10, padding: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginBottom: 16 },
  statusBadge: { borderRadius: 3, fontSize: 9, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3 },
  table: { marginTop: 10 },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableRow: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  totalLabel: { fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, width: 200 },
  totalsBlock: { alignItems: 'flex-end', marginTop: 16 },
})

const formatAmount = (amount: number, currency: string) =>
  `${currency}${amount.toFixed(2)}`

export const ClassicTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, client, company, currency, documentNumber, dueDate,
    issueDate, items, notes, status, subtotal, taxTotal, total, validUntil,
  } = props

  const title = type === 'invoice' ? 'INVOICE' : 'QUOTE'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logo && <Image src={company.logo} style={styles.logo} />}
            <Text style={styles.companyName}>{company.name}</Text>
            <Text>{company.address.street}</Text>
            <Text>{company.address.postalCode} {company.address.city}</Text>
            <Text>{company.address.country}</Text>
            {company.phone && <Text>Tel: {company.phone}</Text>}
            {company.email && <Text>{company.email}</Text>}
            {company.vatNumber && <Text>VAT: {company.vatNumber}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docNumber}>{documentNumber}</Text>
            <Text style={[styles.statusBadge, { backgroundColor: '#eee', marginTop: 6 }]}>{status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View>
            <Text style={styles.label}>Issue Date</Text>
            <Text>{issueDate}</Text>
          </View>
          {dueDate && (
            <View>
              <Text style={styles.label}>Due Date</Text>
              <Text>{dueDate}</Text>
            </View>
          )}
          {validUntil && (
            <View>
              <Text style={styles.label}>Valid Until</Text>
              <Text>{validUntil}</Text>
            </View>
          )}
        </View>

        {/* Client */}
        <View style={styles.clientBlock}>
          <Text style={styles.label}>Bill To</Text>
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

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTax}>Tax</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatAmount(item.unitPrice, currency)}</Text>
              <Text style={styles.colTax}>{(item.taxRate * 100).toFixed(0)}%</Text>
              <Text style={styles.colTotal}>{formatAmount(item.lineTotal, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatAmount(subtotal, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax</Text>
            <Text>{formatAmount(taxTotal, currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{formatAmount(total, currency)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {company.bankName && <Text style={styles.footerLine}>Bank: {company.bankName} | IBAN: {company.iban} | BIC: {company.bic}</Text>}
          {company.siret && <Text style={styles.footerLine}>SIRET: {company.siret}</Text>}
          {company.legalMentions && <Text style={styles.footerLine}>{company.legalMentions}</Text>}
        </View>
      </Page>
    </Document>
  )
}
