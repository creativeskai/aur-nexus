import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import { CheckCircle, X, Star, RotateCcw, ChevronRight, ArrowLeft } from 'lucide-react'

// ── Swipe physics ──────────────────────────────────────────
const SWIPE_THRESHOLD = 100
const ROTATION_FACTOR = 0.08

function SwipeCard({ design, onSwipe, isTop, nextDesign }) {
  const cardRef = useRef(null)
  const startPos = useRef(null)
  const currentPos = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [decision, setDecision] = useState(null) // 'approve' | 'pass' | 'super'

  const images = design._files?.filter(f =>
    ['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase())
  ) || []
  const coverImage = images[0]?.file_url

  function getPos(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: e.clientX, y: e.clientY }
  }

  function onStart(e) {
    if (!isTop) return
    startPos.current = getPos(e)
    setDragging(true)
  }

  function onMove(e) {
    if (!dragging || !startPos.current) return
    const pos = getPos(e)
    const dx = pos.x - startPos.current.x
    const dy = pos.y - startPos.current.y
    currentPos.current = { x: dx, y: dy }
    setOffset({ x: dx, y: dy })

    // Determine intent
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      setDecision(dx > 0 ? 'approve' : 'pass')
    } else if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
      setDecision('super')
    } else {
      setDecision(null)
    }
  }

  function onEnd() {
    if (!dragging) return
    setDragging(false)
    const { x, y } = currentPos.current

    if (x > SWIPE_THRESHOLD) {
      flyOut('right')
    } else if (x < -SWIPE_THRESHOLD) {
      flyOut('left')
    } else if (y < -SWIPE_THRESHOLD) {
      flyOut('up')
    } else {
      // snap back
      setOffset({ x: 0, y: 0 })
      setDecision(null)
    }
    startPos.current = null
    currentPos.current = { x: 0, y: 0 }
  }

  function flyOut(dir) {
    const card = cardRef.current
    if (!card) return
    const tx = dir === 'right' ? 800 : dir === 'left' ? -800 : 0
    const ty = dir === 'up' ? -800 : 0
    card.style.transition = 'transform 0.35s ease'
    card.style.transform = `translate(${tx}px, ${ty}px) rotate(${tx * ROTATION_FACTOR}deg)`
    setTimeout(() => {
      onSwipe(dir === 'right' ? 'approve' : dir === 'left' ? 'pass' : 'super')
    }, 320)
  }

  // Button triggers
  function triggerSwipe(action) {
    const dir = action === 'approve' ? 'right' : action === 'pass' ? 'left' : 'up'
    flyOut(dir)
  }

  const rotation = offset.x * ROTATION_FACTOR
  const liftY = Math.abs(offset.x) * 0.05

  const approveOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1)
  const passOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1)
  const superOpacity = Math.min(Math.max(-offset.y / SWIPE_THRESHOLD, 0), 1)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Next card peek */}
      {nextDesign && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#FFFFFF', border: '1px solid #EBEBEB', borderRadius: '20px',
          transform: 'scale(0.95) translateY(12px)',
          overflow: 'hidden', zIndex: 0
        }}>
          {nextDesign._files?.filter(f => ['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0]?.file_url && (
            <img src={nextDesign._files.filter(f => ['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0].file_url}
              style={{ width: '100%', height: '65%', objectFit: 'cover', display: 'block' }} />
          )}
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        style={{
          position: 'absolute', inset: 0,
          background: '#FFFFFF', borderRadius: '20px',
          border: '1px solid #EBEBEB',
          boxShadow: dragging ? '0 20px 60px rgba(0,0,0,0.15)' : '0 8px 32px rgba(0,0,0,0.08)',
          transform: `translate(${offset.x}px, ${offset.y - liftY}px) rotate(${rotation}deg)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
          cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none', overflow: 'hidden', zIndex: 1,
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Decision overlays */}
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, opacity: approveOpacity, transform: `rotate(-15deg)`, transition: 'opacity 0.1s' }}>
          <div style={{ border: '3px solid #2E7D4F', borderRadius: '8px', padding: '6px 16px', color: '#2E7D4F', fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>APPROVE</div>
        </div>
        <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10, opacity: passOpacity, transform: `rotate(15deg)`, transition: 'opacity 0.1s' }}>
          <div style={{ border: '3px solid #9A948F', borderRadius: '8px', padding: '6px 16px', color: '#9A948F', fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>PASS</div>
        </div>
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10, opacity: superOpacity, transition: 'opacity 0.1s' }}>
          <div style={{ border: '3px solid #C8A96E', borderRadius: '8px', padding: '6px 16px', color: '#C8A96E', fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>SUPER ★</div>
        </div>

        {/* Cover image */}
        <div style={{ flex: '0 0 58%', background: '#F7F7F5', position: 'relative', overflow: 'hidden' }}>
          {coverImage ? (
            <img src={coverImage} alt={design.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#C0BCB8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No Image</span>
            </div>
          )}
          {/* Category pill */}
          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
            <span style={{ background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: '10px', fontFamily: 'DM Mono, monospace', padding: '4px 10px', borderRadius: '99px', letterSpacing: '0.08em' }}>
              {design.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, lineHeight: 1.2, marginBottom: '4px' }}>{design.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>by {design.users?.full_name}</span>
              {design.collections && <><span style={{ color: '#EBEBEB' }}>·</span><span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>{design.collections.name}</span></>}
              {design.season && <><span style={{ color: '#EBEBEB' }}>·</span><span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>{design.season}</span></>}
            </div>
          </div>

          {/* Review scores */}
          {design._reviews?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {design._reviews.map(r => (
                <div key={r.id} style={{ background: '#F7F7F5', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: '#9A948F', textTransform: 'uppercase', marginBottom: '2px' }}>{r.users?.full_name?.split(' ')[0]}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0D0D0D', fontFamily: 'DM Mono, monospace' }}>{r.overall_score}</div>
                </div>
              ))}
              {design._reviews.length > 0 && (
                <div style={{ background: '#0D0D0D', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '2px' }}>Avg</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#C8A96E', fontFamily: 'DM Mono, monospace' }}>
                    {(design._reviews.reduce((s, r) => s + parseFloat(r.overall_score), 0) / design._reviews.length).toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          )}

          {design.description && (
            <p style={{ fontSize: '12px', color: '#9A948F', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {design.description}
            </p>
          )}

          <div style={{ marginTop: 'auto' }}>
            <StatusBadge status={design.status} />
          </div>
        </div>
      </div>

      {/* Expose trigger for buttons */}
      <div style={{ display: 'none' }} id={`swipe-trigger-${design.id}`} data-trigger={JSON.stringify({ triggerSwipe })} />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function AdminApprovalsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [commentType, setCommentType] = useState(null) // 'super' | 'approve_comment'
  const [comment, setComment] = useState('')
  const [history, setHistory] = useState([]) // for rewind
  const [saving, setSaving] = useState(false)
  const triggerRef = useRef(null)

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    setLoading(true)
    const { data } = await supabase
      .from('designs')
      .select('*, users!designs_designer_id_fkey(full_name), collections(name)')
      .in('status', ['submitted', 'under_review', 'resubmitted'])
      .order('updated_at', { ascending: true })

    if (!data || data.length === 0) { setQueue([]); setLoading(false); setDone(true); return }

    // Fetch files and reviews for each design
    const enriched = await Promise.all(data.map(async d => {
      const [files, reviews] = await Promise.all([
        supabase.from('design_files').select('*').eq('design_id', d.id),
        supabase.from('reviews').select('*, users(full_name)').eq('design_id', d.id)
      ])
      return { ...d, _files: files.data || [], _reviews: reviews.data || [] }
    }))

    setQueue(enriched)
    setCurrent(0)
    setDone(false)
    setLoading(false)
  }

  async function performAction(action, designId, commentText = '') {
    setSaving(true)
    const design = queue.find(d => d.id === designId)
    if (!design) { setSaving(false); return }

    try {
      if (action === 'approve' || action === 'super') {
        // Generate SKU
        const catMap = { 'Sneakers':'SNK','Slides':'SLD','Sandals':'SDL','T-Shirts':'TSH','Oversized T-Shirts':'OTS','Jerseys':'JRS','Shirts':'SHT','Hoodies':'HDY','Sweatshirts':'SWT','Jackets':'JKT','Trousers':'TRS','Cargo Pants':'CGO','Shorts':'SHO','Joggers':'JGR','Denim':'DNM','Caps':'CAP','Beanies':'BNY','Socks':'SCK','Bags':'BAG','Rings':'RNG','Chains':'CHN','Bracelets':'BRC','Pendants':'PND' }
        const cat = catMap[design.category] || 'GEN'
        const season = (design.season || 'SS27').replace(/\s/g,'').toUpperCase()
        const { count } = await supabase.from('skus').select('*',{count:'exact',head:true}).eq('category_code',cat).eq('season_code',season)
        const seq = (count||0)+1
        const sku = `AUR-${cat}-${season}-${String(seq).padStart(3,'0')}`
        await supabase.from('skus').insert({ design_id:design.id, sku_code:sku, category_code:cat, season_code:season, sequence:seq, generated_by:profile.id })
        await supabase.from('designs').update({ status:'approved', sku, updated_at:new Date().toISOString() }).eq('id',design.id)
        await supabase.from('status_history').insert({ design_id:design.id, changed_by:profile.id, from_status:design.status, to_status:'approved' })
        await supabase.from('notifications').insert({ recipient_id:design.designer_id, type:'design_approved', design_id:design.id })

        if (action === 'super' && commentText.trim()) {
          await supabase.from('comments').insert({ design_id:design.id, author_id:profile.id, body:`⭐ ${commentText.trim()}` })
        }
        toast.success(action === 'super' ? `⭐ Super approved — ${sku}` : `✅ Approved — ${sku}`)

      } else if (action === 'pass') {
        // Just move to under_review if submitted, otherwise leave
        if (design.status === 'submitted') {
          await supabase.from('designs').update({ status:'under_review', updated_at:new Date().toISOString() }).eq('id',design.id)
          await supabase.from('status_history').insert({ design_id:design.id, changed_by:profile.id, from_status:design.status, to_status:'under_review' })
        }
        toast('Passed for now')
      }
    } catch(e) { toast.error(e.message) }

    setSaving(false)
  }

  function handleSwipe(action, designId) {
    if (action === 'super') {
      setCommentType('super')
      setShowComment(true)
      // Store pending action
      triggerRef.current = { action, designId }
      return
    }
    advance(action, designId)
  }

  async function advance(action, designId) {
    await performAction(action, designId)
    setHistory(h => [...h, { action, designId, index: current }])
    if (current + 1 >= queue.length) setDone(true)
    else setCurrent(c => c + 1)
  }

  async function handleCommentSubmit() {
    const { action, designId } = triggerRef.current
    await performAction(action, designId, comment)
    setHistory(h => [...h, { action, designId, index: current }])
    setComment('')
    setShowComment(false)
    triggerRef.current = null
    if (current + 1 >= queue.length) setDone(true)
    else setCurrent(c => c + 1)
  }

  function handleRewind() {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setCurrent(last.index)
    setDone(false)
    toast('Rewound')
  }

  const currentDesign = queue[current]
  const nextDesign = queue[current + 1]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ fontSize:'13px', color:'#9A948F', fontFamily:'DM Mono, monospace' }}>Loading queue…</div>
    </div>
  )

  return (
    <div style={{ maxWidth:'480px', margin:'0 auto', padding:'0 0 32px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:400 }}>Review Queue</h1>
          {!done && <p style={{ fontSize:'12px', color:'#9A948F', marginTop:'3px', fontFamily:'DM Mono, monospace' }}>
            {current + 1} of {queue.length}
          </p>}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {history.length > 0 && (
            <button onClick={handleRewind} title="Rewind" style={{
              width:'36px', height:'36px', borderRadius:'50%', border:'1px solid #EBEBEB',
              background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'#C8A96E'
            }}>
              <RotateCcw size={15} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={() => navigate(`/designs/${currentDesign?.id}`)} title="View full detail"
            style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1px solid #EBEBEB', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9A948F' }}>
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!done && (
        <div style={{ height:'3px', background:'#F7F7F5', borderRadius:'99px', marginBottom:'20px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#0D0D0D', borderRadius:'99px', width:`${((current) / queue.length) * 100}%`, transition:'width 0.3s' }} />
        </div>
      )}

      {done ? (
        <div style={{ textAlign:'center', padding:'60px 24px' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', fontWeight:400, marginBottom:'8px' }}>Queue cleared</h2>
          <p style={{ fontSize:'13px', color:'#9A948F', marginBottom:'24px' }}>All designs have been reviewed.</p>
          <Button variant="secondary" size="sm" onClick={fetchQueue}>Refresh Queue</Button>
        </div>
      ) : (
        <>
          {/* Card area */}
          <div style={{ position:'relative', height:'520px', marginBottom:'28px' }}>
            <SwipeCard
              key={currentDesign.id}
              design={currentDesign}
              nextDesign={nextDesign}
              isTop={true}
              onSwipe={(action) => handleSwipe(action, currentDesign.id)}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px' }}>
            {/* Pass */}
            <button
              onClick={() => handleSwipe('pass', currentDesign.id)}
              disabled={saving}
              style={{
                width:'58px', height:'58px', borderRadius:'50%',
                border:'2px solid #EBEBEB', background:'#FFFFFF',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.15s', boxShadow:'0 4px 12px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#9A948F'; e.currentTarget.style.transform='scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#EBEBEB'; e.currentTarget.style.transform='scale(1)' }}
            >
              <X size={22} color="#9A948F" strokeWidth={2} />
            </button>

            {/* Super Like */}
            <button
              onClick={() => handleSwipe('super', currentDesign.id)}
              disabled={saving}
              style={{
                width:'52px', height:'52px', borderRadius:'50%',
                border:'2px solid #E8D5A0', background:'#FFFFFF',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.15s', boxShadow:'0 4px 12px rgba(200,169,110,0.15)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#C8A96E'; e.currentTarget.style.transform='scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E8D5A0'; e.currentTarget.style.transform='scale(1)' }}
            >
              <Star size={18} color="#C8A96E" strokeWidth={2} />
            </button>

            {/* Approve */}
            <button
              onClick={() => handleSwipe('approve', currentDesign.id)}
              disabled={saving}
              style={{
                width:'58px', height:'58px', borderRadius:'50%',
                border:'2px solid #A8DDB8', background:'#FFFFFF',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.15s', boxShadow:'0 4px 12px rgba(46,125,79,0.12)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2E7D4F'; e.currentTarget.style.transform='scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#A8DDB8'; e.currentTarget.style.transform='scale(1)' }}
            >
              <CheckCircle size={22} color="#2E7D4F" strokeWidth={2} />
            </button>
          </div>

          {/* Swipe hints */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'14px', padding:'0 12px' }}>
            <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C0BCB8' }}>← pass</span>
            <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C8A96E' }}>↑ super</span>
            <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C0BCB8' }}>approve →</span>
          </div>
        </>
      )}

      {/* Super Like comment modal */}
      <Modal open={showComment} onClose={() => { setShowComment(false); setComment(''); triggerRef.current = null }} title="⭐ Super Approve">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <p style={{ fontSize:'13px', color:'#9A948F', lineHeight:1.6 }}>
            Add a note for the designer — what makes this design exceptional?
          </p>
          <Textarea
            label="Comment (optional)"
            placeholder="e.g. Perfect silhouette, prioritise for SS27 hero launch…"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Button variant="secondary" onClick={() => { setShowComment(false); setComment(''); triggerRef.current = null }}>Cancel</Button>
            <Button onClick={handleCommentSubmit} disabled={saving} style={{ background:'#C8A96E', borderColor:'#C8A96E' }}>
              <Star size={13} strokeWidth={1.5} /> Super Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
