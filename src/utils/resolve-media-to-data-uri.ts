import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Payload } from 'payload'

const isAbsoluteUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://')

/**
 * Resolves a Payload media document to a format that @react-pdf/renderer
 * can use in its Image component.
 *
 * Handles three scenarios:
 * 1. Cloud storage (S3, Azure, GCS, R2, etc.) — url is already absolute, use directly
 * 2. Local storage — reads file from disk and converts to base64 data URI
 * 3. Local storage with serverURL — constructs absolute URL as fallback
 */
export const resolveMediaToDataUri = (
  payload: Payload,
  mediaCollectionSlug: string,
  mediaDoc: Record<string, any> | string | undefined | null,
): string | undefined => {
  if (!mediaDoc || typeof mediaDoc !== 'object') return undefined

  const { filename, mimeType, url } = mediaDoc
  if (!filename && !url) return undefined

  // Cloud storage: url is already an absolute URL (e.g. https://s3.amazonaws.com/...)
  if (url && isAbsoluteUrl(url)) {
    return url
  }

  // Local storage: read file from disk and convert to base64 data URI
  if (filename) {
    const collectionConfig = payload.config.collections.find(
      (c) => c.slug === mediaCollectionSlug,
    )
    const uploadConfig = collectionConfig?.upload
    if (
      uploadConfig &&
      typeof uploadConfig === 'object' &&
      typeof uploadConfig.staticDir === 'string'
    ) {
      try {
        const filePath = resolve(uploadConfig.staticDir, filename)
        const fileBuffer = readFileSync(filePath)
        return `data:${mimeType || 'image/png'};base64,${fileBuffer.toString('base64')}`
      } catch {
        // Fall through to URL-based approach
      }
    }
  }

  // Fallback: construct absolute URL from relative path + serverURL
  if (url && payload.config.serverURL) {
    return `${payload.config.serverURL}${url}`
  }

  return undefined
}
