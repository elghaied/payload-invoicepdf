import type { CollectionBeforeChangeHook } from 'payload'

interface AutoNumberOptions {
  collectionSlug: string
  fieldName: string
  prefix: string
}

export const createAutoNumberHook =
  (options: AutoNumberOptions): CollectionBeforeChangeHook =>
  async ({ data, operation, req }) => {
    if (operation !== 'create') {return data}

    const { collectionSlug, fieldName, prefix } = options
    const year = new Date().getFullYear()
    const searchPrefix = `${prefix}-${year}-`

    // Find the latest document number for this year
    const latest = await req.payload.find({
      collection: collectionSlug as any,
      depth: 0,
      limit: 1,
      req,
      sort: `-${fieldName}`,
      where: {
        [fieldName]: { contains: searchPrefix },
      },
    })

    let nextNumber = 1
    if (latest.docs.length > 0) {
      const lastNumber = (latest.docs[0] as any)[fieldName] as string
      const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10)
      nextNumber = lastSequence + 1
    }

    const newNumber = `${searchPrefix}${String(nextNumber).padStart(4, '0')}`
    data[fieldName] = newNumber

    return data
  }
