import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { invoicePdf, builtInTemplates } from 'payload-invoicepdf'

import { corporateTemplate } from './templates/corporate.js'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'products',
        admin: { useAsTitle: 'name' },
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'sku', type: 'text' },
          { name: 'description', type: 'textarea' },
        ],
      },
      {
        slug: 'media',
        fields: [{ name: 'alt', type: 'text' }],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
      {
        slug: 'customers',
        admin: { useAsTitle: 'companyName' },
        fields: [
          { name: 'companyName', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'vatNumber', type: 'text', label: 'VAT Number' },
          {
            name: 'address',
            type: 'group',
            fields: [
              { name: 'street', type: 'text' },
              { name: 'city', type: 'text' },
              { name: 'postalCode', type: 'text' },
              { name: 'country', type: 'text' },
            ],
          },
        ],
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URL || '',
    }),
    editor: lexicalEditor(),
    email: nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM!,
      defaultFromName: process.env.SMTP_FROM_NAME!,
      skipVerify: true,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      },
    }),
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      invoicePdf({
        productCollection: 'products',
        productFieldMapping: {
          name: 'name',
          price: 'price',
          ref: 'sku',
          description: 'description',
        },
        customerCollection: 'customers',
        customerFieldMapping: {
          name: 'companyName',
          email: 'email',
          vatNumber: 'vatNumber',
          address: {
            street: 'address.street',
            city: 'address.city',
            postalCode: 'address.postalCode',
            country: 'address.country',
          },
        },
        templates: [...builtInTemplates, corporateTemplate],
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
