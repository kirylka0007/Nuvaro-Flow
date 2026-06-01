const XERO_API = 'https://api.xero.com/api.xro/2.0'
const TOKEN_URL = 'https://identity.xero.com/connect/token'

export interface XeroInvoice {
  InvoiceID: string
  InvoiceNumber: string
  Contact?: { Name?: string }
  Total: number
  CurrencyCode: string
  Date?: string
  DateString?: string
  Status: string
}

export interface XeroHistoryRecord {
  Changes?: string
  DateUTC?: string
  DateUTCString?: string
  User?: string
}

export async function refreshXeroToken(token: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
      client_id: process.env.XERO_CLIENT_ID!,
      client_secret: process.env.XERO_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}

export async function getInvoices(accessToken: string, tenantId: string): Promise<XeroInvoice[]> {
  const res = await fetch(`${XERO_API}/Invoices?where=Type%3D%3D%22ACCREC%22`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`)
  const data = await res.json()
  return (data.Invoices ?? []) as XeroInvoice[]
}

export async function getInvoiceHistory(
  invoiceId: string,
  accessToken: string,
  tenantId: string,
): Promise<XeroHistoryRecord[]> {
  const res = await fetch(`${XERO_API}/Invoices/${invoiceId}/History`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.HistoryRecords ?? []) as XeroHistoryRecord[]
}

/** Fetch all histories in batches to respect Xero rate limits */
export async function getAllHistories(
  invoices: XeroInvoice[],
  accessToken: string,
  tenantId: string,
  batchSize = 8,
): Promise<Record<string, XeroHistoryRecord[]>> {
  const histories: Record<string, XeroHistoryRecord[]> = {}
  for (let i = 0; i < invoices.length; i += batchSize) {
    const batch = invoices.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(inv => getInvoiceHistory(inv.InvoiceID, accessToken, tenantId)),
    )
    results.forEach((result, j) => {
      histories[batch[j].InvoiceID] = result.status === 'fulfilled' ? result.value : []
    })
  }
  return histories
}
