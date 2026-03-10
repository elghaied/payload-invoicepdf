import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceTemplateProps } from '../types.js'

const PRIMARY = '#1e293b'
const ACCENT = '#f59e0b'

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  headerBlock: {
    backgroundColor: PRIMARY,
    padding: 30,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: { width: 80, height: 40, objectFit: 'contain', marginBottom: 8 },
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  companyDetail: { fontSize: 9, color: '#94a3b8' },
  docTitle: { fontSize: 26, fontWeight: 'bold', color: ACCENT },
  docNumber: { fontSize: 11, color: '#cbd5e1', textAlign: 'right', marginTop: 2 },
  statusBadge: {
    backgroundColor: ACCENT,
    color: PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  body: { padding: 30 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoCol: { width: '45%' },
  label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  bold: { fontWeight: 'bold' },
  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  thText: { color: '#fff', fontWeight: 'bold', fontSize: 9 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colTax: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginBottom: 4 },
  grandTotalBlock: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    backgroundColor: PRIMARY,
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  grandTotalText: { color: ACCENT, fontSize: 14, fontWeight: 'bold' },
  notes: { marginTop: 24, padding: 12, backgroundColor: '#f8fafc', borderLeftWidth: 3, borderLeftColor: ACCENT },
  footer: { position: 'absolute', bottom: 24, left: 30, right: 30, fontSize: 7, color: '#94a3b8', textAlign: 'center' },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const BoldTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, documentNumber, status, issueDate, dueDate, validUntil,
    company, client, items, subtotal, taxTotal, total, currency, notes,
  } = props

  const title = type === 'invoice' ? 'INVOICE' : 'QUOTE'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <View>
            {company.logo && <Image src={company.logo} style={styles.logo} />}
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyDetail}>{company.address.street}, {company.address.postalCode} {company.address.city}</Text>
            {company.phone && <Text style={styles.companyDetail}>Tel: {company.phone}</Text>}
            {company.email && <Text style={styles.companyDetail}>{company.email}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docNumber}>{documentNumber}</Text>
            <Text style={styles.statusBadge}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.bold}>{client.name}</Text>
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
            <View style={styles.infoCol}>
              <Text style={styles.label}>Details</Text>
              <Text>Issued: {issueDate}</Text>
              {dueDate && <Text>Due: {dueDate}</Text>}
              {validUntil && <Text>Valid until: {validUntil}</Text>}
              {company.vatNumber && <Text>VAT: {company.vatNumber}</Text>}
              {company.siret && <Text>SIRET: {company.siret}</Text>}
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, styles.thText]}>Description</Text>
              <Text style={[styles.colQty, styles.thText]}>Qty</Text>
              <Text style={[styles.colPrice, styles.thText]}>Price</Text>
              <Text style={[styles.colTax, styles.thText]}>Tax</Text>
              <Text style={[styles.colTotal, styles.thText]}>Total</Text>
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
              <Text>Subtotal</Text>
              <Text>{fmt(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{fmt(taxTotal, currency)}</Text>
            </View>
            <View style={styles.grandTotalBlock}>
              <Text style={styles.grandTotalText}>TOTAL</Text>
              <Text style={styles.grandTotalText}>{fmt(total, currency)}</Text>
            </View>
          </View>

          {notes && (
            <View style={styles.notes}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Notes</Text>
              <Text>{notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>
            {company.bankName && `${company.bankName} | IBAN: ${company.iban} | BIC: ${company.bic}`}
            {company.legalMentions && ` | ${company.legalMentions}`}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
