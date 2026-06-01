import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/connect?error=no_code', request.url))
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.XERO_REDIRECT_URI!,
      client_id: process.env.XERO_CLIENT_ID!,
      client_secret: process.env.XERO_CLIENT_SECRET!,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/connect?error=token_exchange', request.url))
  }

  const tokens = await tokenRes.json()

  // Get tenant
  const connectionsRes = await fetch('https://api.xero.com/connections', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const connections = connectionsRes.ok ? await connectionsRes.json() : []
  const tenant = connections[0]

  const session = await getSession()
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token
  session.tenantId = tenant?.tenantId ?? ''
  session.tenantName = tenant?.tenantName ?? 'Xero'
  await session.save()

  return NextResponse.redirect(new URL('/', request.url))
}
