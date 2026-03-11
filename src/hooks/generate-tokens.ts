import crypto from 'crypto'
import type { CollectionBeforeChangeHook } from 'payload'

export const createGenerateTokensHook = (): CollectionBeforeChangeHook =>
  async ({ data, operation }) => {
    if (operation !== 'create') return data

    data.acceptToken = crypto.randomBytes(32).toString('hex')
    data.rejectToken = crypto.randomBytes(32).toString('hex')

    // Set token expiry to validUntil if present, otherwise 30 days from now
    if (data.validUntil) {
      data.tokenExpiresAt = data.validUntil
    } else {
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)
      data.tokenExpiresAt = thirtyDays.toISOString()
    }

    return data
  }
