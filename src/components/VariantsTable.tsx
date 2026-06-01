const CARD = { background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)', borderRadius: 10, padding: 16 }

export default function VariantsTable({
  variants,
  total,
}: {
  variants: Record<string, number>
  total: number
}) {
  const rows = Object.entries(variants).map(([variant, count], i) => ({
    variant, count, share: total ? Math.round((count / total) * 100) : 0, isHappy: i === 0,
  }))

  return (
    <div style={CARD} className="h-[280px] flex flex-col">
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#64748b' }}>
        Process Variants
      </p>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(30,127,216,0.2)' }}>
              <th className="text-left pb-2 pr-2 uppercase tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>Variant</th>
              <th className="text-right pb-2 px-2 uppercase tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>Count</th>
              <th className="text-right pb-2 uppercase tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}
                style={{ borderBottom: '1px solid rgba(30,127,216,0.06)' }}
                className="hover:bg-[rgba(30,127,216,0.04)] transition-colors">
                <td className="py-2 pr-2 leading-snug" style={{ color: row.isHappy ? '#f1f5f9' : '#94a3b8', fontWeight: row.isHappy ? 500 : 400, maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.variant}
                </td>
                <td className="py-2 px-2 text-right" style={{ color: '#94a3b8' }}>{row.count}</td>
                <td className="py-2 text-right" style={{ color: '#64748b' }}>{row.share}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
