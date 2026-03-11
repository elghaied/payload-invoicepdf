import React from 'react'

import type { EmailTemplateProps } from '../types.js'

export const AttachedPdfEmail: React.FC<EmailTemplateProps> = ({
  type,
  client,
  company,
  documentNumber,
}) => {
  const docLabel = type === 'invoice' ? 'Invoice' : 'Quote'

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }}>
        <table cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f4f5', padding: '32px 0' }} width="100%">
          <tr>
            <td align="center">
              <table cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }} width="600">
                {/* Header */}
                <tr>
                  <td style={{ borderBottom: '1px solid #e4e4e7', padding: '32px 40px 24px' }}>
                    {company.logo ? (
                      <img
                        alt={company.name}
                        src={company.logo}
                        style={{ maxHeight: '48px', maxWidth: '200px' }}
                      />
                    ) : (
                      <span style={{ color: '#18181b', fontSize: '20px', fontWeight: 'bold' }}>
                        {company.name}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '32px 40px' }}>
                    <p style={{ color: '#18181b', fontSize: '16px', margin: '0 0 16px' }}>
                      Dear {client.name},
                    </p>
                    <p style={{ color: '#3f3f46', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Please find attached {docLabel} <strong>{documentNumber}</strong>.
                    </p>
                    <p style={{ color: '#3f3f46', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                      If you have any questions, please don&apos;t hesitate to reach out.
                    </p>

                    {/* Signature */}
                    <table cellPadding={0} cellSpacing={0} style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
                      <tr>
                        <td style={{ paddingTop: '16px' }}>
                          <p style={{ color: '#18181b', fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px' }}>
                            {company.name}
                          </p>
                          {company.phone && (
                            <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 2px' }}>
                              {company.phone}
                            </p>
                          )}
                          {company.email && (
                            <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 2px' }}>
                              {company.email}
                            </p>
                          )}
                          {company.website && (
                            <p style={{ color: '#71717a', fontSize: '13px', margin: '0' }}>
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
                    <td style={{ backgroundColor: '#fafafa', borderTop: '1px solid #e4e4e7', padding: '16px 40px' }}>
                      <p style={{ color: '#a1a1aa', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
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
