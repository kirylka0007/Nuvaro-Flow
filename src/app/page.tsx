import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Dashboard from '@/components/Dashboard'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Demo mode renders sample data with no Xero connection, so the dashboard can
  // be shown or deployed publicly without an authenticated org. DEMO_MODE=1
  // makes a whole deployment demo-only, so any URL works for a public link.
  const demo = process.env.DEMO_MODE === '1' || (await searchParams).demo === '1'
  if (demo) return <Dashboard demo />

  const session = await getSession()
  if (!session.accessToken) {
    redirect('/connect')
  }

  return <Dashboard tenantName={session.tenantName} />
}
