import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  accessToken?: string
  refreshToken?: string
  tenantId?: string
  tenantName?: string
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'nuvaro_flow_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
