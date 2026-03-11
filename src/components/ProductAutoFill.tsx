'use client'
import type React from 'react';

import { useConfig, useField } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

type Props = {
  path: string
  productCollection: string
  productFieldMapping: { name: string; price: string }
}

export const ProductAutoFill: React.FC<Props> = ({
  path,
  productCollection: collection,
  productFieldMapping: mapping,
}) => {
  const basePath = path.replace(/\.autoFillFromProduct$/, '')

  const { value: productId } = useField<string>({ path: `${basePath}.product` })
  const { setValue: setDescription } = useField<string>({ path: `${basePath}.description` })
  const { setValue: setUnitPrice } = useField<number>({ path: `${basePath}.unitPrice` })
  const { config } = useConfig()

  const prevProductRef = useRef<null | string>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentId = productId
      ? typeof productId === 'object'
        ? (productId as any).id || (productId as any).value
        : String(productId)
      : null

    // On first render, record the current product ID without fetching
    // to avoid overwriting existing values when editing a saved document
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevProductRef.current = currentId
      return
    }

    if (currentId === prevProductRef.current) {return}
    prevProductRef.current = currentId

    if (!currentId) {return}

    fetch(`${config.routes.api}/${collection}/${currentId}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {throw new Error('Fetch failed')}
        return res.json()
      })
      .then((product) => {
        if (mapping.name && product[mapping.name] != null) {
          setDescription(String(product[mapping.name]))
        }
        if (mapping.price && product[mapping.price] != null) {
          setUnitPrice(Number(product[mapping.price]))
        }
      })
      .catch(() => {
        // Silently ignore - product may not exist or user may lack access
      })
  }, [productId, mapping, collection, config.routes.api, setDescription, setUnitPrice])

  return null
}
