import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Package } from 'lucide-react'

const PRODUCTION_STATUSES = ['approved', 'specification_pending', 'production_ready', 'sampling', 'sample_approved', 'production', 'launch_ready']

export default function ProductionPage() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchDesigns() }, [statusFilter])

  async function fetchDesigns() {
    setLoading(true)
    let query = supabase
      .from('designs')
      .select('*, users!designs_designer_id_fkey(full_name), production_specs(*)')
      .in('status', statusFilter ? [statusFilter] : PRODUCTION_STATUSES)
      .order('updated_at', { ascending: false })

    const { data } = await query
    setDesigns(data || [])
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-[var(--ink)] mb-1">Production</h1>
          <p className="text-sm text-[var(--muted)]">{designs.length} products in pipeline</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--ink)] transition-colors"
        >
          <option value="">All Production Stages</option>
          {PRODUCTION_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--muted)]">Loading…</div>
      ) : designs.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products in production"
          description="Approved designs will appear here once they enter the production pipeline."
        />
      ) : (
        <Card>
          <div className="divide-y divide-[var(--border)]">
            <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-[var(--surface-alt)] text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
              <div className="col-span-1">SKU</div>
              <div className="col-span-3">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Designer</div>
              <div className="col-span-2">Vendor</div>
              <div className="col-span-2">Status</div>
            </div>
            {designs.map(d => (
              <Link
                key={d.id}
                to={`/designs/${d.id}`}
                className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-[var(--surface-alt)] transition-colors"
              >
                <div className="col-span-1 font-mono text-[10px] text-[var(--muted)]">{d.sku || '—'}</div>
                <div className="col-span-3 font-medium text-sm text-[var(--ink)]">{d.name}</div>
                <div className="col-span-2 text-xs text-[var(--muted)]">{d.category}</div>
                <div className="col-span-2 text-xs text-[var(--muted)]">{d.users?.full_name}</div>
                <div className="col-span-2 text-xs text-[var(--muted)]">{d.production_specs?.vendor || '—'}</div>
                <div className="col-span-2"><StatusBadge status={d.status} /></div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
