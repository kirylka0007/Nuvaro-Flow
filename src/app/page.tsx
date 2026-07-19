import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Dashboard from '@/components/Dashboard'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Demo mode renders sample data with no Xero connection, so the dashboard can
  // be shown or deployed publicly without an authenticated org.
  const demo = (await searchParams).demo === '1'
  if (demo) return <Dashboard demo />

  const session = await getSession()
  if (!session.accessToken) {
    redirect('/connect')
  }

  return <Dashboard tenantName={session.tenantName} />
}
