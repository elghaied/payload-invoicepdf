import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceTemplateProps } from 'payload-invoicepdf'

const NAVY = '#0f172a'
const NAVY_LIGHT = '#1e293b'
const GOLD = '#b8952a'
const GRAY_100 = '#f1f5f9'
const GRAY_300 = '#cbd5e1'
const GRAY_500 = '#64748b'

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },

  // Header band
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 36,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 56, height: 56, objectFit: 'contain' },
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  companyTagline: { fontSize: 9, color: GRAY_300, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 24, fontWeight: 'bold', color: GOLD, letterSpacing: 2 },
  docNumber: { fontSize: 10, color: GRAY_300, marginTop: 4 },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: GOLD,
    color: NAVY,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Gold accent bar
  accentBar: { height: 3, backgroundColor: GOLD },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 24 },

  // Two-column info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoCol: { width: '47%' },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
    paddingBottom: 4,
  },
  infoText: { fontSize: 9, lineHeight: 1.6, color: '#334155' },
  infoBold: { fontSize: 10, fontWeight: 'bold', color: NAVY },

  // Dates row
  datesRow: {
    flexDirection: 'row',
    backgroundColor: GRAY_100,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 40,
  },
  dateLabel: { fontSize: 7, color: GRAY_500, textTransform: 'uppercase', letterSpacing: 1 },
  dateValue: { fontSize: 10, fontWeight: 'bold', color: NAVY, marginTop: 2 },

  // Items table
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  thText: { color: '#ffffff', fontWeight: 'bold', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: { backgroundColor: GRAY_100 },
  colDesc: { flex: 3.5 },
  colQty: { flex: 0.8, textAlign: 'right' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colTax: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },

  // Totals
  totalsBlock: { alignItems: 'flex-end', marginTop: 16 },
  totalRow: {
    flexDirection: 'row',
    width: 240,
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalLabel: { fontSize: 9, color: GRAY_500 },
  totalValue: { fontSize: 9 },
  grandTotalRow: {
    flexDirection: 'row',
    width: 240,
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
  grandTotalValue: { fontSize: 12, fontWeight: 'bold', color: GOLD },

  // Notes
  notes: {
    marginTop: 24,
    padding: 14,
    backgroundColor: GRAY_100,
    borderLeftWidth: 3,
    borderLeftColor: NAVY_LIGHT,
  },
  notesLabel: { fontSize: 8, fontWeight: 'bold', color: NAVY, textTransform: 'uppercase', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#334155', lineHeight: 1.5 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
    paddingVertical: 12,
    paddingHorizontal: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  footerText: { fontSize: 7, color: GRAY_300 },
})

const fmt = (n: number, c: string) => `${c}${n.toFixed(2)}`

export const CorporateTemplate: React.FC<InvoiceTemplateProps> = (props) => {
  const {
    type, documentNumber, status, issueDate, dueDate, validUntil,
    company, client, items, subtotal, taxTotal, total, currency, notes,
  } = props

  const title = type === 'invoice' ? 'INVOICE' : 'QUOTE'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Navy header band */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo && <Image src={company.logo} style={styles.logo} />}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.website && <Text style={styles.companyTagline}>{company.website}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docNumber}>{documentNumber}</Text>
            <Text style={styles.statusBadge}>{status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Gold accent bar */}
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* Dates */}
          <View style={styles.datesRow}>
            <View>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateValue}>{issueDate}</Text>
            </View>
            {dueDate && (
              <View>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={styles.dateValue}>{dueDate}</Text>
              </View>
            )}
            {validUntil && (
              <View>
                <Text style={styles.dateLabel}>Valid Until</Text>
                <Text style={styles.dateValue}>{validUntil}</Text>
              </View>
            )}
          </View>

          {/* Two-column: Company + Client */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.sectionLabel}>From</Text>
              <Text style={styles.infoBold}>{company.name}</Text>
              <Text style={styles.infoText}>{company.address.street}</Text>
              <Text style={styles.infoText}>{company.address.postalCode} {company.address.city}</Text>
              <Text style={styles.infoText}>{company.address.country}</Text>
              {company.phone && <Text style={styles.infoText}>Tel: {company.phone}</Text>}
              {company.email && <Text style={styles.infoText}>{company.email}</Text>}
              {company.vatNumber && <Text style={styles.infoText}>VAT: {company.vatNumber}</Text>}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.sectionLabel}>Bill To</Text>
              <Text style={styles.infoBold}>{client.name}</Text>
              {client.address && (
                <>
                  <Text style={styles.infoText}>{client.address.street}</Text>
                  <Text style={styles.infoText}>{client.address.postalCode} {client.address.city}</Text>
                  <Text style={styles.infoText}>{client.address.country}</Text>
                </>
              )}
              {client.email && <Text style={styles.infoText}>{client.email}</Text>}
              {client.vatNumber && <Text style={styles.infoText}>VAT: {client.vatNumber}</Text>}
            </View>
          </View>

          {/* Items table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, styles.thText]}>Description</Text>
              <Text style={[styles.colQty, styles.thText]}>Qty</Text>
              <Text style={[styles.colPrice, styles.thText]}>Price</Text>
              <Text style={[styles.colTax, styles.thText]}>Tax</Text>
              <Text style={[styles.colTotal, styles.thText]}>Total</Text>
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
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmt(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{fmt(taxTotal, currency)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{fmt(total, currency)}</Text>
            </View>
          </View>

          {/* Notes */}
          {notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {company.bankName && <Text style={styles.footerText}>Bank: {company.bankName}</Text>}
          {company.iban && <Text style={styles.footerText}>IBAN: {company.iban}</Text>}
          {company.bic && <Text style={styles.footerText}>BIC: {company.bic}</Text>}
          {company.siret && <Text style={styles.footerText}>SIRET: {company.siret}</Text>}
          {company.legalMentions && <Text style={styles.footerText}>{company.legalMentions}</Text>}
        </View>
      </Page>
    </Document>
  )
}

export const corporateTemplate = {
  name: 'Corporate',
  component: CorporateTemplate,
}
