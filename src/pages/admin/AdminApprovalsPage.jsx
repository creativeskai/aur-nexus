import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import { CheckCircle, X, Star, RotateCcw, ChevronRight, ChevronDown } from 'lucide-react'

const SWIPE_THRESHOLD = 90
const ROTATION_FACTOR = 0.06

// ── Category groups ────────────────────────────────────────
const CATEGORY_GROUPS = {
  Footwear: ['Sneakers','Slides','Sandals'],
  Apparel: ['T-Shirts','Oversized T-Shirts','Jerseys','Shirts','Hoodies','Sweatshirts','Jackets','Trousers','Cargo Pants','Shorts','Joggers','Denim'],
  Accessories: ['Caps','Beanies','Socks','Bags'],
  Jewellery: ['Rings','Chains','Bracelets','Pendants'],
}

function getCategoryGroup(category) {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group
  }
  return 'Other'
}

// ── Swipe Card ─────────────────────────────────────────────
function SwipeCard({ design, onSwipe, isTop, nextDesign }) {
  const cardRef = useRef(null)
  const startPos = useRef(null)
  const currentPos = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

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
    if (e.cancelable) e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - startPos.current.x
    const dy = pos.y - startPos.current.y
    currentPos.current = { x: dx, y: dy }
    setOffset({ x: dx, y: dy })
  }

  function onEnd() {
    if (!dragging) return
    setDragging(false)
    const { x, y } = currentPos.current
    if (x > SWIPE_THRESHOLD) flyOut('right')
    else if (x < -SWIPE_THRESHOLD) flyOut('left')
    else if (y < -SWIPE_THRESHOLD) flyOut('up')
    else { setOffset({ x: 0, y: 0 }) }
    startPos.current = null
    currentPos.current = { x: 0, y: 0 }
  }

  function flyOut(dir) {
    const card = cardRef.current
    if (!card) return
    const tx = dir === 'right' ? 900 : dir === 'left' ? -900 : 0
    const ty = dir === 'up' ? -900 : 0
    card.style.transition = 'transform 0.32s ease'
    card.style.transform = `translate(${tx}px, ${ty}px) rotate(${tx * ROTATION_FACTOR}deg)`
    setTimeout(() => {
      onSwipe(dir === 'right' ? 'approve' : dir === 'left' ? 'pass' : 'super')
    }, 300)
  }

  const rotation = offset.x * ROTATION_FACTOR
  const approveOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1)
  const passOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1)
  const superOpacity = Math.min(Math.max(-offset.y / SWIPE_THRESHOLD, 0), 1)

  const avg = design._reviews?.length
    ? (design._reviews.reduce((s,r) => s + parseFloat(r.overall_score), 0) / design._reviews.length).toFixed(1)
    : null

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {/* Background card */}
      {nextDesign && (
        <div style={{
          position:'absolute', inset:0, background:'#FFFFFF',
          border:'1px solid #EBEBEB', borderRadius:'20px',
          transform:'scale(0.94) translateY(14px)', overflow:'hidden', zIndex:0
        }}>
          {nextDesign._files?.filter(f=>['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0]?.file_url && (
            <img
              src={nextDesign._files.filter(f=>['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0].file_url}
              style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center top', display:'block', background:'#F7F7F5' }}
            />
          )}
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        style={{
          position:'absolute', inset:0,
          background:'#FFFFFF', borderRadius:'20px',
          border:'1px solid #EBEBEB',
          boxShadow: dragging ? '0 24px 64px rgba(0,0,0,0.14)' : '0 6px 24px rgba(0,0,0,0.07)',
          transform:`translate(${offset.x}px,${offset.y}px) rotate(${rotation}deg)`,
          transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
          userSelect:'none', touchAction:'none',
          overflow:'hidden', zIndex:1,
          display:'flex', flexDirection:'column'
        }}
      >
        {/* Decision labels */}
        <div style={{ position:'absolute', top:20, left:20, zIndex:10, opacity:approveOpacity, transform:'rotate(-12deg)', pointerEvents:'none' }}>
          <div style={{ border:'3px solid #2E7D4F', borderRadius:'8px', padding:'5px 14px', color:'#2E7D4F', fontSize:'20px', fontWeight:700, fontFamily:'DM Mono, monospace', background:'rgba(255,255,255,0.9)' }}>APPROVE</div>
        </div>
        <div style={{ position:'absolute', top:20, right:20, zIndex:10, opacity:passOpacity, transform:'rotate(12deg)', pointerEvents:'none' }}>
          <div style={{ border:'3px solid #9A948F', borderRadius:'8px', padding:'5px 14px', color:'#9A948F', fontSize:'20px', fontWeight:700, fontFamily:'DM Mono, monospace', background:'rgba(255,255,255,0.9)' }}>PASS</div>
        </div>
        <div style={{ position:'absolute', top:20, left:'50%', transform:`translateX(-50%)`, zIndex:10, opacity:superOpacity, pointerEvents:'none' }}>
          <div style={{ border:'3px solid #C8A96E', borderRadius:'8px', padding:'5px 14px', color:'#C8A96E', fontSize:'20px', fontWeight:700, fontFamily:'DM Mono, monospace', background:'rgba(255,255,255,0.9)', whiteSpace:'nowrap' }}>SUPER ★</div>
        </div>

        {/* Full image - object-contain so nothing crops */}
        <div style={{ flex:'0 0 62%', background:'#F7F7F5', overflow:'hidden', position:'relative' }}>
          {coverImage ? (
            <img
              src={coverImage} alt={design.name}
              style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center', display:'block', pointerEvents:'none' }}
            />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#C0BCB8', textTransform:'uppercase' }}>No Image</span>
            </div>
          )}
          {/* Category group + category */}
          <div style={{ position:'absolute', bottom:10, left:12, display:'flex', gap:'6px', flexWrap:'wrap' }}>
            <span style={{ background:'rgba(0,0,0,0.55)', color:'#FFFFFF', fontSize:'10px', fontFamily:'DM Mono, monospace', padding:'3px 9px', borderRadius:'99px' }}>
              {getCategoryGroup(design.category)}
            </span>
            <span style={{ background:'rgba(0,0,0,0.35)', color:'rgba(255,255,255,0.9)', fontSize:'10px', fontFamily:'DM Mono, monospace', padding:'3px 9px', borderRadius:'99px' }}>
              {design.category}
            </span>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ flex:1, padding:'14px 18px', display:'flex', flexDirection:'column', gap:'8px', overflow:'hidden' }}>
          <div>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'21px', fontWeight:400, lineHeight:1.2, marginBottom:'3px' }}>{design.name}</h2>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>by {design.users?.full_name}</span>
              {design.collections && <><span style={{ color:'#EBEBEB' }}>·</span><span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>{design.collections.name}</span></>}
              {design.season && <><span style={{ color:'#EBEBEB' }}>·</span><span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>{design.season}</span></>}
              {design.intended_market && <><span style={{ color:'#EBEBEB' }}>·</span><span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>{design.intended_market}</span></>}
            </div>
          </div>

          {/* Scores */}
          {design._reviews?.length > 0 && (
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              {design._reviews.map(r => (
                <div key={r.id} style={{ background:'#F7F7F5', borderRadius:'7px', padding:'5px 9px', textAlign:'center', minWidth:'46px' }}>
                  <div style={{ fontSize:'9px', fontFamily:'DM Mono, monospace', color:'#C0BCB8', textTransform:'uppercase', marginBottom:'2px' }}>{r.users?.full_name?.split(' ')[0]}</div>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#0D0D0D', fontFamily:'DM Mono, monospace' }}>{r.overall_score}</div>
                </div>
              ))}
              {avg && (
                <div style={{ background:'#0D0D0D', borderRadius:'7px', padding:'5px 9px', textAlign:'center', minWidth:'46px' }}>
                  <div style={{ fontSize:'9px', fontFamily:'DM Mono, monospace', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:'2px' }}>Avg</div>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#C8A96E', fontFamily:'DM Mono, monospace' }}>{avg}</div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <StatusBadge status={design.status} />
            {design.description && (
              <span style={{ fontSize:'11px', color:'#C0BCB8', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{design.description}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Grouped list view (for 'All' tab) ─────────────────────
function GroupedList({ queue, onSelect }) {
  const groups = {}
  queue.forEach(d => {
    const g = getCategoryGroup(d.category)
    if (!groups[g]) groups[g] = []
    groups[g].push(d)
  })

  const [collapsed, setCollapsed] = useState({})

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      {Object.entries(groups).map(([group, designs]) => (
        <div key={group} style={{ border:'1px solid #EBEBEB', borderRadius:'10px', overflow:'hidden' }}>
          <button
            onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', background:'#F7F7F5', border:'none', cursor:'pointer' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'12px', fontWeight:600, color:'#0D0D0D' }}>{group}</span>
              <span style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>{designs.length} pending</span>
            </div>
            <ChevronDown size={14} color="#9A948F" style={{ transform: collapsed[group] ? 'rotate(-90deg)' : 'rotate(0)', transition:'transform 0.2s' }} />
          </button>
          {!collapsed[group] && designs.map((d, i) => (
            <button key={d.id} onClick={() => onSelect(d)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', background:'#FFFFFF', border:'none', borderTop:'1px solid #F7F7F5', cursor:'pointer', textAlign:'left' }}
            >
              {d._files?.filter(f=>['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0]?.file_url ? (
                <img src={d._files.filter(f=>['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()))[0].file_url}
                  style={{ width:'44px', height:'44px', borderRadius:'8px', objectFit:'cover', flexShrink:0, background:'#F7F7F5' }} />
              ) : (
                <div style={{ width:'44px', height:'44px', borderRadius:'8px', background:'#F7F7F5', flexShrink:0 }} />
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:500, color:'#0D0D0D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                <div style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F', marginTop:'2px' }}>{d.category} · {d.users?.full_name}</div>
              </div>
              <StatusBadge status={d.status} />
            </button>
          ))}
        </div>
      ))}
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
  const [view, setView] = useState('swipe') // 'swipe' | 'list'
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)
  const pendingAction = useRef(null)

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    setLoading(true)
    const { data } = await supabase
      .from('designs')
      .select('*, users!designs_designer_id_fkey(full_name), collections(name)')
      .in('status', ['submitted','under_review','resubmitted'])
      .order('updated_at', { ascending: true })

    if (!data?.length) { setQueue([]); setDone(true); setLoading(false); return }

    const enriched = await Promise.all(data.map(async d => {
      const [files, reviews] = await Promise.all([
        supabase.from('design_files').select('*').eq('design_id', d.id),
        supabase.from('reviews').select('*, users(full_name)').eq('design_id', d.id)
      ])
      return { ...d, _files: files.data||[], _reviews: reviews.data||[] }
    }))

    setQueue(enriched)
    setCurrent(0)
    setDone(false)
    setLoading(false)
  }

  async function performAction(action, design, commentText='') {
    setSaving(true)
    try {
      if (action === 'approve' || action === 'super') {
        const catMap = {'Sneakers':'SNK','Slides':'SLD','Sandals':'SDL','T-Shirts':'TSH','Oversized T-Shirts':'OTS','Jerseys':'JRS','Shirts':'SHT','Hoodies':'HDY','Sweatshirts':'SWT','Jackets':'JKT','Trousers':'TRS','Cargo Pants':'CGO','Shorts':'SHO','Joggers':'JGR','Denim':'DNM','Caps':'CAP','Beanies':'BNY','Socks':'SCK','Bags':'BAG','Rings':'RNG','Chains':'CHN','Bracelets':'BRC','Pendants':'PND'}
        const cat = catMap[design.category]||'GEN'
        const season = (design.season||'SS27').replace(/\s/g,'').toUpperCase()
        const { count } = await supabase.from('skus').select('*',{count:'exact',head:true}).eq('category_code',cat).eq('season_code',season)
        const seq = (count||0)+1
        const sku = `AUR-${cat}-${season}-${String(seq).padStart(3,'0')}`
        await supabase.from('skus').insert({ design_id:design.id, sku_code:sku, category_code:cat, season_code:season, sequence:seq, generated_by:profile.id })
        await supabase.from('designs').update({ status:'approved', sku, updated_at:new Date().toISOString() }).eq('id',design.id)
        await supabase.from('status_history').insert({ design_id:design.id, changed_by:profile.id, from_status:design.status, to_status:'approved' })
        await supabase.from('notifications').insert({ recipient_id:design.designer_id, type:'design_approved', design_id:design.id })
        if (action==='super' && commentText.trim()) {
          await supabase.from('comments').insert({ design_id:design.id, author_id:profile.id, body:`⭐ ${commentText.trim()}` })
        }
        toast.success(`${action==='super'?'⭐ Super approved':'✅ Approved'} — ${sku}`)
      } else {
        if (design.status==='submitted') {
          await supabase.from('designs').update({ status:'under_review', updated_at:new Date().toISOString() }).eq('id',design.id)
          await supabase.from('status_history').insert({ design_id:design.id, changed_by:profile.id, from_status:design.status, to_status:'under_review' })
        }
        toast('Passed — will appear next time')
      }
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  function handleSwipe(action, design) {
    if (action === 'super') {
      pendingAction.current = { action, design }
      setShowComment(true)
      return
    }
    advance(action, design)
  }

  async function advance(action, design, commentText='') {
    await performAction(action, design, commentText)
    setHistory(h => [...h, { action, design, index: current }])
    if (current + 1 >= queue.length) setDone(true)
    else setCurrent(c => c + 1)
  }

  async function handleCommentSubmit() {
    const { action, design } = pendingAction.current
    await advance(action, design, comment)
    setComment('')
    setShowComment(false)
    pendingAction.current = null
  }

  function handleRewind() {
    if (!history.length) return
    const last = history[history.length - 1]
    setHistory(h => h.slice(0,-1))
    setCurrent(last.index)
    setDone(false)
    toast('Rewound')
  }

  const currentDesign = queue[current]
  const nextDesign = queue[current + 1]

  const Tab = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{
      padding:'7px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:500,
      border:'none', cursor:'pointer', transition:'all 0.15s',
      background: view===id ? '#0D0D0D' : 'transparent',
      color: view===id ? '#FFFFFF' : '#9A948F',
    }}>{label}</button>
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ fontSize:'12px', color:'#9A948F', fontFamily:'DM Mono, monospace' }}>Loading queue…</div>
    </div>
  )

  return (
    <div style={{ maxWidth:'460px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', fontWeight:400 }}>Review Queue</h1>
          <p style={{ fontSize:'11px', color:'#9A948F', fontFamily:'DM Mono, monospace', marginTop:'2px' }}>
            {queue.length} pending · {queue.filter(d=>d.status==='approved').length} approved today
          </p>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {history.length > 0 && (
            <button onClick={handleRewind} title="Rewind" style={{ width:'34px', height:'34px', borderRadius:'50%', border:'1px solid #E8D5A0', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#C8A96E' }}>
              <RotateCcw size={14} strokeWidth={1.5} />
            </button>
          )}
          {currentDesign && (
            <button onClick={() => navigate(`/designs/${currentDesign.id}`)} title="Full detail" style={{ width:'34px', height:'34px', borderRadius:'50%', border:'1px solid #EBEBEB', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9A948F' }}>
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:'#F7F7F5', borderRadius:'9px', padding:'3px', marginBottom:'16px' }}>
        <Tab id="swipe" label="Swipe" />
        <Tab id="list" label="All Designs" />
      </div>

      {/* Progress bar */}
      {view==='swipe' && !done && (
        <div style={{ height:'2px', background:'#F7F7F5', borderRadius:'99px', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#0D0D0D', width:`${(current/queue.length)*100}%`, transition:'width 0.3s', borderRadius:'99px' }} />
        </div>
      )}

      {/* List view */}
      {view==='list' && (
        <GroupedList queue={queue} onSelect={d => { navigate(`/designs/${d.id}`) }} />
      )}

      {/* Swipe view */}
      {view==='swipe' && (
        done ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <div style={{ fontSize:'44px', marginBottom:'16px' }}>✅</div>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'24px', fontWeight:400, marginBottom:'8px' }}>Queue cleared</h2>
            <p style={{ fontSize:'13px', color:'#9A948F', marginBottom:'24px' }}>All designs reviewed.</p>
            <Button variant="secondary" size="sm" onClick={fetchQueue}>Refresh Queue</Button>
          </div>
        ) : (
          <>
            {/* Cards */}
            <div style={{ position:'relative', height:'500px', marginBottom:'24px' }}>
              <SwipeCard
                key={currentDesign.id}
                design={currentDesign}
                nextDesign={nextDesign}
                isTop={true}
                onSwipe={(action) => handleSwipe(action, currentDesign)}
              />
            </div>

            {/* Counter */}
            <div style={{ textAlign:'center', fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#C0BCB8', marginBottom:'16px' }}>
              {current+1} / {queue.length}
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px' }}>
              <button onClick={() => handleSwipe('pass', currentDesign)} disabled={saving}
                style={{ width:'56px', height:'56px', borderRadius:'50%', border:'2px solid #EBEBEB', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 3px 10px rgba(0,0,0,0.06)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#9A948F';e.currentTarget.style.transform='scale(1.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#EBEBEB';e.currentTarget.style.transform='scale(1)'}}>
                <X size={21} color="#9A948F" strokeWidth={2} />
              </button>
              <button onClick={() => handleSwipe('super', currentDesign)} disabled={saving}
                style={{ width:'48px', height:'48px', borderRadius:'50%', border:'2px solid #E8D5A0', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 3px 10px rgba(200,169,110,0.15)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#C8A96E';e.currentTarget.style.transform='scale(1.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#E8D5A0';e.currentTarget.style.transform='scale(1)'}}>
                <Star size={17} color="#C8A96E" strokeWidth={2} />
              </button>
              <button onClick={() => handleSwipe('approve', currentDesign)} disabled={saving}
                style={{ width:'56px', height:'56px', borderRadius:'50%', border:'2px solid #A8DDB8', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 3px 10px rgba(46,125,79,0.1)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#2E7D4F';e.currentTarget.style.transform='scale(1.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#A8DDB8';e.currentTarget.style.transform='scale(1)'}}>
                <CheckCircle size={21} color="#2E7D4F" strokeWidth={2} />
              </button>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'12px', padding:'0 8px' }}>
              <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C0BCB8' }}>← pass</span>
              <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C8A96E' }}>↑ super</span>
              <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', color:'#C0BCB8' }}>approve →</span>
            </div>
          </>
        )
      )}

      {/* Super comment modal */}
      <Modal open={showComment} onClose={() => { setShowComment(false); setComment(''); pendingAction.current=null }} title="⭐ Super Approve">
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <p style={{ fontSize:'13px', color:'#9A948F', lineHeight:1.6 }}>Add a note for the designer — what makes this stand out?</p>
          <Textarea label="Comment (optional)" placeholder="e.g. Perfect for SS27 hero launch, prioritise sampling…" rows={3} value={comment} onChange={e=>setComment(e.target.value)} />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Button variant="secondary" onClick={() => { setShowComment(false); setComment(''); pendingAction.current=null }}>Cancel</Button>
            <Button onClick={handleCommentSubmit} disabled={saving} style={{ background:'#C8A96E', borderColor:'#C8A96E' }}>
              <Star size={13} />Super Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
