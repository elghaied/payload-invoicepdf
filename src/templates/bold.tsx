import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import React from 'react'

import type { InvoiceTemplateProps } from '../types.js'

const PRIMARY = '#1e293b'
const ACCENT = '#f59e0b'

const styles = StyleSheet.create({
  body: { padding: 30 },
  bold: { fontWeight: 'bold' },
  colDesc: { flex: 3 },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colQty: { flex: 1, textAlign: 'right' },
  colTax: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  companyDetail: { color: '#94a3b8', fontSize: 9 },
  companyName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  docNumber: { color: '#cbd5e1', fontSize: 11, marginTop: 2, textAlign: 'right' },
  docTitle: { color: ACCENT, fontSize: 26, fontWeight: 'bold' },
  footer: { bottom: 24, color: '#94a3b8', fontSize: 7, left: 30, position: 'absolute', right: 30, textAlign: 'center' },
  grandTotalBlock: {
    backgroundColor: PRIMARY,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    padding: 10,
    width: 220,
  },
  grandTotalText: { color: ACCENT, fontSize: 14, fontWeight: 'bold' },
  headerBlock: {
    alignItems: 'flex-start',
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    paddingBottom: 24,
  },
  infoCol: { width: '45%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  label: { color: '#94a3b8', fontSize: 8, letterSpacing: 1, marginBottom: 3, textTransform: 'uppercase' },
  logo: { height: 40, marginBottom: 8, objectFit: 'contain', width: 80 },
  notes: { backgroundColor: '#f8fafc', borderLeftColor: ACCENT, borderLeftWidth: 3, marginTop: 24, padding: 12 },
  page: { color: '#333', fontFamily: 'Helvetica', fontSize: 10, padding: 0 },
  statusBadge: {
    alignSelf: 'flex-end',
    backgroundColor: ACCENT,
    borderRadius: 3,
    color: PRIMARY,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textAlign: 'center',
  },
  table: { marginTop: 10 },
  tableHeader: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  thText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, width: 220 },
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const BoldTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, client, company, currency, documentNumber, dueDate,
    issueDate, items, notes, status, subtotal, taxTotal, total, validUntil,
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
