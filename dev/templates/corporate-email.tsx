import React from 'react'
import type { EmailTemplateProps } from 'payload-invoicepdf'

const NAVY = '#0f172a'
const GOLD = '#b8952a'
const GRAY_100 = '#f1f5f9'
const GRAY_500 = '#64748b'

export const CorporateEmail: React.FC<EmailTemplateProps> = ({
  type,
  documentNumber,
  client,
  company,
}) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f1f5f9', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: GRAY_100, padding: '32px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '0', overflow: 'hidden' }}>
                {/* Navy header */}
                <tr>
                  <td style={{ backgroundColor: NAVY, padding: '28px 40px', textAlign: 'center' as const }}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        style={{ maxHeight: '48px', maxWidth: '200px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>
                        {company.name}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Gold accent bar */}
                <tr>
                  <td style={{ height: '3px', backgroundColor: GOLD }} />
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '36px 40px' }}>
                    <p style={{ fontSize: '16px', color: NAVY, margin: '0 0 20px', fontWeight: 'bold' }}>
                      Dear {client.name},
                    </p>
                    <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Please find attached {docLabel}{' '}
                      <strong style={{ color: NAVY }}>{documentNumber}</strong>.
                    </p>
                    <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 24px' }}>
                      Should you have any questions or require further information, please do not hesitate to contact us.
                    </p>

                    {/* Signature block */}
                    <table cellPadding={0} cellSpacing={0} width="100%">
                      <tr>
                        <td style={{ borderTop: `2px solid ${GOLD}`, paddingTop: '16px' }}>
                          <p style={{ fontSize: '14px', color: NAVY, fontWeight: 'bold', margin: '0 0 4px' }}>
                            {company.name}
                          </p>
                          {company.phone && (
                            <p style={{ fontSize: '13px', color: GRAY_500, margin: '0 0 2px' }}>
                              {company.phone}
                            </p>
                          )}
                          {company.email && (
                            <p style={{ fontSize: '13px', color: GRAY_500, margin: '0 0 2px' }}>
                              {company.email}
                            </p>
                          )}
                          {company.website && (
                            <p style={{ fontSize: '13px', color: GRAY_500, margin: '0' }}>
                              {company.website}
                            </p>
                          )}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: NAVY, padding: '16px 40px', textAlign: 'center' as const }}>
                    {company.legalMentions ? (
                      <p style={{ fontSize: '11px', color: GRAY_500, margin: 0, lineHeight: '1.5' }}>
                        {company.legalMentions}
                      </p>
                    ) : (
                      <p style={{ fontSize: '11px', color: GRAY_500, margin: 0 }}>
                        &copy; {company.name}
                      </p>
                    )}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

export const corporateEmailTemplate = {
  name: 'corporate',
  label: 'Corporate',
  description: 'A navy & gold corporate-styled email matching the Corporate PDF template.',
  kind: 'attachment' as const,
  component: CorporateEmail,
  forTypes: ['invoice', 'quote'] as ('invoice' | 'quote')[],
}
