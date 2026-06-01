import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SCOPES = [
  'openid', 'profile', 'email',
  'accounting.invoices', 'accounting.contacts',
  'accounting.payments', 'accounting.settings.read',
  'offline_access',
].join(' ')

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.XERO_CLIENT_ID!,
    redirect_uri: process.env.XERO_REDIRECT_URI!,
    scope: SCOPES,
    state,
  })
  return NextResponse.redirect(
    `https://login.xero.com/identity/connect/authorize?${params}`,
  )
}
