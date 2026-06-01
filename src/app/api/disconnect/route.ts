import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await getSession()
  session.destroy()
  return NextResponse.redirect(new URL('/connect', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
}
