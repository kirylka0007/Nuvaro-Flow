import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Dashboard from '@/components/Dashboard'

export default async function Page() {
  const session = await getSession()

  if (!session.accessToken) {
    redirect('/connect')
  }

  return <Dashboard tenantName={session.tenantName} />
}
