import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/Badge'
import { CheckSquare, Clock } from 'lucide-react'

export default function AdminApprovalsPage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.from('designs')
      .select('*, users!designs_designer_id_fkey(full_name), collections(name), reviews(overall_score, role, users(full_name))')
      .in('status', ['submitted', 'under_review', 'resubmitted'])
      .order('updated_at', { ascending: true })
      .then(({ data }) => { setQueue(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300 }}>Approval Queue</h1>
        <p style={{ fontSize: '13px', color: '#9A948F', marginTop: '6px' }}>{queue.length} design{queue.length !== 1 ? 's' : ''} awaiting decision</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9A948F', fontSize: '13px' }}>Loading…</div>
      ) : queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <CheckSquare size={32} color="#E8E4DC" strokeWidth={1} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>Queue is clear</h3>
          <p style={{ fontSize: '13px', color: '#9A948F' }}>No designs are waiting for your review or approval.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.map(d => {
            const avg = d.reviews?.length
              ? (d.reviews.reduce((s, r) => s + parseFloat(r.overall_score), 0) / d.reviews.length).toFixed(1)
              : null
            const salesR = d.reviews?.find(r => r.role === 'sales')
            const mktR = d.reviews?.find(r => r.role === 'marketing')

            return (
              <Link key={d.id} to={`/designs/${d.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px',
                  padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '24px',
                  transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D0D0D'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4DC'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#0D0D0D' }}>{d.name}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>
                      <span>{d.category}</span>
                      {d.collections && <><span>·</span><span>{d.collections.name}</span></>}
                      <span>·</span><span>by {d.users?.full_name}</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} strokeWidth={1.5} />
                        {new Date(d.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
                    {[['Sales', salesR?.overall_score], ['Marketing', mktR?.overall_score], ['Average', avg]].map(([label, val]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: '#9A948F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '16px', fontWeight: 500, color: val ? (label === 'Average' ? '#9E7A3F' : '#0D0D0D') : '#E8E4DC' }}>
                          {val || '—'}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#9A948F', fontSize: '12px' }}>Review →</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
