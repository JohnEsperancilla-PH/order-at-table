import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex <= 0) continue

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const cwd = process.cwd()
loadEnvFile(path.join(cwd, '.env.local'))
loadEnvFile(path.join(cwd, '.env'))

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const recommended = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'CONTACT_EMAIL',
]

const missingRequired = required.filter((key) => !process.env[key])
const missingRecommended = recommended.filter((key) => !process.env[key])

if (missingRequired.length > 0) {
  console.error('Missing required environment variables:')
  for (const key of missingRequired) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

if (missingRecommended.length > 0) {
  console.warn('Missing recommended environment variables:')
  for (const key of missingRecommended) {
    console.warn(`- ${key}`)
  }
}

console.log('Environment validation passed for required variables.')
