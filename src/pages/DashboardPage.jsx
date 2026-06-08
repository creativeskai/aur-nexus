import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Upload, Clock, AlertCircle, CheckCircle, Package, ArrowRight, RefreshCw } from 'lucide-react'

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div style={{ background:'#FFFFFF', border:'1px solid #EBEBEB', borderRadius:'10px', padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9A948F' }}>{label}</span>
        <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'#F7F7F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={13} color="#C0BCB8" strokeWidth={1.5} />
        </div>
      </div>
      <div style={{ fontFamily:'Outfit, sans-serif', fontSize:'32px', fontWeight:300, lineHeight:1, color: accent || '#0D0D0D', letterSpacing:'-0.02em' }}>
        {value ?? 0}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({})
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) load() }, [profile])

  async function load() {
    setLoading(true)
    try {
      const uid = profile.id, role = profile.role
      if (role === 'designer') {
        const [d,p,r,a,rec] = await Promise.all([
          supabase.from('designs').select('*',{count:'exact',head:true}).eq('designer_id',uid).eq('status','draft'),
          supabase.from('designs').select('*',{count:'exact',head:true}).eq('designer_id',uid).in('status',['submitted','under_review','resubmitted']),
          supabase.from('designs').select('*',{count:'exact',head:true}).eq('designer_id',uid).eq('status','revision_requested'),
          supabase.from('designs').select('*',{count:'exact',head:true}).eq('designer_id',uid).eq('status','approved'),
          supabase.from('designs').select('*,collections(name)').eq('designer_id',uid).order('updated_at',{ascending:false}).limit(6)
        ])
        setStats({ drafts:d.count||0, pending:p.count||0, revisions:r.count||0, approved:a.count||0 })
        setRecent(rec.data||[])
      } else if (role === 'admin') {
        const [pa,td,ap,ip,rec] = await Promise.all([
          supabase.from('designs').select('*',{count:'exact',head:true}).in('status',['submitted','under_review','resubmitted']),
          supabase.from('designs').select('*',{count:'exact',head:true}),
          supabase.from('designs').select('*',{count:'exact',head:true}).eq('status','approved'),
          supabase.from('designs').select('*',{count:'exact',head:true}).in('status',['sampling','production','production_ready']),
          supabase.from('designs').select('*,users!designs_designer_id_fkey(full_name),collections(name)').order('updated_at',{ascending:false}).limit(6)
        ])
        setStats({ pendingApprovals:pa.count||0, totalDesigns:td.count||0, approved:ap.count||0, inProduction:ip.count||0 })
        setRecent(rec.data||[])
      } else {
        const [p,rec] = await Promise.all([
          supabase.from('designs').select('*',{count:'exact',head:true}).in('status',['submitted','under_review']),
          supabase.from('designs').select('*,users!designs_designer_id_fkey(full_name)').in('status',['submitted','under_review']).order('updated_at',{ascending:false}).limit(6)
        ])
        setStats({ pending:p.count||0 })
        setRecent(rec.data||[])
      }
    } catch(e){ console.error(e) }
    setLoading(false)
  }

  const h = new Date().getHours()
  const greeting = h<12?'Good morning':h<17?'Good afternoon':'Good evening'

  return (
    <div>
      {/* Header */}
      <div className="flex-header" style={{ marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'30px', fontWeight:400, lineHeight:1.2 }}>
            {greeting}, {profile?.full_name?.split(' ')[0]}.
          </h1>
          <p style={{ fontSize:'12px', color:'#9A948F', marginTop:'4px' }}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
          </p>
        </div>
        <button onClick={load} style={{ width:'32px', height:'32px', borderRadius:'7px', border:'1px solid #EBEBEB', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9A948F' }}>
          <RefreshCw size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:'20px' }}>
        {profile?.role==='designer' && <>
          <StatCard label="Drafts" value={stats.drafts} icon={Upload} />
          <StatCard label="In Review" value={stats.pending} icon={Clock} accent="#9A6B00" />
          <StatCard label="Revision" value={stats.revisions} icon={AlertCircle} accent="#C4663A" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle} accent="#2E7D4F" />
        </>}
        {profile?.role==='admin' && <>
          <StatCard label="Pending" value={stats.pendingApprovals} icon={Clock} accent="#9A6B00" />
          <StatCard label="Total" value={stats.totalDesigns} icon={Upload} />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle} accent="#2E7D4F" />
          <StatCard label="Production" value={stats.inProduction} icon={Package} accent="#5E4EA0" />
        </>}
        {['sales','marketing'].includes(profile?.role) && (
          <StatCard label="Pending Review" value={stats.pending} icon={Clock} accent="#9A6B00" />
        )}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
        {['designer','admin'].includes(profile?.role) && (
          <Link to="/designs/new"><Button size="sm"><Upload size={12} strokeWidth={1.5} />Upload Design</Button></Link>
        )}
        {profile?.role==='admin' && (
          <Link to="/admin/approvals"><Button variant="secondary" size="sm"><CheckCircle size={12} strokeWidth={1.5} />Approvals</Button></Link>
        )}
        <Link to="/designs"><Button variant="secondary" size="sm">All Designs <ArrowRight size={12} strokeWidth={1.5} /></Button></Link>
      </div>

      {/* Recent */}
      <div style={{ background:'#FFFFFF', border:'1px solid #EBEBEB', borderRadius:'10px', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #EBEBEB', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'12px', fontWeight:500 }}>
            {profile?.role==='designer'?'Recent Designs':profile?.role==='admin'?'Latest Activity':'Pending Reviews'}
          </span>
          <Link to="/designs" style={{ fontSize:'12px', color:'#9A948F' }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#9A948F', fontSize:'13px' }}>Loading…</div>
        ) : recent.length===0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#9A948F', fontSize:'13px' }}>No designs yet.</div>
        ) : recent.map((d,i) => (
          <Link key={d.id} to={`/designs/${d.id}`}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom: i<recent.length-1?'1px solid #F7F7F5':'none', transition:'background 0.1s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#F7F7F5'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div>
              <div style={{ fontSize:'13px', fontWeight:500, color:'#0D0D0D' }}>{d.name}</div>
              <div style={{ fontSize:'11px', color:'#9A948F', fontFamily:'DM Mono, monospace', marginTop:'2px' }}>
                {d.category}{d.collections?` · ${d.collections.name}`:''}{d.users?` · ${d.users.full_name}`:''}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {d.sku && <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#9E7A3F' }}>{d.sku}</span>}
              <StatusBadge status={d.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
