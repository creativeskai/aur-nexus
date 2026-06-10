import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Upload, Search, FolderOpen } from 'lucide-react'

const STATUSES = ['draft','submitted','under_review','revision_requested','resubmitted','approved','specification_pending','production_ready','sampling','sample_approved','production','launch_ready','archived']

export default function DesignsListPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const canUpload = ['designer', 'admin'].includes(profile?.role)

  useEffect(() => { fetchDesigns() }, [statusFilter, profile])

  async function fetchDesigns() {
    setLoading(true)
    let q = supabase.from('designs')
      .select('*, users!designs_designer_id_fkey(full_name), collections(name)')
      .order('updated_at', { ascending: false })
    if (profile?.role === 'designer') q = q.eq('designer_id', profile.id)
    if (statusFilter) q = q.eq('status', statusFilter)
    const { data } = await q
    setDesigns(data || [])
    setLoading(false)
  }

  const filtered = designs.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase()) ||
    d.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const th = { fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', padding: '10px 0', fontWeight: 400 }

  return (
    <div>
      <div className="flex-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300 }}>
            {profile?.role === 'designer' ? 'My Designs' : 'All Designs'}
          </h1>
          <p style={{ fontSize: '13px', color: '#9A948F', marginTop: '6px' }}>{filtered.length} design{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {canUpload && (
          <Link to="/designs/new">
            <Button size="sm"><Upload size={13} strokeWidth={1.5} />Upload Design</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} color="#9A948F" strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, category, SKU…"
            style={{
              width: '100%', paddingLeft: '36px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
              background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '8px',
              fontSize: '13px', color: '#0D0D0D', outline: 'none', fontFamily: 'Outfit, sans-serif'
            }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px', background: '#FFFFFF', border: '1px solid #E8E4DC',
            borderRadius: '8px', fontSize: '13px', color: '#0D0D0D', cursor: 'pointer',
            outline: 'none', fontFamily: 'Outfit, sans-serif'
          }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9A948F', fontSize: '13px' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FolderOpen size={22} color="#9A948F" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>No designs found</h3>
          <p style={{ fontSize: '13px', color: '#9A948F', marginBottom: '20px' }}>
            {canUpload ? 'Upload your first design to get started.' : 'No designs match your current filters.'}
          </p>
          {canUpload && <Link to="/designs/new"><Button size="sm"><Upload size={13} />Upload Design</Button></Link>}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-grid-designs" style={{ gap: '0', padding: '0 24px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
            {['Design', 'Category', 'Collection', 'Designer', 'Status'].map((h,i) => (
              <div key={h} className={i >= 2 && i <= 3 ? 'hide-mobile' : ''} style={th}>{h}</div>
            ))}
          </div>
          {filtered.map((d, i) => (
            <Link key={d.id} to={`/designs/${d.id}`}
              className="table-grid-designs" style={{
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid #F5F2EC' : 'none',
                transition: 'background 0.1s', textDecoration: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#0D0D0D' }}>{d.name}</div>
                {d.sku && <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: '#9E7A3F', marginTop: '2px' }}>{d.sku}</div>}
              </div>
              <div style={{ fontSize: '12px', color: '#9A948F' }}>{d.category}</div>
              <div style={{ fontSize: '12px', color: '#9A948F' }}>{d.collections?.name || '—'}</div>
              <div style={{ fontSize: '12px', color: '#9A948F' }}>{d.users?.full_name || '—'}</div>
              <div><StatusBadge status={d.status} /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
