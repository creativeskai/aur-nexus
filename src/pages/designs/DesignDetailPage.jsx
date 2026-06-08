import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import { toast } from 'sonner'
import { ArrowLeft, Send, Star, CheckCircle, RotateCcw, ChevronRight, FileText, Image } from 'lucide-react'

const transitions = {
  admin: {
    draft: [], submitted: ['under_review'], under_review: ['approved', 'revision_requested'],
    resubmitted: ['approved', 'revision_requested'], approved: ['specification_pending', 'revision_requested'],
    specification_pending: ['production_ready'], production_ready: ['sampling'],
    sampling: ['sample_approved'], sample_approved: ['production'],
    production: ['launch_ready'], launch_ready: ['archived'],
  },
  designer: { draft: ['submitted'], revision_requested: ['resubmitted'] }
}

function ScoreRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F2EC' }}>
      <span style={{ fontSize: '13px', color: '#0D0D0D' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: '28px', height: '28px', borderRadius: '6px', border: 'none',
            fontSize: '11px', fontFamily: 'DM Mono, monospace', cursor: 'pointer',
            background: value === n ? '#0D0D0D' : value && n <= value ? '#C8A96E' : '#F5F2EC',
            color: value === n ? '#FAFAF7' : value && n <= value ? '#0D0D0D' : '#9A948F',
            transition: 'all 0.1s'
          }}>{n}</button>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#0D0D0D' }}>{value}</span>
    </div>
  )
}

export default function DesignDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [design, setDesign] = useState(null)
  const [files, setFiles] = useState([])
  const [comments, setComments] = useState([])
  const [reviews, setReviews] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showRevision, setShowRevision] = useState(false)
  const [revisionReason, setRevisionReason] = useState('')
  const [scores, setScores] = useState({ brand_fit: 0, commercial_pot: 0, originality: 0, production_feas: 0 })
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const [d, f, c, r, h] = await Promise.all([
      supabase.from('designs').select('*, users!designs_designer_id_fkey(full_name, email), collections(name)').eq('id', id).single(),
      supabase.from('design_files').select('*').eq('design_id', id).order('uploaded_at'),
      supabase.from('comments').select('*, users(full_name, role)').eq('design_id', id).is('parent_id', null).order('created_at'),
      supabase.from('reviews').select('*, users(full_name, role)').eq('design_id', id),
      supabase.from('status_history').select('*, users(full_name)').eq('design_id', id).order('changed_at', { ascending: false })
    ])
    setDesign(d.data)
    setFiles(f.data || [])
    setComments(c.data || [])
    setReviews(r.data || [])
    setHistory(h.data || [])
    const mine = r.data?.find(rv => rv.reviewer_id === profile?.id)
    if (mine) setScores({ brand_fit: mine.brand_fit, commercial_pot: mine.commercial_pot, originality: mine.originality, production_feas: mine.production_feas })
    setLoading(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    await supabase.from('comments').insert({ design_id: id, author_id: profile.id, body: newComment.trim() })
    setNewComment('')
    setSubmittingComment(false)
    fetchAll()
  }

  async function submitReview() {
    const { brand_fit, commercial_pot, originality, production_feas } = scores
    if (!brand_fit || !commercial_pot || !originality || !production_feas) { toast.error('Score all 4 criteria'); return }
    const { error } = await supabase.from('reviews').upsert({
      design_id: id, reviewer_id: profile.id, role: profile.role,
      brand_fit, commercial_pot, originality, production_feas
    }, { onConflict: 'design_id,reviewer_id' })
    if (error) { toast.error(error.message); return }
    toast.success('Review submitted')
    setShowReview(false)
    fetchAll()
  }

  async function transition(newStatus, reason = '') {
    if (newStatus === 'revision_requested' && !reason.trim()) { toast.error('Reason is required'); return }
    setTransitioning(true)
    const updates = { status: newStatus, updated_at: new Date().toISOString() }

    // Generate SKU on approval
    if (newStatus === 'approved' && !design.sku) {
      const catMap = { 'Sneakers':'SNK','Slides':'SLD','Sandals':'SDL','T-Shirts':'TSH','Oversized T-Shirts':'OTS','Jerseys':'JRS','Shirts':'SHT','Hoodies':'HDY','Sweatshirts':'SWT','Jackets':'JKT','Trousers':'TRS','Cargo Pants':'CGO','Shorts':'SHO','Joggers':'JGR','Denim':'DNM','Caps':'CAP','Beanies':'BNY','Socks':'SCK','Bags':'BAG','Rings':'RNG','Chains':'CHN','Bracelets':'BRC','Pendants':'PND' }
      const cat = catMap[design.category] || 'GEN'
      const season = (design.season || 'SS27').replace(/\s/g, '').toUpperCase()
      const { count } = await supabase.from('skus').select('*', { count: 'exact', head: true }).eq('category_code', cat).eq('season_code', season)
      const seq = (count || 0) + 1
      const sku = `AUR-${cat}-${season}-${String(seq).padStart(3, '0')}`
      await supabase.from('skus').insert({ design_id: id, sku_code: sku, category_code: cat, season_code: season, sequence: seq, generated_by: profile.id })
      updates.sku = sku
    }

    const { error } = await supabase.from('designs').update(updates).eq('id', id)
    if (error) { toast.error(error.message); setTransitioning(false); return }

    let commentId = null
    if (reason.trim()) {
      const { data: c } = await supabase.from('comments').insert({ design_id: id, author_id: profile.id, body: reason.trim(), is_revision_reason: true }).select().single()
      commentId = c?.id
    }

    await supabase.from('status_history').insert({ design_id: id, changed_by: profile.id, from_status: design.status, to_status: newStatus, comment_id: commentId })

    if (newStatus === 'approved') {
      await supabase.from('notifications').insert({ recipient_id: design.designer_id, type: 'design_approved', design_id: id })
    }
    if (newStatus === 'revision_requested') {
      await supabase.from('notifications').insert({ recipient_id: design.designer_id, type: 'revision_requested', design_id: id })
    }

    toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`)
    setRevisionReason('')
    setShowRevision(false)
    setTransitioning(false)
    fetchAll()
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9A948F', fontSize: '13px' }}>Loading…</div>
  if (!design) return <div style={{ padding: '60px', textAlign: 'center', color: '#9A948F', fontSize: '13px' }}>Design not found.</div>

  const myTransitions = transitions[profile?.role]?.[design.status] || []
  const designImages = files.filter(f => f.file_type === 'design_image')
  const inspirationImages = files.filter(f => f.file_type === 'inspiration_image')
  const avgScore = reviews.length ? (reviews.reduce((s, r) => s + parseFloat(r.overall_score), 0) / reviews.length).toFixed(1) : null
  const canReview = ['sales', 'marketing', 'admin'].includes(profile?.role) && ['submitted','under_review','resubmitted'].includes(design.status)
  const myReview = reviews.find(r => r.reviewer_id === profile?.id)
  const isImg = (ext) => ['jpg','jpeg','png','webp'].includes(ext?.toLowerCase())

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/designs')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9A948F', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '28px', padding: 0 }}>
        <ArrowLeft size={14} strokeWidth={1.5} /> All Designs
      </button>

      {/* Header */}
      <div className="flex-header" style={{ marginBottom: '36px', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300 }}>{design.name}</h1>
            <StatusBadge status={design.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>{design.category}</span>
            {design.collections && <><span style={{ color: '#E8E4DC' }}>·</span><span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>{design.collections.name}</span></>}
            {design.sku && <><span style={{ color: '#E8E4DC' }}>·</span><span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: '#9E7A3F', fontWeight: 500 }}>{design.sku}</span></>}
            <span style={{ color: '#E8E4DC' }}>·</span>
            <span style={{ fontSize: '12px', color: '#9A948F' }}>by {design.users?.full_name}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {canReview && (
            <Button variant="secondary" size="sm" onClick={() => setShowReview(true)}>
              <Star size={13} strokeWidth={1.5} />{myReview ? 'Edit Review' : 'Score Design'}
            </Button>
          )}
          {myTransitions.includes('submitted') && (
            <Button size="sm" disabled={transitioning} onClick={() => transition('submitted')}>
              <Send size={13} strokeWidth={1.5} />Submit for Review
            </Button>
          )}
          {myTransitions.includes('resubmitted') && (
            <Button size="sm" disabled={transitioning} onClick={() => transition('resubmitted')}>
              <Send size={13} strokeWidth={1.5} />Resubmit
            </Button>
          )}
          {myTransitions.includes('approved') && (
            <Button variant="accent" size="sm" disabled={transitioning} onClick={() => transition('approved')}>
              <CheckCircle size={13} strokeWidth={1.5} />Approve
            </Button>
          )}
          {myTransitions.includes('revision_requested') && (
            <Button variant="danger" size="sm" disabled={transitioning} onClick={() => setShowRevision(true)}>
              <RotateCcw size={13} strokeWidth={1.5} />Request Revision
            </Button>
          )}
          {myTransitions.filter(t => !['approved','revision_requested','submitted','resubmitted'].includes(t)).map(t => (
            <Button key={t} variant="secondary" size="sm" disabled={transitioning} onClick={() => transition(t)}>
              {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} <ChevronRight size={12} />
            </Button>
          ))}
        </div>
      </div>

      <div className="grid-detail">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Design Images */}
          {designImages.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
                <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>Design Images</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: designImages.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '12px', padding: '16px' }}>
                {designImages.map(f => (
                  <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8E4DC' }}>
                    {isImg(f.file_format) ? (
                      <img src={f.file_url} alt={f.file_name} style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain', background: '#F5F2EC', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '120px', background: '#F5F2EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FileText size={24} color="#9A948F" strokeWidth={1.5} />
                        <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F', textTransform: 'uppercase' }}>{f.file_format}</span>
                      </div>
                    )}
                    <div style={{ padding: '8px 12px', fontSize: '11px', color: '#9A948F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace' }}>{f.file_name}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Inspiration */}
          {inspirationImages.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
                <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>Inspiration</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '16px' }}>
                {inspirationImages.map(f => (
                  <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer">
                    <img src={f.file_url} alt={f.file_name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E4DC', display: 'block' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>Product Details</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <InfoRow label="Season" value={design.season} />
              <InfoRow label="Launch Window" value={design.launch_window} />
              <InfoRow label="Drop" value={design.drop_name} />
              <InfoRow label="Gender" value={design.gender} />
              <InfoRow label="Market" value={design.intended_market} />
              <InfoRow label="Version" value={`v${design.current_version}`} />
            </div>
            {design.description && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', marginBottom: '8px' }}>Description</div>
                <p style={{ fontSize: '13px', color: '#0D0D0D', lineHeight: 1.7 }}>{design.description}</p>
              </div>
            )}
            {design.design_story && (
              <div style={{ padding: '0 20px 20px', borderTop: design.description ? '1px solid #F5F2EC' : 'none', paddingTop: design.description ? '20px' : 0 }}>
                <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', marginBottom: '8px' }}>Design Story</div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 300, color: '#0D0D0D', lineHeight: 1.8, fontStyle: 'italic' }}>{design.design_story}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
            </div>
            {comments.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '13px', color: '#9A948F' }}>No comments yet.</div>
            ) : (
              comments.map((c, i) => (
                <div key={c.id} style={{
                  padding: '16px 20px',
                  borderBottom: i < comments.length - 1 ? '1px solid #F5F2EC' : 'none',
                  background: c.is_revision_reason ? '#FFF8F5' : 'transparent'
                }}>
                  {c.is_revision_reason && (
                    <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: '#C4663A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Revision Reason</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 500, color: '#9A948F', flexShrink: 0 }}>
                      {c.users?.full_name?.charAt(0)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{c.users?.full_name}</span>
                    <span style={{ fontSize: '11px', color: '#9A948F', textTransform: 'capitalize' }}>{c.users?.role}</span>
                    <span style={{ fontSize: '11px', color: '#9A948F', marginLeft: 'auto' }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#0D0D0D', lineHeight: 1.6, paddingLeft: '32px' }}>{c.body}</p>
                </div>
              ))
            )}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E8E4DC', display: 'flex', gap: '10px' }}>
              <textarea
                value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment… (⌘+Enter to send)"
                rows={2}
                style={{ flex: 1, padding: '10px 14px', background: '#F5F2EC', border: '1px solid #E8E4DC', borderRadius: '8px', fontSize: '13px', color: '#0D0D0D', outline: 'none', resize: 'none', fontFamily: 'Outfit, sans-serif', lineHeight: 1.5 }}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment() }}
              />
              <Button size="sm" onClick={submitComment} disabled={submittingComment || !newComment.trim()}>
                <Send size={13} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Reviews */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>Reviews</span>
              {avgScore && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: 500, color: '#9E7A3F' }}>{avgScore} avg</span>}
            </div>
            {reviews.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: '13px', color: '#9A948F', textAlign: 'center' }}>No reviews yet.</div>
            ) : reviews.map(r => (
              <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F5F2EC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{r.users?.full_name}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '16px', fontWeight: 500, color: '#0D0D0D' }}>{r.overall_score}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[['Brand', r.brand_fit], ['Commercial', r.commercial_pot], ['Originality', r.originality], ['Production', r.production_feas]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#9A948F' }}>{l}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#0D0D0D' }}>{v}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* History */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>Status History</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9A948F' }}>No history yet.</div>
              ) : history.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8E4DC', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#0D0D0D' }}>
                      {h.from_status && <span style={{ color: '#9A948F' }}>{h.from_status.replace(/_/g, ' ')} → </span>}
                      <span style={{ fontWeight: 500 }}>{h.to_status.replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9A948F', marginTop: '2px' }}>
                      {h.users?.full_name} · {new Date(h.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} title="Score this Design" size="lg">
        <div>
          <ScoreRow label="Brand Fit" value={scores.brand_fit} onChange={v => setScores(s => ({ ...s, brand_fit: v }))} />
          <ScoreRow label="Commercial Potential" value={scores.commercial_pot} onChange={v => setScores(s => ({ ...s, commercial_pot: v }))} />
          <ScoreRow label="Originality" value={scores.originality} onChange={v => setScores(s => ({ ...s, originality: v }))} />
          <ScoreRow label="Production Feasibility" value={scores.production_feas} onChange={v => setScores(s => ({ ...s, production_feas: v }))} />
          {scores.brand_fit && scores.commercial_pot && scores.originality && scores.production_feas ? (
            <div style={{ margin: '20px 0', padding: '20px', background: '#F5F2EC', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Overall Score</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 300, color: '#0D0D0D', lineHeight: 1 }}>
                {((scores.brand_fit + scores.commercial_pot + scores.originality + scores.production_feas) / 4).toFixed(1)}
              </div>
            </div>
          ) : <div style={{ height: '16px' }} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setShowReview(false)}>Cancel</Button>
            <Button onClick={submitReview}>Submit Review</Button>
          </div>
        </div>
      </Modal>

      {/* Revision Modal */}
      <Modal open={showRevision} onClose={() => setShowRevision(false)} title="Request Revision">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#9A948F', lineHeight: 1.6 }}>
            This reason is required, will be visible to the designer, and permanently logged.
          </p>
          <Textarea
            label="Revision Reason *"
            placeholder="Describe exactly what needs to change and why…"
            rows={4}
            value={revisionReason}
            onChange={e => setRevisionReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setShowRevision(false)}>Cancel</Button>
            <Button variant="danger" disabled={!revisionReason.trim() || transitioning} onClick={() => transition('revision_requested', revisionReason)}>
              <RotateCcw size={13} strokeWidth={1.5} />Request Revision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
