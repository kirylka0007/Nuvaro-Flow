import Link from 'next/link'

export default function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#080F1E' }}>
      <div className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.25)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(30,127,216,0.15)' }}>
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Nuvaro Flow</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Process Intelligence</p>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>
            Connect your Xero account
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            Authorise read-only access to your Xero invoices to start analysing your Order-to-Cash process.
          </p>
        </div>

        <Link href="/api/auth/xero"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #1E7FD8, #00A8CC)', color: '#fff' }}>
          Connect Xero
        </Link>

        <p className="text-xs text-center" style={{ color: '#475569' }}>
          Secure OAuth 2.0 connection · read-only invoice access
        </p>
      </div>
    </div>
  )
}
