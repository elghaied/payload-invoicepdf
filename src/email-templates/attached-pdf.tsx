import React from 'react'
import type { EmailTemplateProps } from '../types.js'

export const AttachedPdfEmail: React.FC<EmailTemplateProps> = ({
  type,
  documentNumber,
  client,
  company,
}) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f4f5', padding: '32px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header */}
                <tr>
                  <td style={{ padding: '32px 40px 24px', borderBottom: '1px solid #e4e4e7' }}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        style={{ maxHeight: '48px', maxWidth: '200px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b' }}>
                        {company.name}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '32px 40px' }}>
                    <p style={{ fontSize: '16px', color: '#18181b', margin: '0 0 16px' }}>
                      Dear {client.name},
                    </p>
                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Please find attached {docLabel} <strong>{documentNumber}</strong>.
                    </p>
                    <p style={{ fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 24px' }}>
                      If you have any questions, please don&apos;t hesitate to reach out.
                    </p>

                    {/* Signature */}
                    <table cellPadding={0} cellSpacing={0} style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
                      <tr>
                        <td style={{ paddingTop: '16px' }}>
                          <p style={{ fontSize: '14px', color: '#18181b', fontWeight: 'bold', margin: '0 0 4px' }}>
                            {company.name}
                          </p>
                          {company.phone && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.phone}
                            </p>
                          )}
                          {company.email && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 2px' }}>
                              {company.email}
                            </p>
                          )}
                          {company.website && (
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0' }}>
                              {company.website}
                            </p>
                          )}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                {company.legalMentions && (
                  <tr>
                    <td style={{ padding: '16px 40px', backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7' }}>
                      <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
                        {company.legalMentions}
                      </p>
                    </td>
                  </tr>
                )}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
