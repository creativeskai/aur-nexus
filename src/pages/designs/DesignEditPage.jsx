import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'

const CATEGORIES = ['Sneakers','Slides','Sandals','T-Shirts','Oversized T-Shirts','Jerseys','Shirts','Hoodies','Sweatshirts','Jackets','Trousers','Cargo Pants','Shorts','Joggers','Denim','Caps','Beanies','Socks','Bags','Rings','Chains','Bracelets','Pendants']
const SEASONS = ['SS25','AW25','SS26','AW26','SS27','AW27','SS28']
const GENDERS = ['Men','Women','Unisex','Kids']
const MARKETS = ['India','UK','Global','South Asia','Middle East','Southeast Asia','Europe','USA']

// Designs editable only if not yet reviewed/approved
const EDITABLE_STATUSES = ['draft','submitted','under_review','revision_requested','resubmitted']

function FormSection({ title, children }) {
  return (
    <div style={{ background:'#FFFFFF', border:'1px solid #EBEBEB', borderRadius:'10px', overflow:'hidden', marginBottom:'16px' }}>
      <div style={{ padding:'12px 20px', borderBottom:'1px solid #EBEBEB', background:'#F7F7F5' }}>
        <span style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9A948F' }}>{title}</span>
      </div>
      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>{children}</div>
    </div>
  )
}

function FileZone({ label, accept, files, onFiles, onRemove, existingFiles, onRemoveExisting }) {
  const ref = useRef()
  const [dragging, setDragging] = useState(false)

  return (
    <div>
      <label style={{ fontSize:'10px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9A948F', display:'block', marginBottom:'8px' }}>{label}</label>

      {/* Existing files */}
      {existingFiles?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'10px' }}>
          {existingFiles.map(f => (
            <div key={f.id} style={{ position:'relative', width:'72px', height:'72px', borderRadius:'8px', overflow:'hidden', border:'1px solid #EBEBEB' }}>
              {['jpg','jpeg','png','webp'].includes(f.file_format?.toLowerCase()) ? (
                <img src={f.file_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', background:'#F7F7F5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontFamily:'DM Mono, monospace', color:'#9A948F', textTransform:'uppercase' }}>{f.file_format}</div>
              )}
              <button onClick={() => onRemoveExisting(f.id)} style={{ position:'absolute', top:'3px', right:'3px', width:'18px', height:'18px', borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF' }}>
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={e => { e.preventDefault(); setDragging(false); onFiles(prev => [...prev, ...[...e.dataTransfer.files]]) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => ref.current?.click()}
        style={{ border:`2px dashed ${dragging ? '#0D0D0D' : '#EBEBEB'}`, borderRadius:'8px', padding:'20px', textAlign:'center', cursor:'pointer', background: dragging ? '#F7F7F5' : 'transparent', transition:'all 0.15s' }}
      >
        <input ref={ref} type="file" accept={accept} multiple style={{ display:'none' }} onChange={e => { onFiles(prev => [...prev, ...[...e.target.files]]); e.target.value='' }} />
        <ImagePlus size={18} color="#C8A96E" strokeWidth={1.5} style={{ margin:'0 auto 8px' }} />
        <p style={{ fontSize:'12px', color:'#0D0D0D' }}>Drop or <span style={{ color:'#C8A96E', textDecoration:'underline' }}>browse</span></p>
        <p style={{ fontSize:'10px', color:'#9A948F', marginTop:'3px', fontFamily:'DM Mono, monospace' }}>{accept}</p>
      </div>

      {files.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px' }}>
          {files.map((f,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', background:'#F7F7F5', border:'1px solid #EBEBEB', borderRadius:'6px', padding:'4px 8px' }}>
              <span style={{ fontSize:'11px', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
              <button onClick={() => onFiles(fs => fs.filter((_,idx) => idx !== i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#9A948F', display:'flex', padding:0 }}><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DesignEditPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [design, setDesign] = useState(null)
  const [collections, setCollections] = useState([])
  const [existingFiles, setExistingFiles] = useState([])
  const [newDesignFiles, setNewDesignFiles] = useState([])
  const [newInspirationFiles, setNewInspirationFiles] = useState([])
  const [newMoodboardFiles, setNewMoodboardFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => { fetchDesign() }, [id])

  async function fetchDesign() {
    const [{ data: d }, { data: c }, { data: f }] = await Promise.all([
      supabase.from('designs').select('*').eq('id', id).single(),
      supabase.from('collections').select('id,name').eq('status','active'),
      supabase.from('design_files').select('*').eq('design_id', id)
    ])

    if (!d) { toast.error('Design not found'); navigate('/designs'); return }
    if (d.designer_id !== profile.id && profile.role !== 'admin') { toast.error('Not authorized'); navigate('/designs'); return }
    if (!EDITABLE_STATUSES.includes(d.status)) { toast.error('Design cannot be edited at this stage'); navigate(`/designs/${id}`); return }

    setDesign(d)
    setCollections(c || [])
    setExistingFiles(f || [])
    reset({
      name: d.name, category: d.category, collection_id: d.collection_id || '',
      description: d.description || '', design_story: d.design_story || '',
      launch_window: d.launch_window || '', season: d.season || '',
      drop_name: d.drop_name || '', gender: d.gender || '', intended_market: d.intended_market || ''
    })
    setLoading(false)
  }

  async function removeExistingFile(fileId) {
    await supabase.from('design_files').delete().eq('id', fileId)
    setExistingFiles(f => f.filter(x => x.id !== fileId))
  }

  async function uploadFile(file, designId, fileType) {
    const ext = file.name.split('.').pop().toLowerCase()
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
    const path = `${designId}/${fileType}/${Date.now()}_${safe}`
    const { error } = await supabase.storage.from('design-files').upload(path, file, { upsert: false })
    if (error) { console.error(error); return }
    const { data: { publicUrl } } = supabase.storage.from('design-files').getPublicUrl(path)
    await supabase.from('design_files').insert({ design_id:designId, file_type:fileType, file_url:publicUrl, file_name:file.name, file_format:ext, uploaded_by:profile.id })
  }

  async function onSubmit(data) {
    setSaving(true)
    try {
      await supabase.from('designs').update({
        name: data.name, category: data.category,
        collection_id: data.collection_id || null,
        description: data.description || null,
        design_story: data.design_story || null,
        launch_window: data.launch_window || null,
        season: data.season || null, drop_name: data.drop_name || null,
        gender: data.gender || null, intended_market: data.intended_market || null,
        updated_at: new Date().toISOString()
      }).eq('id', id)

      const allNew = [
        ...newDesignFiles.map(f => ({ file: f, type: 'design_image' })),
        ...newInspirationFiles.map(f => ({ file: f, type: 'inspiration_image' })),
        ...newMoodboardFiles.map(f => ({ file: f, type: 'moodboard_image' })),
      ]
      for (const { file, type } of allNew) await uploadFile(file, id, type)

      // Log edit in status history
      await supabase.from('status_history').insert({ design_id:id, changed_by:profile.id, from_status:design.status, to_status:design.status, comment_id:null })

      toast.success('Design updated')
      navigate(`/designs/${id}`)
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#9A948F', fontSize:'13px' }}>Loading…</div>

  const designImages = existingFiles.filter(f => f.file_type === 'design_image')
  const inspirationImages = existingFiles.filter(f => f.file_type === 'inspiration_image')
  const moodboardImages = existingFiles.filter(f => f.file_type === 'moodboard_image')

  return (
    <div style={{ maxWidth:'720px' }}>
      <button onClick={() => navigate(`/designs/${id}`)} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#9A948F', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to Design
      </button>

      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:400 }}>Edit Design</h1>
        <p style={{ fontSize:'12px', color:'#9A948F', marginTop:'4px' }}>{design?.name}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormSection title="Product Information">
          <Input label="Design Name *" {...register('name', { required: true })} error={errors.name && 'Required'} />
          <div className="form-grid-2">
            <Select label="Category *" {...register('category', { required: true })}>
              <option value="">Select</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Collection" {...register('collection_id')}>
              <option value="">No collection</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Textarea label="Description" rows={2} {...register('description')} />
          <Textarea label="Design Story" rows={3} {...register('design_story')} />
        </FormSection>

        <FormSection title="Launch & Market">
          <div className="form-grid-3">
            <Select label="Season" {...register('season')}>
              <option value="">Select</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Launch Window" placeholder="e.g. March 2027" {...register('launch_window')} />
            <Input label="Drop Name" placeholder="e.g. Drop 01" {...register('drop_name')} />
          </div>
          <div className="form-grid-2">
            <Select label="Gender" {...register('gender')}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select label="Intended Market" {...register('intended_market')}>
              <option value="">Select</option>
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </FormSection>

        <FormSection title="Media">
          <FileZone label="Design Images" accept=".jpg,.jpeg,.png,.webp,.pdf,.ai,.psd,.svg"
            files={newDesignFiles} onFiles={setNewDesignFiles}
            existingFiles={designImages} onRemoveExisting={removeExistingFile}
            onRemove={i => setNewDesignFiles(f => f.filter((_,idx)=>idx!==i))}
          />
          <FileZone label="Inspiration" accept=".jpg,.jpeg,.png,.webp"
            files={newInspirationFiles} onFiles={setNewInspirationFiles}
            existingFiles={inspirationImages} onRemoveExisting={removeExistingFile}
            onRemove={i => setNewInspirationFiles(f => f.filter((_,idx)=>idx!==i))}
          />
          <FileZone label="Moodboard" accept=".jpg,.jpeg,.png,.webp,.pdf"
            files={newMoodboardFiles} onFiles={setNewMoodboardFiles}
            existingFiles={moodboardImages} onRemoveExisting={removeExistingFile}
            onRemove={i => setNewMoodboardFiles(f => f.filter((_,idx)=>idx!==i))}
          />
        </FormSection>

        <div style={{ display:'flex', gap:'10px' }}>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/designs/${id}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
