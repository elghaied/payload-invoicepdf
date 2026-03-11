'use client'
import React, { useEffect, useRef } from 'react'
import { useConfig, useField } from '@payloadcms/ui'
import { getByPath } from '../utils/resolve-customer-data.js'

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
        // Resolve name (string or string[])
        if (mapping.name) {
          const nameFields = Array.isArray(mapping.name) ? mapping.name : [mapping.name]
          const name = nameFields
            .map((field) => getByPath(customer, field))
            .filter((v) => v != null && String(v).trim() !== '')
            .map(String)
            .join(' ')
          if (name) setName(name)
        }

        if (mapping.email) {
          const email = getByPath(customer, mapping.email)
          if (email != null) setEmail(String(email))
        }

        if (mapping.vatNumber) {
          const vatNumber = getByPath(customer, mapping.vatNumber)
          if (vatNumber != null) setVatNumber(String(vatNumber))
        }

        if (mapping.address) {
          if (mapping.address.street) {
            const v = getByPath(customer, mapping.address.street)
            if (v != null) setStreet(String(v))
          }
          if (mapping.address.city) {
            const v = getByPath(customer, mapping.address.city)
            if (v != null) setCity(String(v))
          }
          if (mapping.address.postalCode) {
            const v = getByPath(customer, mapping.address.postalCode)
            if (v != null) setPostalCode(String(v))
          }
          if (mapping.address.country) {
            const v = getByPath(customer, mapping.address.country)
            if (v != null) setCountry(String(v))
          }
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
