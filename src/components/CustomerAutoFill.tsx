'use client'
import React, { useEffect, useRef } from 'react'
import { useConfig, useField } from '@payloadcms/ui'
import { resolveCustomerData } from '../utils/resolve-customer-data.js'

type Props = {
  path: string
  customerFieldMapping: {
    name: string | string[]
    email?: string
    vatNumber?: string
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  customerCollection: string
}

export const CustomerAutoFill: React.FC<Props> = ({
  path,
  customerFieldMapping: mapping,
  customerCollection: collection,
}) => {
  const basePath = path.replace(/\.autoFillFromCustomer$/, '')

  const { value: customerId } = useField<string>({ path: `${basePath}.customer` })
  const { setValue: setName } = useField<string>({ path: `${basePath}.name` })
  const { setValue: setEmail } = useField<string>({ path: `${basePath}.email` })
  const { setValue: setVatNumber } = useField<string>({ path: `${basePath}.vatNumber` })
  const { setValue: setStreet } = useField<string>({ path: `${basePath}.address.street` })
  const { setValue: setCity } = useField<string>({ path: `${basePath}.address.city` })
  const { setValue: setPostalCode } = useField<string>({ path: `${basePath}.address.postalCode` })
  const { setValue: setCountry } = useField<string>({ path: `${basePath}.address.country` })
  const { config } = useConfig()

  const prevCustomerRef = useRef<string | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentId = customerId
      ? typeof customerId === 'object'
        ? (customerId as any).id || (customerId as any).value
        : String(customerId)
      : null

    // On first render, record the current ID without fetching
    // to avoid overwriting existing values when editing a saved document
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevCustomerRef.current = currentId
      return
    }

    if (currentId === prevCustomerRef.current) return
    prevCustomerRef.current = currentId

    if (!currentId) return

    fetch(`${config.routes.api}/${collection}/${currentId}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed')
        return res.json()
      })
      .then((customer) => {
        const resolved = resolveCustomerData(customer, mapping)
        if (resolved.name) setName(resolved.name)
        if (resolved.email != null) setEmail(resolved.email)
        if (resolved.vatNumber != null) setVatNumber(resolved.vatNumber)
        if (resolved.address) {
          if (resolved.address.street != null) setStreet(resolved.address.street)
          if (resolved.address.city != null) setCity(resolved.address.city)
          if (resolved.address.postalCode != null) setPostalCode(resolved.address.postalCode)
          if (resolved.address.country != null) setCountry(resolved.address.country)
        }
      })
      .catch(() => {
        // Silently ignore — customer may not exist or user may lack access
      })
  }, [
    customerId, mapping, collection, config.routes.api,
    setName, setEmail, setVatNumber, setStreet, setCity, setPostalCode, setCountry,
  ])

  return null
}
